import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAdminSummary } from '../services/api';

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const numberFormat = new Intl.NumberFormat('en-US');

export default function AdminSummary() {
  const headingRef = useRef(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Grant program summary | Maplewood County';
    headingRef.current?.focus?.();
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
      <h1 className="admin-summary-heading" ref={headingRef} tabIndex={-1}>
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
          <section className="card total-awarded-block" aria-labelledby="total-awarded-heading">
            <h2 id="total-awarded-heading" className="total-awarded-heading">Total funds awarded</h2>
            <p className="total-awarded-value" aria-label={`Total funds awarded: ${currencyFormat.format(summary.totalAwarded)}`}>
              {currencyFormat.format(summary.totalAwarded)}
            </p>
          </section>
        </>
      )}
      <p className="admin-summary-back">
        <Link to="/">Back to home</Link>
      </p>
    </div>
  );
}
