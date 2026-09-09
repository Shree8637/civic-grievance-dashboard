# STATE — Civic Grievance Intelligence Dashboard

> **Last updated:** 2026-09-09

---

## Current Phase

**Phase 5 — Polish, Testing, Demo Prep** ✅ Complete
**Status:** All 5 Phases of the Civic Grievance Intelligence Dashboard have been successfully designed, built, seeded, integrated, tested end-to-end, and verified.

---

## Key Decisions Made

| # | Decision | Choice |
|---|----------|--------|
| 1 | Category list | Garbage, Water Supply, Drainage, Roads, Streetlights, **Other** (catch-all) |
| 2 | Ward set | 8 real Mumbai wards: A, C, F/N, G/S, H/W, K/E, L, P/S |
| 3 | Ward boundaries | Simplified approximate zones (circles around center points), not real GeoJSON |
| 4 | NLP dataset | Manual synthesis (~few hundred examples per category) |
| 5 | Multilingual UI | Skip — English only for v1 |
| 6 | Admin roles | Single admin role, no ward-scoping |
| 7 | CSS approach | Plain CSS (no Tailwind), following design system palette/typography/spacing |
| 8 | Charts library | Recharts (React-native) |
| 9 | NLP service | FastAPI microservice (live classification on submit) |
| 10 | Auth | Simple JWT with seeded admin credentials — no OAuth, no citizen login |
| 11 | Build tool | Vite (not CRA — CRA is deprecated, Vite is the modern React standard) |

---

## Phase Progress

### Phase 0 — Setup ✅
- [x] Repo folder structure (`/frontend`, `/backend`, `/nlp-service`)
- [x] Initialize React app (Vite + react-router-dom, axios, recharts, leaflet, react-leaflet, lucide-react)
- [x] Initialize Express backend (express, pg, cors, dotenv, multer, express-validator, bcryptjs, jsonwebtoken)
- [x] Initialize Python FastAPI service skeleton (main.py + requirements.txt)
- [x] DB schema SQL (`complaints`, `wards`, `clusters`, `admin_users`) with ENUMs, FKs, indexes
- [x] Ward seed data (8 Mumbai wards with center coordinates + radius)
- [x] Admin seed script (bcrypt-hashed password, safe to re-run)
- [x] `.env` files for all 3 services
- [x] `.gitignore` (project-wide)
- [x] Frontend design system CSS (full color palette, typography, spacing, components from design doc)
- [x] Frontend routing (citizen: Home, Submit, Track; admin: Login, Overview, Map, Complaints, Analytics)
- [x] Frontend layouts (CitizenLayout + AdminLayout with sidebar)
- [x] Admin login page (fully functional JWT auth flow)
- [x] All page stubs created with placeholder content
- [x] Axios API utility with JWT interceptor
- [x] Shared constants (categories, statuses)
- [x] Verify: React boots on :5173 ✓
- [x] Verify: Express responds on :5000 (/api/health → ok) ✓
- [x] Verify: Postgres connects ✓ (Supabase connection pooler verified)

### Phase 1 — Core Complaint Flow ✅
- [x] `POST /api/complaints` — accepts description, lat/lng, photo upload (multer), phone, auto-assigns nearest ward
- [x] Citizen complaint form (`SubmitComplaint.jsx`) with Leaflet pin locator, GPS auto-detect, photo upload preview, suggestion chips
- [x] Confirmation screen with formatted Reference ID (`#GD-10001`), one-click copy, and track link
- [x] `GET /api/complaints/:id` & `GET /api/complaints/track` — lookup by formatted ID (e.g. `GD-10001`) or citizen phone
- [x] Citizen tracking page (`TrackComplaint.jsx`) with 3-stage visual timeline (Submitted → In Progress → Resolved), mini map, and photo lightbox
- [x] `GET /api/admin/complaints` — list with pagination, filtering by ward, category, status, and text search
- [x] `PATCH /api/admin/complaints/:id` — update status and manual category override
- [x] Admin complaint management table (`AdminComplaints.jsx`) with inline status updater, detail inspection drawer, photo thumbnails
- [x] Mobile-responsive styles for citizen portal and admin dashboard
- [x] Test dataset seeded: 13 varied complaints submitted covering all wards and categories

### Phase 2 — NLP Classification ✅
- [x] Labeled training dataset synthesized (`data/training_data.json` with 300 balanced samples across 6 classes)
- [x] Trained TF-IDF + Logistic Regression pipeline with calibrated probabilities (`train.py`)
- [x] Evaluated on 20% held-out test set: **83.33% Accuracy**, 0.8567 Precision, 0.8338 F1-Score
- [x] Evaluation metrics saved to `evaluation_report.json` for semester report / viva defense
- [x] FastAPI microservice deployed on `:8000` (`main.py`) with `/classify` and `/health` endpoints
- [x] Express backend integrated (`services/nlp.js`): automatic category prediction and confidence scoring on submit
- [x] Batch classifier endpoint added (`POST /api/admin/complaints/classify-all`)
- [x] Admin UI confidence pills and low-confidence (<60%) visual warning banner
- [x] Admin filter toolbar: "Low Confidence" quick toggle to audit borderline complaints
- [x] Admin manual category override (F17 from PRD) enabled in both table and detail modal

### Phase 3 — Clustering & Hotspots ✅
- [x] DBSCAN geospatial clustering engine (`nlp-service/cluster.py`) using Haversine metric (0.8–1.0 km radius)
- [x] Near-duplicate & recurring incident detection via TF-IDF + Cosine Similarity text cohesion
- [x] Microservice endpoint `POST /clusters/compute` exposed on FastAPI (`:8000`)
- [x] Backend clustering database service (`backend/src/services/clustering.js`): manages `clusters` table and updates `complaints.cluster_id`
- [x] Backend endpoints `GET /api/admin/hotspots` (with ward/category filtering) and `POST /api/admin/hotspots/recompute`
- [x] Admin Hotspot Map view (`AdminMap.jsx` & `AdminMap.css`):
  - Dynamic Leaflet layers: Category-colored hotspot density circles, individual complaint pins, and Mumbai ward boundary zones
  - Slide-out Inspector Drawer with cluster metrics, top incident keywords, and linked complaints
  - High text cohesion alert badge for recurring incidents (e.g. repeated reports of the same pipeline leak)
  - Interactive "Recompute Hotspots" button with live database sync
  - Floating category color legend and ward/category filter toolbar
- [x] Clustered demo dataset populated: 5 distinct municipal hotspots across Mumbai (Bandra Roads, Kurla Drainage, Matunga Water, Worli Streetlights)

### Phase 4 — Admin Analytics Dashboard ✅
- [x] Backend analytics services (`services/analytics.js`): `/analytics/summary` (KPIs, category breakdown, ward workload) and `/analytics/trends` (time-series velocity)
- [x] Recharts integration in React:
  - Custom stacked AreaChart for time-series trend volume (14/30/60/90 days selector)
  - Donut PieChart with custom tooltip for category distribution
  - Horizontal BarChart for ward complaint volume & resolution comparison
  - Circular animated SVG ring for overall resolution rate
- [x] Summary KPI metric cards: Total complaints, Resolution Rate %, Average Turnaround (days), Low Confidence count
- [x] Admin Analytics view (`AdminAnalytics.jsx` & `AdminAnalytics.css`) with responsive cards and empty/loading states
- [x] Verified in browser with live database aggregation

### Phase 5 — Polish, Testing, Demo Prep ✅
- [x] Realistic demo dataset seeded (`backend/db/seed-demo.js`): 104 complaints distributed across all 8 Mumbai wards, 6 categories, and 3 statuses over 30 days
- [x] Automated End-to-End Test Suite (`backend/tests/e2e-test.js`): 19/19 checks passed covering health checks, JWT auth, citizen submission, live NLP inference, nearest ward detection, reference tracking, admin status lifecycle, DBSCAN hotspot recomputation, and analytics metrics
- [x] Full browser inspection via browser subagent across all citizen & admin routes (`/`, `/submit`, `/track`, `/admin/login`, `/admin/map`, `/admin/complaints`, `/admin/analytics`)
- [x] Generated high-resolution UI artifacts and recordings in artifact repository
- [x] Comprehensive Demo Guide & Evaluation Report (`docs/demo-guide-and-evaluation.md`) with classification metrics (83.3% accuracy, 0.8338 F1), DBSCAN specs, and step-by-step viva script

---

## Open Questions / Blockers

None. All 5 phases are complete, functional, and verified. Ready for presentation, evaluation, or production deployment.

---

## Deviations from Plan

| Item | Plan said | What we did | Why |
|------|-----------|-------------|-----|
| Build tool | Not specified (implied CRA) | Vite | CRA is deprecated; Vite is the modern React standard, faster dev server |
| Admin login | Listed for Phase 1 | Built in Phase 0 | Needed to verify the auth flow and admin layout shell work end-to-end |

---

## File Structure

```
idea_lab_05/
├── .gitignore
├── STATE.md
├── docs/                          # Project documentation
│   ├── civic-grievance-dashboard-prd.md
│   ├── civic-grievance-dashboard-tech-stack.md
│   ├── civic-grievance-dashboard-implementation-plan.md
│   └── civic-grievance-dashboard-design-layout.md
├── frontend/                      # React (Vite)
│   ├── index.html
│   ├── .env
│   ├── package.json
│   └── src/
│       ├── main.jsx               # Entry with BrowserRouter
│       ├── App.jsx                 # Routes
│       ├── index.css               # Design system
│       ├── utils/
│       │   ├── api.js              # Axios instance
│       │   └── constants.js        # Categories, statuses
│       ├── layouts/
│       │   ├── CitizenLayout.jsx
│       │   └── AdminLayout.jsx
│       └── pages/
│           ├── citizen/
│           │   ├── Home.jsx
│           │   ├── SubmitComplaint.jsx
│           │   └── TrackComplaint.jsx
│           └── admin/
│               ├── AdminLogin.jsx
│               ├── AdminOverview.jsx
│               ├── AdminMap.jsx
│               ├── AdminComplaints.jsx
│               └── AdminAnalytics.jsx
├── backend/                       # Express API
│   ├── .env
│   ├── package.json
│   ├── db/
│   │   ├── schema.sql
│   │   ├── seed-wards.sql
│   │   └── seed-admin.sql
│   └── src/
│       ├── server.js               # Express entry
│       ├── db.js                    # Postgres pool
│       ├── setup-db.js              # One-command DB setup
│       ├── middleware/auth.js       # JWT middleware
│       └── routes/
│           ├── auth.js              # Login
│           ├── complaints.js        # Citizen endpoints (stub)
│           ├── admin.js             # Admin endpoints (stub)
│           └── wards.js             # Ward list
└── nlp-service/                   # Python FastAPI
    ├── .env
    ├── requirements.txt
    └── main.py                     # Classify endpoint (stub)
```

