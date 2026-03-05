import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { getStoredUser, logout } from '../services/api';

export default function Layout() {
  const user = getStoredUser();

  return (
    <div className="app-container">
      <header className="app-header">
        <Link to="/" className="app-header-brand">
          Maplewood County
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              <span className="nav-user-name">{user.fullName}</span>
              {user.role === 'APPLICANT' && (
                <Link to="/dashboard" className="btn btn-secondary btn-nav">Dashboard</Link>
              )}
              {user.role === 'REVIEWER' && (
                <Link to="/reviewer" className="btn btn-secondary btn-nav">Reviewer Dashboard</Link>
              )}
              <button
                type="button"
                className="btn btn-header-secondary btn-nav"
                onClick={() => { logout(); window.location.href = '/'; }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/register" className="btn btn-secondary btn-nav">Register</Link>
              <Link to="/login" className="btn btn-header-login">Log In</Link>
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
