import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser, getMyApplications } from '../services/api';
import StatusBadge from '../components/StatusBadge';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

export default function ApplicantDashboard() {
  const user = getStoredUser();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchApplications = useCallback(() => {
    setError('');
    setLoading(true);
    getMyApplications()
      .then(setList)
      .catch((e) => setError(e.message || 'Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const firstName = user?.fullName?.split(' ')[0] || 'Applicant';

  return (
    <>
      <h1 className="dashboard-welcome">Welcome, {firstName}</h1>
      <p className="dashboard-subtitle">View and manage your grant applications.</p>
      <div className="dashboard-actions">
        <Link to="/apply" className="btn btn-primary">
          Start New Application
        </Link>
      </div>

      <div
        className="dashboard-loading"
        aria-busy={loading}
        aria-live="polite"
        role="status"
        aria-label={loading ? 'Loading applications' : undefined}
      >
        {loading && 'Loading applications…'}
      </div>

      {error && (
        <div className="dashboard-error card" role="alert">
          <p>{error}</p>
          <div className="dashboard-error-actions">
            <button type="button" className="btn btn-primary" onClick={fetchApplications}>
              Try again
            </button>
          </div>
        </div>
      )}

      {!loading && !error && list.length === 0 && (
        <section className="card empty-state" aria-labelledby="empty-state-heading">
          <h2 id="empty-state-heading" className="sr-only">
            No applications yet
          </h2>
          <p>You haven&apos;t submitted any applications yet.</p>
          <Link to="/apply" className="btn btn-primary">
            Start New Application
          </Link>
        </section>
      )}

      {!loading && !error && list.length > 0 && (
        <div className="card applications-table-wrap">
          <table className="applications-table" aria-label="Your applications">
            <thead>
              <tr>
                <th scope="col">Application ID</th>
                <th scope="col">Project Title</th>
                <th scope="col">Date Submitted</th>
                <th scope="col">Status</th>
                <th scope="col">Award Amount</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((app) => (
                <tr key={app.id}>
                  <td>{app.id.slice(0, 8)}…</td>
                  <td>{app.projectTitle}</td>
                  <td>{new Date(app.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge status={app.status} />
                  </td>
                  <td>
                    {app.awardAmount != null ? (
                      <span className="award-amount" aria-label={`Award amount: ${formatCurrency(app.awardAmount)}`}>
                        {formatCurrency(app.awardAmount)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <Link to={`/application/${app.id}`}>View application</Link>
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
