import { run } from '../services/eligibilityEngine';

export default function EligibilityPanel({ formData }) {
  const result = run(formData || {});

  return (
    <div className="card" style={{
      borderLeft: `4px solid ${result.eligible ? 'var(--success)' : result.score > 0 ? 'var(--warning)' : 'var(--neutral)'}`,
    }}>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Eligibility Check</h3>
      <div style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius)',
        marginBottom: 16,
        background: result.eligible ? '#E8F5E9' : result.score > 0 ? '#FFF3E0' : '#F5F5F5',
        color: result.eligible ? 'var(--success)' : result.score > 0 ? 'var(--warning)' : 'var(--neutral)',
        fontWeight: 600,
      }}>
        {result.eligible
          ? `Eligible – All ${result.total} criteria met`
          : result.score > 0
            ? `Not Eligible – ${result.score} of ${result.total} criteria met`
            : 'Complete the form to see eligibility'}
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {result.results.map((r) => (
          <li key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: '1.2rem' }} title={r.pass ? 'Pass' : 'Fail'}>
              {r.pass ? '✓' : r.message ? '✗' : '○'}
            </span>
            <span style={{ color: r.pass ? 'var(--success)' : r.message ? 'var(--danger)' : 'var(--neutral)' }}>
              {r.name}: {r.message || 'Not yet evaluated'}
            </span>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: '0.875rem', color: 'var(--neutral)', marginTop: 12, marginBottom: 0 }}>
        You may still submit if not all criteria are met. The reviewer will make the final determination.
      </p>
    </div>
  );
}
