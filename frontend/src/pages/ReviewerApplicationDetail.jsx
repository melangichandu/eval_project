import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApplication, getDocumentBlob, updateStatus, calculateAward } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const FOCUSABLE_SELECTOR = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function formatCurrency(n) {
  return n != null && !Number.isNaN(Number(n)) ? `$${Number(n).toLocaleString()}` : '';
}

function formatDateOnly(str) {
  if (!str || !String(str).trim()) return '—';
  const d = new Date(String(str).trim());
  return Number.isNaN(d.getTime()) ? str : d.toLocaleDateString();
}

export default function ReviewerApplicationDetail() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [awardPreview, setAwardPreview] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [docLoading, setDocLoading] = useState(null);
  const approveBtnRef = useRef(null);
  const rejectBtnRef = useRef(null);
  const approveModalRef = useRef(null);
  const rejectModalRef = useRef(null);

  const load = () => {
    setError('');
    getApplication(id)
      .then(setApp)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    if (!showApproveModal || !approveModalRef.current) return;
    const el = approveModalRef.current;
    const focusables = el.querySelectorAll(FOCUSABLE_SELECTOR);
    const first = focusables[0];
    if (first) first.focus();
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setShowApproveModal(false);
        setAwardPreview(null);
        approveBtnRef.current?.focus();
        e.preventDefault();
        return;
      }
      if (e.key === 'Tab' && el.contains(document.activeElement)) {
        const list = el.querySelectorAll(FOCUSABLE_SELECTOR);
        if (list.length === 0) return;
        const firstEl = list[0];
        const lastEl = list[list.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      approveBtnRef.current?.focus();
    };
  }, [showApproveModal]);

  useEffect(() => {
    if (!showRejectModal || !rejectModalRef.current) return;
    const el = rejectModalRef.current;
    const focusables = el.querySelectorAll(FOCUSABLE_SELECTOR);
    const first = focusables[0];
    if (first) first.focus();
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setShowRejectModal(false);
        setRejectComment('');
        rejectBtnRef.current?.focus();
        e.preventDefault();
        return;
      }
      if (e.key === 'Tab' && el.contains(document.activeElement)) {
        const list = el.querySelectorAll(FOCUSABLE_SELECTOR);
        if (list.length === 0) return;
        const firstEl = list[0];
        const lastEl = list[list.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      rejectBtnRef.current?.focus();
    };
  }, [showRejectModal]);

  const handleViewDocument = async (docId, fileName) => {
    setDocLoading(docId);
    try {
      const blob = await getDocumentBlob(id, docId, { download: false });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setError(e.message);
    } finally {
      setDocLoading(null);
    }
  };

  const handleDownloadDocument = async (docId, fileName) => {
    setDocLoading(docId);
    try {
      const blob = await getDocumentBlob(id, docId, { download: true });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'document';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setDocLoading(null);
    }
  };

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

  if (loading) return <p className="reviewer-detail-loading">Loading…</p>;
  if (error)
    return (
      <div className="reviewer-detail-error-wrap">
        <p className="reviewer-detail-error" role="alert">{error}</p>
        <button type="button" className="btn btn-primary" onClick={load}>Try again</button>
      </div>
    );
  if (!app) return null;

  const canApprove = app.status === 'UNDER_REVIEW';
  const canReject = app.status === 'UNDER_REVIEW';
  const canMarkUnderReview = app.status === 'SUBMITTED';

  const eligibilityDetails = Array.isArray(app.eligibilityDetails)
    ? app.eligibilityDetails
    : typeof app.eligibilityDetails === 'string'
      ? (() => { try { return JSON.parse(app.eligibilityDetails); } catch { return []; } })()
      : [];
  const score = app.eligibilityScore != null ? app.eligibilityScore : 0;
  const total = app.eligibilityTotal != null ? app.eligibilityTotal : 0;
  const eligible = total > 0 && score === total;

  return (
    <>
      <p className="reviewer-detail-back-wrap">
        <Link to="/reviewer" className="btn btn-neutral">← Back to Dashboard</Link>
      </p>
      <h1 className="reviewer-detail-heading">{app.projectTitle}</h1>
      <p className="reviewer-detail-meta">
        <StatusBadge status={app.status} /> {app.organizationName || app.orgName}
      </p>

      {/* Eligibility results from stored data */}
      <section className="card application-detail-section" aria-labelledby="eligibility-heading">
        <h2 id="eligibility-heading" className="reviewer-detail-section-heading">Eligibility results</h2>
        <div
          className={`eligibility-summary ${eligible ? 'eligibility-summary--eligible' : score > 0 ? 'eligibility-summary--not-eligible' : 'eligibility-summary--neutral'}`}
          role="status"
        >
          {total > 0
            ? (eligible ? `Eligible – ${score} of ${total} criteria met` : `Not Eligible – ${score} of ${total} criteria met`)
            : 'No eligibility data'}
        </div>
        <ul className="eligibility-rules-list" aria-label="Eligibility rules">
          {eligibilityDetails.map((r) => {
            const statusClass = r.neutral ? 'eligibility-neutral' : r.pass ? 'eligibility-pass' : 'eligibility-fail';
            const iconChar = r.neutral ? '○' : r.pass ? '✓' : '✗';
            return (
              <li key={r.id || r.name} className="eligibility-rule">
                <span className={`eligibility-rule-icon ${statusClass}`} aria-hidden="true">{iconChar}</span>
                <span className={`eligibility-rule-message ${statusClass}`}>{r.name}: {r.message}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Organization Information */}
      <section className="card application-detail-section" aria-labelledby="org-heading">
        <h2 id="org-heading" className="reviewer-detail-section-heading">Organization Information</h2>
        <dl className="reviewer-detail-dl">
          <dt>Organization Name</dt><dd>{app.organizationName}</dd>
          <dt>EIN</dt><dd>{app.ein}</dd>
          <dt>Organization Type</dt><dd>{app.organizationType}</dd>
          <dt>Year Founded</dt><dd>{app.yearFounded}</dd>
          <dt>Annual Operating Budget</dt><dd>{formatCurrency(app.annualOperatingBudget)}</dd>
          <dt>Full-Time Employees</dt><dd>{app.fullTimeEmployees}</dd>
          <dt>Primary Contact Name</dt><dd>{app.primaryContactName}</dd>
          <dt>Email</dt><dd>{app.primaryContactEmail}</dd>
          <dt>Phone</dt><dd>{app.primaryContactPhone}</dd>
          <dt>Organization Address</dt><dd>{app.organizationAddress}</dd>
          <dt>Mission Statement</dt><dd>{app.missionStatement}</dd>
        </dl>
      </section>

      {/* Project Details */}
      <section className="card application-detail-section" aria-labelledby="project-heading">
        <h2 id="project-heading" className="reviewer-detail-section-heading">Project Details</h2>
        <dl className="reviewer-detail-dl">
          <dt>Project Title</dt><dd>{app.projectTitle}</dd>
          <dt>Project Category</dt><dd>{app.projectCategory}</dd>
          <dt>Project Description</dt><dd>{app.projectDescription}</dd>
          <dt>Target Population</dt><dd>{app.targetPopulation}</dd>
          <dt>Estimated Beneficiaries</dt><dd>{app.estimatedBeneficiaries}</dd>
          <dt>Total Project Cost</dt><dd>{formatCurrency(app.totalProjectCost)}</dd>
          <dt>Amount Requested</dt><dd>{formatCurrency(app.amountRequested)}</dd>
          <dt>Project Start Date</dt><dd>{formatDateOnly(app.projectStartDate)}</dd>
          <dt>Project End Date</dt><dd>{formatDateOnly(app.projectEndDate)}</dd>
          <dt>Previously Received Grant</dt><dd>{app.previouslyReceivedGrant ? 'Yes' : 'No'}</dd>
        </dl>
      </section>

      {/* Documents */}
      <section className="card application-detail-section" aria-labelledby="documents-heading">
        <h2 id="documents-heading" className="reviewer-detail-section-heading">Documents</h2>
        {app.documents?.length > 0 ? (
          <ul className="document-list">
            {app.documents.map((d) => (
              <li key={d.id} className="document-item">
                <span className="document-item-name">{d.fileName}</span>
                <span className="document-item-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-document-action"
                    onClick={() => handleViewDocument(d.id, d.fileName)}
                    disabled={docLoading === d.id}
                    aria-label={`View ${d.fileName}`}
                  >
                    {docLoading === d.id ? '…' : 'View'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-neutral btn-document-action"
                    onClick={() => handleDownloadDocument(d.id, d.fileName)}
                    disabled={docLoading === d.id}
                    aria-label={`Download ${d.fileName}`}
                  >
                    Download
                  </button>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="document-empty">No document uploaded.</p>
        )}
      </section>

      {/* Actions (US-204) */}
      <section className="card application-detail-section" aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="reviewer-detail-section-heading">Actions</h2>
        <div className="reviewer-detail-actions">
          {canMarkUnderReview && (
            <button type="button" className="btn btn-secondary" onClick={handleMarkUnderReview} disabled={actionLoading}>
              Mark Under Review
            </button>
          )}
          {canApprove && (
            <button type="button" ref={approveBtnRef} className="btn btn-primary" onClick={handleApproveClick} disabled={actionLoading}>
              Approve
            </button>
          )}
          {canReject && (
            <button type="button" ref={rejectBtnRef} className="btn btn-danger" onClick={handleRejectClick} disabled={actionLoading}>
              Reject
            </button>
          )}
        </div>
      </section>

      {showApproveModal && awardPreview && (
        <div className="modal-backdrop modal-overlay" role="dialog" aria-modal="true" aria-labelledby="approve-modal-title">
          <div ref={approveModalRef} className="modal-content modal-content--narrow">
            <h2 id="approve-modal-title" className="modal-heading">Approve Application</h2>
            <p><strong>Award Calculation</strong></p>
            <table className="modal-table">
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
            <p><strong>Award Amount:</strong> {formatCurrency(awardPreview.awardAmount)}</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-neutral" onClick={() => { setShowApproveModal(false); setAwardPreview(null); }}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleConfirmApprove} disabled={actionLoading}>
                {actionLoading ? 'Confirming…' : `Confirm Approval – ${formatCurrency(awardPreview.awardAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="modal-backdrop modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
          <div ref={rejectModalRef} className="modal-content modal-content--narrow">
            <h2 id="reject-modal-title" className="modal-heading">Reject Application</h2>
            <p>Reason for rejection (required):</p>
            <textarea
              className="modal-textarea"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={4}
              placeholder="Provide feedback for the applicant"
              aria-label="Reason for rejection"
            />
            <div className="modal-actions">
              <button type="button" className="btn btn-neutral" onClick={() => { setShowRejectModal(false); setRejectComment(''); }}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleConfirmReject} disabled={actionLoading || !rejectComment.trim()}>
                {actionLoading ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
