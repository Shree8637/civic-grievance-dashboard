# Product Requirements Document
## Civic Grievance Intelligence Dashboard

| | |
|---|---|
| **Author** | Shreeraj Jagtap (Roll No. 48, IT — Div A, Batch A2) |
| **Institution** | Shree L. R. Tiwari College of Engineering (SLRTCE) |
| **Theme** | Urban Systems |
| **Document Type** | Product Requirements Document (PRD) |
| **Status** | Draft v2.0 — scoped as a web application |
| **Related Doc** | Statement of Purpose (SOP) — Sem 5 Mini/Major Project |

---

## 1. Executive Summary

Municipal bodies in cities like Mumbai receive thousands of complaints daily — garbage accumulation, water supply disruption, drainage blockages, road damage, streetlight failures — spread across disconnected channels. Complaints are logged and (sometimes) resolved one at a time, but the *patterns* hidden inside that data — which ward is failing on which service, which category is trending up — are almost never surfaced.

The **Civic Grievance Intelligence Dashboard** is a web application: a lightweight complaint-submission portal for citizens, and an analytics layer for municipal administrators that turns raw complaint text into categorized, geolocated, trend-ready intelligence using NLP and clustering.

---

## 2. Problem Statement

To investigate the interaction between urban services and citizens, and identify opportunities for improved service delivery — specifically, the lack of a system that converts individual grievance reports into aggregate, actionable insight for administrators.

**Why this matters:**
- Citizens have no visibility into whether their complaint is part of a larger, known problem.
- Administrators triage complaints reactively, one ticket at a time, with no hotspot or trend view.
- Resource allocation decisions (which ward needs a drainage crew this month) are made without data.

---

## 3. Goals & Non-Goals

### 3.1 Goals
- Give citizens a low-friction way to report civic issues through a responsive web portal.
- Automatically classify complaint text into service categories using NLP.
- Detect geographic hotspots and recurring-issue clusters.
- Give administrators a ward-level dashboard: heatmaps, trends, category breakdowns, resolution stats.
- Build the entire system on free/open-source tools only (project constraint — no paid APIs).

### 3.2 Non-Goals (for this build)
- WhatsApp or SMS-based complaint channel — descoped; the project is a web application only.
- Direct integration with official municipal grievance systems (listed as future scope).
- Multilingual (Marathi/Hindi) NLP support (future scope).
- Native mobile app — the web portal is built mobile-responsive to cover on-the-go reporting instead.
- Automated complaint *resolution* (routing to departments, SLA enforcement) — v1 focuses on visibility and classification, not workflow automation.
- Predictive/forecasting analytics (future scope).

---

## 4. Target Users

| Persona | Description | Core Need |
|---|---|---|
| **Citizen** | Resident reporting a civic issue (pothole, garbage, water leak, streetlight) | Report an issue in <2 minutes, track its status, feel heard |
| **Ward Administrator / Municipal Staff** | Reviews complaints for their ward | See what's recurring, where, and how urgent, without reading every complaint individually |
| **Department Head / Analyst** *(secondary)* | Cross-ward view for resource planning | Trend and category-level reporting across the city |

---

## 5. User Stories

**Citizen**
- As a citizen, I want to submit a complaint by describing the issue in plain text so I don't need to fill a rigid form.
- As a citizen, I want the web portal to work smoothly on my phone browser since that's how I'll access it most often.
- As a citizen, I want to attach my location so the issue is mapped correctly.
- As a citizen, I want to track the status of my complaint (submitted → under review → resolved).

**Administrator**
- As an admin, I want complaints auto-categorized (garbage / water / roads / drainage / streetlight) so I don't have to manually tag each one.
- As an admin, I want to see a ward-level heatmap so I can spot hotspots at a glance.
- As an admin, I want to see complaint volume trends over time per category.
- As an admin, I want to filter complaints by ward, category, date range, and status.
- As an admin, I want to see resolution-rate metrics per ward/category to gauge service performance.

---

## 6. Functional Requirements

### 6.1 Citizen Complaint Portal (Web)
| ID | Requirement | Priority |
|---|---|---|
| F1 | Complaint submission form: free-text description + optional photo + location (map pin or auto-geolocate) | Must |
| F2 | Complaint tracking page: status lookup by complaint ID / phone number | Must |
| F3 | Confirmation + complaint ID issued on submission | Must |
| F4 | Basic complaint history for a returning citizen (by phone number, no full auth required for v1) | Should |

### 6.2 NLP Classification Engine
| ID | Requirement | Priority |
|---|---|---|
| F5 | Classify incoming complaint text into categories: garbage, water supply, drainage, roads, streetlights (extensible) | Must |
| F6 | Confidence score stored per classification; low-confidence complaints flagged for manual review | Should |
| F7 | (Stretch) Urgency/severity tagging from text (e.g. "flooding" vs "minor pothole") | Could |

### 6.3 Clustering & Hotspot Detection
| ID | Requirement | Priority |
|---|---|---|
| F8 | Geospatial clustering of complaints within a ward/category to identify hotspots | Must |
| F9 | Text-similarity clustering to group near-duplicate complaints (e.g. 15 people reporting the same pothole) | Should |
| F10 | Hotspot markers sized/colored by complaint density on the admin map | Must |

### 6.4 Admin Analytics Dashboard
| ID | Requirement | Priority |
|---|---|---|
| F11 | Ward-level heatmap (Leaflet.js + OpenStreetMap) | Must |
| F12 | Category distribution chart (pie/bar) | Must |
| F13 | Complaint volume trend over time (line chart, filterable by ward/category) | Must |
| F14 | Resolution statistics (open vs resolved, avg. resolution time) | Should |
| F15 | Filter/search: by ward, category, date range, status | Must |
| F16 | Manual status update by admin (submitted → in progress → resolved) | Must |
| F17 | Manual override of NLP category if misclassified | Should |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Cost** | All infrastructure, APIs, and libraries must be free / open-source — no paid keys (hard project constraint) |
| **Performance** | Dashboard visualizations should load in under ~3s for datasets in the thousands-of-complaints range (demo scale) |
| **Scalability** | Not a production concern for this build, but schema should not block future scale-up |
| **Reliability** | Complaint submission should not fail silently; failed submission/API calls should be retried or logged |
| **Accessibility** | Web form usable on low-end smartphones, minimal data usage |
| **Security** | Basic input sanitization on complaint text; no sensitive PII required beyond phone number for tracking |
| **Data Privacy** | Citizen phone numbers used only for tracking/notifications, not exposed on the admin dashboard beyond what's needed |

---

## 8. Proposed Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| NLP / Analytics | Python, scikit-learn (TF-IDF, KMeans/DBSCAN) or open-weight Hugging Face models (e.g. DistilBERT) |
| Mapping | Leaflet.js + OpenStreetMap |
| Geocoding | Nominatim (free) |
| Hosting (suggested) | Free-tier options (e.g. Render/Railway for backend, Vercel/Netlify for frontend) — to be finalized |

---

## 9. High-Level System Flow

```
Citizen (Web)
        │
        ▼
Complaint Ingestion API (Express)
        │
        ├──► PostgreSQL (raw complaint stored)
        │
        ▼
NLP Classification Service (Python/scikit-learn or HF model)
        │
        ▼
Category + Confidence written back to complaint record
        │
        ▼
Clustering Job (geospatial + text similarity)
        │
        ▼
Hotspot / Cluster records generated
        │
        ▼
Admin Dashboard (React + Leaflet)
   ── Heatmap · Trends · Category Charts · Status Management
```

---

## 10. Core Data Model (Entities)

**Complaint**
`id, description (text), category, subcategory, confidence_score, ward_id, latitude, longitude, status (submitted/in_progress/resolved), citizen_phone, photo_url (optional), cluster_id, created_at, updated_at`

**Ward**
`id, name, geo_boundary (optional for v1), admin_contact`

**Cluster / Hotspot**
`id, category, ward_id, complaint_count, centroid_lat, centroid_lng, first_seen, last_seen`

**Admin User**
`id, name, ward_id (scope), role`

---

## 11. Key API Endpoints (indicative)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/complaints` | Submit a new complaint (web) |
| GET | `/api/complaints/:id` | Track complaint status |
| GET | `/api/admin/complaints` | List/filter complaints (ward, category, date, status) |
| PATCH | `/api/admin/complaints/:id` | Update status / correct category |
| GET | `/api/admin/hotspots` | Fetch cluster/hotspot data for map |
| GET | `/api/admin/analytics/trends` | Time-series complaint volume by category |
| GET | `/api/admin/analytics/summary` | Ward-level summary stats |

---

## 12. Success Metrics (for demo/evaluation)

- **Classification accuracy** of the NLP model on a labeled sample of test complaints.
- **Hotspot precision** — do detected hotspots correspond to genuinely repeated/nearby complaints in the demo dataset?
- **Dashboard usability** — can an admin filter to a specific ward+category and see a coherent trend within a few clicks?
- **End-to-end flow** — a complaint submitted via the web portal appears correctly categorized and mapped on the admin dashboard.

---

## 13. Roadmap (mapped from SOP phases)

| Phase | Focus | Key Deliverables |
|---|---|---|
| **Phase 1 — Research & Requirements** | Study existing grievance channels, finalize categories, design DB schema | Requirements doc, schema design |
| **Phase 2 — Core Platform** | Complaint portal, backend, database, basic admin dashboard | Working submission + tracking flow |
| **Phase 3 — Intelligence Layer** | NLP classification, geospatial + text clustering, hotspot detection | Classification pipeline, cluster engine |
| **Phase 4 — Testing & Demo** | Test with representative dataset, evaluate accuracy, polish dashboard | Demo-ready system, evaluation report |

---

## 14. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| No real municipal complaint dataset available | Use a representative/synthetic dataset modeled on known Mumbai civic issues for demo purposes |
| NLP classification accuracy may be low with limited training data | Start with a smaller, well-defined category set; consider pretrained/open-weight models over training from scratch |
| Free-tier hosting limits (cold starts, storage caps) | Keep the demo dataset small; document this as a known limitation, not a production claim |
| Scope creep (this SOP lists many "future scope" items) | Explicitly gate multilingual support, predictive analytics, and official system integration to Future Scope — not v1 |

---

## 15. Out of Scope / Future Scope (from SOP)

- WhatsApp-based complaint channel (originally considered, descoped for this build to keep the project a pure web application)
- Multilingual (Marathi/Hindi) complaint processing
- AI-driven complaint prioritization
- Predictive analytics for infrastructure failures
- Integration with official municipal grievance systems
- Automatic routing of complaints to relevant departments
- SMS and voice-based complaint registration
- Dedicated mobile application

---

## 16. Open Questions

- What exact complaint categories should v1 support — the 5 listed (garbage, water, roads, drainage, streetlights), or is there a target list from the college project brief?
- Will a synthetic dataset be built manually, or scraped/adapted from public grievance portals (e.g. Mumbai's MCGM complaint categories) for realism?
- Should ward boundaries be real (GeoJSON for actual Mumbai wards) or simplified for the demo?
