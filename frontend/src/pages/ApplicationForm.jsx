import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EligibilityPanel from '../components/EligibilityPanel';

const ORG_TYPES = ['501(c)(3)', '501(c)(4)', 'Community-Based Organization', 'Faith-Based Organization', 'For-Profit Business', 'Government Agency', 'Individual'];
const CATEGORIES = ['Youth Programs', 'Senior Services', 'Public Health', 'Neighborhood Safety', 'Arts & Culture', 'Workforce Development', 'Other'];

const initialForm = {
  organizationName: '', ein: '', organizationType: '', yearFounded: '', annualOperatingBudget: '', fullTimeEmployees: '',
  primaryContactName: '', primaryContactEmail: '', primaryContactPhone: '', organizationAddress: '', missionStatement: '',
  projectTitle: '', projectCategory: '', projectDescription: '', targetPopulation: '', estimatedBeneficiaries: '',
  totalProjectCost: '', amountRequested: '', projectStartDate: '', projectEndDate: '', previouslyReceivedGrant: false,
};

export default function ApplicationForm() {
  const navigate = useNavigate();
  const [section, setSection] = useState(1);
  const [form, setForm] = useState(() => {
    try {
      const s = sessionStorage.getItem('grant_draft');
      return s ? { ...initialForm, ...JSON.parse(s) } : initialForm;
    } catch { return initialForm; }
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');

  useEffect(() => {
    sessionStorage.setItem('grant_draft', JSON.stringify(form));
  }, [form]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    setFileError('');
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(f.type)) {
      setFileError('Only PDF, JPG, and PNG are allowed.');
      setFile(null);
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setFileError('File must be 5 MB or smaller.');
      setFile(null);
      return;
    }
    setFileError('');
    setFile(f);
  };

  const eligibilityData = {
    organizationType: form.organizationType,
    yearFounded: form.yearFounded ? Number(form.yearFounded) : null,
    annualOperatingBudget: form.annualOperatingBudget ? Number(form.annualOperatingBudget) : null,
    amountRequested: form.amountRequested ? Number(form.amountRequested) : null,
    totalProjectCost: form.totalProjectCost ? Number(form.totalProjectCost) : null,
    estimatedBeneficiaries: form.estimatedBeneficiaries ? Number(form.estimatedBeneficiaries) : null,
  };

  return (
    <>
      <h1>Grant Application</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        <div className="card">
          {section === 1 && (
            <>
              <h2 style={{ marginTop: 0 }}>Section 1: Organization Information</h2>
              <div className="form-group">
                <label>Organization Name <span className="required">*</span></label>
                <input name="organizationName" value={form.organizationName} onChange={handleChange} required minLength={2} maxLength={100} />
              </div>
              <div className="form-group">
                <label>EIN (Tax ID) <span className="required">*</span></label>
                <input name="ein" value={form.ein} onChange={handleChange} required placeholder="XX-XXXXXXX" pattern="\d{2}-\d{7}" />
              </div>
              <div className="form-group">
                <label>Organization Type <span className="required">*</span></label>
                <select name="organizationType" value={form.organizationType} onChange={handleChange} required>
                  <option value="">Select type</option>
                  {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Year Founded <span className="required">*</span></label>
                <input name="yearFounded" type="number" value={form.yearFounded} onChange={handleChange} required min={1800} max={new Date().getFullYear()} />
              </div>
              <div className="form-group">
                <label>Annual Operating Budget <span className="required">*</span></label>
                <input name="annualOperatingBudget" type="number" value={form.annualOperatingBudget} onChange={handleChange} required min={0} step={1000} />
              </div>
              <div className="form-group">
                <label>Number of Full-Time Employees <span className="required">*</span></label>
                <input name="fullTimeEmployees" type="number" value={form.fullTimeEmployees} onChange={handleChange} required min={0} max={9999} />
              </div>
              <div className="form-group">
                <label>Primary Contact Name <span className="required">*</span></label>
                <input name="primaryContactName" value={form.primaryContactName} onChange={handleChange} required minLength={2} maxLength={50} />
              </div>
              <div className="form-group">
                <label>Primary Contact Email <span className="required">*</span></label>
                <input name="primaryContactEmail" type="email" value={form.primaryContactEmail} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Primary Contact Phone <span className="required">*</span></label>
                <input name="primaryContactPhone" value={form.primaryContactPhone} onChange={handleChange} required placeholder="(XXX) XXX-XXXX" />
              </div>
              <div className="form-group">
                <label>Organization Address <span className="required">*</span></label>
                <textarea name="organizationAddress" value={form.organizationAddress} onChange={handleChange} required rows={2} />
              </div>
              <div className="form-group">
                <label>Mission Statement <span className="required">*</span></label>
                <textarea name="missionStatement" value={form.missionStatement} onChange={handleChange} required minLength={20} maxLength={500} rows={3} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                <button type="button" className="btn btn-primary" onClick={() => setSection(2)}>Next</button>
              </div>
            </>
          )}
          {section === 2 && (
            <>
              <h2 style={{ marginTop: 0 }}>Section 2: Project Details</h2>
              <div className="form-group">
                <label>Project Title <span className="required">*</span></label>
                <input name="projectTitle" value={form.projectTitle} onChange={handleChange} required minLength={5} maxLength={100} />
              </div>
              <div className="form-group">
                <label>Project Category <span className="required">*</span></label>
                <select name="projectCategory" value={form.projectCategory} onChange={handleChange} required>
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Project Description <span className="required">*</span></label>
                <textarea name="projectDescription" value={form.projectDescription} onChange={handleChange} required minLength={50} maxLength={2000} rows={4} />
              </div>
              <div className="form-group">
                <label>Target Population Served <span className="required">*</span></label>
                <input name="targetPopulation" value={form.targetPopulation} onChange={handleChange} required minLength={5} maxLength={200} />
              </div>
              <div className="form-group">
                <label>Estimated Number of Beneficiaries <span className="required">*</span></label>
                <input name="estimatedBeneficiaries" type="number" value={form.estimatedBeneficiaries} onChange={handleChange} required min={1} max={1000000} />
              </div>
              <div className="form-group">
                <label>Total Project Cost <span className="required">*</span></label>
                <input name="totalProjectCost" type="number" value={form.totalProjectCost} onChange={handleChange} required min={100} step={100} />
              </div>
              <div className="form-group">
                <label>Amount Requested <span className="required">*</span></label>
                <input name="amountRequested" type="number" value={form.amountRequested} onChange={handleChange} required min={100} max={50000} step={100} />
              </div>
              <div className="form-group">
                <label>Project Start Date <span className="required">*</span></label>
                <input name="projectStartDate" type="date" value={form.projectStartDate} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Project End Date <span className="required">*</span></label>
                <input name="projectEndDate" type="date" value={form.projectEndDate} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input name="previouslyReceivedGrant" type="checkbox" checked={form.previouslyReceivedGrant} onChange={handleChange} />
                  Previously Received Maplewood Grant
                </label>
              </div>
              <div className="form-group">
                <label>Supporting Document (PDF, JPG, PNG; max 5 MB) <span className="required">*</span></label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} />
                {file && <p style={{ marginTop: 4, color: 'var(--success)' }}>{file.name}</p>}
                {fileError && <p className="error">{fileError}</p>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
                <button type="button" className="btn btn-neutral" onClick={() => setSection(1)}>Back</button>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/apply/review', { state: { form, file } })}>
                  Review & Submit
                </button>
              </div>
            </>
          )}
        </div>
        <div style={{ position: 'sticky', top: 24 }}>
          <EligibilityPanel formData={eligibilityData} />
        </div>
      </div>
    </>
  );
}
