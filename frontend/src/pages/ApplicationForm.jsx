import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import EligibilityPanel from '../components/EligibilityPanel';

const ORG_TYPES = ['501(c)(3)', '501(c)(4)', 'Community-Based Organization', 'Faith-Based Organization', 'For-Profit Business', 'Government Agency', 'Individual'];
const CATEGORIES = ['Youth Programs', 'Senior Services', 'Public Health', 'Neighborhood Safety', 'Arts & Culture', 'Workforce Development', 'Other'];

const EIN_REGEX = /^\d{2}-\d{7}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\(\d{3}\)\s*\d{3}-\d{4}$/;

const currentYear = new Date().getFullYear();
const minStartDate = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
})();

function parseLocalDate(isoDateStr) {
  const match = (isoDateStr || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const d2 = new Date(y, m - 1, d);
  if (d2.getFullYear() !== y || d2.getMonth() !== m - 1 || d2.getDate() !== d) return null;
  return d2;
}

/** Max project end date: exactly 24 months after start date (YYYY-MM-DD). */
function getMaxEndDateFromStart(startDateStr) {
  if (!startDateStr || !startDateStr.trim()) return undefined;
  const start = parseLocalDate(startDateStr.trim());
  if (!start) return undefined;
  const maxEnd = new Date(start.getFullYear(), start.getMonth() + 24, start.getDate());
  return maxEnd.toISOString().slice(0, 10);
}

const initialForm = {
  organizationName: '', ein: '', organizationType: '', yearFounded: '', annualOperatingBudget: '', fullTimeEmployees: '',
  primaryContactName: '', primaryContactEmail: '', primaryContactPhone: '', organizationAddress: '', missionStatement: '',
  projectTitle: '', projectCategory: '', projectDescription: '', targetPopulation: '', estimatedBeneficiaries: '',
  totalProjectCost: '', amountRequested: '', projectStartDate: '', projectEndDate: '', previouslyReceivedGrant: false,
};

function formatPhone(value) {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length <= 3) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function formatEin(value) {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
}

function validateSection1Fields(form) {
  const err = {};
  const s = (v) => (v || '').trim();

  if (!s(form.organizationName)) err.organizationName = 'Organization name is required';
  else if (s(form.organizationName).length < 2 || s(form.organizationName).length > 100) err.organizationName = 'Organization name must be 2–100 characters';

  if (!s(form.ein)) err.ein = 'EIN (Tax ID) is required';
  else if (!EIN_REGEX.test(form.ein.replace(/\s/g, ''))) err.ein = 'EIN must be in format XX-XXXXXXX (2 digits, hyphen, 7 digits)';

  if (!s(form.organizationType)) err.organizationType = 'Organization type is required';

  const y = form.yearFounded === '' || form.yearFounded == null ? null : Number(form.yearFounded);
  if (y === null || isNaN(y)) err.yearFounded = 'Year founded is required';
  else if (y < 1800 || y > currentYear) err.yearFounded = `Year must be between 1800 and ${currentYear}`;

  const budget = form.annualOperatingBudget === '' || form.annualOperatingBudget == null ? null : Number(form.annualOperatingBudget);
  if (budget === null || isNaN(budget)) err.annualOperatingBudget = 'Annual operating budget is required';
  else if (budget < 0 || budget > 100000000) err.annualOperatingBudget = 'Budget must be $0–$100,000,000';

  const emp = form.fullTimeEmployees === '' || form.fullTimeEmployees == null ? null : Number(form.fullTimeEmployees);
  if (emp === null || isNaN(emp)) err.fullTimeEmployees = 'Number of full-time employees is required';
  else if (emp < 0 || emp > 9999) err.fullTimeEmployees = 'Must be 0–9999';

  if (!s(form.primaryContactName)) err.primaryContactName = 'Primary contact name is required';
  else if (s(form.primaryContactName).length < 2 || s(form.primaryContactName).length > 50) err.primaryContactName = 'Primary contact name must be 2–50 characters';

  if (!s(form.primaryContactEmail)) err.primaryContactEmail = 'Primary contact email is required';
  else if (!EMAIL_REGEX.test(form.primaryContactEmail.trim().toLowerCase())) err.primaryContactEmail = 'Enter a valid email address';

  const phoneVal = (form.primaryContactPhone || '').trim();
  if (!phoneVal) err.primaryContactPhone = 'Primary contact phone is required';
  else if (!PHONE_REGEX.test(formatPhone(form.primaryContactPhone))) err.primaryContactPhone = 'Phone must be in format (XXX) XXX-XXXX';

  if (!s(form.organizationAddress)) err.organizationAddress = 'Organization address is required';

  if (!s(form.missionStatement)) err.missionStatement = 'Mission statement is required';
  else if (s(form.missionStatement).length < 20 || s(form.missionStatement).length > 500) err.missionStatement = 'Mission statement must be 20–500 characters';

  return err;
}

function validateSection2Fields(form) {
  const err = {};
  const s = (v) => (v || '').trim();

  if (!s(form.projectTitle)) err.projectTitle = 'Project title is required';
  else if (s(form.projectTitle).length < 5 || s(form.projectTitle).length > 100) err.projectTitle = 'Project title must be 5–100 characters';

  if (!s(form.projectCategory)) err.projectCategory = 'Project category is required';

  if (!s(form.projectDescription)) err.projectDescription = 'Project description is required';
  else if (s(form.projectDescription).length < 50 || s(form.projectDescription).length > 2000) err.projectDescription = 'Project description must be 50–2000 characters';

  if (!s(form.targetPopulation)) err.targetPopulation = 'Target population served is required';
  else if (s(form.targetPopulation).length < 5 || s(form.targetPopulation).length > 200) err.targetPopulation = 'Target population must be 5–200 characters';

  const ben = form.estimatedBeneficiaries === '' || form.estimatedBeneficiaries == null ? null : Number(form.estimatedBeneficiaries);
  if (ben === null || isNaN(ben)) err.estimatedBeneficiaries = 'Estimated number of beneficiaries is required';
  else if (ben < 1 || ben > 1000000) err.estimatedBeneficiaries = 'Must be 1–1,000,000';

  const total = form.totalProjectCost === '' || form.totalProjectCost == null ? null : Number(form.totalProjectCost);
  if (total === null || isNaN(total)) err.totalProjectCost = 'Total project cost is required';
  else if (total < 100 || total > 10000000) err.totalProjectCost = 'Total project cost must be $100–$10,000,000';

  const amt = form.amountRequested === '' || form.amountRequested == null ? null : Number(form.amountRequested);
  if (amt === null || isNaN(amt)) err.amountRequested = 'Amount requested is required';
  else if (amt < 100 || amt > 50000) err.amountRequested = 'Amount requested must be $100–$50,000';

  const startStr = form.projectStartDate ? form.projectStartDate.trim() : '';
  if (!startStr) err.projectStartDate = 'Project start date is required';
  else {
    const startDate = parseLocalDate(startStr);
    const minStart = new Date();
    minStart.setDate(minStart.getDate() + 30);
    minStart.setHours(0, 0, 0, 0);
    if (!startDate || startDate < minStart) err.projectStartDate = 'Project start date must be at least 30 days from today';
  }

  const endStr = form.projectEndDate ? form.projectEndDate.trim() : '';
  if (!endStr) err.projectEndDate = 'Project end date is required';
  else if (startStr) {
    const startDate = parseLocalDate(startStr);
    const endDate = parseLocalDate(endStr);
    if (!endDate) err.projectEndDate = 'Invalid project end date';
    else if (endDate <= startDate) err.projectEndDate = 'Project end date must be after start date';
    else {
      const maxEnd = new Date(startDate.getFullYear(), startDate.getMonth() + 24, startDate.getDate());
      if (endDate > maxEnd) err.projectEndDate = 'Project end date must be within 24 months of start date';
    }
  }

  return err;
}

export default function ApplicationForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const [section, setSection] = useState(1);
  const [form, setForm] = useState(() => {
    let initial = initialForm;
    const fromState = location.state?.form;
    if (fromState && typeof fromState === 'object') initial = { ...initialForm, ...fromState };
    else try {
      const s = sessionStorage.getItem('grant_draft');
      if (s) initial = { ...initialForm, ...JSON.parse(s) };
    } catch {}
    if (initial.ein) initial = { ...initial, ein: formatEin(initial.ein) };
    return initial;
  });
  const [files, setFiles] = useState(() => {
    const s = location.state;
    if (Array.isArray(s?.files) && s.files.length) return s.files;
    if (s?.file) return [s.file];
    return [];
  });
  const [fileError, setFileError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitSummaryError, setSubmitSummaryError] = useState('');

  useEffect(() => {
    sessionStorage.setItem('grant_draft', JSON.stringify(form));
  }, [form]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'primaryContactPhone' && type !== 'checkbox') {
      const formatted = formatPhone(value);
      setForm((f) => ({ ...f, [name]: formatted }));
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    } else if (name === 'ein' && type !== 'checkbox') {
      const formatted = formatEin(value);
      setForm((f) => ({ ...f, [name]: formatted }));
      const trimmed = formatted.replace(/\s/g, '');
      const einError = !trimmed ? '' : !EIN_REGEX.test(trimmed) ? 'EIN must be in format XX-XXXXXXX (2 digits, hyphen, 7 digits)' : '';
      setFieldErrors((prev) => ({ ...prev, ein: einError }));
    } else {
      setForm((f) => {
        const next = { ...f, [name]: type === 'checkbox' ? checked : value };
        if (name === 'projectStartDate' && next.projectEndDate) {
          const maxEnd = getMaxEndDateFromStart(next.projectStartDate);
          if (maxEnd && next.projectEndDate > maxEnd) next.projectEndDate = maxEnd;
        }
        return next;
      });
      setFieldErrors((prev) => {
        const next = { ...prev, [name]: '' };
        if (name === 'projectStartDate') next.projectEndDate = '';
        return next;
      });
    }
    setFileError('');
    setSubmitSummaryError('');
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    if (section === 1) {
      const err1 = validateSection1Fields(form);
      setFieldErrors((prev) => ({ ...prev, [name]: err1[name] || '' }));
    } else {
      const err2 = validateSection2Fields(form);
      setFieldErrors((prev) => ({ ...prev, [name]: err2[name] || '' }));
    }
  };

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

  const handleFile = (e) => {
    const list = e.target.files;
    if (!list?.length) return;
    const next = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      if (!ALLOWED_TYPES.includes(f.type)) {
        setFileError('Only PDF, JPG, and PNG are allowed.');
        e.target.value = '';
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setFileError(`"${f.name}" is over 5 MB. Each file must be 5 MB or smaller.`);
        e.target.value = '';
        return;
      }
      next.push(f);
    }
    setFileError('');
    setFiles((prev) => [...prev, ...next]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError('');
  };

  const goNext = () => {
    const err = validateSection1Fields(form);
    setFieldErrors(err);
    if (Object.keys(err).length > 0) {
      setSubmitSummaryError('Please fix the errors in Section 1 before continuing.');
      return;
    }
    setSubmitSummaryError('');
    setSection(2);
  };

  const goReview = () => {
    const err = validateSection2Fields(form);
    setFieldErrors(err);
    if (!files.length) setFileError('At least one supporting document is required.');
    if (Object.keys(err).length > 0 || !files.length) {
      setSubmitSummaryError('Please fix the errors in Section 2 and attach at least one supporting document.');
      return;
    }
    setSubmitSummaryError('');
    navigate('/apply/review', { state: { form, files } });
  };

  const eligibilityData = {
    organizationType: form.organizationType,
    yearFounded: form.yearFounded ? Number(form.yearFounded) : null,
    annualOperatingBudget: form.annualOperatingBudget ? Number(form.annualOperatingBudget) : null,
    amountRequested: form.amountRequested ? Number(form.amountRequested) : null,
    totalProjectCost: form.totalProjectCost ? Number(form.totalProjectCost) : null,
    estimatedBeneficiaries: form.estimatedBeneficiaries ? Number(form.estimatedBeneficiaries) : null,
  };

  const id = (name) => `apply-${name}`;

  return (
    <>
      <h1>Grant Application</h1>
      <div className="application-form-page">
        <div className="card">
          {submitSummaryError && (
            <p className="error-summary" role="alert">
              {submitSummaryError}
            </p>
          )}
          {section === 1 && (
            <div className="form-section">
              <h2>Section 1: Organization Information</h2>
              <div className="form-group">
                <label htmlFor={id('organizationName')}>
                  Organization Name <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id={id('organizationName')}
                  name="organizationName"
                  value={form.organizationName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  minLength={2}
                  maxLength={100}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.organizationName}
                  aria-describedby={fieldErrors.organizationName ? `${id('organizationName')}-error` : undefined}
                />
                {fieldErrors.organizationName && (
                  <p id={`${id('organizationName')}-error`} className="error" role="alert">
                    {fieldErrors.organizationName}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('ein')}>
                  EIN (Tax ID) <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id={id('ein')}
                  name="ein"
                  value={form.ein}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="XX-XXXXXXX"
                  maxLength={10}
                  inputMode="numeric"
                  autoComplete="off"
                  aria-required="true"
                  aria-invalid={!!fieldErrors.ein}
                  aria-describedby={fieldErrors.ein ? `${id('ein')}-error` : undefined}
                />
                {fieldErrors.ein && (
                  <p id={`${id('ein')}-error`} className="error" role="alert">
                    {fieldErrors.ein}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('organizationType')}>
                  Organization Type <span className="required" aria-hidden="true">*</span>
                </label>
                <select
                  id={id('organizationType')}
                  name="organizationType"
                  value={form.organizationType}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.organizationType}
                  aria-describedby={fieldErrors.organizationType ? `${id('organizationType')}-error` : undefined}
                >
                  <option value="">Select type</option>
                  {ORG_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {fieldErrors.organizationType && (
                  <p id={`${id('organizationType')}-error`} className="error" role="alert">
                    {fieldErrors.organizationType}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('yearFounded')}>
                  Year Founded <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id={id('yearFounded')}
                  name="yearFounded"
                  type="number"
                  value={form.yearFounded}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min={1800}
                  max={currentYear}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.yearFounded}
                  aria-describedby={fieldErrors.yearFounded ? `${id('yearFounded')}-error` : undefined}
                />
                {fieldErrors.yearFounded && (
                  <p id={`${id('yearFounded')}-error`} className="error" role="alert">
                    {fieldErrors.yearFounded}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('annualOperatingBudget')}>
                  Annual Operating Budget <span className="required" aria-hidden="true">*</span>
                </label>
                <div className="input-with-prefix">
                  <span className="input-prefix" aria-hidden="true">$</span>
                  <input
                    id={id('annualOperatingBudget')}
                    name="annualOperatingBudget"
                    type="number"
                    value={form.annualOperatingBudget}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min={0}
                    max={100000000}
                    step={1}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.annualOperatingBudget}
                    aria-describedby={fieldErrors.annualOperatingBudget ? `${id('annualOperatingBudget')}-error` : undefined}
                  />
                </div>
                {fieldErrors.annualOperatingBudget && (
                  <p id={`${id('annualOperatingBudget')}-error`} className="error" role="alert">
                    {fieldErrors.annualOperatingBudget}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('fullTimeEmployees')}>
                  Number of Full-Time Employees <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id={id('fullTimeEmployees')}
                  name="fullTimeEmployees"
                  type="number"
                  value={form.fullTimeEmployees}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min={0}
                  max={9999}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.fullTimeEmployees}
                  aria-describedby={fieldErrors.fullTimeEmployees ? `${id('fullTimeEmployees')}-error` : undefined}
                />
                {fieldErrors.fullTimeEmployees && (
                  <p id={`${id('fullTimeEmployees')}-error`} className="error" role="alert">
                    {fieldErrors.fullTimeEmployees}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('primaryContactName')}>
                  Primary Contact Name <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id={id('primaryContactName')}
                  name="primaryContactName"
                  value={form.primaryContactName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  minLength={2}
                  maxLength={50}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.primaryContactName}
                  aria-describedby={fieldErrors.primaryContactName ? `${id('primaryContactName')}-error` : undefined}
                />
                {fieldErrors.primaryContactName && (
                  <p id={`${id('primaryContactName')}-error`} className="error" role="alert">
                    {fieldErrors.primaryContactName}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('primaryContactEmail')}>
                  Primary Contact Email <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id={id('primaryContactEmail')}
                  name="primaryContactEmail"
                  type="email"
                  value={form.primaryContactEmail}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.primaryContactEmail}
                  aria-describedby={fieldErrors.primaryContactEmail ? `${id('primaryContactEmail')}-error` : undefined}
                />
                {fieldErrors.primaryContactEmail && (
                  <p id={`${id('primaryContactEmail')}-error`} className="error" role="alert">
                    {fieldErrors.primaryContactEmail}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('primaryContactPhone')}>
                  Primary Contact Phone <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id={id('primaryContactPhone')}
                  name="primaryContactPhone"
                  type="tel"
                  value={form.primaryContactPhone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="(XXX) XXX-XXXX"
                  aria-required="true"
                  aria-invalid={!!fieldErrors.primaryContactPhone}
                  aria-describedby={fieldErrors.primaryContactPhone ? `${id('primaryContactPhone')}-error` : undefined}
                />
                {fieldErrors.primaryContactPhone && (
                  <p id={`${id('primaryContactPhone')}-error`} className="error" role="alert">
                    {fieldErrors.primaryContactPhone}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('organizationAddress')}>
                  Organization Address <span className="required" aria-hidden="true">*</span>
                </label>
                <textarea
                  id={id('organizationAddress')}
                  name="organizationAddress"
                  value={form.organizationAddress}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  rows={2}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.organizationAddress}
                  aria-describedby={fieldErrors.organizationAddress ? `${id('organizationAddress')}-error` : undefined}
                />
                {fieldErrors.organizationAddress && (
                  <p id={`${id('organizationAddress')}-error`} className="error" role="alert">
                    {fieldErrors.organizationAddress}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('missionStatement')}>
                  Mission Statement <span className="required" aria-hidden="true">*</span>
                </label>
                <textarea
                  id={id('missionStatement')}
                  name="missionStatement"
                  value={form.missionStatement}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  minLength={20}
                  maxLength={500}
                  rows={3}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.missionStatement}
                  aria-describedby={fieldErrors.missionStatement ? `${id('missionStatement')}-error` : undefined}
                />
                {fieldErrors.missionStatement && (
                  <p id={`${id('missionStatement')}-error`} className="error" role="alert">
                    {fieldErrors.missionStatement}
                  </p>
                )}
              </div>
              <div className="form-navigation">
                <button type="button" className="btn btn-primary" onClick={goNext}>
                  Next
                </button>
              </div>
            </div>
          )}
          {section === 2 && (
            <div className="form-section">
              <h2>Section 2: Project Details</h2>
              <div className="form-group">
                <label htmlFor={id('projectTitle')}>
                  Project Title <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id={id('projectTitle')}
                  name="projectTitle"
                  value={form.projectTitle}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  minLength={5}
                  maxLength={100}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.projectTitle}
                  aria-describedby={fieldErrors.projectTitle ? `${id('projectTitle')}-error` : undefined}
                />
                {fieldErrors.projectTitle && (
                  <p id={`${id('projectTitle')}-error`} className="error" role="alert">
                    {fieldErrors.projectTitle}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('projectCategory')}>
                  Project Category <span className="required" aria-hidden="true">*</span>
                </label>
                <select
                  id={id('projectCategory')}
                  name="projectCategory"
                  value={form.projectCategory}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.projectCategory}
                  aria-describedby={fieldErrors.projectCategory ? `${id('projectCategory')}-error` : undefined}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {fieldErrors.projectCategory && (
                  <p id={`${id('projectCategory')}-error`} className="error" role="alert">
                    {fieldErrors.projectCategory}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('projectDescription')}>
                  Project Description <span className="required" aria-hidden="true">*</span>
                </label>
                <textarea
                  id={id('projectDescription')}
                  name="projectDescription"
                  value={form.projectDescription}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  minLength={50}
                  maxLength={2000}
                  rows={4}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.projectDescription}
                  aria-describedby={fieldErrors.projectDescription ? `${id('projectDescription')}-error` : undefined}
                />
                {fieldErrors.projectDescription && (
                  <p id={`${id('projectDescription')}-error`} className="error" role="alert">
                    {fieldErrors.projectDescription}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('targetPopulation')}>
                  Target Population Served <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id={id('targetPopulation')}
                  name="targetPopulation"
                  value={form.targetPopulation}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  minLength={5}
                  maxLength={200}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.targetPopulation}
                  aria-describedby={fieldErrors.targetPopulation ? `${id('targetPopulation')}-error` : undefined}
                />
                {fieldErrors.targetPopulation && (
                  <p id={`${id('targetPopulation')}-error`} className="error" role="alert">
                    {fieldErrors.targetPopulation}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('estimatedBeneficiaries')}>
                  Estimated Number of Beneficiaries <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id={id('estimatedBeneficiaries')}
                  name="estimatedBeneficiaries"
                  type="number"
                  value={form.estimatedBeneficiaries}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min={1}
                  max={1000000}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.estimatedBeneficiaries}
                  aria-describedby={fieldErrors.estimatedBeneficiaries ? `${id('estimatedBeneficiaries')}-error` : undefined}
                />
                {fieldErrors.estimatedBeneficiaries && (
                  <p id={`${id('estimatedBeneficiaries')}-error`} className="error" role="alert">
                    {fieldErrors.estimatedBeneficiaries}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('totalProjectCost')}>
                  Total Project Cost <span className="required" aria-hidden="true">*</span>
                </label>
                <div className="input-with-prefix">
                  <span className="input-prefix" aria-hidden="true">$</span>
                  <input
                    id={id('totalProjectCost')}
                    name="totalProjectCost"
                    type="number"
                    value={form.totalProjectCost}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min={100}
                    max={10000000}
                    step={1}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.totalProjectCost}
                    aria-describedby={fieldErrors.totalProjectCost ? `${id('totalProjectCost')}-error` : undefined}
                  />
                </div>
                {fieldErrors.totalProjectCost && (
                  <p id={`${id('totalProjectCost')}-error`} className="error" role="alert">
                    {fieldErrors.totalProjectCost}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('amountRequested')}>
                  Amount Requested <span className="required" aria-hidden="true">*</span>
                </label>
                <div className="input-with-prefix">
                  <span className="input-prefix" aria-hidden="true">$</span>
                  <input
                    id={id('amountRequested')}
                    name="amountRequested"
                    type="number"
                    value={form.amountRequested}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    min={100}
                    max={50000}
                    step={1}
                    aria-required="true"
                    aria-invalid={!!fieldErrors.amountRequested}
                    aria-describedby={fieldErrors.amountRequested ? `${id('amountRequested')}-error` : undefined}
                  />
                </div>
                {fieldErrors.amountRequested && (
                  <p id={`${id('amountRequested')}-error`} className="error" role="alert">
                    {fieldErrors.amountRequested}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('projectStartDate')}>
                  Project Start Date <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id={id('projectStartDate')}
                  name="projectStartDate"
                  type="date"
                  value={form.projectStartDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min={minStartDate}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.projectStartDate}
                  aria-describedby={fieldErrors.projectStartDate ? `${id('projectStartDate')}-error` : undefined}
                />
                {fieldErrors.projectStartDate && (
                  <p id={`${id('projectStartDate')}-error`} className="error" role="alert">
                    {fieldErrors.projectStartDate}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor={id('projectEndDate')}>
                  Project End Date <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id={id('projectEndDate')}
                  name="projectEndDate"
                  type="date"
                  value={form.projectEndDate}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  min={form.projectStartDate || minStartDate}
                  max={getMaxEndDateFromStart(form.projectStartDate)}
                  aria-required="true"
                  aria-invalid={!!fieldErrors.projectEndDate}
                  aria-describedby={fieldErrors.projectEndDate ? `${id('projectEndDate')}-error` : undefined}
                />
                {fieldErrors.projectEndDate && (
                  <p id={`${id('projectEndDate')}-error`} className="error" role="alert">
                    {fieldErrors.projectEndDate}
                  </p>
                )}
              </div>
              <div className="form-group form-group-checkbox-row">
                <label htmlFor={id('previouslyReceivedGrant')} className="form-group-checkbox-label">
                  <input
                    id={id('previouslyReceivedGrant')}
                    name="previouslyReceivedGrant"
                    type="checkbox"
                    checked={form.previouslyReceivedGrant}
                    onChange={handleChange}
                    aria-describedby={`${id('previouslyReceivedGrant')}-help`}
                  />
                  <span>Previously Received Maplewood Grant</span>
                </label>
                <span id={`${id('previouslyReceivedGrant')}-help`} className="help">Optional</span>
              </div>
              <div className="form-group">
                <label htmlFor={id('supportingDocument')}>
                  Supporting Documents (PDF, JPG, PNG; max 5 MB each) <span className="required" aria-hidden="true">*</span>
                </label>
                <input
                  id={id('supportingDocument')}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  onChange={handleFile}
                  aria-required="true"
                  aria-invalid={!!fileError}
                  aria-describedby={fileError ? `${id('supportingDocument')}-error` : (files.length ? `${id('supportingDocument')}-ok` : undefined)}
                />
                {files.length > 0 && (
                  <ul id={`${id('supportingDocument')}-ok`} className="file-upload-list" aria-label="Selected files">
                    {files.map((f, i) => (
                      <li key={`${f.name}-${i}`} className="file-upload-list-item">
                        <span className="file-upload-name">
                          {f.name}
                          {f.size != null && (
                            <span className="file-upload-size"> ({(f.size / 1024).toFixed(1)} KB)</span>
                          )}
                        </span>
                        <button
                          type="button"
                          className="btn btn-neutral file-upload-remove"
                          onClick={() => removeFile(i)}
                          aria-label={`Remove ${f.name}`}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {fileError && (
                  <p id={`${id('supportingDocument')}-error`} className="error" role="alert">
                    {fileError}
                  </p>
                )}
              </div>
              <div className="form-navigation form-navigation--between">
                <button type="button" className="btn btn-neutral" onClick={() => setSection(1)}>
                  Back
                </button>
                <button type="button" className="btn btn-primary" onClick={goReview}>
                  Review &amp; Submit
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="application-form-sidebar">
          <EligibilityPanel formData={eligibilityData} />
        </div>
      </div>
    </>
  );
}
