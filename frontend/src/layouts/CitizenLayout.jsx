import { Outlet, Link, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import './CitizenLayout.css';

function CitizenLayout() {
  const location = useLocation();

  return (
    <div className="citizen-layout">
      <header className="citizen-header">
        <div className="citizen-header-inner">
          <Link to="/" className="citizen-logo">
            <Shield size={24} />
            <span>Civic Grievance Dashboard</span>
          </Link>
          <nav className="citizen-nav">
            <Link
              to="/submit"
              className={`citizen-nav-link ${location.pathname === '/submit' ? 'active' : ''}`}
            >
              Report Issue
            </Link>
            <Link
              to="/track"
              className={`citizen-nav-link ${location.pathname.startsWith('/track') ? 'active' : ''}`}
            >
              Track
            </Link>
          </nav>
        </div>
      </header>

      <main className="citizen-main">
        <Outlet />
      </main>

      <footer className="citizen-footer">
        <p>Civic Grievance Intelligence Dashboard &mdash; SLRTCE Mini Project</p>
      </footer>
    </div>
  );
}

export default CitizenLayout;
