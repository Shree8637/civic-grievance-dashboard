# Civic Grievance Intelligence Dashboard — Roadmap

**Project**: Civic Grievance Intelligence Dashboard
**Mode**: mvp (Vertical MVP — each phase delivers an end-to-end user capability)
**Granularity**: Standard (5-8 phases)
**Phase Convention**: sequential
**Created**: 2026-09-09

---

## Phases

- [ ] **Phase 1: Core Complaint Submission & Tracking (Web)** — Citizen submits complaints via web form with tracking ID; can check status by ID/phone
- [ ] **Phase 2: WhatsApp Channel** — Citizen submits complaints via WhatsApp bot with location; receives tracking ID reply
- [ ] **Phase 3: NLP Classification Engine** — Complaints auto-categorized into 5 categories with confidence scores; low-confidence flagged; admin can override
- [ ] **Phase 4: Clustering & Hotspots** — Geospatial (DBSCAN) and text-similarity clustering identify ward/category hotspots and near-duplicates
- [ ] **Phase 5: Admin Dashboard** — Ward heatmap, category charts, volume trends, resolution stats; filters; status updates
- [ ] **Phase 6: Polish, Demo Data & Deploy** — End-to-end integration, synthetic demo dataset, free-tier deployment, documentation

---

## Phase Details

### Phase 1: Core Complaint Submission & Tracking (Web)
**Goal**: Citizens can submit complaints via web form with location/photo, receive a tracking ID, and check status by ID or phone number — end-to-end web flow works.
**Mode**: mvp
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. Citizen opens web form, enters free-text description, picks location on map (or uses geolocation), optionally uploads photo, and submits successfully
  2. System generates a unique tracking ID immediately on submission and displays it to the citizen
  3. Citizen can enter a tracking ID on a tracking page and see the complaint's current status
  4. Citizen can enter their phone number on tracking page and see all complaints linked to that number
  5. Complaint data (text, location, photo reference, tracking ID, timestamp, status=submitted) persists in PostgreSQL
**Plans**: TBD
**UI hint**: yes

### Phase 2: WhatsApp Channel
**Goal**: Citizens can submit complaints via WhatsApp (free-text + location pin), receive a tracking ID reply, and track status — end-to-end WhatsApp flow works.
**Mode**: mvp
**Depends on**: Phase 1 (complaint creation logic, tracking ID generation, database schema)
**Requirements**: WA-01, WA-02, WA-03, AUTH-02
**Success Criteria** (what must be TRUE):
  1. WhatsApp webhook receives incoming messages and routes to complaint creation logic
  2. Bot prompts for location if not provided in first message (or accepts WhatsApp location pin)
  3. Complaint is created in database with same schema as web submissions (tracking ID, status=submitted)
  4. Bot replies with the generated tracking ID and confirmation message
  5. Citizen can use tracking ID from WhatsApp on web tracking page (Phase 1) and see status
**Plans**: TBD
**UI hint**: no

### Phase 3: NLP Classification Engine
**Goal**: Every complaint (web or WhatsApp) is automatically classified into one of 5 categories with a confidence score; low-confidence items are flagged; admins can override.
**Mode**: mvp
**Depends on**: Phase 1 (complaint data in DB), Phase 2 (WhatsApp complaints in DB)
**Requirements**: CLASS-01, CLASS-02, CLASS-03, CLASS-04
**Success Criteria** (what must be TRUE):
  1. NLP service (Python/scikit-learn) receives complaint text and returns category (garbage, water supply, drainage, roads, streetlights) + confidence score (0–1)
  2. Classification runs automatically on complaint creation (both web and WhatsApp channels)
  3. Category and confidence score are stored on the complaint record in PostgreSQL
  4. Complaints with confidence below threshold (e.g., <0.6) are automatically flagged for manual review
  5. Admin can view flagged complaints and manually override the category, which updates the record
**Plans**: TBD
**UI hint**: no

### Phase 4: Clustering & Hotspots
**Goal**: Complaints are analyzed for geospatial hotspots (ward/category density via DBSCAN) and near-duplicate groups (text similarity); results feed the dashboard map.
**Mode**: mvp
**Depends on**: Phase 3 (classified complaints with coordinates in DB)
**Requirements**: CLUST-01, CLUST-02, CLUST-03
**Success Criteria** (what must be TRUE):
  1. DBSCAN clustering runs on complaint coordinates per ward+category and produces hotspot clusters (centroid, radius, complaint count, density)
  2. Text-similarity clustering (TF-IDF + cosine similarity) groups near-duplicate complaints across wards
  3. Hotspot data (geospatial clusters) and duplicate groups are stored/updated in database
  4. Hotspot markers on a map are sized and colored by complaint density (visual verification via Phase 5 dashboard)
  5. Clustering re-runs incrementally as new complaints arrive (or on schedule) without full recompute
**Plans**: TBD
**UI hint**: no

### Phase 5: Admin Dashboard
**Goal**: Municipal admins see ward-level heatmap with hotspot markers, category distribution, volume trends, resolution stats; can filter and update complaint statuses.
**Mode**: mvp
**Depends on**: Phase 4 (hotspot/cluster data), Phase 3 (classified complaints), Phase 1/2 (complaint data)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06
**Success Criteria** (what must be TRUE):
  1. Admin loads dashboard and sees a Leaflet+OpenStreetMap heatmap of Mumbai wards with hotspot markers sized/colored by complaint density
  2. Admin sees category distribution chart (pie/bar) showing complaint counts per category
  3. Admin sees complaint volume trend line chart over time, filterable by ward and category
  4. Admin sees resolution statistics: open vs. resolved counts, average resolution time
  5. Admin can filter the complaint list by ward, category, date range, and status
  6. Admin can click a complaint and update its status (submitted → in progress → resolved), which persists
**Plans**: TBD
**UI hint**: yes

### Phase 6: Polish, Demo Data & Deploy
**Goal**: Full end-to-end system works with synthetic demo data; deployed to free-tier hosting; documentation complete for academic submission.
**Mode**: mvp
**Depends on**: Phase 5 (all features integrated)
**Requirements**: (integration/validation of all prior requirements)
**Success Criteria** (what must be TRUE):
  1. Synthetic demo dataset (1,000+ complaints across wards/categories) loads and renders on dashboard without errors
  2. End-to-end flow verified: web submit → classify → cluster → dashboard → track (all channels)
  3. Application deployed to free-tier hosting (Vercel/Render + Supabase/Neon PostgreSQL) and accessible via public URL
  4. Cold-start behavior documented; dashboard loads in <3s for demo-scale data
  5. README + architecture diagram + API docs + deployment guide complete for academic submission
**Plans**: TBD
**UI hint**: yes

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core Complaint Submission & Tracking (Web) | 0/3 | Not started | - |
| 2. WhatsApp Channel | 0/3 | Not started | - |
| 3. NLP Classification Engine | 0/3 | Not started | - |
| 4. Clustering & Hotspots | 0/3 | Not started | - |
| 5. Admin Dashboard | 0/4 | Not started | - |
| 6. Polish, Demo Data & Deploy | 0/3 | Not started | - |

---

## Coverage Summary

| Phase | Requirements | Count |
|-------|--------------|-------|
| 1 | AUTH-01, AUTH-03, AUTH-04 | 3 |
| 2 | WA-01, WA-02, WA-03, AUTH-02 | 4 |
| 3 | CLASS-01, CLASS-02, CLASS-03, CLASS-04 | 4 |
| 4 | CLUST-01, CLUST-02, CLUST-03 | 3 |
| 5 | DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06 | 6 |
| 6 | (integration of all) | 0 |

**Total v1 requirements mapped**: 19/19 ✓
**Unmapped**: 0 ✓