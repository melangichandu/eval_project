import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { submitApplication, uploadDocument } from '../services/api';
import EligibilityPanel from '../components/EligibilityPanel';

function formatCurrency(n) {
  if (n === '' || n == null || isNaN(Number(n))) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Number(n));
}

function formatDate(str) {
  if (!str || !str.trim()) return '—';
  const d = new Date(str.trim());
  return Number.isNaN(d.getTime()) ? str : d.toLocaleDateString();
}

function formatNumber(n) {
  if (n === '' || n == null || isNaN(Number(n))) return '—';
  return new Intl.NumberFormat().format(Number(n));
}

export default function ReviewSubmit() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState(state?.form || null);
  const [file, setFile] = useState(state?.file || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdAppId, setCreatedAppId] = useState(null);

  useEffect(() => {
    if (!form) navigate('/apply');
  }, [form, navigate]);

  const handleBackToEdit = () => {
    navigate('/apply', { state: { form, file } });
  };

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
      setCreatedAppId(app.id);
      if (file) {
        try {
          await uploadDocument(app.id, file);
        } catch (e) {
          setError(`Your application was submitted, but the document upload failed: ${e.message}. You can go to your application and try uploading again.`);
          setLoading(false);
          return;
        }
      }
      sessionStorage.removeItem('grant_draft');
      navigate(`/application/${app.id}`, { state: { fromSubmit: true } });
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
      <div className="card review-summary">
        <h2 className="review-submit-heading">Application Summary</h2>

        <section className="review-section" aria-labelledby="review-org-heading">
          <h3 id="review-org-heading" className="review-section-heading">Organization Information</h3>
          <dl className="review-dl">
            <dt>Organization Name</dt>
            <dd>{form.organizationName || '—'}</dd>
            <dt>EIN (Tax ID)</dt>
            <dd>{form.ein || '—'}</dd>
            <dt>Organization Type</dt>
            <dd>{form.organizationType || '—'}</dd>
            <dt>Year Founded</dt>
            <dd>{formatNumber(form.yearFounded)}</dd>
            <dt>Annual Operating Budget</dt>
            <dd>{formatCurrency(form.annualOperatingBudget)}</dd>
            <dt>Number of Full-Time Employees</dt>
            <dd>{formatNumber(form.fullTimeEmployees)}</dd>
            <dt>Primary Contact Name</dt>
            <dd>{form.primaryContactName || '—'}</dd>
            <dt>Primary Contact Email</dt>
            <dd>{form.primaryContactEmail || '—'}</dd>
            <dt>Primary Contact Phone</dt>
            <dd>{form.primaryContactPhone || '—'}</dd>
            <dt>Organization Address</dt>
            <dd>{form.organizationAddress || '—'}</dd>
            <dt>Mission Statement</dt>
            <dd>{form.missionStatement || '—'}</dd>
          </dl>
        </section>

        <section className="review-section" aria-labelledby="review-project-heading">
          <h3 id="review-project-heading" className="review-section-heading">Project Details</h3>
          <dl className="review-dl">
            <dt>Project Title</dt>
            <dd>{form.projectTitle || '—'}</dd>
            <dt>Project Category</dt>
            <dd>{form.projectCategory || '—'}</dd>
            <dt>Project Description</dt>
            <dd>{form.projectDescription || '—'}</dd>
            <dt>Target Population Served</dt>
            <dd>{form.targetPopulation || '—'}</dd>
            <dt>Estimated Number of Beneficiaries</dt>
            <dd>{formatNumber(form.estimatedBeneficiaries)}</dd>
            <dt>Total Project Cost</dt>
            <dd>{formatCurrency(form.totalProjectCost)}</dd>
            <dt>Amount Requested</dt>
            <dd>{formatCurrency(form.amountRequested)}</dd>
            <dt>Project Start Date</dt>
            <dd>{formatDate(form.projectStartDate)}</dd>
            <dt>Project End Date</dt>
            <dd>{formatDate(form.projectEndDate)}</dd>
            <dt>Previously Received Maplewood Grant</dt>
            <dd>{form.previouslyReceivedGrant ? 'Yes' : 'No'}</dd>
            <dt>Supporting Document</dt>
            <dd>
              {file ? (
                <>
                  {file.name}
                  {file.size != null && (
                    <span className="review-doc-meta"> ({(file.size / 1024).toFixed(1)} KB)</span>
                  )}
                </>
              ) : (
                <span className="review-no-doc">No document selected</span>
              )}
            </dd>
          </dl>
        </section>
      </div>

      <section className="review-eligibility" aria-labelledby="review-eligibility-heading">
        <h3 id="review-eligibility-heading" className="sr-only">Eligibility</h3>
        <EligibilityPanel formData={eligibilityData} />
      </section>

      {!allSix && (
        <div className="card review-warning eligibility-warning-card" role="alert" aria-live="polite">
          <p className="eligibility-warning-card-p">
            Your application does not meet all eligibility criteria. You may still submit; the reviewer will make the final determination.
          </p>
        </div>
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {error && createdAppId && (
        <p>
          <button type="button" className="btn btn-primary" onClick={() => navigate(`/application/${createdAppId}`)}>
            Go to my application
          </button>
        </p>
      )}

      <div className="form-navigation form-navigation--between review-submit-actions">
        <button type="button" className="btn btn-neutral" onClick={handleBackToEdit} disabled={loading}>
          Back to Edit
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading || !file}>
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>
    </>
  );
}
