# Implementation Plan
## Civic Grievance Intelligence Dashboard

| | |
|---|---|
| **Author** | Shreeraj Jagtap (Roll No. 48, IT — Div A, Batch A2) |
| **Institution** | Shree L. R. Tiwari College of Engineering (SLRTCE) |
| **Related Docs** | Statement of Purpose (SOP), Product Requirements Document (PRD), Tech Stack Document |
| **Scope** | Web application only — no WhatsApp channel |

---

## 1. Approach

Build in phases matching the SOP's roadmap, broken here into concrete, buildable increments. Order is chosen so that **something demoable exists as early as possible** (a working submit → store → view flow by the end of Phase 1), and intelligence (NLP + clustering) is layered on top rather than blocking the base system. With the project scoped as web-only, all complaint intake flows through a single channel, which simplifies both testing and sequencing compared to a multi-channel build.

---

## 2. Phase 0 — Setup (Week 1)

| Task | Details |
|---|---|
| Repo setup | GitHub repo, folder structure: `/frontend`, `/backend`, `/nlp-service` |
| Environment | Node.js + npm, Python venv, PostgreSQL (local or Supabase) |
| DB schema draft | Create tables: `complaints`, `wards`, `clusters`, `admin_users` per PRD data model |
| Ward reference data | Get a list/GeoJSON of Mumbai wards (or a simplified subset) to seed the `wards` table |
| Tooling | ESLint/Prettier config, Postman collection skeleton, `.env` files (gitignored) |

**Deliverable:** Empty-but-running skeleton — React app boots, Express server responds, Postgres connected.

---

## 3. Phase 1 — Core Complaint Flow (Weeks 2–3)

Goal: a citizen can submit a complaint through the web portal and see it stored; an admin can see a raw list.

| Task | Owner Layer |
|---|---|
| `POST /api/complaints` — accept description, location (lat/lng or address), optional photo | Backend |
| Citizen complaint form (description, location picker via Leaflet click or geolocation, submit) | Frontend |
| `GET /api/complaints/:id` — status lookup | Backend |
| Citizen tracking page (enter complaint ID → see status) | Frontend |
| `GET /api/admin/complaints` — list all complaints, basic pagination | Backend |
| Admin raw complaint table view (no analytics yet — just a working list) | Frontend |
| Photo upload handling (multer) if photos are in scope | Backend |
| Mobile-responsive pass on the citizen form | Frontend |

**Deliverable:** End-to-end submit → store → view flow works for the web portal. This is your first demoable milestone.

**Test:** Manually submit 10–15 varied complaints covering all 5 categories; confirm they appear correctly in the admin list.

---

## 4. Phase 2 — NLP Classification (Weeks 4–5)

Goal: every complaint gets an automatic category.

| Task | Details |
|---|---|
| Build/label a training dataset | Collect or synthesize a few hundred example complaint texts across the 5 categories (garbage, water, drainage, roads, streetlights) |
| Train baseline classifier | TF-IDF + Logistic Regression/SVM (scikit-learn) |
| Wrap as a callable service | Small FastAPI/Flask endpoint, or a batch script triggered on new-complaint insert |
| Integrate with backend | Express calls the Python service on complaint creation, writes `category` + `confidence_score` back to Postgres |
| Manual override UI | Admin can correct a wrong category (F17 from PRD) |
| Low-confidence flagging | Complaints below a confidence threshold are visually flagged for manual review |

**Deliverable:** New complaints arrive pre-categorized; admin list can filter by category.

**Test:** Hold out ~20% of the labeled dataset, report classification accuracy (this becomes a number for your evaluation section/viva).

---

## 5. Phase 3 — Clustering & Hotspot Detection (Weeks 6–7)

| Task | Details |
|---|---|
| Geospatial clustering job | DBSCAN over `(lat, lng)` per category/ward — run as a scheduled job or on-demand endpoint |
| Cluster storage | Populate `clusters` table (centroid, complaint_count, category, ward) |
| Text-similarity check (optional, for near-duplicate detection) | TF-IDF + cosine similarity within a geographic cluster to confirm complaints are about the *same* issue, not just nearby |
| `GET /api/admin/hotspots` | Backend endpoint feeding the map |
| Hotspot map layer | Leaflet + `Leaflet.heat` or sized markers, colored/sized by complaint density |

**Deliverable:** Admin dashboard map shows real hotspots derived from the seeded/demo dataset, not just individual pins.

---

## 6. Phase 4 — Admin Analytics Dashboard (Weeks 7–8)

| Task | Details |
|---|---|
| Category distribution chart | Recharts/Chart.js pie or bar |
| Trend-over-time chart | Line chart, complaint volume by category over date range |
| Resolution stats | Open vs. resolved counts, average resolution time |
| Filters | Ward, category, date range, status — wired to `GET /api/admin/complaints` and analytics endpoints |
| Status update UI | Admin can move a complaint through submitted → in progress → resolved |

**Deliverable:** Full dashboard matching the PRD's F11–F16 — this is the "impressive" screen for your demo/viva.

---

## 7. Phase 5 — Polish, Testing, Demo Prep (Weeks 9–10)

| Task | Details |
|---|---|
| Seed a realistic demo dataset | Enough volume/spread across wards and categories to make hotspots and trends visually meaningful |
| End-to-end test pass | Submit via the web portal, confirm classification, clustering, dashboard all reflect it correctly |
| UI polish | Consistent styling, loading states, empty states, mobile responsiveness on the citizen form |
| Deploy | Frontend → Vercel/Netlify, Backend → Render/Railway, DB → Supabase/Render Postgres |
| Write up evaluation numbers | Classification accuracy, hotspot examples, screenshots for the report |
| Prepare demo script | Fixed sequence: submit complaint → show it categorized → show it on hotspot map → show trend chart update |

**Deliverable:** Deployed, demo-ready system + supporting numbers for the project report.

---

## 8. Suggested Timeline Summary

| Phase | Weeks | Focus |
|---|---|---|
| 0 | 1 | Setup |
| 1 | 2–3 | Core complaint flow (web) |
| 2 | 4–5 | NLP classification |
| 3 | 6–7 | Clustering & hotspots |
| 4 | 7–8 | Admin analytics dashboard |
| 5 | 9–10 | Polish, testing, demo prep |

*(Adjust to your actual semester calendar/evaluation dates — this assumes a ~10-week build window, one week shorter than a multi-channel build since there's no separate messaging-integration phase.)*

---

## 9. Dependencies & Sequencing Notes

- **Phase 2 (NLP) depends on Phase 1** being stable — you need real complaint records to classify.
- **Phase 3 (clustering) depends on Phase 2** if you want category-aware clustering (cluster *within* a category), though basic geospatial clustering could technically start earlier on raw complaints.
- With a single web channel, there's no parallel-track integration risk (previously a concern with a separate messaging setup) — every complaint follows the same path through the pipeline, which simplifies both development and testing.
- **Demo dataset seeding** should happen incrementally, not all at once at the end — testing clustering/hotspots on a handful of dummy points is not convincing; you'll want volume before Phase 3 wraps up.

---

## 10. Immediate Next Steps

1. Finalize the exact category list and ward set (open question carried over from the PRD).
2. Set up the repo + DB schema (Phase 0).
3. Decide dataset strategy for NLP training — synthesize manually, or adapt from a public grievance dataset — before Phase 2 starts, since this is the item most likely to cause delay if left late.
