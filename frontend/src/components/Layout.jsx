import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { getStoredUser, logout } from '../services/api';

export default function Layout() {
  const user = getStoredUser();

  return (
    <div className="app-container">
      <header style={{
        background: 'var(--primary)',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '1.25rem' }}>
          Maplewood County
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user ? (
            <>
              <span style={{ fontSize: '0.9rem' }}>{user.fullName}</span>
              {user.role === 'APPLICANT' && (
                <Link to="/dashboard" className="btn btn-secondary" style={{ padding: '8px 16px' }}>Dashboard</Link>
              )}
              {user.role === 'REVIEWER' && (
                <Link to="/reviewer" className="btn btn-secondary" style={{ padding: '8px 16px' }}>Reviewer Dashboard</Link>
              )}
              <button
                type="button"
                className="btn"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                onClick={() => { logout(); window.location.href = '/'; }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-secondary" style={{ padding: '8px 16px' }}>Register</Link>
              <Link to="/login" className="btn" style={{ background: 'white', color: 'var(--primary)', padding: '8px 16px' }}>Log In</Link>
            </>
          )}
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
