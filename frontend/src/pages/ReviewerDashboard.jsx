import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllApplications, getApplicationsSummary } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const currencyFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const numberFormat = new Intl.NumberFormat('en-US');

export default function ReviewerDashboard() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [filterEligibility, setFilterEligibility] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    document.title = 'Reviewer Dashboard | Maplewood County';
  }, []);

  const fetchSummary = useCallback(() => {
    setSummaryError('');
    setSummaryLoading(true);
    getApplicationsSummary()
      .then(setSummary)
      .catch((e) => setSummaryError(e.message))
      .finally(() => setSummaryLoading(false));
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const fetchList = useCallback(() => {
    setError('');
    setLoading(true);
    const params = {};
    if (filterEligibility !== 'all') params.eligibility = filterEligibility;
    if (filterStatus !== 'all') params.status = filterStatus;
    getAllApplications(params)
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filterEligibility, filterStatus]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <>
      <h1 className="reviewer-dashboard-heading">
        Reviewer Dashboard
      </h1>
      <p className="reviewer-dashboard-description">
        View and manage all submitted applications. Filter by eligibility and status, then open an application to review and approve or reject.
      </p>
      <section className="summary-counts" aria-label="Application summary">
        {summaryError && (
          <div className="reviewer-dashboard-error-wrap">
            <p className="reviewer-dashboard-error" role="alert">{summaryError}</p>
            <button type="button" className="btn btn-primary" onClick={fetchSummary}>
              Try again
            </button>
          </div>
        )}
        {summaryLoading && !summary && <p className="reviewer-dashboard-loading">Loading summary…</p>}
        {!summaryLoading && summary && (
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
              <span className="summary-item-value" aria-label={`Approved: ${numberFormat.format(summary.approved)} applications, ${currencyFormat.format(summary.totalAwarded)} total awarded`}>
                {numberFormat.format(summary.approved)} Approved ({currencyFormat.format(summary.totalAwarded)} total)
              </span>
            </div>
            <div className="card summary-item">
              <span className="summary-item-label">Rejected</span>
              <span className="summary-item-value" aria-label={`Rejected: ${numberFormat.format(summary.rejected)} applications`}>
                {numberFormat.format(summary.rejected)}
              </span>
            </div>
          </div>
        )}
      </section>
      <div className="filters-row" role="group" aria-label="Filter applications">
        <div className="filter-group">
          <label htmlFor="filter-eligibility">Eligibility</label>
          <select
            id="filter-eligibility"
            className="filter-select"
            value={filterEligibility}
            onChange={(e) => setFilterEligibility(e.target.value)}
            aria-label="Filter by eligibility"
          >
            <option value="all">All</option>
            <option value="eligible">Eligible</option>
            <option value="not_eligible">Not Eligible</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="filter-status">Status</label>
          <select
            id="filter-status"
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>
      {error && (
        <div className="reviewer-dashboard-error-wrap">
          <p className="reviewer-dashboard-error" role="alert">{error}</p>
          <button type="button" className="btn btn-primary" onClick={fetchList}>
            Try again
          </button>
        </div>
      )}
      {loading && <p className="reviewer-dashboard-loading">Loading…</p>}
      {!loading && list.length === 0 && (
        <p className="reviewer-empty-message">
          {filterEligibility === 'all' && filterStatus === 'all'
            ? 'No applications yet.'
            : 'No applications match the filters.'}
        </p>
      )}
      {!loading && list.length > 0 && (
        <div className="card reviewer-table-wrap">
          <table className="reviewer-table">
            <thead>
              <tr>
                <th scope="col">Application ID</th>
                <th scope="col">Organization name</th>
                <th scope="col">Project Title</th>
                <th scope="col">Date Submitted</th>
                <th scope="col">Eligibility</th>
                <th scope="col">Status</th>
                <th scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {list.map((app) => (
                <tr key={app.id}>
                  <td>{app.id.slice(0, 8)}…</td>
                  <td>{app.orgName || app.organizationName}</td>
                  <td>{app.projectTitle}</td>
                  <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <span className={app.eligibilityScore === app.eligibilityTotal ? 'badge badge-eligible' : 'badge badge-not-eligible'}>
                      {app.eligibilityScore === app.eligibilityTotal ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </td>
                  <td><StatusBadge status={app.status} /></td>
                  <td>
                    <Link to={`/reviewer/application/${app.id}`}>Review</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
