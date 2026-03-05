import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAllApplications } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ReviewerDashboard() {
  const headingRef = useRef(null);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterEligibility, setFilterEligibility] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    document.title = 'Reviewer Dashboard | Maplewood County';
    headingRef.current?.focus?.();
  }, []);

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

  const submitted = list.filter((a) => a.status === 'SUBMITTED').length;
  const underReview = list.filter((a) => a.status === 'UNDER_REVIEW').length;
  const approved = list.filter((a) => a.status === 'APPROVED');
  const totalAwarded = approved.reduce((sum, a) => sum + (Number(a.awardAmount) || 0), 0);
  const rejected = list.filter((a) => a.status === 'REJECTED').length;

  return (
    <>
      <h1 className="reviewer-dashboard-heading" ref={headingRef} tabIndex={-1}>
        Reviewer Dashboard
      </h1>
      <p className="reviewer-dashboard-description">
        View and manage all submitted applications. Filter by eligibility and status, then open an application to review and approve or reject.
      </p>
      <div className="reviewer-stats-row">
        <div className="card reviewer-stat-card">
          <div className="reviewer-stat-label">Submitted</div>
          <div className="reviewer-stat-value">{submitted}</div>
        </div>
        <div className="card reviewer-stat-card">
          <div className="reviewer-stat-label">Under Review</div>
          <div className="reviewer-stat-value">{underReview}</div>
        </div>
        <div className="card reviewer-stat-card">
          <div className="reviewer-stat-label">Approved</div>
          <div className="reviewer-stat-value">${totalAwarded.toLocaleString()}</div>
        </div>
        <div className="card reviewer-stat-card">
          <div className="reviewer-stat-label">Rejected</div>
          <div className="reviewer-stat-value">{rejected}</div>
        </div>
      </div>
      <div className="reviewer-filters-row">
        <label>
          Eligibility:{' '}
          <select value={filterEligibility} onChange={(e) => setFilterEligibility(e.target.value)} aria-label="Filter by eligibility">
            <option value="all">All</option>
            <option value="eligible">Eligible</option>
            <option value="not_eligible">Not Eligible</option>
          </select>
        </label>
        <label>
          Status:{' '}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter by status">
            <option value="all">All</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
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
