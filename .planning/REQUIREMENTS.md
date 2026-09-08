# Requirements: Civic Grievance Intelligence Dashboard

**Defined:** 2026-09-09
**Core Value:** Citizens can report issues in under 2 minutes via web or WhatsApp, and administrators can see ward-level hotspots and category trends without reading every complaint individually

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: Citizen can submit complaint via web form with free-text description, location (map pin/geolocation), optional photo
- [ ] **AUTH-02**: Citizen can submit complaint via WhatsApp Cloud API (free tier) with free-text + location
- [ ] **AUTH-03**: Complaint receives auto-generated tracking ID on submission (both channels)
- [ ] **AUTH-04**: Citizen can track complaint status by complaint ID or phone number

### Classification

- [ ] **CLASS-01**: NLP engine classifies complaint text into 5 categories: garbage, water supply, drainage, roads, streetlights
- [ ] **CLASS-02**: Classification confidence score stored per complaint
- [ ] **CLASS-03**: Low-confidence complaints flagged for manual review
- [ ] **CLASS-04**: Admin can override NLP category if misclassified

### Clustering

- [ ] **CLUST-01**: Geospatial clustering (DBSCAN) identifies ward/category hotspots from complaint coordinates
- [ ] **CLUST-02**: Text-similarity clustering groups near-duplicate complaints (same issue reported by multiple people)
- [ ] **CLUST-03**: Hotspot markers on admin map sized/colored by complaint density

### Dashboard

- [ ] **DASH-01**: Admin dashboard shows ward-level heatmap (Leaflet + OpenStreetMap) with hotspot markers
- [ ] **DASH-02**: Admin dashboard shows category distribution chart (pie/bar)
- [ ] **DASH-03**: Admin dashboard shows complaint volume trends over time (line chart, filterable by ward/category)
- [ ] **DASH-04**: Admin dashboard shows resolution statistics (open vs resolved, avg. resolution time)
- [ ] **DASH-05**: Admin can filter complaints by ward, category, date range, status
- [ ] **DASH-06**: Admin can manually update complaint status (submitted → in progress → resolved)

### WhatsApp

- [ ] **WA-01**: WhatsApp webhook endpoint receives messages and maps to complaint creation logic
- [ ] **WA-02**: Bot asks for location if not shared (or accepts WhatsApp location pin)
- [ ] **WA-03**: Bot replies with complaint ID for tracking

## v2 Requirements

### Notifications

- **NOTF-01**: Citizen receives WhatsApp/SMS notification when complaint status changes
- **NOTF-02**: Admin receives alerts for new high-density hotspots
- **NOTF-03**: Citizen can configure notification preferences

### Advanced Analytics

- **ADV-01**: Urgency/severity tagging from text (e.g., "flooding" vs "minor pothole")
- **ADV-02**: Predictive analytics for infrastructure failure forecasting
- **ADV-03**: Cross-ward trend comparison for resource planning
- **ADV-04**: Department-level workload balancing reports

### Multilingual

- **ML-01**: Marathi/Hindi complaint text processing
- **ML-02**: Marathi/Hindi UI labels on citizen portal
- **ML-03**: Multilingual NLP classification

### Integration

- **INT-01**: Direct integration with official municipal grievance systems
- **INT-02**: Automatic routing of complaints to relevant departments
- **INT-03**: SLA enforcement and escalation workflows

### Mobile

- **MOB-01**: Native mobile application
- **MOB-02**: SMS and voice-based complaint registration

## Out of Scope

| Feature | Reason |
|---------|--------|
| Direct integration with official municipal grievance systems | Future scope per PRD; requires municipal cooperation |
| Multilingual (Marathi/Hindi) NLP support | Future scope; adds significant complexity to NLP pipeline |
| Native mobile app | WhatsApp covers mobile-first need for v1 |
| Automated complaint resolution (routing, SLA enforcement) | v1 focuses on visibility and classification, not workflow automation |
| Predictive/forecasting analytics | Future scope; requires historical data not available in demo |
| Real-time chat | Not core to community value; high complexity |
| Video posts | Storage/bandwidth costs; defer to v2+ |
| SMS and voice-based complaint registration | Future scope; WhatsApp covers primary mobile channel |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 2 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| CLASS-01 | Phase 3 | Pending |
| CLASS-02 | Phase 3 | Pending |
| CLASS-03 | Phase 3 | Pending |
| CLASS-04 | Phase 3 | Pending |
| CLUST-01 | Phase 4 | Pending |
| CLUST-02 | Phase 4 | Pending |
| CLUST-03 | Phase 4 | Pending |
| DASH-01 | Phase 5 | Pending |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 5 | Pending |
| DASH-04 | Phase 5 | Pending |
| DASH-05 | Phase 5 | Pending |
| DASH-06 | Phase 5 | Pending |
| WA-01 | Phase 2 | Pending |
| WA-02 | Phase 2 | Pending |
| WA-03 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-09-09*
*Last updated: 2026-09-09 after initial definition*