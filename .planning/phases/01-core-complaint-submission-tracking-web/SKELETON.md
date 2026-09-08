# Walking Skeleton — Civic Grievance Intelligence Dashboard

**Phase:** 1
**Generated:** 2026-09-09

## Capability Proven End-to-End

A citizen opens the web portal, submits a complaint with description and phone number, receives a GD-XXXXX tracking ID instantly, and can look up that tracking ID to see the complaint status — exercising the full React → Express → PostgreSQL stack.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 18 + Vite + TypeScript | Fast HMR, component model fits two-portal architecture, zero-config Tailwind |
| Data layer | PostgreSQL (Supabase/Neon) + pg pool + node-pg-migrate | Relational + PostGIS-ready, free tier, versioned migrations |
| Validation | Zod schemas (shared frontend/backend) | Single source of truth, TypeScript inference, no duplication |
| Map/Location | Leaflet + react-leaflet + browser Geolocation API | Free, no API key, OSM tiles, mature React bindings |
| Photo storage | Supabase Storage (direct browser upload, anon key) | Zero backend bandwidth, CDN delivery, simpler than Cloudinary |
| Ward assignment | @turf/turf booleanPointInPolygon on cached GeoJSON | No PostGIS extension needed, runs in Node, zero infra |
| Tracking ID | PostgreSQL SEQUENCE (START 10000) → GD- + LPAD(5) | Guaranteed unique, sequential, concurrency-safe, survives restarts |
| Error format | HTTP 200 + `{ success, message, errors }` | Consistent frontend handling, no CORS preflight issues |
| Deployment target | Vercel (frontend) + Render/Railway (backend) + Supabase (DB) | Free tiers, Git-based deploys, preview environments |
| Directory layout | Monorepo: `frontend/`, `backend/`, `shared/` | Clear separation, shared types/schemas, independent deploys |

## Stack Touched in Phase 1

- [x] Project scaffold (Vite + Express + TypeScript + Tailwind + ESLint + Vitest + Playwright)
- [x] Routing — `/submit`, `/confirm`, `/track` real routes
- [x] Database — complaints table (17 columns), wards table, sequence; real write (POST) and real read (tracking lookup)
- [x] UI — Interactive form with validation, map picker, photo upload, tracking lookup wired to API
- [x] Deployment — Documented local full-stack run command (`docker-compose up` + `npm run dev`)

## Out of Scope (Deferred to Later Slices)

- WhatsApp channel (Phase 2)
- NLP classification (Phase 3) — `category`, `subcategory`, `confidence_score` remain nullable
- Clustering/hotspots (Phase 4) — `cluster_id` remains nullable
- Admin dashboard (Phase 5) — status updates, charts, heatmap
- Multilingual labels (v2)
- Photo upload progress indicator (Phase 6 polish)
- Email/SMS notifications (Phase 6 / v2)
- Offline/PWA support (future)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: WhatsApp Channel — webhook receives messages, creates complaints with same schema, replies with tracking ID
- Phase 3: NLP Classification Engine — Python service classifies text → 5 categories + confidence; low-confidence flagged; admin override
- Phase 4: Clustering & Hotspots — DBSCAN geospatial + TF-IDF text similarity → hotspot clusters & duplicate groups
- Phase 5: Admin Dashboard — Leaflet heatmap, category charts, volume trends, resolution stats, filters, status updates
- Phase 6: Polish, Demo Data & Deploy — synthetic dataset, free-tier deployment, docs, cold-start optimization