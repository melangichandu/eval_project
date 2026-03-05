import { run } from '../services/eligibilityEngine';

export default function EligibilityPanel({ formData }) {
  const result = run(formData || {});

  const summaryStatusClass = result.eligible
    ? 'eligibility-summary--eligible'
    : result.score > 0
      ? 'eligibility-summary--not-eligible'
      : 'eligibility-summary--neutral';

  const panelBorderClass = result.eligible
    ? 'eligibility-panel--eligible'
    : result.score > 0
      ? 'eligibility-panel--not-eligible'
      : 'eligibility-panel--neutral';

  const summaryText = result.eligible
    ? `Eligible – All ${result.total} criteria met`
    : result.score > 0
      ? `Not Eligible – ${result.score} of ${result.total} criteria met`
      : 'Complete the form to see eligibility';

  return (
    <div
      className={`eligibility-panel ${panelBorderClass}`}
      role="region"
      aria-labelledby="eligibility-heading"
    >
      <h3 id="eligibility-heading">Eligibility Check</h3>
      <div
        className={`eligibility-summary ${summaryStatusClass}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {summaryText}
      </div>
      <ul className="eligibility-rules-list" aria-label="Eligibility rules">
        {result.results.map((r) => {
          const statusClass = r.neutral
            ? 'eligibility-neutral'
            : r.pass
              ? 'eligibility-pass'
              : 'eligibility-fail';
          const iconLabel = r.neutral ? 'Not evaluated' : r.pass ? 'Pass' : 'Fail';
          const iconChar = r.neutral ? '○' : r.pass ? '✓' : '✗';
          return (
            <li key={r.id} className="eligibility-rule">
              <span
                className={`eligibility-rule-icon ${statusClass}`}
                title={iconLabel}
                aria-hidden="true"
              >
                {iconChar}
              </span>
              <span className={`eligibility-rule-message ${statusClass}`}>
                {r.name}: {r.message}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="eligibility-panel-note">
        You may still submit if not all criteria are met. The reviewer will make the final determination.
      </p>
    </div>
  );
}
