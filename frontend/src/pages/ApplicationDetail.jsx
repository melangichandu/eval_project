import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getApplication } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EligibilityPanel from '../components/EligibilityPanel';

export default function ApplicationDetail() {
  const { id } = useParams();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getApplication(id)
      .then(setApp)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>;
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
      <h1>{app.projectTitle}</h1>
      <p><StatusBadge status={app.status} /> {app.awardAmount != null && `Award: $${Number(app.awardAmount).toLocaleString()}`}</p>
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
      {app.status === 'REJECTED' && app.reviewerComments && (
        <div className="card" style={{ background: '#FFEBEE' }}>
          <h3>Reviewer Comments</h3>
          <p>{app.reviewerComments}</p>
        </div>
      )}
      {app.status === 'APPROVED' && app.awardBreakdown && (
        <div className="card" style={{ background: '#E8F5E9' }}>
          <h3>Award Breakdown</h3>
          <p><strong>Total Score:</strong> {app.awardBreakdown.totalScore} / {app.awardBreakdown.maxScore}</p>
          <p><strong>Award Amount:</strong> ${Number(app.awardAmount).toLocaleString()}</p>
        </div>
      )}
    </>
  );
}
