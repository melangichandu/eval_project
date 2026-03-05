import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { getApplication } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EligibilityPanel from '../components/EligibilityPanel';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

export default function ApplicationDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const showSubmitSuccess = location.state?.fromSubmit === true;

  useEffect(() => {
    getApplication(id)
      .then(setApp)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="application-detail-error" role="alert">{error}</p>;
  if (!app) return null;

  const eligibilityData = {
    organizationType: app.organizationType,
    yearFounded: app.yearFounded,
    annualOperatingBudget: app.annualOperatingBudget,
    amountRequested: app.amountRequested,
    totalProjectCost: app.totalProjectCost,
    estimatedBeneficiaries: app.estimatedBeneficiaries,
  };

  return (
    <>
      <p><Link to="/dashboard">← Dashboard</Link></p>
      {showSubmitSuccess && (
        <div className="card application-success-banner" role="status" aria-live="polite">
          <p className="application-success-banner-p">Application submitted successfully.</p>
        </div>
      )}
      <h1>{app.projectTitle}</h1>
      <p><StatusBadge status={app.status} /></p>
      {app.status === 'APPROVED' && app.awardAmount != null && (
        <section className="card application-detail-award" aria-labelledby="award-heading">
          <h2 id="award-heading" className="application-detail-award-heading">Award Amount</h2>
          <p className="award-amount" aria-label={`Award amount: ${formatCurrency(app.awardAmount)}`}>
            {formatCurrency(app.awardAmount)}
          </p>
          <p className="application-detail-award-note">
            The amount was calculated based on the program&apos;s criteria.
          </p>
        </section>
      )}
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
      {app.status === 'REJECTED' && (
        <section className="card application-detail-rejection-card reviewer-comments" aria-labelledby="reviewer-feedback-heading">
          <h3 id="reviewer-feedback-heading">Reviewer feedback</h3>
          <p className="reviewer-comments-body">
            {app.reviewerComments && app.reviewerComments.trim() !== ''
              ? app.reviewerComments
              : 'No additional feedback provided'}
          </p>
        </section>
      )}
      {app.status === 'APPROVED' && app.awardBreakdown && (
        <div className="card application-detail-award-breakdown-card">
          <h3>Award Breakdown</h3>
          <p><strong>Total Score:</strong> {app.awardBreakdown.totalScore} / {app.awardBreakdown.maxScore}</p>
          <p><strong>Award Amount:</strong> <span className="award-amount">{formatCurrency(app.awardAmount)}</span></p>
        </div>
      )}
    </>
  );
}
