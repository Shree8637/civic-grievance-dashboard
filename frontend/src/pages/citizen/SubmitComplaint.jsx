import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  Camera, 
  Phone, 
  FileText, 
  CheckCircle2, 
  ArrowLeft, 
  UploadCloud, 
  X, 
  Copy, 
  Check, 
  Compass, 
  AlertCircle 
} from 'lucide-react';
import api from '../../utils/api';
import './SubmitComplaint.css';

// Custom SVG Pin Icon for Leaflet
const createPinIcon = () => {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div class="pin-marker">
        <svg width="34" height="42" viewBox="0 0 24 24" fill="#D64550" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3" fill="#FFFFFF"></circle>
        </svg>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -42],
  });
};

// Component to handle map clicks and place marker
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to smoothly pan map when coordinates change
function MapCenterUpdater({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 15, { duration: 1.2 });
    }
  }, [coords, map]);
  return null;
}

const QUICK_EXAMPLES = [
  'Garbage dump overflowing on the sidewalk for 3 days',
  'Deep pothole on road causing dangerous vehicle swerving',
  'Water pipeline leaking continuously near apartment gate',
  'Streetlight flickering and off on the residential lane',
  'Open drainage cover posing safety hazard to pedestrians',
];

export default function SubmitComplaint() {
  const navigate = useNavigate();
  
  // Form state
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedWardId, setSelectedWardId] = useState('');
  const [wards, setWards] = useState([]);
  
  // Location state
  const [location, setLocation] = useState(null); // { lat, lng }
  const [detectedWard, setDetectedWard] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  
  // Photo state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedData, setSubmittedData] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Initial Mumbai Coordinates
  const defaultCenter = [19.0760, 72.8777];

  // Load wards on mount
  useEffect(() => {
    api.get('/wards')
      .then((res) => {
        setWards(res.data);
      })
      .catch((err) => {
        console.error('Failed to load wards:', err);
      });
  }, []);

  // Whenever user selects or updates lat/lng, look up nearest ward
  const handleLocationSelect = async (lat, lng) => {
    setLocation({ lat, lng });
    setErrorMessage('');
    try {
      const res = await api.get(`/wards/nearest?lat=${lat}&lng=${lng}`);
      if (res.data) {
        setDetectedWard(res.data);
        if (!selectedWardId) {
          setSelectedWardId(res.data.id);
        }
      }
    } catch (err) {
      console.error('Nearest ward lookup failed:', err);
    }
  };

  // Browser Geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        handleLocationSelect(latitude, longitude);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        let msg = 'Unable to retrieve location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please click on the map to pin your location.';
        }
        setErrorMessage(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Photo handlers
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB limit.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrorMessage('');
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage('Please provide a detailed description of at least 10 characters.');
      return;
    }

    if (!location && !selectedWardId) {
      setErrorMessage('Please pinpoint the location on the map or select a ward.');
      return;
    }

    if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
      setErrorMessage('Please enter a valid 10-digit mobile number for status tracking.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('description', description.trim());
      if (location) {
        formData.append('latitude', location.lat);
        formData.append('longitude', location.lng);
      }
      if (selectedWardId) {
        formData.append('ward_id', selectedWardId);
      }
      if (phone) {
        formData.append('citizen_phone', phone.trim());
      }
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await api.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data && res.data.success) {
        setSubmittedData(res.data.complaint);
      } else {
        setErrorMessage('Failed to submit grievance. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage(
        err.response?.data?.error || 'An error occurred while submitting your grievance.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyComplaintId = () => {
    if (submittedData?.complaint_id) {
      navigator.clipboard.writeText(submittedData.complaint_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const resetForm = () => {
    setDescription('');
    setPhone('');
    setLocation(null);
    setDetectedWard(null);
    setSelectedWardId('');
    handleRemovePhoto();
    setSubmittedData(null);
    setErrorMessage('');
  };

  // Confirmation screen once submitted
  if (submittedData) {
    return (
      <div className="submit-container">
        <div className="confirmation-card card">
          <div className="success-icon-wrap">
            <CheckCircle2 size={56} className="success-icon" />
          </div>
          
          <h2 className="confirmation-title">Complaint Successfully Submitted</h2>
          <p className="confirmation-sub">
            Your grievance has been lodged with the municipal authority. Save this reference ID to track progress anytime.
          </p>

          <div className="reference-badge-box">
            <span className="ref-label">Complaint Reference ID</span>
            <div className="ref-id-row">
              <span className="ref-id">{submittedData.complaint_id}</span>
              <button 
                type="button" 
                className="btn btn-sm copy-btn" 
                onClick={copyComplaintId}
                title="Copy Reference ID"
              >
                {copiedId ? <Check size={16} /> : <Copy size={16} />}
                {copiedId ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="summary-details">
            <div className="detail-item">
              <span className="detail-label">Ward:</span>
              <span className="detail-val">
                {submittedData.ward_name ? `Ward ${submittedData.ward_name} (${submittedData.ward_full_name || ''})` : 'Auto-assigned'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Initial Status:</span>
              <span className="status-pill status-submitted">● Submitted</span>
            </div>
            {submittedData.citizen_phone && (
              <div className="detail-item">
                <span className="detail-label">Contact:</span>
                <span className="detail-val">{submittedData.citizen_phone}</span>
              </div>
            )}
          </div>

          <div className="confirmation-actions">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => navigate(`/track?id=${submittedData.complaint_id}`)}
            >
              Track this Complaint
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={resetForm}
            >
              Submit Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-container">
      <div className="submit-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </Link>
        <h1 className="page-title">Report a Civic Issue</h1>
        <p className="page-subtitle">
          Submit photos and location of potholes, garbage, water leaks, or drainage issues directly to the civic control center.
        </p>
      </div>

      {errorMessage && (
        <div className="error-alert">
          <AlertCircle size={20} />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="complaint-form">
        {/* Step 1: Description */}
        <div className="form-card card">
          <div className="card-header-icon">
            <FileText size={22} className="section-icon" />
            <div>
              <h2 className="section-title">1. Describe the Issue</h2>
              <p className="section-desc">What is the problem and what makes it urgent?</p>
            </div>
          </div>

          <div className="form-group">
            <textarea
              className="form-textarea desc-textarea"
              rows={4}
              placeholder="e.g. Overflowing municipal garbage bin near the community park entrance. Foul odor and waste is spilling over the road..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              required
            />
            <div className="textarea-footer">
              <span className="char-count">{description.length}/1000 characters</span>
            </div>
          </div>

          <div className="quick-suggestions">
            <span className="suggestions-label">Quick samples:</span>
            <div className="chips-list">
              {QUICK_EXAMPLES.map((example, idx) => (
                <button
                  type="button"
                  key={idx}
                  className="chip-btn"
                  onClick={() => setDescription(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Step 2: Location */}
        <div className="form-card card">
          <div className="card-header-icon">
            <MapPin size={22} className="section-icon" />
            <div>
              <h2 className="section-title">2. Pinpoint Location</h2>
              <p className="section-desc">Click on the map or use your device GPS to locate the problem.</p>
            </div>
          </div>

          <div className="location-toolbar">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleGetLocation}
              disabled={isLocating}
            >
              <Compass size={16} className={isLocating ? 'spin' : ''} />
              {isLocating ? 'Detecting GPS...' : 'Use My Current Location'}
            </button>

            {location && (
              <span className="coordinates-badge">
                📍 {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
              </span>
            )}
          </div>

          <div className="map-container-wrapper">
            <MapContainer
              center={location ? [location.lat, location.lng] : defaultCenter}
              zoom={location ? 15 : 12}
              scrollWheelZoom={false}
              className="leaflet-submit-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleLocationSelect} />
              {location && (
                <>
                  <Marker position={[location.lat, location.lng]} icon={createPinIcon()} />
                  <MapCenterUpdater coords={location} />
                </>
              )}
            </MapContainer>
            <div className="map-instruction">
              💡 Tip: Click anywhere on the map to place or reposition the pin.
            </div>
          </div>

          <div className="ward-selection-row">
            <div className="detected-ward-box">
              <span className="detected-label">Detected Ward Zone:</span>
              <span className="detected-value">
                {detectedWard ? (
                  <>
                    <strong>Ward {detectedWard.name}</strong> ({detectedWard.full_name})
                    <span className="distance-tag">~{detectedWard.distance_km} km to center</span>
                  </>
                ) : (
                  <span className="text-muted">Click map to auto-detect ward</span>
                )}
              </span>
            </div>

            <div className="manual-ward-select">
              <label className="form-label" htmlFor="ward-select">
                Or manually select Ward:
              </label>
              <select
                id="ward-select"
                className="form-select"
                value={selectedWardId}
                onChange={(e) => setSelectedWardId(e.target.value)}
              >
                <option value="">-- Choose Municipal Ward --</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    Ward {w.name} — {w.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Photo & Phone */}
        <div className="form-card card">
          <div className="card-header-icon">
            <Camera size={22} className="section-icon" />
            <div>
              <h2 className="section-title">3. Photo & Contact Details</h2>
              <p className="section-desc">Add visual evidence and contact number for tracking updates.</p>
            </div>
          </div>

          <div className="photo-phone-grid">
            {/* Photo upload */}
            <div className="form-group">
              <label className="form-label">Evidence Photo (Optional)</label>
              
              {!photoPreview ? (
                <div 
                  className="upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={32} className="upload-icon" />
                  <span className="upload-text">Click to upload photo</span>
                  <span className="upload-subtext">JPG, PNG, WebP up to 5MB</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    className="file-hidden-input"
                    onChange={handlePhotoChange}
                  />
                </div>
              ) : (
                <div className="photo-preview-box">
                  <img src={photoPreview} alt="Complaint preview" className="preview-img" />
                  <button
                    type="button"
                    className="remove-photo-btn"
                    onClick={handleRemovePhoto}
                    title="Remove photo"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Citizen phone */}
            <div className="form-group">
              <label className="form-label" htmlFor="citizen-phone">
                Mobile Number (For Tracking)
              </label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input
                  id="citizen-phone"
                  type="tel"
                  className="form-input icon-padded"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={15}
                />
              </div>
              <span className="field-hint">
                You can look up all your submitted complaints later with this number.
              </span>
            </div>
          </div>
        </div>

        {/* Submit action */}
        <div className="submit-action-bar">
          <button
            type="submit"
            className="btn btn-primary btn-lg submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border"></span>
                <span>Submitting Complaint...</span>
              </>
            ) : (
              <span>Submit Complaint</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
