# Tech Stack Document
## Civic Grievance Intelligence Dashboard

| | |
|---|---|
| **Author** | Shreeraj Jagtap (Roll No. 48, IT — Div A, Batch A2) |
| **Institution** | Shree L. R. Tiwari College of Engineering (SLRTCE) |
| **Related Docs** | Statement of Purpose (SOP), Product Requirements Document (PRD) |
| **Constraint** | All tools/services must be free — no paid API keys or licenses |
| **Scope** | Web application only — no WhatsApp/SMS channel |

---

## 1. Guiding Principle

Every choice below is filtered through one hard constraint: **zero cost**. Where a category has an "industry standard" paid option (e.g. Google Maps), the stack uses the closest free/open-source equivalent instead (OpenStreetMap).

---

## 2. Stack Overview

| Layer | Technology | Role |
|---|---|---|
| Frontend | React.js | Citizen portal + admin dashboard UI |
| Frontend Mapping | Leaflet.js + OpenStreetMap | Ward heatmaps, hotspot visualization |
| Backend / API | Node.js + Express.js | REST API, request handling, auth |
| Database | PostgreSQL | Complaint records, wards, clusters, admin users |
| NLP / ML | Python + scikit-learn (or Hugging Face open-weight models) | Complaint classification, clustering |
| Geocoding | Nominatim | Convert addresses ↔ coordinates |
| Version Control | Git + GitHub | Source control, collaboration |
| Hosting (proposed) | Render / Railway (backend), Vercel / Netlify (frontend), Supabase / Render Postgres (DB) | Free-tier deployment |

---

## 3. Frontend

### 3.1 React.js
- **Use:** Citizen complaint form + tracking page; admin analytics dashboard.
- **Why:** Component-based structure fits two distinct UIs (citizen-facing, admin-facing) sharing a design system; large ecosystem for charts/maps.
- **Supporting libraries:**
  - **React Router** — navigation between citizen portal and admin dashboard.
  - **Axios / fetch** — API calls to the Express backend.
  - **Recharts or Chart.js** — category distribution, trend-over-time charts.
  - **Leaflet.js (react-leaflet)** — embedding the ward heatmap/hotspot map.
  - **Tailwind CSS or plain CSS** — styling (free either way; Tailwind speeds up a data-dashboard-heavy UI).

### 3.2 Leaflet.js + OpenStreetMap
- **Use:** All map rendering — ward boundaries, hotspot markers, complaint density heatmaps.
- **Why over Google Maps:** No API key, no billing account, no usage cap for reasonable demo traffic. OpenStreetMap tile data is free and sufficient for Mumbai ward-level detail.
- **Plugin note:** `Leaflet.heat` for heatmap layers; `react-leaflet` for React integration.

---

## 4. Backend

### 4.1 Node.js + Express.js
- **Use:** REST API layer — complaint ingestion, status updates, admin queries.
- **Why:** Same language (JavaScript) across frontend and backend simplifies development for a solo/small-team academic project; Express is lightweight and well-documented for building REST APIs quickly.
- **Supporting libraries:**
  - **pg / node-postgres** — PostgreSQL client.
  - **multer** — handling complaint photo uploads (if included).
  - **express-validator** — input sanitization on complaint text/fields.
  - **cors** — enabling frontend-backend communication across origins during development.
  - **dotenv** — environment variable management (API keys, DB credentials) kept out of source control.

### 4.2 Python (for NLP/Analytics service)
- **Use:** A separate lightweight service (or scheduled job) that classifies complaint text and runs clustering, called by/integrated with the Express backend.
- **Why a second language here:** Python's NLP/ML ecosystem (scikit-learn, Hugging Face `transformers`) is significantly more mature than Node's for this kind of text classification and clustering work — worth the small integration overhead.
- **Integration options (pick one):**
  - Simple internal REST call from Express to a small Flask/FastAPI Python microservice.
  - Or a batch script that processes new complaints on a schedule and writes results back to PostgreSQL.

---

## 5. NLP & Analytics

| Task | Tool | Notes |
|---|---|---|
| Text classification (category) | **scikit-learn** (TF-IDF + Logistic Regression / SVM) | Fast, interpretable, works well with a modest labeled dataset — good starting point |
| Text classification (upgrade path) | **Hugging Face open-weight models** (e.g. DistilBERT, fine-tuned or zero-shot) | Higher accuracy if a labeled dataset is available or zero-shot classification is acceptable |
| Geospatial clustering (hotspots) | **DBSCAN** (scikit-learn) | Density-based clustering suits irregularly shaped hotspots better than k-means for lat/lng data |
| Text-similarity clustering (duplicates) | **TF-IDF + cosine similarity** or **KMeans** | Groups near-duplicate complaints describing the same issue |
| Data handling | **pandas, numpy** | Standard data manipulation for the analytics pipeline |

**Recommendation:** Start with TF-IDF + scikit-learn for both classification and clustering — it's fast to implement, needs no GPU, and is easy to explain in a viva/demo. Treat a Hugging Face model as a stretch upgrade if time and a labeled dataset allow.

---

## 6. Database

### 6.1 PostgreSQL
- **Use:** Primary data store — complaints, wards, clusters/hotspots, admin users.
- **Why over MongoDB (despite the "MERN" framing elsewhere):** Complaint data is fundamentally relational (complaints belong to wards, clusters aggregate complaints, admins are scoped to wards) and benefits from proper joins, constraints, and query performance for the trend/aggregation queries the dashboard needs. PostgreSQL also has strong native support for geospatial queries via the **PostGIS** extension if ward boundaries are modeled as real geometry later.
- **Free hosting options:** Supabase (free tier includes Postgres), Render (free Postgres instance), or a local instance for development/demo.

---

## 7. Mapping & Geocoding

| Tool | Use |
|---|---|
| **OpenStreetMap** | Base map tiles (free, no key required) |
| **Leaflet.js** | Rendering the map, markers, heatmap layer in the frontend |
| **Nominatim** | Geocoding (address → lat/lng) and reverse geocoding for complaints submitted without a precise map pin |

**Note:** Nominatim's public instance has a strict rate limit (1 request/second, no bulk geocoding) — fine for a live demo, but batch-geocode any seed/demo dataset ahead of time rather than at runtime.

---

## 8. Dev Tools & Workflow

| Tool | Purpose |
|---|---|
| **Git + GitHub** | Version control, project history for submission |
| **Postman / Thunder Client** | API testing during backend development |
| **VS Code** | Primary editor |
| **ESLint + Prettier** | Code consistency across frontend/backend |
| **dotenv** | Local environment configuration |

---

## 9. Hosting & Deployment (proposed, free-tier)

| Component | Suggested Service | Notes |
|---|---|---|
| Frontend | **Vercel** or **Netlify** | Free static/React hosting, auto-deploy from GitHub |
| Backend (Express) | **Render** or **Railway** | Free web service tier (note: cold starts on free tiers) |
| Database | **Supabase** (Postgres) or **Render Postgres** | Free tier storage caps — fine for a demo dataset |
| Python NLP service | Same host as backend (Render) as a second service, or run as a scheduled/offline job | Avoids needing a third hosting account |

**Constraint to flag:** free-tier backends typically "sleep" after inactivity, causing a slow first request. Worth mentioning in the demo/viva so it doesn't look like a bug.

---

## 10. Stack Decisions at a Glance — Why Not the Alternatives

| Decision | Alternative Considered | Why Rejected |
|---|---|---|
| PostgreSQL | MongoDB | Complaint/ward/cluster relationships are relational; aggregation queries for the dashboard are easier in SQL |
| Leaflet + OSM | Google Maps API | Requires billing account even for free tier usage; OSM has no such requirement |
| scikit-learn (primary) | Training a deep learning model from scratch | Needs far more labeled data and compute than available for this project scope |
| Node.js backend | Django (Python end-to-end) | Keeps JS consistent across frontend/backend; Python is scoped specifically to the NLP service where it earns its place |
| Web-only channel | WhatsApp/SMS integration | Keeps the build focused on a single, fully-owned surface (no third-party messaging setup, verification, or rate limits to manage) |

---

## 11. Summary

The stack is deliberately split by strength: **JavaScript (React + Node/Express)** for the application layer where speed of development and one shared language matter, and **Python (scikit-learn)** carved out specifically for the NLP/clustering intelligence layer where it has the clearest ecosystem advantage. Every external service (OpenStreetMap, Nominatim, Render/Vercel/Supabase free tiers) is chosen to satisfy the zero-cost constraint without materially compromising what the PRD requires. Keeping the project web-only also removes an entire category of external dependency (messaging provider setup/verification) that isn't needed to meet the PRD's goals.
