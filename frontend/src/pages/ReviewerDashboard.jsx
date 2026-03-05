import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllApplications } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function ReviewerDashboard() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterEligibility, setFilterEligibility] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const params = {};
    if (filterEligibility !== 'all') params.eligibility = filterEligibility;
    if (filterStatus !== 'all') params.status = filterStatus;
    getAllApplications(params)
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [filterEligibility, filterStatus]);

  const submitted = list.filter((a) => a.status === 'SUBMITTED').length;
  const underReview = list.filter((a) => a.status === 'UNDER_REVIEW').length;
  const approved = list.filter((a) => a.status === 'APPROVED');
  const totalAwarded = approved.reduce((sum, a) => sum + (Number(a.awardAmount) || 0), 0);
  const rejected = list.filter((a) => a.status === 'REJECTED').length;

  return (
    <>
      <h1>Reviewer Dashboard</h1>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ minWidth: 140 }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--neutral)' }}>Submitted</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{submitted}</div>
        </div>
        <div className="card" style={{ minWidth: 140 }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--neutral)' }}>Under Review</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{underReview}</div>
        </div>
        <div className="card" style={{ minWidth: 140 }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--neutral)' }}>Approved</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${totalAwarded.toLocaleString()}</div>
        </div>
        <div className="card" style={{ minWidth: 140 }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--neutral)' }}>Rejected</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{rejected}</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <label>
          Eligibility:{' '}
          <select value={filterEligibility} onChange={(e) => setFilterEligibility(e.target.value)}>
            <option value="all">All</option>
            <option value="eligible">Eligible</option>
            <option value="not_eligible">Not Eligible</option>
          </select>
        </label>
        <label>
          Status:{' '}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
      </div>
      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}
      {loading && <p>Loading…</p>}
      {!loading && list.length === 0 && <p>No applications match the filters.</p>}
      {!loading && list.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                <th style={{ padding: 12 }}>Application ID</th>
                <th style={{ padding: 12 }}>Organization</th>
                <th style={{ padding: 12 }}>Project Title</th>
                <th style={{ padding: 12 }}>Date Submitted</th>
                <th style={{ padding: 12 }}>Eligibility</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.map((app) => (
                <tr key={app.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 12 }}>{app.id.slice(0, 8)}…</td>
                  <td style={{ padding: 12 }}>{app.orgName || app.organizationName}</td>
                  <td style={{ padding: 12 }}>{app.projectTitle}</td>
                  <td style={{ padding: 12 }}>{new Date(app.submittedAt).toLocaleDateString()}</td>
                  <td style={{ padding: 12 }}>
                    <span className={app.eligibilityScore === app.eligibilityTotal ? 'badge badge-eligible' : 'badge badge-not-eligible'}>
                      {app.eligibilityScore === app.eligibilityTotal ? 'Eligible' : 'Not Eligible'}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}><StatusBadge status={app.status} /></td>
                  <td style={{ padding: 12 }}>
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
