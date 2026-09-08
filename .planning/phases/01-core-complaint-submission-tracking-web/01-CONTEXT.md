# Phase 1 Context: Core Complaint Submission & Tracking (Web)

**Project:** Civic Grievance Intelligence Dashboard
**Phase:** 1
**Date:** 2026-09-09

---

## Domain

Citizen-facing web portal for submitting civic complaints and tracking their status — end-to-end flow from form submission → tracking ID → status lookup.

**Requirements in scope:**
- AUTH-01: Web form with free-text description, location (map pin/geolocation), optional photo
- AUTH-03: Auto-generated tracking ID on submission
- AUTH-04: Track complaint status by complaint ID or phone number

---

## Canonical Refs

- `.planning/PROJECT.md` — Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` — v1 requirements with phase mappings
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, dependencies
- `civic-grievance-dashboard-design-layout.md` — Screen layouts, component inventory, design system
- `civic-grievance-dashboard-prd.md` — Functional requirements F1-F4, data model
- `civic-grievance-dashboard-tech-stack.md` — React/Node/PostgreSQL stack, libraries
- `civic-grievance-dashboard-implementation-plan.md` — Phase 1 tasks and deliverables

---

## Decisions

### Tracking ID Format
- **Decision:** GD-XXXXX format (e.g., GD-10432)
- **Rationale:** Matches design mockup, human-readable, sequential for demo visibility
- **Implementation:** Sequential counter or timestamp-based with GD- prefix

### Location Selection UX
- **Decision:** Both "Use my location" and "Pin on map" equally prominent as side-by-side buttons
- **Rationale:** Gives users choice; mobile users may prefer geolocation, desktop users may prefer map pin
- **Implementation:** Two buttons triggering browser Geolocation API vs Leaflet map click handler

### Photo Storage
- **Decision:** Cloudinary/Supabase Storage (free tier)
- **Rationale:** Zero-cost constraint; persistent unlike ephemeral filesystem; CDN for fast loads
- **Implementation:** Direct upload from frontend to storage provider; store URL in `photo_url` column

### Form Validation
- **Decision:** Standard validation with char limits & format checks
- **Rules:**
  - Description: required, 10–2000 characters
  - Location: required (either geolocation success or map pin placed)
  - Phone: required, Indian format regex (+91 XXXXXXXXXX)
  - Photo: optional, max 5MB, image/* MIME types
- **Rationale:** Balances user-friendliness with data quality; catches common errors early

### Tracking Lookup Behavior
- **Decision:** Fuzzy + exact — tracking ID exact match; phone supports partial (last 4–6 digits)
- **Rationale:** Tracking IDs are precise; phone numbers users may misremember or type partially
- **Implementation:** `WHERE tracking_id = $1` OR `WHERE phone ILIKE '%' || $2 || '%'`

### Complaint Statuses
- **Decision:** Three statuses from design: Submitted, In Progress, Resolved
- **Rationale:** Schema supports full lifecycle from Phase 1; admin dashboard (Phase 5) updates status
- **Values:** `submitted` (default), `in_progress`, `resolved`

### API Design
- **Decision:** Standard REST conventions
- **Endpoints:**
  - `POST /api/complaints` — create complaint (web)
  - `GET /api/complaints/:id` — get by internal ID (admin)
  - `GET /api/complaints?phone=...` — list by phone (tracking)
  - `GET /api/track/:trackingId` — public tracking by tracking ID
- **Rationale:** Predictable, well-understood, separates public tracking from admin endpoints

### Error Handling
- **Decision:** User-friendly messages with HTTP 200 + JSON `{ success: false, message: '...' }`
- **Rationale:** Simpler frontend error handling; avoids CORS preflight issues on free-tier hosting
- **Format:** `{ success: boolean, message?: string, data?: any, errors?: string[] }`

### Ward Assignment
- **Decision:** Auto-assign from coordinates via reverse geocoding
- **Method:** Nominatim (free) or ward boundary GeoJSON point-in-polygon
- **Rationale:** Zero user effort; accurate for Mumbai wards; needed for Phase 4 clustering anyway

### Database Schema
- **Decision:** Per PRD data model exactly (all columns from Phase 1)
- **Table:** `complaints`
- **Columns:**
  - `id` (PK, UUID)
  - `tracking_id` (unique, GD-XXXXX)
  - `description` (TEXT)
  - `category` (VARCHAR, nullable in Phase 1)
  - `subcategory` (VARCHAR, nullable)
  - `confidence_score` (FLOAT, nullable)
  - `ward_id` (FK to wards, nullable initially)
  - `latitude` (DECIMAL)
  - `longitude` (DECIMAL)
  - `status` (VARCHAR, default 'submitted')
  - `source` (VARCHAR, 'web' or 'whatsapp')
  - `citizen_phone` (VARCHAR, E.164 format)
  - `photo_url` (TEXT, nullable)
  - `cluster_id` (FK, nullable)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)
- **Indexes:** `tracking_id` (unique), `citizen_phone`, `ward_id`, `status`, `created_at`

### Phone Number Format
- **Decision:** E.164 format (+91XXXXXXXXXX) stored; input accepts various formats
- **Normalization:** Strip spaces, dashes, parentheses; prepend +91 if 10 digits; validate 10 digits after country code
- **Rationale:** Consistent storage, reliable lookup, international standard

---

## Code Context

### Reusable Assets (from design document)
- **Design system:** Color palette, typography (Inter), 8px spacing, Lucide-style icons
- **Component inventory:** Primary/secondary buttons, status tags, map component, toast confirmations
- **Responsive breakpoints:** Mobile (<640px) primary target for citizen portal
- **Accessibility:** Status with label+icon, labeled inputs, WCAG AA contrast, non-map fallback

### Integration Points
- **Frontend → Backend:** REST API via Axios/fetch
- **Frontend → Map:** Leaflet.js (react-leaflet) for mini map on submit form
- **Backend → DB:** pg (node-postgres) with connection pooling
- **Backend → Geocoding:** Nominatim API (rate-limited, batch geocode demo data)
- **Frontend → Storage:** Direct upload to Cloudinary/Supabase Storage

### New Files to Create
- `/frontend` — React app (citizen portal)
- `/backend` — Express API
- `/backend/src/routes/complaints.js` — complaint CRUD
- `/backend/src/routes/tracking.js` — public tracking endpoint
- `/backend/src/db/schema.sql` — complaints table + indexes
- `/frontend/src/pages/SubmitComplaint.jsx` — form with map + photo
- `/frontend/src/pages/TrackComplaint.jsx` — lookup by ID/phone
- `/frontend/src/components/MapPicker.jsx` — Leaflet map pin component
- `/frontend/src/components/TrackingResult.jsx` — status display

---

## Deferred Ideas

- Marathi/Hindi labels on citizen portal → Future scope (multilingual NLP)
- Category field on submit form → Phase 3 (NLP classification)
- Photo upload progress indicator → Phase 6 polish
- Offline support / PWA → Future scope
- Email notifications on status change → Phase 6 (v2 NOTF-01)

---

## Scope Boundaries

**IN SCOPE (Phase 1):**
- Web complaint form with description, location (geolocation + map pin), optional photo, phone
- Tracking ID generation (GD-XXXXX)
- Confirmation screen with tracking ID
- Tracking page: exact ID lookup + fuzzy phone lookup
- Status display: Submitted / In Progress / Resolved
- PostgreSQL persistence with full PRD schema
- Auto ward assignment from coordinates
- REST API + user-friendly error format

**OUT OF SCOPE (explicit):**
- WhatsApp channel → Phase 2
- NLP classification → Phase 3
- Clustering/hotspots → Phase 4
- Admin dashboard → Phase 5
- Category field on citizen form → Phase 3
- Multilingual support → Future scope
- Automated status progression → Phase 5
- SMS/email notifications → Phase 6

---