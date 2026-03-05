import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser } from '../services/api';
import { getMyApplications } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ApplicantDashboard() {
  const user = getStoredUser();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyApplications()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 style={{ marginBottom: 8 }}>Welcome, {user?.fullName?.split(' ')[0] || 'Applicant'}</h1>
      <p style={{ color: 'var(--neutral)', marginBottom: 24 }}>View and manage your grant applications.</p>
      <div style={{ marginBottom: 24 }}>
        <Link to="/apply" className="btn btn-primary">Start New Application</Link>
      </div>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {loading && <p>Loading applications…</p>}
      {!loading && !error && list.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <p style={{ marginBottom: 16 }}>You haven&apos;t submitted any applications yet.</p>
          <Link to="/apply" className="btn btn-primary">Start New Application</Link>
        </div>
      )}
      {!loading && list.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Application ID</th>
                <th style={{ padding: 12 }}>Project Title</th>
                <th style={{ padding: 12 }}>Date Submitted</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Award Amount</th>
                <th style={{ padding: 12 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map((app) => (
                <tr key={app.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 12 }}>{app.id.slice(0, 8)}…</td>
                  <td style={{ padding: 12 }}>{app.projectTitle}</td>
                  <td style={{ padding: 12 }}>{new Date(app.submittedAt).toLocaleDateString()}</td>
                  <td style={{ padding: 12 }}><StatusBadge status={app.status} /></td>
                  <td style={{ padding: 12 }}>{app.awardAmount != null ? `$${Number(app.awardAmount).toLocaleString()}` : '—'}</td>
                  <td style={{ padding: 12 }}>
                    <Link to={`/application/${app.id}`}>View</Link>
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
