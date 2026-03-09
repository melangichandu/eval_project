import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAdminSummary } from '../services/api';

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const numberFormat = new Intl.NumberFormat('en-US');

const PROGRAM_BUDGET = 2_000_000; // $2M total program funds

export default function AdminSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Grant program summary | Maplewood County';
  }, []);

  const fetchSummary = useCallback(() => {
    setError('');
    setLoading(true);
    getAdminSummary()
      .then(setSummary)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return (
    <div className="admin-summary">
      <h1 className="admin-summary-heading">
        Grant program summary
      </h1>
      <p className="admin-summary-note">
        System-wide application counts and total funds awarded. This view is for administrators.
      </p>
      {error && (
        <div className="reviewer-dashboard-error-wrap">
          <p className="reviewer-dashboard-error" role="alert">{error}</p>
          <button type="button" className="btn btn-primary" onClick={fetchSummary}>
            Try again
          </button>
        </div>
      )}
      {loading && !summary && <p className="reviewer-dashboard-loading">Loading summary…</p>}
      {!loading && summary && (
        <>
          <section className="summary-counts" aria-label="Application summary">
            <div className="summary-counts-inner">
              <div className="card summary-item">
                <span className="summary-item-label">Submitted</span>
                <span className="summary-item-value" aria-label={`Submitted: ${numberFormat.format(summary.submitted)} applications`}>
                  {numberFormat.format(summary.submitted)}
                </span>
              </div>
              <div className="card summary-item">
                <span className="summary-item-label">Under Review</span>
                <span className="summary-item-value" aria-label={`Under Review: ${numberFormat.format(summary.underReview)} applications`}>
                  {numberFormat.format(summary.underReview)}
                </span>
              </div>
              <div className="card summary-item">
                <span className="summary-item-label">Approved</span>
                <span className="summary-item-value" aria-label={`Approved: ${numberFormat.format(summary.approved)} applications`}>
                  {numberFormat.format(summary.approved)}
                </span>
              </div>
              <div className="card summary-item">
                <span className="summary-item-label">Rejected</span>
                <span className="summary-item-value" aria-label={`Rejected: ${numberFormat.format(summary.rejected)} applications`}>
                  {numberFormat.format(summary.rejected)}
                </span>
              </div>
            </div>
          </section>
          <section className="summary-funds" aria-label="Program funds summary">
            <h2 className="summary-funds-heading">Program funds</h2>
            <div className="summary-funds-inner">
              <div className="card summary-item summary-fund-card">
                <span className="summary-item-label">Total funds</span>
                <span className="summary-item-value" aria-label={`Total program funds: ${currencyFormat.format(PROGRAM_BUDGET)}`}>
                  {currencyFormat.format(PROGRAM_BUDGET)}
                </span>
              </div>
              <div className="card summary-item summary-fund-card">
                <span className="summary-item-label">Total funds awarded</span>
                <span className="summary-item-value" aria-label={`Total funds awarded: ${currencyFormat.format(summary.totalAwarded)}`}>
                  {currencyFormat.format(summary.totalAwarded)}
                </span>
              </div>
              <div className="card summary-item summary-fund-card">
                <span className="summary-item-label">Remaining funds</span>
                <span className="summary-item-value" aria-label={`Remaining funds: ${currencyFormat.format(PROGRAM_BUDGET - summary.totalAwarded)}`}>
                  {currencyFormat.format(Math.max(0, PROGRAM_BUDGET - summary.totalAwarded))}
                </span>
              </div>
            </div>
          </section>
        </>
      )}
      <p className="admin-summary-back">
        <Link to="/" className="admin-summary-back-link">← Back to home</Link>
      </p>
    </div>
  );
}
