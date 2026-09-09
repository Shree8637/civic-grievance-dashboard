import { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { 
  Search, 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Wrench, 
  FileText, 
  ExternalLink,
  ChevronRight,
  ImageIcon
} from 'lucide-react';
import api, { getUploadUrl } from '../../utils/api';
import { getCategoryByValue, getStatusByValue } from '../../utils/constants';
import './TrackComplaint.css';

// Custom Pin Icon for Track Map
const trackPinIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `
    <div class="pin-marker">
      <svg width="30" height="38" viewBox="0 0 24 24" fill="#1E3A5F" stroke="#FFFFFF" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="#FFFFFF"></circle>
      </svg>
    </div>
  `,
  iconSize: [30, 38],
  iconAnchor: [15, 38],
});

export default function TrackComplaint() {
  const [searchParams] = useSearchParams();
  const routeParams = useParams();
  
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Auto-search if URL query has ?id=... or route param /track/:id
  useEffect(() => {
    const targetId = searchParams.get('id') || routeParams.id;
    if (targetId) {
      setQueryInput(targetId);
      performSearch(targetId);
    }
  }, [searchParams, routeParams]);

  const performSearch = async (searchTerm) => {
    const term = searchTerm || queryInput;
    if (!term || !term.trim()) {
      setError('Please enter a Complaint ID or Phone Number.');
      return;
    }

    setLoading(true);
    setError('');
    setSearchPerformed(true);

    try {
      const res = await api.get(`/complaints/track?query=${encodeURIComponent(term.trim())}`);
      if (res.data && res.data.complaints) {
        setComplaints(res.data.complaints);
      } else {
        setComplaints([]);
      }
    } catch (err) {
      console.error('Tracking search error:', err);
      setComplaints([]);
      setError(
        err.response?.data?.error || `No records found matching "${term.trim()}". Please verify and try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(queryInput);
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper to determine status progress step
  const getStatusStepIndex = (status) => {
    switch (status) {
      case 'submitted':
        return 1;
      case 'in_progress':
        return 2;
      case 'resolved':
        return 3;
      default:
        return 1;
    }
  };

  return (
    <div className="track-container">
      <div className="track-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>
        <h1 className="page-title">Track Complaint Status</h1>
        <p className="page-subtitle">
          Enter your Complaint Reference ID (e.g. <code>GD-10001</code>) or your 10-digit registered mobile number.
        </p>
      </div>

      {/* Search Bar */}
      <div className="track-search-card card">
        <form onSubmit={handleSearchSubmit} className="track-search-form">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="e.g. GD-10001 or 9876543210"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary track-btn" disabled={loading}>
            {loading ? <span className="spinner-border"></span> : <Search size={18} />}
            <span>Search Status</span>
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="error-alert">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Results List */}
      <div className="results-container">
        {complaints.length > 1 && (
          <div className="results-count-bar">
            <span>Found <strong>{complaints.length}</strong> complaints associated with your search:</span>
          </div>
        )}

        {complaints.map((item) => {
          const catMeta = getCategoryByValue(item.category);
          const statusMeta = getStatusByValue(item.status);
          const currentStep = getStatusStepIndex(item.status);
          const hasCoords = item.latitude && item.longitude;

          return (
            <div key={item.id} className="complaint-detail-card card">
              {/* Card Top */}
              <div className="card-top-header">
                <div className="id-category-group">
                  <span className="complaint-ref-badge">{item.complaint_id}</span>
                  <span 
                    className="category-badge"
                    style={{ backgroundColor: `${catMeta.color}15`, color: catMeta.color, borderColor: `${catMeta.color}35` }}
                  >
                    ● {catMeta.label}
                  </span>
                  {item.ward_name && (
                    <span className="ward-badge">
                      Ward {item.ward_name} ({item.ward_full_name || 'Mumbai'})
                    </span>
                  )}
                </div>

                <div className="date-badge">
                  <Calendar size={14} />
                  <span>{formatDate(item.created_at)}</span>
                </div>
              </div>

              {/* Status Stepper Progression */}
              <div className="status-timeline-box">
                <div className="timeline-steps">
                  {/* Step 1: Submitted */}
                  <div className={`step-item ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}`}>
                    <div className="step-circle">
                      <FileText size={16} />
                    </div>
                    <div className="step-label">Submitted</div>
                    <div className="step-sub">Logged in portal</div>
                  </div>

                  <div className={`step-line ${currentStep >= 2 ? 'filled' : ''}`}></div>

                  {/* Step 2: In Progress */}
                  <div className={`step-item ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}`}>
                    <div className="step-circle">
                      <Wrench size={16} />
                    </div>
                    <div className="step-label">In Progress</div>
                    <div className="step-sub">Ward team assigned</div>
                  </div>

                  <div className={`step-line ${currentStep >= 3 ? 'filled' : ''}`}></div>

                  {/* Step 3: Resolved */}
                  <div className={`step-item ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}`}>
                    <div className="step-circle">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="step-label">Resolved</div>
                    <div className="step-sub">Issue inspected & fixed</div>
                  </div>
                </div>
              </div>

              {/* Description & Evidence */}
              <div className="complaint-body-grid">
                <div className="complaint-text-panel">
                  <h3 className="section-subheading">Issue Description</h3>
                  <p className="complaint-description">{item.description}</p>

                  <div className="meta-footer-details">
                    {item.citizen_phone && (
                      <div className="meta-row">
                        <Phone size={14} className="meta-icon" />
                        <span>Registered Phone: <strong>{item.citizen_phone}</strong></span>
                      </div>
                    )}
                    {hasCoords && (
                      <div className="meta-row">
                        <MapPin size={14} className="meta-icon" />
                        <span>Coordinates: {Number(item.latitude).toFixed(4)}, {Number(item.longitude).toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Evidence Photo / Mini Map */}
                <div className="complaint-visual-panel">
                  {item.photo_url ? (
                    <div className="evidence-photo-box" onClick={() => setSelectedPhoto(item.photo_url)}>
                      <img 
                        src={getUploadUrl(item.photo_url)} 
                        alt="Evidence photo" 
                        className="evidence-thumbnail"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="photo-overlay">
                        <ImageIcon size={16} />
                        <span>Click to view full photo</span>
                      </div>
                    </div>
                  ) : hasCoords ? (
                    <div className="track-mini-map-wrap">
                      <MapContainer
                        center={[item.latitude, item.longitude]}
                        zoom={15}
                        scrollWheelZoom={false}
                        dragging={false}
                        zoomControl={false}
                        className="track-mini-map"
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={[item.latitude, item.longitude]} icon={trackPinIcon} />
                      </MapContainer>
                    </div>
                  ) : (
                    <div className="no-visual-box">
                      <MapPin size={24} color="var(--color-text-muted)" />
                      <span>No map coordinates or photo provided</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state when searched but nothing returned */}
        {searchPerformed && !loading && complaints.length === 0 && !error && (
          <div className="empty-state-card card">
            <Search size={44} className="empty-icon" />
            <h3 className="empty-title">No Records Found</h3>
            <p className="empty-text">
              We couldn't locate any complaints matching your search query. Please double-check your Complaint Reference ID (e.g. <code>GD-10001</code>) or phone number.
            </p>
            <Link to="/submit" className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-3)' }}>
              Submit a New Complaint
            </Link>
          </div>
        )}
      </div>

      {/* Lightbox / Modal for Photo Viewing */}
      {selectedPhoto && (
        <div className="photo-modal-backdrop" onClick={() => setSelectedPhoto(null)}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={getUploadUrl(selectedPhoto)} 
              alt="Full evidence" 
              className="modal-full-img" 
            />
            <button 
              type="button" 
              className="modal-close-btn"
              onClick={() => setSelectedPhoto(null)}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
