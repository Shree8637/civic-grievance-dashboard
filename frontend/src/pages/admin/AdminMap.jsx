import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Circle, 
  Popup, 
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { 
  RefreshCw, 
  Layers, 
  MapPin, 
  AlertCircle, 
  Flame, 
  Calendar, 
  ExternalLink, 
  X, 
  Check, 
  Wrench, 
  CheckCircle2, 
  Filter,
  Eye
} from 'lucide-react';
import api from '../../utils/api';
import { CATEGORIES, STATUSES, getCategoryByValue, getStatusByValue } from '../../utils/constants';
import './AdminMap.css';

// Custom Marker Generator for Individual Complaints
const createPinIcon = (color) => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div class="pin-marker" style="transform: scale(0.85)">
        <svg width="24" height="30" viewBox="0 0 24 24" fill="${color}" stroke="#FFFFFF" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3" fill="#FFFFFF"></circle>
        </svg>
      </div>
    `,
    iconSize: [24, 30],
    iconAnchor: [12, 30],
    popupAnchor: [0, -30],
  });
};

// Custom DivIcon for Cluster Center Badge
const createClusterBadgeIcon = (count, color) => {
  return L.divIcon({
    className: 'cluster-badge-pin',
    html: `
      <div class="cluster-badge-pulse" style="background-color: ${color}; box-shadow: 0 0 0 4px ${color}40">
        <span class="cluster-badge-count">${count}</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Map Pan Controller
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 14, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function AdminMap() {
  const [wards, setWards] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [rawComplaints, setRawComplaints] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecomputing, setIsRecomputing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState('');

  // Filters
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Layer Toggles
  const [showHotspots, setShowHotspots] = useState(true);
  const [showIndividualPins, setShowIndividualPins] = useState(true);
  const [showWardBoundaries, setShowWardBoundaries] = useState(true);

  // Selected Cluster for Inspector Drawer
  const [activeCluster, setActiveCluster] = useState(null);
  const [mapCenter, setMapCenter] = useState([19.0760, 72.8777]);
  const [mapZoom, setMapZoom] = useState(12);

  // Show quick toast notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Load wards
  useEffect(() => {
    api.get('/wards')
      .then((res) => setWards(res.data))
      .catch((err) => console.error('Failed to load wards:', err));
  }, []);

  // Fetch hotspots & raw complaints
  const fetchHotspotsData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedWard) params.ward_id = selectedWard;
      if (selectedCategory) params.category = selectedCategory;

      const res = await api.get('/admin/hotspots', { params });
      setClusters(res.data.clusters || []);
      setRawComplaints(res.data.raw_complaints || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Error fetching hotspots:', err);
      setError('Failed to load hotspot data');
    } finally {
      setLoading(false);
    }
  }, [selectedWard, selectedCategory]);

  useEffect(() => {
    fetchHotspotsData();
  }, [fetchHotspotsData]);

  // Recompute clusters via DBSCAN
  const handleRecompute = async () => {
    setIsRecomputing(true);
    try {
      const res = await api.post('/admin/hotspots/recompute', {
        eps_km: 1.0,
        min_samples: 2,
      });
      showToast(res.data?.message || 'Clusters successfully updated!');
      fetchHotspotsData();
    } catch (err) {
      console.error('Failed to recompute clusters:', err);
      showToast('Error recomputing clusters');
    } finally {
      setIsRecomputing(false);
    }
  };

  // Select a cluster and pan map
  const handleSelectCluster = (cluster) => {
    setActiveCluster(cluster);
    setMapCenter([parseFloat(cluster.centroid_lat), parseFloat(cluster.centroid_lng)]);
    setMapZoom(15);
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-map-page">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="admin-toast">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls Toolbar */}
      <div className="map-header-card card">
        <div className="map-header-top">
          <div>
            <h1 className="admin-title">Geospatial Hotspot Map</h1>
            <p className="admin-subtitle">
              DBSCAN geospatial density clusters and complaint concentration across Mumbai wards.
            </p>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm recompute-btn"
              onClick={handleRecompute}
              disabled={isRecomputing}
              title="Run DBSCAN clustering algorithm on all complaints"
            >
              <Flame size={16} className={isRecomputing ? 'spin' : ''} />
              <span>{isRecomputing ? 'Clustering...' : 'Recompute Hotspots'}</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={fetchHotspotsData}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter & Layer Toggle Row */}
        <div className="map-controls-row">
          <div className="filter-dropdowns-group">
            {/* Ward dropdown */}
            <select
              className="form-select map-filter-select"
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
            >
              <option value="">All Wards</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  Ward {w.name} ({w.full_name})
                </option>
              ))}
            </select>

            {/* Category dropdown */}
            <select
              className="form-select map-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Layer toggles */}
          <div className="layer-toggles-group">
            <label className="layer-checkbox-label">
              <input
                type="checkbox"
                checked={showHotspots}
                onChange={(e) => setShowHotspots(e.target.checked)}
              />
              <span>Hotspot Circles ({clusters.length})</span>
            </label>

            <label className="layer-checkbox-label">
              <input
                type="checkbox"
                checked={showIndividualPins}
                onChange={(e) => setShowIndividualPins(e.target.checked)}
              />
              <span>Pins ({rawComplaints.length})</span>
            </label>

            <label className="layer-checkbox-label">
              <input
                type="checkbox"
                checked={showWardBoundaries}
                onChange={(e) => setShowWardBoundaries(e.target.checked)}
              />
              <span>Ward Zones</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Map View Area */}
      <div className="map-layout-container">
        {/* Leaflet Map Canvas */}
        <div className="leaflet-wrapper card">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            scrollWheelZoom={true}
            className="admin-leaflet-canvas"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapCenter} zoom={mapZoom} />

            {/* Layer 1: Ward Boundary Circles */}
            {showWardBoundaries &&
              wards.map((ward) => (
                <Circle
                  key={`ward-boundary-${ward.id}`}
                  center={[parseFloat(ward.center_lat), parseFloat(ward.center_lng)]}
                  radius={parseFloat(ward.radius_km || 2) * 1000}
                  pathOptions={{
                    color: '#1E3A5F',
                    weight: 1.5,
                    dashArray: '6, 6',
                    fillColor: '#1E3A5F',
                    fillOpacity: 0.04,
                  }}
                >
                  <Popup>
                    <div className="map-popup-card">
                      <strong>Ward {ward.name}</strong>
                      <p>{ward.full_name}</p>
                      <small>Approx. zone radius: {ward.radius_km} km</small>
                    </div>
                  </Popup>
                </Circle>
              ))}

            {/* Layer 2: DBSCAN Hotspot Circles */}
            {showHotspots &&
              clusters.map((cluster) => {
                const catMeta = getCategoryByValue(cluster.category);
                const lat = parseFloat(cluster.centroid_lat);
                const lng = parseFloat(cluster.centroid_lng);
                const radiusMeters = Math.max(parseFloat(cluster.radius_meters || 300), 200);
                const isSelected = activeCluster && activeCluster.id === cluster.id;

                return (
                  <span key={`hotspot-group-${cluster.id}`}>
                    <Circle
                      center={[lat, lng]}
                      radius={radiusMeters}
                      pathOptions={{
                        color: catMeta.color,
                        weight: isSelected ? 3.5 : 2,
                        fillColor: catMeta.color,
                        fillOpacity: isSelected ? 0.45 : 0.28,
                      }}
                      eventHandlers={{
                        click: () => handleSelectCluster(cluster),
                      }}
                    />
                    <Marker
                      position={[lat, lng]}
                      icon={createClusterBadgeIcon(cluster.complaint_count, catMeta.color)}
                      eventHandlers={{
                        click: () => handleSelectCluster(cluster),
                      }}
                    >
                      <Popup>
                        <div className="map-popup-card">
                          <span className="popup-category" style={{ color: catMeta.color }}>
                            ● {catMeta.label} Hotspot
                          </span>
                          <strong>{cluster.complaint_count} Complaints</strong>
                          <p>Ward {cluster.ward_name || ''} ({cluster.ward_full_name || ''})</p>
                          <button
                            type="button"
                            className="popup-inspect-btn"
                            onClick={() => handleSelectCluster(cluster)}
                          >
                            Inspect Hotspot &rarr;
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  </span>
                );
              })}

            {/* Layer 3: Individual Complaint Pins */}
            {showIndividualPins &&
              rawComplaints.map((comp) => {
                const catMeta = getCategoryByValue(comp.category);
                const lat = parseFloat(comp.latitude);
                const lng = parseFloat(comp.longitude);

                return (
                  <Marker
                    key={`complaint-pin-${comp.id}`}
                    position={[lat, lng]}
                    icon={createPinIcon(catMeta.color)}
                  >
                    <Popup>
                      <div className="map-popup-card">
                        <div className="popup-header-row">
                          <span className="popup-comp-id">{comp.complaint_id}</span>
                          <span className={`status-pill status-${comp.status}`}>
                            {comp.status}
                          </span>
                        </div>
                        <span className="popup-category" style={{ color: catMeta.color }}>
                          {catMeta.label}
                        </span>
                        <p className="popup-desc">{comp.description}</p>
                        <small className="popup-date">{formatDate(comp.created_at)}</small>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>

          {/* Map Legend */}
          <div className="map-floating-legend">
            <h4 className="legend-title">Categories</h4>
            <div className="legend-items">
              {CATEGORIES.map((cat) => (
                <div key={cat.value} className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: cat.color }}></span>
                  <span className="legend-label">{cat.label}</span>
                </div>
              ))}
            </div>
            <div className="legend-density-hint">
              <Flame size={13} color="#D64550" />
              <span>Circle size = hotspot density</span>
            </div>
          </div>
        </div>

        {/* Side Inspector Drawer */}
        {activeCluster ? (
          <div className="cluster-inspector-panel card">
            <div className="inspector-header">
              <div className="inspector-title-group">
                <span 
                  className="inspector-cat-pill"
                  style={{ 
                    backgroundColor: `${getCategoryByValue(activeCluster.category).color}20`,
                    color: getCategoryByValue(activeCluster.category).color
                  }}
                >
                  ● {getCategoryByValue(activeCluster.category).label} Hotspot
                </span>
                <h3 className="inspector-cluster-title">
                  {activeCluster.complaint_count} Complaints Clustered
                </h3>
              </div>
              <button
                type="button"
                className="inspector-close-btn"
                onClick={() => setActiveCluster(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="inspector-body">
              {/* Recurring Incident Alert if high text cohesion */}
              {activeCluster.cohesion_score >= 0.30 && (
                <div className="recurring-incident-banner">
                  <AlertCircle size={18} className="banner-icon" />
                  <div>
                    <strong>High Text Similarity ({Math.round(activeCluster.cohesion_score * 100)}%)</strong>
                    <p>Complaints describe the same underlying incident at this location.</p>
                  </div>
                </div>
              )}

              {/* Cluster Meta */}
              <div className="inspector-meta-box">
                <div className="meta-row">
                  <span className="meta-k">Location:</span>
                  <span className="meta-v">
                    Ward {activeCluster.ward_name} ({activeCluster.ward_full_name || 'Mumbai'})
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-k">Centroid GPS:</span>
                  <span className="meta-v">
                    {Number(activeCluster.centroid_lat).toFixed(4)}, {Number(activeCluster.centroid_lng).toFixed(4)}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-k">First Reported:</span>
                  <span className="meta-v">{formatDate(activeCluster.first_seen)}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-k">Latest Report:</span>
                  <span className="meta-v">{formatDate(activeCluster.last_seen)}</span>
                </div>
              </div>

              {/* Top Keywords */}
              {activeCluster.top_keywords && activeCluster.top_keywords.length > 0 && (
                <div className="keywords-box">
                  <span className="keywords-label">Incident Keywords:</span>
                  <div className="keywords-chips">
                    {activeCluster.top_keywords.map((kw, i) => (
                      <span key={i} className="kw-chip">#{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Complaints List in Cluster */}
              <div className="cluster-complaints-section">
                <h4 className="section-title">
                  Complaints in this Cluster ({activeCluster.complaints?.length || activeCluster.complaint_count})
                </h4>

                <div className="cluster-complaints-list">
                  {activeCluster.complaints && activeCluster.complaints.length > 0 ? (
                    activeCluster.complaints.map((c) => (
                      <div key={c.id} className="cluster-complaint-item">
                        <div className="complaint-item-top">
                          <span className="complaint-item-id">{c.complaint_id}</span>
                          <span className={`status-pill status-${c.status}`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="complaint-item-desc">{c.description}</p>
                        <span className="complaint-item-date">{formatDate(c.created_at)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="empty-text">No detailed complaint records linked.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Sidebar Summary when no cluster is selected */
          <div className="cluster-sidebar-summary card">
            <h3 className="summary-title">Hotspots Summary</h3>
            <p className="summary-sub">
              Geospatial clusters generated via DBSCAN density scanning. Click any hotspot circle on the map to inspect incident details.
            </p>

            <div className="kpi-mini-grid">
              <div className="kpi-mini-item">
                <span className="kpi-mini-num">{clusters.length}</span>
                <span className="kpi-mini-lbl">Active Hotspots</span>
              </div>
              <div className="kpi-mini-item">
                <span className="kpi-mini-num">
                  {clusters.length > 0 ? Math.max(...clusters.map((c) => c.complaint_count)) : 0}
                </span>
                <span className="kpi-mini-lbl">Peak Cluster Size</span>
              </div>
            </div>

            <div className="hotspots-quick-list">
              <h4 className="quick-list-title">Detected Hotspots:</h4>
              {clusters.length === 0 ? (
                <div className="empty-clusters-notice">
                  <Flame size={28} color="var(--color-text-muted)" />
                  <p>No dense clusters detected with current filters.</p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleRecompute}
                    style={{ marginTop: '8px' }}
                  >
                    Recompute Hotspots
                  </button>
                </div>
              ) : (
                clusters.map((cl) => {
                  const cat = getCategoryByValue(cl.category);
                  return (
                    <div
                      key={cl.id}
                      className="hotspot-summary-card"
                      onClick={() => handleSelectCluster(cl)}
                    >
                      <div className="hotspot-summary-header">
                        <span className="hotspot-summary-cat" style={{ color: cat.color }}>
                          ● {cat.label}
                        </span>
                        <span className="hotspot-summary-badge">
                          {cl.complaint_count} reports
                        </span>
                      </div>
                      <p className="hotspot-summary-location">
                        Ward {cl.ward_name} ({cl.ward_full_name || 'Mumbai'})
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
