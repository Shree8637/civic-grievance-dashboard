import { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Eye, 
  X, 
  MapPin, 
  Calendar, 
  Phone, 
  ImageIcon,
  Check,
  AlertTriangle
} from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import api, { getUploadUrl } from '../../utils/api';
import { CATEGORIES, STATUSES, getCategoryByValue, getStatusByValue } from '../../utils/constants';
import './AdminComplaints.css';

const adminPinIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `
    <div class="pin-marker">
      <svg width="28" height="36" viewBox="0 0 24 24" fill="#1E3A5F" stroke="#FFFFFF" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
        <circle cx="12" cy="10" r="3" fill="#FFFFFF"></circle>
      </svg>
    </div>
  `,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

export default function AdminComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Filters
  const [selectedWard, setSelectedWard] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyLowConfidence, setOnlyLowConfidence] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, totalPages: 1 });

  // Detail Modal & Photo Modal state
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch wards once
  useEffect(() => {
    api.get('/wards')
      .then((res) => setWards(res.data))
      .catch((err) => console.error('Failed to load wards:', err));
  }, []);

  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 12,
      };
      if (selectedWard) params.ward_id = selectedWard;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (onlyLowConfidence) params.low_confidence = 'true';

      const res = await api.get('/admin/complaints', { params });
      setComplaints(res.data.complaints || []);
      setPagination(res.data.pagination || { total: 0, page: 1, limit: 12, totalPages: 1 });
    } catch (err) {
      console.error('Error fetching admin complaints:', err);
      setError(err.response?.data?.error || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [page, selectedWard, selectedCategory, selectedStatus, searchTerm, onlyLowConfidence]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // Show quick toast notification
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Quick Status Update
  const handleStatusChange = async (complaintId, newStatus) => {
    setIsUpdating(true);
    try {
      const res = await api.patch(`/admin/complaints/${complaintId}`, { status: newStatus });
      if (res.data && res.data.success) {
        showToast(`Status updated to "${newStatus.replace('_', ' ')}"`);
        // Update locally
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? { ...c, status: newStatus } : c))
        );
        if (activeComplaint && activeComplaint.id === complaintId) {
          setActiveComplaint((prev) => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      showToast('Error updating status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Category Override
  const handleCategoryOverride = async (complaintId, newCategory) => {
    setIsUpdating(true);
    try {
      const res = await api.patch(`/admin/complaints/${complaintId}`, { category: newCategory });
      if (res.data && res.data.success) {
        showToast(`Category updated to "${newCategory}"`);
        setComplaints((prev) =>
          prev.map((c) => (c.id === complaintId ? { ...c, category: newCategory } : c))
        );
        if (activeComplaint && activeComplaint.id === complaintId) {
          setActiveComplaint((prev) => ({ ...prev, category: newCategory }));
        }
      }
    } catch (err) {
      console.error('Failed to override category:', err);
      showToast('Error updating category');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedWard('');
    setSelectedCategory('');
    setSelectedStatus('');
    setSearchTerm('');
    setOnlyLowConfidence(false);
    setPage(1);
  };

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-complaints-page">
      {/* Toast popup */}
      {toastMessage && (
        <div className="admin-toast">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">Grievance Management</h1>
          <p className="admin-subtitle">
            Review, filter, and update status of citizen complaints across all municipal wards.
          </p>
        </div>
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={fetchComplaints}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar card">
        <div className="search-box-wrapper">
          <Search size={18} className="filter-icon" />
          <input
            type="text"
            className="form-input filter-search-input"
            placeholder="Search ID, text, or phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="filters-dropdowns">
          {/* Ward filter */}
          <select
            className="form-select filter-select"
            value={selectedWard}
            onChange={(e) => {
              setSelectedWard(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Wards</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                Ward {w.name} ({w.full_name})
              </option>
            ))}
          </select>

          {/* Category filter */}
          <select
            className="form-select filter-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            className="form-select filter-select"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Low Confidence Filter Toggle */}
          <button
            type="button"
            className={`btn btn-sm ${onlyLowConfidence ? 'btn-flagged-active' : 'btn-secondary'}`}
            onClick={() => {
              setOnlyLowConfidence(!onlyLowConfidence);
              setPage(1);
            }}
            title="Filter complaints where AI classification confidence is low (<60%)"
          >
            <AlertTriangle size={14} color={onlyLowConfidence ? '#FFFFFF' : '#E9A23B'} />
            <span>Low Confidence</span>
          </button>

          {(selectedWard || selectedCategory || selectedStatus || searchTerm || onlyLowConfidence) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm clear-filters-btn"
              onClick={handleResetFilters}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="error-alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Complaints Table */}
      <div className="table-wrapper card">
        <table className="admin-data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Ward</th>
              <th>Category & Confidence</th>
              <th>Description</th>
              <th>Photo</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="table-loading-spinner">
                    <span className="spinner-border" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}></span>
                    <span style={{ marginLeft: '8px', color: 'var(--color-text-muted)' }}>Loading complaints...</span>
                  </div>
                </td>
              </tr>
            ) : complaints.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="empty-table-state">
                    <AlertCircle size={32} color="var(--color-text-muted)" style={{ marginBottom: '8px' }} />
                    <p style={{ fontWeight: 600, color: 'var(--color-primary)' }}>No complaints found</p>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                      Try adjusting your filters or search keywords.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              complaints.map((item) => {
                const cat = getCategoryByValue(item.category);
                const statusMeta = getStatusByValue(item.status);
                const conf = item.confidence_score != null ? Number(item.confidence_score) : null;
                const isLowConf = conf != null && conf < 0.60;

                return (
                  <tr key={item.id} className="complaint-row">
                    <td>
                      <span className="complaint-table-id">{item.complaint_id}</span>
                    </td>
                    <td className="date-cell">
                      {formatDate(item.created_at)}
                    </td>
                    <td>
                      <span className="ward-pill">
                        {item.ward_name ? `Ward ${item.ward_name}` : 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <div className="category-cell-group">
                        <span 
                          className="cat-pill" 
                          style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                        >
                          {cat.label}
                        </span>
                        {conf != null && (
                          <span 
                            className={`confidence-pill ${isLowConf ? 'conf-low' : 'conf-high'}`}
                            title={`NLP Model Confidence: ${(conf * 100).toFixed(1)}%`}
                          >
                            {isLowConf && <AlertTriangle size={11} />}
                            {(conf * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="desc-cell">
                      <p className="desc-text" title={item.description}>
                        {item.description}
                      </p>
                    </td>
                    <td>
                      {item.photo_url ? (
                        <button
                          type="button"
                          className="photo-thumb-btn"
                          onClick={() => setPreviewPhoto(item.photo_url)}
                          title="View evidence photo"
                        >
                          <img 
                            src={getUploadUrl(item.photo_url)} 
                            alt="Evidence" 
                            className="table-img-thumb"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </button>
                      ) : (
                        <span className="no-photo-dash">—</span>
                      )}
                    </td>
                    <td>
                      {/* Interactive Status Selector */}
                      <select
                        className={`status-select status-select-${item.status}`}
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        disabled={isUpdating}
                      >
                        <option value="submitted">Submitted</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm action-view-btn"
                        onClick={() => setActiveComplaint(item)}
                        title="View Full Details"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Pagination Bar */}
        <div className="table-pagination-bar">
          <div className="pagination-count">
            Showing <strong>{complaints.length}</strong> of <strong>{pagination.total}</strong> grievances
          </div>
          <div className="pagination-controls">
            <button
              type="button"
              className="btn btn-secondary btn-sm page-nav-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              <ChevronLeft size={16} />
              <span>Prev</span>
            </button>
            <span className="page-indicator">
              Page <strong>{page}</strong> of <strong>{pagination.totalPages || 1}</strong>
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm page-nav-btn"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages || loading}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Complaint Details Modal / Drawer */}
      {activeComplaint && (
        <div className="detail-modal-backdrop" onClick={() => setActiveComplaint(null)}>
          <div className="detail-modal-card card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <span className="modal-complaint-id">{activeComplaint.complaint_id}</span>
                <span className={`status-pill status-${activeComplaint.status}`}>
                  ● {activeComplaint.status.replace('_', ' ')}
                </span>
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setActiveComplaint(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-scroll">
              {/* Low Confidence Warning Banner */}
              {activeComplaint.confidence_score != null && Number(activeComplaint.confidence_score) < 0.60 && (
                <div className="modal-low-conf-alert">
                  <AlertTriangle size={20} className="modal-alert-icon" />
                  <div className="modal-alert-text">
                    <strong>Flagged for Review: Low AI Confidence ({(Number(activeComplaint.confidence_score) * 100).toFixed(1)}%)</strong>
                    <p>The NLP model has low classification certainty for this text. Please review the description and select the correct category below if needed.</p>
                  </div>
                </div>
              )}

              {/* Quick Status Bar */}
              <div className="status-action-row">
                <span className="status-action-label">Change Status:</span>
                <div className="status-btn-group">
                  <button
                    type="button"
                    className={`btn btn-sm ${activeComplaint.status === 'submitted' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleStatusChange(activeComplaint.id, 'submitted')}
                  >
                    Submitted
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeComplaint.status === 'in_progress' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleStatusChange(activeComplaint.id, 'in_progress')}
                  >
                    In Progress
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${activeComplaint.status === 'resolved' ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => handleStatusChange(activeComplaint.id, 'resolved')}
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="modal-section">
                <h4 className="modal-section-title">Complaint Description</h4>
                <p className="modal-desc-box">{activeComplaint.description}</p>
              </div>

              {/* Metadata Grid */}
              <div className="modal-meta-grid">
                <div className="modal-meta-item">
                  <span className="meta-k">Assigned Ward:</span>
                  <span className="meta-v">
                    {activeComplaint.ward_name 
                      ? `Ward ${activeComplaint.ward_name} (${activeComplaint.ward_full_name || ''})` 
                      : 'Not assigned'}
                  </span>
                </div>

                <div className="modal-meta-item">
                  <span className="meta-k">Category & Confidence:</span>
                  <div className="meta-v category-override-wrap">
                    <select
                      className="form-select category-override-select"
                      value={activeComplaint.category || 'other'}
                      onChange={(e) => handleCategoryOverride(activeComplaint.id, e.target.value)}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    {activeComplaint.confidence_score != null && (
                      <span className={`confidence-pill ${Number(activeComplaint.confidence_score) < 0.60 ? 'conf-low' : 'conf-high'}`}>
                        {(Number(activeComplaint.confidence_score) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="modal-meta-item">
                  <span className="meta-k">Citizen Phone:</span>
                  <span className="meta-v">{activeComplaint.citizen_phone || 'Not provided'}</span>
                </div>

                <div className="modal-meta-item">
                  <span className="meta-k">Submitted At:</span>
                  <span className="meta-v">{formatDate(activeComplaint.created_at)}</span>
                </div>
              </div>

              {/* Visual Panel: Photo and Mini Map */}
              <div className="modal-visual-row">
                {activeComplaint.photo_url && (
                  <div className="modal-photo-panel">
                    <h4 className="modal-section-title">Evidence Photo</h4>
                    <div className="modal-img-wrap" onClick={() => setPreviewPhoto(activeComplaint.photo_url)}>
                      <img 
                        src={getUploadUrl(activeComplaint.photo_url)} 
                        alt="Complaint photo" 
                        className="modal-photo" 
                      />
                    </div>
                  </div>
                )}

                {activeComplaint.latitude && activeComplaint.longitude && (
                  <div className="modal-map-panel">
                    <h4 className="modal-section-title">Pinned Location</h4>
                    <div className="modal-map-wrap">
                      <MapContainer
                        center={[activeComplaint.latitude, activeComplaint.longitude]}
                        zoom={14}
                        scrollWheelZoom={false}
                        className="modal-leaflet-map"
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker 
                          position={[activeComplaint.latitude, activeComplaint.longitude]} 
                          icon={adminPinIcon} 
                        />
                      </MapContainer>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for photo preview */}
      {previewPhoto && (
        <div className="photo-modal-backdrop" onClick={() => setPreviewPhoto(null)}>
          <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
            <img 
              src={getUploadUrl(previewPhoto)} 
              alt="Full preview" 
              className="modal-full-img" 
            />
            <button 
              type="button" 
              className="modal-close-btn"
              onClick={() => setPreviewPhoto(null)}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
