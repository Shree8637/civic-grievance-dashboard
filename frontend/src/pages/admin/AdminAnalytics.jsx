import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, RefreshCw, AlertTriangle, BarChart3,
  Clock, CheckCircle2, Zap, PieChart as PieChartIcon,
  Activity, Layers
} from 'lucide-react';
import api from '../../utils/api';
import { CATEGORIES, getCategoryByValue, STATUSES } from '../../utils/constants';
import './AdminAnalytics.css';

/* ── Custom Recharts Tooltip ──────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--color-white)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      boxShadow: 'var(--shadow-lg)',
      fontSize: 'var(--font-size-xs)',
    }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: 'var(--color-primary)' }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: entry.color, display: 'inline-block',
          }} />
          <span style={{ color: 'var(--color-text-muted)' }}>
            {getCategoryByValue(entry.dataKey).label}:
          </span>
          <span style={{ fontWeight: 600 }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Resolution Rate Ring ─────────────────────────────────── */
function ResolutionRing({ rate }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * (rate / 100));
  return (
    <div className="rate-ring-container">
      <svg className="rate-ring-svg" viewBox="0 0 80 80">
        <circle className="rate-ring-track" cx="40" cy="40" r={r} />
        <circle
          className="rate-ring-fill"
          cx="40" cy="40" r={r}
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="rate-ring-info">
        <div className="rate-ring-pct">{rate}%</div>
        <div className="rate-ring-label">Overall Resolution Rate</div>
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────── */
export default function AdminAnalytics() {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, trendsRes] = await Promise.all([
        api.get('/admin/analytics/summary'),
        api.get(`/admin/analytics/trends?days=${days}`),
      ]);
      setSummary(summaryRes.data);
      setTrends(trendsRes.data.trends || []);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Unable to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  const kpis = summary?.kpis || {
    total: 0, submitted: 0, in_progress: 0, resolved: 0,
    resolution_rate: 0, avg_resolution_days: 0, low_confidence_count: 0,
  };
  const categories = summary?.categories || [];
  const wardBreakdown = summary?.wardBreakdown || [];

  // Donut data
  const donutData = categories.map((c) => ({
    name: getCategoryByValue(c.category).label,
    value: c.count,
    color: getCategoryByValue(c.category).color,
  }));

  // Max complaints in any ward (for bar scaling)
  const maxWardTotal = Math.max(1, ...wardBreakdown.map((w) => w.total));

  if (loading) {
    return (
      <div className="admin-analytics-page">
        <div className="analytics-loading">
          <div className="spinner" />
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-analytics-page">
      {/* Header */}
      <div className="analytics-header-row">
        <div>
          <h1 className="admin-title">
            <TrendingUp size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />
            Trend Analytics
          </h1>
          <p className="admin-subtitle">
            Daily complaint velocity, category distribution, ward breakdown, and resolution performance.
          </p>
        </div>
        <div className="analytics-controls">
          <select
            className="form-select"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={60}>Last 60 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Daily Trend Area Chart ──────────────────────────── */}
      <div className="chart-card card">
        <div className="chart-card-header">
          <div>
            <h3 className="chart-card-title">Daily Complaint Trends</h3>
            <p className="chart-card-sub">Stacked area chart — past {days} days</p>
          </div>
          <div className="chart-legend">
            {CATEGORIES.map((cat) => (
              <div key={cat.value} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: cat.color }} />
                <span>{cat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {trends.length === 0 ? (
          <div className="analytics-empty-chart">
            <BarChart3 size={36} />
            <p>No trend data available for this period.</p>
          </div>
        ) : (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  {CATEGORIES.map((cat) => (
                    <linearGradient key={cat.value} id={`grad-${cat.value}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={cat.color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={cat.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--color-border)' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                {CATEGORIES.map((cat) => (
                  <Area
                    key={cat.value}
                    type="monotone"
                    dataKey={cat.value}
                    stackId="1"
                    stroke={cat.color}
                    strokeWidth={1.5}
                    fill={`url(#grad-${cat.value})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Three Panel Grid ───────────────────────────────── */}
      <div className="analytics-panels-grid">
        {/* ── Panel 1: Category Distribution (Donut) ─────── */}
        <div className="analytics-panel card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <PieChartIcon size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                Category Distribution
              </h3>
              <p className="panel-sub">AI-classified breakdown</p>
            </div>
          </div>

          {donutData.length === 0 ? (
            <div className="analytics-empty-chart">
              <Layers size={32} />
              <p>No category data yet.</p>
            </div>
          ) : (
            <div className="donut-container">
              <div className="donut-chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {donutData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${value} complaints`, name]}
                      contentStyle={{
                        background: 'var(--color-white)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-xs)',
                        boxShadow: 'var(--shadow-md)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="donut-legend">
                {donutData.map((d) => (
                  <div key={d.name} className="donut-legend-item">
                    <span className="donut-legend-dot" style={{ backgroundColor: d.color }} />
                    <span>{d.name}</span>
                    <span className="donut-legend-count">({d.value})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Panel 2: Ward Breakdown ────────────────────── */}
        <div className="analytics-panel card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <BarChart3 size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                Ward Breakdown
              </h3>
              <p className="panel-sub">Status distribution per ward</p>
            </div>
          </div>

          {wardBreakdown.length === 0 ? (
            <div className="analytics-empty-chart">
              <Layers size={32} />
              <p>No ward data available.</p>
            </div>
          ) : (
            <div className="ward-bar-list">
              {wardBreakdown
                .filter((w) => w.total > 0)
                .map((ward) => {
                  const resolvedPct = ward.total > 0 ? Math.round((ward.resolved / ward.total) * 100) : 0;
                  const inProgressPct = ward.total > 0 ? Math.round((ward.in_progress / ward.total) * 100) : 0;
                  const submittedPct = ward.total > 0 ? Math.round((ward.submitted / ward.total) * 100) : 0;
                  const widthScale = (ward.total / maxWardTotal) * 100;

                  return (
                    <div key={ward.ward_id} className="ward-bar-row">
                      <div className="ward-bar-labels">
                        <span className="ward-bar-name">{ward.name}</span>
                        <span className="ward-bar-stats">
                          {ward.total} total
                        </span>
                      </div>
                      <div className="ward-bar-track" style={{ width: `${Math.max(widthScale, 15)}%` }}>
                        <div
                          className="ward-bar-segment"
                          style={{
                            width: `${resolvedPct}%`,
                            backgroundColor: STATUSES[2].color,
                          }}
                          title={`Resolved: ${ward.resolved}`}
                        />
                        <div
                          className="ward-bar-segment"
                          style={{
                            width: `${inProgressPct}%`,
                            backgroundColor: STATUSES[1].color,
                          }}
                          title={`In Progress: ${ward.in_progress}`}
                        />
                        <div
                          className="ward-bar-segment"
                          style={{
                            width: `${submittedPct}%`,
                            backgroundColor: STATUSES[0].color,
                          }}
                          title={`Submitted: ${ward.submitted}`}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ── Panel 3: Resolution Statistics ─────────────── */}
        <div className="analytics-panel card">
          <div className="panel-header">
            <div>
              <h3 className="panel-title">
                <Activity size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                Resolution Stats
              </h3>
              <p className="panel-sub">Performance metrics</p>
            </div>
          </div>

          <div className="resolution-stats-list">
            <div className="resolution-stat-item">
              <div className="resolution-stat-icon" style={{
                background: 'rgba(42, 157, 143, 0.1)', color: 'var(--color-success)',
              }}>
                <CheckCircle2 size={20} />
              </div>
              <div className="resolution-stat-info">
                <div className="resolution-stat-label">Resolved Complaints</div>
                <div className="resolution-stat-value">
                  {kpis.resolved} <span className="stat-unit">of {kpis.total}</span>
                </div>
              </div>
            </div>

            <div className="resolution-stat-item">
              <div className="resolution-stat-icon" style={{
                background: 'rgba(30, 58, 95, 0.1)', color: 'var(--color-primary)',
              }}>
                <Clock size={20} />
              </div>
              <div className="resolution-stat-info">
                <div className="resolution-stat-label">Avg. Turnaround</div>
                <div className="resolution-stat-value">
                  {kpis.avg_resolution_days} <span className="stat-unit">days</span>
                </div>
              </div>
            </div>

            <div className="resolution-stat-item">
              <div className="resolution-stat-icon" style={{
                background: 'rgba(233, 162, 59, 0.1)', color: 'var(--color-alert)',
              }}>
                <Zap size={20} />
              </div>
              <div className="resolution-stat-info">
                <div className="resolution-stat-label">Low-Confidence NLP</div>
                <div className="resolution-stat-value">
                  {kpis.low_confidence_count} <span className="stat-unit">flagged</span>
                </div>
              </div>
            </div>

            <ResolutionRing rate={kpis.resolution_rate} />
          </div>
        </div>
      </div>
    </div>
  );
}
