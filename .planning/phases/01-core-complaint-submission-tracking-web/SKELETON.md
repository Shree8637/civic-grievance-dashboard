# Walking Skeleton — Civic Grievance Intelligence Dashboard

**Phase:** 1
**Generated:** 2026-09-09

## Capability Proven End-to-End

A citizen can open the web portal, submit a complaint with description + location (via map pin or geolocation) + optional photo, receive a GD-XXXXX tracking ID, and look up that complaint by tracking ID or phone number to see its status (Submitted/In Progress/Resolved) — all persisted in PostgreSQL and served by Express API with React frontend.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Framework | React 18 + Vite + TypeScript | Fast HMR, component model fits two-portal architecture, huge ecosystem |
| Build Tool | Vite 5 | 10x faster dev server than CRA, native ESM, zero-config Tailwind |
| Styling | Tailwind CSS 3.4 | Design system from design doc maps 1:1 to Tailwind config; no custom CSS |
| Routing | React Router 6 | `/submit`, `/track`, `/confirm` routes; standard for SPA |
| API Framework | Express 4 + TypeScript | Lightweight, middleware-based, standard for Node APIs |
| Database | PostgreSQL (Supabase/Neon free tier) | Relational + PostGIS ready for Phase 4; zero-cost hosting |
| ORM/Query | pg (node-postgres) + raw SQL | Battle-tested, built-in pooling, parameterized queries prevent SQL injection |
| Validation | Zod 3.23 (shared frontend/backend) | Single source of truth, TypeScript inference, i18n-ready messages |
| Form Management | React Hook Form 7 + @hookform/resolvers/zod | Minimal re-renders, built-in Zod resolver, handles file inputs |
| Map | Leaflet 1.9 + react-leaflet 4.2 | Free, no API key, OSM tiles; official React wrapper |
| Photo Storage | Supabase Storage (free tier) | Direct upload from browser via anon key; simpler than Cloudinary signed URLs |
| Geospatial | @turf/turf 7.4 (booleanPointInPolygon) | Zero-infra ward assignment; runs in Node with cached GeoJSON |
| Geocoding | Nominatim (public) + in-memory cache | Free reverse geocode; 1 req/sec rate limit handled by cache |
| Tracking ID | PostgreSQL SEQUENCE + GD-XXXXX format | Guaranteed unique, sequential, concurrency-safe, survives restarts |
| Migration Tool | node-pg-migrate | Versioned SQL migrations, up/down, CLI + programmatic |
| Testing | Vitest 2.1 (unit/integration) + Playwright 1.48 (E2E) | Shared Vite config, fast, better mobile emulation |
| Deployment Target | Vercel (frontend) + Render (backend) + Supabase/Neon (DB) | Free tiers, automatic deploys, custom domains |

## Stack Touched in Phase 1

- [x] Project scaffold (React + Vite + TS frontend, Express + TS backend, shared types)
- [x] Routing — `/submit`, `/confirm`, `/track` real routes
- [x] Database — complaints table (17 columns), wards table, sequence; real write (submit) and real read (track)
- [x] UI — Form with validation, MapPicker (Leaflet click + geolocation), PhotoUpload (Supabase direct), TrackingForm, TrackingResult, Toast confirmations
- [x] Deployment — Documented local full-stack run command (`docker-compose up` + `npm run dev` in both dirs)

## Out of Scope (Deferred to Later Slices)

- WhatsApp channel (Phase 2)
- NLP classification into 5 categories (Phase 3)
- Geospatial clustering (DBSCAN) and text-similarity clustering (Phase 4)
- Admin dashboard with heatmap, charts, filters, status updates (Phase 5)
- Category field on citizen submit form (Phase 3)
- Marathi/Hindi labels (Future scope)
- Photo upload progress indicator (Phase 6 polish)
- Offline support / PWA (Future scope)
- Email/SMS notifications on status change (Phase 6 / v2)
- Automated status progression (Phase 5)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- Phase 2: WhatsApp Channel — Citizen submits via WhatsApp bot with location; receives tracking ID reply; same complaint schema, same tracking lookup works
- Phase 3: NLP Classification Engine — Python/scikit-learn service classifies complaint text into 5 categories with confidence; low-confidence flagged; admin override
- Phase 4: Clustering & Hotspots — DBSCAN on coordinates per ward+category produces hotspot clusters; TF-IDF cosine similarity groups near-duplicates
- Phase 5: Admin Dashboard — Leaflet heatmap with hotspot markers, category charts, volume trends, resolution stats, filters, manual status updates
- Phase 6: Polish, Demo Data & Deploy — 1000+ synthetic complaints, end-to-end integration verification, free-tier deployment, academic documentation