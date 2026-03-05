import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplication, updateStatus, calculateAward } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EligibilityPanel from '../components/EligibilityPanel';

export default function ReviewerApplicationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [awardPreview, setAwardPreview] = useState(null);
  const [rejectComment, setRejectComment] = useState('');

  const load = () => {
    getApplication(id)
      .then(setApp)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const eligibilityData = app ? {
    organizationType: app.organizationType,
    yearFounded: app.yearFounded,
    annualOperatingBudget: app.annualOperatingBudget,
    amountRequested: app.amountRequested,
    totalProjectCost: app.totalProjectCost,
    estimatedBeneficiaries: app.estimatedBeneficiaries,
  } : {};

  const handleMarkUnderReview = async () => {
    setActionLoading(true);
    try {
      await updateStatus(id, 'UNDER_REVIEW');
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveClick = async () => {
    try {
      const calc = await calculateAward(id);
      setAwardPreview(calc);
      setShowApproveModal(true);
    } catch (e) {
      setError(e.message);
    }
  };

  const handleConfirmApprove = async () => {
    setActionLoading(true);
    try {
      await updateStatus(id, 'APPROVED');
      setShowApproveModal(false);
      setAwardPreview(null);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = () => setShowRejectModal(true);

  const handleConfirmReject = async () => {
    if (!rejectComment.trim()) return;
    setActionLoading(true);
    try {
      await updateStatus(id, 'REJECTED', rejectComment);
      setShowRejectModal(false);
      setRejectComment('');
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!app) return null;

  const canApprove = app.status === 'UNDER_REVIEW';
  const canReject = app.status === 'UNDER_REVIEW';
  const canMarkUnderReview = app.status === 'SUBMITTED';

  return (
    <>
      <p><button type="button" className="btn btn-neutral" onClick={() => navigate('/reviewer')}>← Dashboard</button></p>
      <h1>{app.projectTitle}</h1>
      <p><StatusBadge status={app.status} /> {app.orgName || app.organizationName}</p>
      <EligibilityPanel formData={eligibilityData} />
      <div className="card">
        <h3>Organization</h3>
        <p><strong>Name:</strong> {app.organizationName}</p>
        <p><strong>EIN:</strong> {app.ein}</p>
        <p><strong>Type:</strong> {app.organizationType}</p>
        <p><strong>Year Founded:</strong> {app.yearFounded}</p>
        <p><strong>Budget:</strong> ${Number(app.annualOperatingBudget).toLocaleString()}</p>
        <p><strong>Contact:</strong> {app.primaryContactName}, {app.primaryContactEmail}, {app.primaryContactPhone}</p>
        <p><strong>Address:</strong> {app.organizationAddress}</p>
        <p><strong>Mission:</strong> {app.missionStatement}</p>
      </div>
      <div className="card">
        <h3>Project</h3>
        <p><strong>Category:</strong> {app.projectCategory}</p>
        <p><strong>Description:</strong> {app.projectDescription}</p>
        <p><strong>Target Population:</strong> {app.targetPopulation}</p>
        <p><strong>Beneficiaries:</strong> {app.estimatedBeneficiaries}</p>
        <p><strong>Total Cost:</strong> ${Number(app.totalProjectCost).toLocaleString()}</p>
        <p><strong>Amount Requested:</strong> ${Number(app.amountRequested).toLocaleString()}</p>
        <p><strong>Dates:</strong> {app.projectStartDate} to {app.projectEndDate}</p>
      </div>
      {app.documents?.length > 0 && (
        <div className="card">
          <h3>Documents</h3>
          <ul>{app.documents.map((d) => <li key={d.id}>{d.fileName}</li>)}</ul>
        </div>
      )}
      <div className="card">
        <h3>Actions</h3>
        {canMarkUnderReview && (
          <button type="button" className="btn btn-secondary" onClick={handleMarkUnderReview} disabled={actionLoading} style={{ marginRight: 8 }}>
            Mark Under Review
          </button>
        )}
        {canApprove && (
          <button type="button" className="btn btn-primary" onClick={handleApproveClick} disabled={actionLoading} style={{ marginRight: 8 }}>
            Approve
          </button>
        )}
        {canReject && (
          <button type="button" className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={handleRejectClick} disabled={actionLoading}>
            Reject
          </button>
        )}
      </div>

      {showApproveModal && awardPreview && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: 480, width: '90%' }}>
            <h2 style={{ marginTop: 0 }}>Approve Application</h2>
            <p><strong>Award Calculation</strong></p>
            <table style={{ width: '100%', marginBottom: 16 }}>
              <tbody>
                {awardPreview.breakdown?.map((b, i) => (
                  <tr key={i}>
                    <td>{b.factor}</td>
                    <td>{b.value}</td>
                    <td>{b.score}/{b.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p><strong>Total Score:</strong> {awardPreview.totalScore} / {awardPreview.maxScore}</p>
            <p><strong>Award Percentage:</strong> {(awardPreview.awardPercentage * 100).toFixed(1)}%</p>
            <p><strong>Award Amount:</strong> ${Number(awardPreview.awardAmount).toLocaleString()}</p>
            <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
              <button type="button" className="btn btn-neutral" onClick={() => { setShowApproveModal(false); setAwardPreview(null); }}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmApprove} disabled={actionLoading}>
                {actionLoading ? 'Confirming…' : `Confirm Approval - $${Number(awardPreview.awardAmount).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: 480, width: '90%' }}>
            <h2 style={{ marginTop: 0 }}>Reject Application</h2>
            <p>Reason for rejection (required):</p>
            <textarea
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: 12, marginBottom: 16 }}
              placeholder="Provide feedback for the applicant"
            />
            <div style={{ display: 'flex', gap: 16 }}>
              <button type="button" className="btn btn-neutral" onClick={() => { setShowRejectModal(false); setRejectComment(''); }}>Cancel</button>
              <button type="button" className="btn" style={{ background: 'var(--danger)', color: 'white' }} onClick={handleConfirmReject} disabled={actionLoading || !rejectComment.trim()}>
                {actionLoading ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
