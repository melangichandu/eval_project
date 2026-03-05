export default function StatusBadge({ status }) {
  const s = (status || '').replace('_', '-').toLowerCase();
  const label = (status || '').replace('_', ' ');
  return <span className={`badge badge-${s}`}>{label}</span>;
}
