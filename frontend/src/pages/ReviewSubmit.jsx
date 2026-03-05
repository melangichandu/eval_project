import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { submitApplication, uploadDocument } from '../services/api';
import EligibilityPanel from '../components/EligibilityPanel';

export default function ReviewSubmit() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState(state?.form || null);
  const [file, setFile] = useState(state?.file || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!form) navigate('/apply');
  }, [form, navigate]);

  const eligibilityData = form ? {
    organizationType: form.organizationType,
    yearFounded: form.yearFounded ? Number(form.yearFounded) : null,
    annualOperatingBudget: form.annualOperatingBudget ? Number(form.annualOperatingBudget) : null,
    amountRequested: form.amountRequested ? Number(form.amountRequested) : null,
    totalProjectCost: form.totalProjectCost ? Number(form.totalProjectCost) : null,
    estimatedBeneficiaries: form.estimatedBeneficiaries ? Number(form.estimatedBeneficiaries) : null,
  } : {};

  const handleSubmit = async () => {
    if (!form) return;
    setError('');
    setLoading(true);
    try {
      const payload = {
        organizationName: form.organizationName,
        ein: form.ein,
        organizationType: form.organizationType,
        yearFounded: Number(form.yearFounded),
        annualOperatingBudget: Number(form.annualOperatingBudget),
        fullTimeEmployees: Number(form.fullTimeEmployees),
        primaryContactName: form.primaryContactName,
        primaryContactEmail: form.primaryContactEmail,
        primaryContactPhone: form.primaryContactPhone,
        organizationAddress: form.organizationAddress,
        missionStatement: form.missionStatement,
        projectTitle: form.projectTitle,
        projectCategory: form.projectCategory,
        projectDescription: form.projectDescription,
        targetPopulation: form.targetPopulation,
        estimatedBeneficiaries: Number(form.estimatedBeneficiaries),
        totalProjectCost: Number(form.totalProjectCost),
        amountRequested: Number(form.amountRequested),
        projectStartDate: form.projectStartDate,
        projectEndDate: form.projectEndDate,
        previouslyReceivedGrant: !!form.previouslyReceivedGrant,
      };
      const app = await submitApplication(payload);
      if (file) {
        try {
          await uploadDocument(app.id, file);
        } catch (e) {
          console.warn('Upload failed:', e);
        }
      }
      sessionStorage.removeItem('grant_draft');
      navigate(`/application/${app.id}`);
    } catch (err) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (!form) return null;

  const eligible = eligibilityData && (eligibilityData.organizationType && eligibilityData.yearFounded != null && eligibilityData.annualOperatingBudget != null &&
    eligibilityData.amountRequested != null && eligibilityData.totalProjectCost != null && eligibilityData.estimatedBeneficiaries != null);
  const allSix = eligible && (() => {
    const { run } = require('../services/eligibilityEngine');
    const r = run(eligibilityData);
    return r.eligible;
  })();

  return (
    <>
      <h1>Review & Submit</h1>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Application Summary</h2>
        <p><strong>Organization:</strong> {form.organizationName}</p>
        <p><strong>Project:</strong> {form.projectTitle}</p>
        <p><strong>Amount Requested:</strong> ${Number(form.amountRequested).toLocaleString()}</p>
        <p><strong>Supporting Document:</strong> {file ? file.name : 'None'}</p>
      </div>
      <EligibilityPanel formData={eligibilityData} />
      {!allSix && (
        <div className="card" style={{ background: '#FFF3E0', borderLeft: '4px solid var(--warning)' }}>
          <p style={{ margin: 0 }}>
            Your application does not meet all eligibility criteria. You may still submit, but approval is not guaranteed.
          </p>
        </div>
      )}
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
        <button type="button" className="btn btn-neutral" onClick={() => navigate('/apply')} disabled={loading}>
          Back to Edit
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading || !file}>
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </>
  );
}
