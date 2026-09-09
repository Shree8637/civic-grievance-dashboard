import { Link } from 'react-router-dom';
import { FileText, Search } from 'lucide-react';
import './Home.css';

function Home() {
  return (
    <div className="home-page">
      <div className="home-hero">
        <h1 className="home-title">Report a civic issue in under 2 minutes</h1>
        <p className="home-subtitle">
          Garbage, potholes, water leaks, broken streetlights — tell us what's wrong
          and we'll map it, categorize it, and surface it to the right people.
        </p>

        <div className="home-actions">
          <Link to="/submit" className="btn btn-primary btn-lg" id="cta-report">
            <FileText size={20} />
            Report an Issue
          </Link>
          <Link to="/track" className="btn btn-secondary btn-lg" id="cta-track">
            <Search size={20} />
            Track Complaint
          </Link>
        </div>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">📝</div>
          <h3>Describe in plain text</h3>
          <p>No rigid forms — just tell us what happened in your own words.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📍</div>
          <h3>Pin the location</h3>
          <p>Use GPS or tap the map so the issue gets routed to the right ward.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>Track your complaint</h3>
          <p>Get a complaint ID instantly and check status anytime.</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
