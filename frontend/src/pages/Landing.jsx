import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="card" style={{ textAlign: 'center', maxWidth: 600, margin: '48px auto' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: 8 }}>Community Development Grant Program</h1>
      <p style={{ fontSize: '1.125rem', color: 'var(--neutral)', marginBottom: 24 }}>
        Apply online for community development grants of up to $50,000. Nonprofit organizations can submit applications,
        see real-time eligibility feedback, and track status from one place.
      </p>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/register" className="btn btn-primary">Register</Link>
        <Link to="/login" className="btn btn-secondary">Log In</Link>
      </div>
    </div>
  );
}
