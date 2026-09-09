import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Inbox, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  ArrowRight, 
  RefreshCw, 
  TrendingUp, 
  MapPin, 
  Layers,
  Activity
} from 'lucide-react';
import api from '../../utils/api';
import { getCategoryByValue } from '../../utils/constants';
import './AdminOverview.css';

export default function AdminOverview() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOverview = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/analytics/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load overview:', err);
      setError('Unable to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const kpis = summary?.kpis || {
    total: 0,
    submitted: 0,
    in_progress: 0,
    resolved: 0,
    resolution_rate: 0,
    avg_resolution_days: 2.1,
    low_confidence_count: 0,
  };

  const categories = summary?.categories || [];
  const topHotspots = summary?.topHotspots || [];

  return (
    <div className="admin-overview-page">
      {/* Page Header */}
      <div className="overview-header-row">
        <div>
          <h1 className="admin-title">Dashboard Overview</h1>
          <p className="admin-subtitle">
            Municipal control room summary — real-time grievance counts, resolution velocity, and active hotspots.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={fetchOverview}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="kpi-grid">
        {/* Total Grievances */}
        <div className="kpi-card card">
          <div className="kpi-card-header">
            <span className="kpi-label">Total Grievances</span>
            <div className="kpi-icon-wrap icon-primary">
              <Inbox size={20} />
            </div>
          </div>
          <div className="kpi-value">{kpis.total}</div>
          <div className="kpi-footer-sub">All lodged complaints across Mumbai</div>
        </div>

        {/* Open (Submitted) */}
        <div className="kpi-card card">
          <div className="kpi-card-header">
            <span className="kpi-label">Awaiting Assignment</span>
            <div className="kpi-icon-wrap icon-critical">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="kpi-value text-critical">{kpis.submitted}</div>
          <div className="kpi-footer-sub">Open status / unassigned to field team</div>
        </div>

        {/* In Progress */}
        <div className="kpi-card card">
          <div className="kpi-card-header">
            <span className="kpi-label">Under Investigation</span>
            <div className="kpi-icon-wrap icon-alert">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value text-alert">{kpis.in_progress}</div>
          <div className="kpi-footer-sub">Assigned to ward field inspector</div>
        </div>

        {/* Resolved */}
        <div className="kpi-card card">
          <div className="kpi-card-header">
            <span className="kpi-label">Resolved Issues</span>
            <div className="kpi-icon-wrap icon-success">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="kpi-value text-success">{kpis.resolved}</div>
          <div className="kpi-footer-sub">
            {kpis.resolution_rate}% overall resolution rate
          </div>
        </div>

        {/* Turnaround Time */}
        <div className="kpi-card card">
          <div className="kpi-card-header">
            <span className="kpi-label">Avg. Turnaround</span>
            <div className="kpi-icon-wrap icon-neutral">
              <Activity size={20} />
            </div>
          </div>
          <div className="kpi-value">{kpis.avg_resolution_days} <span className="val-unit">days</span></div>
          <div className="kpi-footer-sub">Average time to close complaint</div>
        </div>
      </div>

      {/* Two Supporting Panels: Categories & Hotspots */}
      <div className="overview-panels-grid">
        {/* Left Panel: Top Categories */}
        <div className="overview-panel card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Top Grievance Categories</h3>
              <p className="panel-sub">Volume breakdown classified by AI NLP model</p>
            </div>
            <Link to="/admin/analytics" className="panel-link">
              <span>View Analytics</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="category-bars-list">
            {categories.length === 0 ? (
              <p className="empty-panel-text">No category data available yet.</p>
            ) : (
              categories.map((catItem) => {
                const meta = getCategoryByValue(catItem.category);
                return (
                  <div key={catItem.category} className="cat-bar-row">
                    <div className="cat-bar-labels">
                      <span className="cat-bar-title" style={{ color: meta.color }}>
                        ● {meta.label}
                      </span>
                      <span className="cat-bar-count">
                        <strong>{catItem.count}</strong> ({catItem.percentage}%)
                      </span>
                    </div>
                    <div className="cat-bar-track">
                      <div
                        className="cat-bar-fill"
                        style={{
                          width: `${Math.max(catItem.percentage, 4)}%`,
                          backgroundColor: meta.color,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Recent Active Hotspots */}
        <div className="overview-panel card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">Active Municipal Hotspots</h3>
              <p className="panel-sub">Dense spatial clusters detected by DBSCAN</p>
            </div>
            <Link to="/admin/map" className="panel-link">
              <span>View Map</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="hotspots-overview-list">
            {topHotspots.length === 0 ? (
              <div className="empty-hotspot-state">
                <Flame size={32} color="var(--color-text-muted)" />
                <p>No active hotspots currently detected.</p>
                <Link to="/admin/map" className="btn btn-secondary btn-sm" style={{ marginTop: '8px' }}>
                  Open Hotspot Map
                </Link>
              </div>
            ) : (
              topHotspots.map((h, i) => {
                const catMeta = getCategoryByValue(h.category);
                return (
                  <div key={h.id || i} className="hotspot-overview-item">
                    <div className="hotspot-item-badge" style={{ backgroundColor: `${catMeta.color}15`, color: catMeta.color }}>
                      <Flame size={16} />
                    </div>
                    <div className="hotspot-item-info">
                      <div className="hotspot-item-header">
                        <span className="hotspot-item-cat" style={{ color: catMeta.color }}>
                          {catMeta.label}
                        </span>
                        <span className="hotspot-item-count">
                          {h.complaint_count} incidents
                        </span>
                      </div>
                      <p className="hotspot-item-location">
                        Ward {h.ward_name} ({h.ward_full_name || 'Mumbai'})
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Action Quick Launchpad */}
      <div className="quick-launchpad-grid">
        <Link to="/admin/map" className="launchpad-card card">
          <div className="launchpad-icon-wrap icon-map">
            <MapPin size={24} />
          </div>
          <div>
            <h4 className="launchpad-title">Interactive Hotspot Map</h4>
            <p className="launchpad-desc">Inspect Mumbai ward boundaries and multi-layer DBSCAN density clusters.</p>
          </div>
          <ArrowRight size={18} className="launchpad-arrow" />
        </Link>

        <Link to="/admin/complaints" className="launchpad-card card">
          <div className="launchpad-icon-wrap icon-list">
            <Layers size={24} />
          </div>
          <div>
            <h4 className="launchpad-title">Manage Complaints Table</h4>
            <p className="launchpad-desc">Update grievance status, filter by ward, and override misclassified categories.</p>
          </div>
          <ArrowRight size={18} className="launchpad-arrow" />
        </Link>

        <Link to="/admin/analytics" className="launchpad-card card">
          <div className="launchpad-icon-wrap icon-analytics">
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 className="launchpad-title">In-Depth Trend Analytics</h4>
            <p className="launchpad-desc">Examine daily complaint velocity charts and ward-wise resolution comparisons.</p>
          </div>
          <ArrowRight size={18} className="launchpad-arrow" />
        </Link>
      </div>
    </div>
  );
}
