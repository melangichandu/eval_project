import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const brandTo = user
    ? (user.role === 'ADMIN' ? '/admin' : user.role === 'REVIEWER' ? '/reviewer' : '/dashboard')
    : '/';

  return (
    <div className="app-container">
      <header className="app-header">
        <Link to={brandTo} className="app-header-brand">
          <span className="app-header-logo" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 6v6c0 5.5 3.5 10 8 12 4.5-2 8-6.5 8-12V6L12 2z" fill="currentColor" opacity="0.9"/>
              <path d="M12 8l-3 3 1.5 4L12 12l1.5 3L15 11l-3-3z" fill="currentColor"/>
            </svg>
          </span>
          <span className="app-header-brand-text">Maplewood County</span>
        </Link>
        <nav className="nav-links">
          {user ? (
            <>
              <span className="nav-user-name">{user.fullName}</span>
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
