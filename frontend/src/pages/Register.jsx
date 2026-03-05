import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister, setAuth } from '../services/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFullName(value) {
  const t = (value || '').trim();
  if (!t) return 'Full name is required';
  if (t.length < 2) return 'Full name must be at least 2 characters';
  if (t.length > 100) return 'Full name must be at most 100 characters';
  return '';
}

function validateEmail(value) {
  if (!value || !value.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(value.trim().toLowerCase())) return 'Email format is invalid';
  return '';
}

function validatePhone(value) {
  if (!value || !value.trim()) return 'Phone is required';
  return '';
}

function validateOrganizationName(value) {
  if (!value || !value.trim()) return 'Organization name is required';
  return '';
}

function validatePassword(value) {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  return '';
}

function validateConfirmPassword(password, confirm) {
  if (!confirm) return 'Please confirm your password';
  if (password !== confirm) return 'Passwords do not match';
  return '';
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    organizationName: '',
    password: '',
    confirmPassword: '',
  });
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setSubmitError('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const runFieldValidation = (name, value) => {
    switch (name) {
      case 'fullName':
        return validateFullName(value);
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'organizationName':
        return validateOrganizationName(value);
      case 'password':
        return validatePassword(value);
      case 'confirmPassword':
        return validateConfirmPassword(form.password, value);
      default:
        return '';
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    const error = runFieldValidation(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const errors = {};
    errors.fullName = validateFullName(form.fullName);
    errors.email = validateEmail(form.email);
    errors.phone = validatePhone(form.phone);
    errors.organizationName = validateOrganizationName(form.organizationName);
    errors.password = validatePassword(form.password);
    errors.confirmPassword = validateConfirmPassword(form.password, form.confirmPassword);
    setFieldErrors(errors);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      organizationName: true,
      password: true,
      confirmPassword: true,
    });
    return !Object.values(errors).some(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validateForm()) return;
    setLoading(true);
    try {
      const data = await apiRegister(form);
      setAuth(data.token, data.user);
      navigate('/dashboard');
    } catch (err) {
      setSubmitError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="card">
        <h2>Create an account</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="register-fullName">
              Full Name <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="register-fullName"
              name="fullName"
              type="text"
              value={form.fullName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              aria-required="true"
              aria-invalid={!!fieldErrors.fullName}
              aria-describedby={fieldErrors.fullName ? 'register-fullName-error' : undefined}
            />
            {fieldErrors.fullName && (
              <p id="register-fullName-error" className="error" role="alert">
                {fieldErrors.fullName}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="register-email">
              Email <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="email"
              aria-required="true"
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'register-email-error' : undefined}
            />
            {fieldErrors.email && (
              <p id="register-email-error" className="error" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="register-phone">
              Phone <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="register-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              placeholder="(XXX) XXX-XXXX"
              autoComplete="tel"
              aria-required="true"
              aria-invalid={!!fieldErrors.phone}
              aria-describedby={fieldErrors.phone ? 'register-phone-error' : undefined}
            />
            {fieldErrors.phone && (
              <p id="register-phone-error" className="error" role="alert">
                {fieldErrors.phone}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="register-organizationName">
              Organization Name <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="register-organizationName"
              name="organizationName"
              type="text"
              value={form.organizationName}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="organization"
              aria-required="true"
              aria-invalid={!!fieldErrors.organizationName}
              aria-describedby={fieldErrors.organizationName ? 'register-organizationName-error' : undefined}
            />
            {fieldErrors.organizationName && (
              <p id="register-organizationName-error" className="error" role="alert">
                {fieldErrors.organizationName}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="register-password">
              Password <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              minLength={8}
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'register-password-error' : undefined}
            />
            {fieldErrors.password && (
              <p id="register-password-error" className="error" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="register-confirmPassword">
              Confirm Password <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="register-confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              autoComplete="new-password"
              aria-required="true"
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? 'register-confirmPassword-error' : undefined}
            />
            {fieldErrors.confirmPassword && (
              <p id="register-confirmPassword-error" className="error" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
          {submitError && (
            <p className="error-summary" role="alert">
              {submitError}
            </p>
          )}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? 'Creating account…' : 'Register'}
            </button>
          </div>
        </form>
      </div>
      <p className="auth-footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
