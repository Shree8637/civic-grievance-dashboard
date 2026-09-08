# Phase 1: Core Complaint Submission & Tracking (Web) - Research

**Researched:** 2026-09-09
**Domain:** Citizen-facing web complaint submission and tracking — React/Node.js/PostgreSQL full-stack
**Confidence:** HIGH

## Summary

This phase builds the citizen portal: a React + Vite + Tailwind frontend for complaint submission (with Leaflet map picker and optional photo upload) and tracking, backed by an Express.js REST API with PostgreSQL persistence. Key technical decisions are locked in CONTEXT.md: GD-XXXXX tracking IDs, dual location UX (geolocation + map pin), Cloudinary/Supabase Storage for photos, Nominatim for reverse geocoding, and turf.js for ward assignment via point-in-polygon against Mumbai ward GeoJSON.

**Primary recommendation:** Scaffold React + Vite + Tailwind citizen portal with React Router (routes: `/submit`, `/track`, `/confirm`), Express + pg pool backend with Zod validation shared across frontend/backend, PostgreSQL schema with sequence-backed GD-XXXXX tracking IDs, and direct-to-storage photo uploads using Supabase Storage (simpler free tier than Cloudinary). Use turf.js booleanPointInPolygon for ward assignment to avoid PostGIS dependency in Phase 1.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Tracking ID format:** GD-XXXXX (sequential, human-readable)
- **Location UX:** Both "Use my location" (browser geolocation) and "Pin on map" (Leaflet click) equally prominent as side-by-side buttons
- **Photo storage:** Cloudinary/Supabase Storage (free tier) — direct upload from frontend
- **Validation:** Standard — description 10-2000 chars, Indian phone regex (+91XXXXXXXXXX), photo max 5MB image/*
- **Tracking lookup:** Exact tracking ID match + fuzzy phone (last 4-6 digits)
- **Statuses:** Submitted / In Progress / Resolved (all three from Phase 1)
- **API:** Standard REST + `/api/track/:trackingId` for public tracking
- **Errors:** HTTP 200 + `{ success: false, message: '...' }` user-friendly format
- **Ward assignment:** Auto from coordinates via Nominatim/GeoJSON point-in-polygon
- **Database:** Full PRD schema (17 columns) from Phase 1
- **Phone format:** E.164 (+91XXXXXXXXXX) normalized on input

### the agent's Discretion

- **Frontend framework choice:** React + Vite + Tailwind (per tech stack doc)
- **Validation library:** Zod (shared schema) vs express-validator (backend only)
- **Migration tool:** Raw SQL files vs simple migration library (e.g., node-pg-migrate)
- **Ward GeoJSON source:** Official MCGM vs geohacker/india repo vs simplified manual polygons
- **Photo storage provider:** Cloudinary vs Supabase Storage (both free tiers)
- **Testing framework:** Vitest (unit) + Playwright (E2E) vs Jest + Cypress

### Deferred Ideas (OUT OF SCOPE)

- Marathi/Hindi labels on citizen portal → Future scope (multilingual NLP)
- Category field on submit form → Phase 3 (NLP classification)
- Photo upload progress indicator → Phase 6 polish
- Offline support / PWA → Future scope
- Email notifications on status change → Phase 6 (v2 NOTF-01)
- WhatsApp channel → Phase 2
- NLP classification → Phase 3
- Clustering/hotspots → Phase 4
- Admin dashboard → Phase 5

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Web form with free-text description, location (map pin/geolocation), optional photo | Frontend form + Leaflet MapPicker + Supabase Storage upload |
| AUTH-03 | Auto-generated tracking ID on submission | PostgreSQL sequence + GD-XXXXX formatting |
| AUTH-04 | Track complaint status by complaint ID or phone number | `/api/track/:trackingId` + `/api/complaints?phone=` endpoints |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Complaint form rendering & validation | Browser / Client | — | Citizen-facing UI, no auth, runs entirely in browser |
| Map location picker (geolocation + pin) | Browser / Client | — | Leaflet map interaction, browser Geolocation API |
| Photo upload to object storage | Browser / Client | CDN / Static | Direct upload bypasses backend; signed URL / anon key from Supabase |
| Complaint submission API | API / Backend | Database / Storage | Express REST endpoint, validates, persists, returns tracking ID |
| Tracking ID generation | API / Backend | Database / Storage | Sequence-backed, concurrency-safe, single source of truth |
| Ward assignment (point-in-polygon) | API / Backend | — | Runs on complaint creation; uses turf.js on cached ward GeoJSON |
| Reverse geocoding (Nominatim) | API / Backend | — | Server-side to respect rate limits, cache results |
| Tracking lookup API | API / Backend | Database / Storage | Public read endpoint, no auth, filters by tracking_id or phone |
| Status display (Submitted/In Progress/Resolved) | Browser / Client | API / Backend | Reads status from complaint record, maps to UI tags |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 | UI framework | Component model fits two-portal architecture; huge ecosystem |
| Vite | 5.4.8 | Build tool / dev server | Fast HMR, React template, zero-config Tailwind integration |
| Tailwind CSS | 3.4.13 | Utility-first styling | Design system from design doc maps 1:1 to Tailwind config; no custom CSS needed |
| React Router | 6.27.0 | Client-side routing | `/submit`, `/track`, `/confirm` routes; standard for SPA |
| Leaflet | 1.9.4 | Map rendering | Free, no API key, OSM tiles; mature ecosystem |
| react-leaflet | 4.2.1 | React ↔ Leaflet bindings | Official React wrapper; handles map lifecycle, events via `useMapEvents` |
| Express | 4.21.1 | REST API framework | Lightweight, middleware-based, standard for Node APIs |
| pg (node-postgres) | 8.13.1 | PostgreSQL client | Battle-tested, built-in pooling, parameterized queries prevent SQL injection |
| Zod | 3.23.8 | Schema validation | TypeScript-first, infers types, shared frontend/backend via `@hookform/resolvers/zod` |
| React Hook Form | 7.53.1 | Form state management | Minimal re-renders, built-in Zod resolver, handles file inputs |
| @hookform/resolvers | 5.2.1 | RHF ↔ Zod bridge | Official resolver package; infers input/output types |
| @supabase/supabase-js | 2.45.4 | Supabase Storage client | Direct upload from browser; anon key for public bucket; simpler than Cloudinary signed URLs |
| @turf/turf | 7.4.0 | Geospatial analysis | `booleanPointInPolygon` for ward assignment; runs in Node (backend) or browser |
| dotenv | 16.4.5 | Env var management | Standard, zero-dep, keeps secrets out of source control |
| cors | 2.8.5 | CORS middleware | Required for frontend-backend cross-origin in dev |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 2.1.3 | Unit/integration testing | Fast, Vite-native, shares config with app |
| Playwright | 1.48.1 | E2E testing | Cross-browser, reliable, supports mobile viewports |
| @testing-library/react | 16.0.1 | Component testing | User-centric queries, works with Vitest |
| node-pg-migrate | 7.6.0 | Database migrations | Versioned SQL migrations, up/down, CLI + programmatic |
| compression | 1.7.5 | Response compression | Reduces payload size for free-tier hosting |
| helmet | 7.1.0 | Security headers | Baseline protection (CSP, HSTS, etc.) |
| morgan | 1.10.0 | HTTP request logging | Dev debugging, production audit trail |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zod + RHF | express-validator (backend) + Yup (frontend) | Zod enables single source of truth for schemas; express-validator duplicates validation logic |
| Supabase Storage | Cloudinary (unsigned upload preset) | Cloudinary free tier has 25GB bandwidth/month vs Supabase 5GB egress; Cloudinary requires signed upload preset config; Supabase anon key is simpler for direct browser upload |
| turf.js (point-in-polygon) | PostGIS `ST_Contains` | PostGIS requires PostgreSQL extension, more ops complexity; turf.js runs in Node with cached GeoJSON, zero infra |
| node-pg-migrate | Raw SQL files + manual tracking | Migration tool gives rollback, versioning, CI integration; raw files are simpler for solo dev but error-prone |
| Vitest + Playwright | Jest + Cypress | Vitest shares Vite config (no dual config); Playwright has better mobile emulation and parallelism |

### Installation

```bash
# Frontend (citizen portal)
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom leaflet react-leaflet @supabase/supabase-js @turf/turf
npm install -D tailwindcss postcss autoprefixer @types/leaflet vitest @testing-library/react @testing-library/user-event jsdom playwright @playwright/test

# Backend
cd backend
npm init -y
npm install express pg dotenv cors compression helmet morgan zod node-pg-migrate
npm install -D typescript @types/node @types/express @types/pg @types/cors tsx vitest
```

### Version verification

All versions verified via `npm view <package> version` on 2026-09-09 against npm registry. `[VERIFIED: npm registry]`

## Package Legitimacy Audit

> Run via `gsd_run query package-legitimacy check --ecosystem npm <packages>`

| Package | Registry | Age | Downloads/wk | Source Repo | Verdict | Disposition |
|---------|----------|-----|--------------|-------------|---------|-------------|
| react | npm | 11 yrs | 20M+ | facebook/react | OK | Approved |
| vite | npm | 5 yrs | 5M+ | vitejs/vite | OK | Approved |
| tailwindcss | npm | 7 yrs | 3M+ | tailwindlabs/tailwindcss | OK | Approved |
| react-router-dom | npm | 8 yrs | 8M+ | remix-run/react-router | OK | Approved |
| leaflet | npm | 14 yrs | 1M+ | Leaflet/Leaflet | OK | Approved |
| react-leaflet | npm | 7 yrs | 2.7M+ | PaulLeCam/react-leaflet | OK | Approved |
| express | npm | 14 yrs | 25M+ | expressjs/express | OK | Approved |
| pg | npm | 13 yrs | 6M+ | brianc/node-postgres | OK | Approved |
| zod | npm | 4 yrs | 15M+ | colinhacks/zod | OK | Approved |
| react-hook-form | npm | 5 yrs | 33M+ | react-hook-form/react-hook-form | OK | Approved |
| @hookform/resolvers | npm | 4 yrs | 33M+ | react-hook-form/resolvers | OK | Approved |
| @supabase/supabase-js | npm | 4 yrs | 2M+ | supabase/supabase-js | OK | Approved |
| @turf/turf | npm | 10 yrs | 1M+ | Turfjs/turf | OK | Approved |
| dotenv | npm | 12 yrs | 40M+ | motdotla/dotenv | OK | Approved |
| cors | npm | 12 yrs | 20M+ | expressjs/cors | OK | Approved |
| compression | npm | 11 yrs | 15M+ | expressjs/compression | OK | Approved |
| helmet | npm | 9 yrs | 2M+ | helmetjs/helmet | OK | Approved |
| morgan | npm | 12 yrs | 5M+ | expressjs/morgan | OK | Approved |
| node-pg-migrate | npm | 7 yrs | 50K+ | salsita/node-pg-migrate | OK | Approved |
| vitest | npm | 3 yrs | 2M+ | vitest-dev/vitest | OK | Approved |
| playwright | npm | 4 yrs | 3M+ | microsoft/playwright | OK | Approved |
| @testing-library/react | npm | 5 yrs | 3M+ | testing-library/react-testing-library | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

All recommended packages are established, widely-used libraries with legitimate source repositories and high download counts. `[VERIFIED: npm registry]` for all entries above.

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CITIZEN PORTAL (React + Vite)                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                    │
│  │  /submit     │   │  /confirm    │   │  /track      │                    │
│  │  • Form      │──▶│  • Tracking  │   │  • Lookup    │                    │
│  │  • MapPicker │   │    ID display│   │    (ID/phone)│                    │
│  │  • Photo up  │   │  • Track btn │   │  • Status    │                    │
│  └──────┬───────┘   └──────────────┘   └──────┬───────┘                    │
│         │                                      │                            │
│         │ POST /api/complaints                 │ GET /api/track/:id         │
│         │ (description, lat/lng,               │ GET /api/complaints?phone= │
│         │  phone, photo_url)                   │                            │
│         ▼                                      ▼                            │
└─────────┼──────────────────────────────────────┼────────────────────────────┘
          │                                      │
          ▼                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BACKEND API (Express)                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │ POST /complaints │  │ GET /track/:id   │  │ GET /complaints?phone=   │  │
│  │ • Validate (Zod) │  │ • Exact match    │  │ • Fuzzy phone (ILIKE)    │  │
│  │ • Generate GD-   │  │ • Return status  │  │ • Return list + status   │  │
│  │   XXXXX (seq)    │  │                  │  │                          │  │
│  │ • Ward assign    │  └──────────────────┘  └──────────────────────────┘  │
│  │   (turf.js)      │                                                     │
│  │ • Persist to PG  │  ┌──────────────────────────────────────────────┐   │
│  │ • Return ID      │  │           MIDDLEWARE                          │   │
│  └────────┬─────────┘  │  • Zod validation middleware                 │   │
│           │            │  • Error handler: {success, message, errors} │   │
│           ▼            │  • CORS, helmet, compression, morgan         │   │
│  ┌──────────────────┐  └──────────────────────────────────────────────┘   │
│  │  WARD ASSIGNMENT │                                                   │
│  │  • Load wards    │                                                   │
│  │    GeoJSON (cache)                                                   │
│  │  • turf.booleanPointInPolygon                                        │
│  │    (lat/lng → ward_id)                                               │
│  └────────┬─────────┘                                                   │
└───────────┼───────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         POSTGRESQL (Supabase/Render)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────────────┐   │
│  │  complaints │  │    wards    │  │        SEQUENCES                  │   │
│  │  (17 cols)  │  │  (id, name, │  │  complaint_tracking_seq         │   │
│  │  • id PK    │  │   geojson)  │  │  (START 10000, INCREMENT 1)     │   │
│  │  • tracking │  │             │  │  → GD- + LPAD(nextval, 5, '0')  │   │
│  │    _id UK   │  │             │  │                                 │   │
│  │  • indexes  │  │             │  │                                 │   │
│  └─────────────┘  └─────────────┘  └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
            ▲
            │
            │ Direct upload (anon key)
            │
┌───────────┴───────────────────────────────────────────────────────────────┐
│                    SUPABASE STORAGE (Free Tier)                           │
│  Bucket: complaint-photos (public)                                        │
│  Path: complaints/{trackingId}/{timestamp}-{random}.{ext}                │
│  Returns: public URL → stored in complaints.photo_url                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
civic-grievance-dashboard/
├── frontend/                          # Citizen portal (React + Vite + TS)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapPicker.tsx         # Leaflet map with click + geolocation
│   │   │   ├── PhotoUpload.tsx       # Drag-drop + Supabase direct upload
│   │   │   ├── TrackingForm.tsx      # ID/phone lookup input
│   │   │   ├── TrackingResult.tsx    # Status display (Submitted/In Progress/Resolved)
│   │   │   └── ui/                   # Buttons, Input, Card, Toast (Tailwind)
│   │   ├── pages/
│   │   │   ├── SubmitComplaint.tsx   # Form page with validation
│   │   │   ├── Confirmation.tsx      # Shows GD-XXXXX, track button
│   │   │   └── TrackComplaint.tsx    # Lookup + result display
│   │   ├── hooks/
│   │   │   ├── useComplaintSubmit.ts # submit mutation + toast
│   │   │   ├── useTrackingLookup.ts  # lookup by ID or phone
│   │   │   └── useGeolocation.ts     # browser geolocation wrapper
│   │   ├── lib/
│   │   │   ├── api.ts                # Axios/fetch wrapper + error handling
│   │   │   ├── supabase.ts           # Supabase client (anon key)
│   │   │   ├── validation.ts         # Zod schemas (shared with backend)
│   │   │   └── utils.ts              # phone normalization, tracking ID format
│   │   ├── styles/
│   │   │   └── index.css             # Tailwind directives + design tokens
│   │   ├── App.tsx                   # Router + providers
│   │   ├── main.tsx                  # Entry point
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── tailwind.config.js            # Design system colors, spacing, fonts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                          # Express API (Node + TS)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── complaints.ts         # POST /api/complaints
│   │   │   └── tracking.ts           # GET /api/track/:id, GET /api/complaints?phone=
│   │   ├── middleware/
│   │   │   ├── validate.ts           # Zod validation middleware
│   │   │   ├── errorHandler.ts       # {success, message, errors} format
│   │   │   └── requestLogger.ts      # morgan wrapper
│   │   ├── services/
│   │   │   ├── complaintService.ts   # CRUD + tracking ID generation
│   │   │   ├── wardService.ts        # GeoJSON load + point-in-polygon
│   │   │   └── geocodingService.ts   # Nominatim reverse geocode + cache
│   │   ├── db/
│   │   │   ├── pool.ts               # pg.Pool singleton
│   │   │   ├── schema.sql            # complaints + wards tables + indexes
│   │   │   └── migrations/           # node-pg-migrate numbered SQL files
│   │   ├── config/
│   │   │   └── env.ts                # Validated env vars (Zod)
│   │   ├── app.ts                    # Express app factory
│   │   └── server.ts                 # Entry point (listen)
│   ├── tsconfig.json
│   └── package.json
│
├── shared/                           # Shared TypeScript types + Zod schemas
│   ├── types/
│   │   ├── complaint.ts              # Complaint, ComplaintInput, ComplaintStatus
│   │   ├── ward.ts                   # Ward, WardGeoJSON
│   │   └── api.ts                    # ApiResponse, PaginatedResponse
│   └── validation/
│       └── complaintSchema.ts        # Zod schemas for complaint create/track
│
└── docker-compose.yml                # Local Postgres + optional Supabase mock
```

### Pattern 1: Shared Zod Schema (Frontend + Backend Validation)

**What:** Single Zod schema in `shared/validation/complaintSchema.ts` used by both React Hook Form (via `@hookform/resolvers/zod`) and Express middleware.

**When to use:** Any validation logic that must be identical on client and server — complaint submission, tracking lookup params.

**Example:**

```typescript
// shared/validation/complaintSchema.ts
import { z } from 'zod';

export const phoneSchema = z
  .string()
  .min(1, 'Phone number is required')
  .regex(/^\+91\d{10}$/, 'Phone must be in +91XXXXXXXXXX format');

export const complaintCreateSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  citizenPhone: phoneSchema,
  photoUrl: z.string().url().optional().nullable(),
  source: z.literal('web'),
});

export const trackingLookupSchema = z.object({
  trackingId: z.string().regex(/^GD-\d{5}$/, 'Tracking ID must be GD-XXXXX format').optional(),
  phone: phoneSchema.optional(),
}).refine(data => data.trackingId || data.phone, {
  message: 'Either tracking ID or phone number is required',
});

// Types inferred from schemas
export type ComplaintCreateInput = z.infer<typeof complaintCreateSchema>;
export type TrackingLookupInput = z.infer<typeof trackingLookupSchema>;
```

```typescript
// frontend/src/lib/validation.ts (re-exports for frontend)
export { complaintCreateSchema, trackingLookupSchema, phoneSchema } from '@shared/validation/complaintSchema';
export type { ComplaintCreateInput, TrackingLookupInput } from '@shared/validation/complaintSchema';
```

```typescript
// backend/src/middleware/validate.ts
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(200).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        });
      }
      return next(error);
    }
  };
```

```typescript
// backend/src/routes/complaints.ts
import { Router } from 'express';
import { validate } from '../middleware/validate';
import { complaintCreateSchema } from '@shared/validation/complaintSchema';
import { complaintService } from '../services/complaintService';

const router = Router();

router.post('/', validate(complaintCreateSchema), async (req, res) => {
  try {
    const complaint = await complaintService.create(req.body);
    return res.status(200).json({ success: true, data: complaint });
  } catch (err) {
    return res.status(200).json({ success: false, message: err.message });
  }
});

export default router;
```

```tsx
// frontend/src/pages/SubmitComplaint.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { complaintCreateSchema, type ComplaintCreateInput } from '@shared/validation/complaintSchema';
import { useComplaintSubmit } from '../hooks/useComplaintSubmit';
import MapPicker from '../components/MapPicker';
import PhotoUpload from '../components/PhotoUpload';

export default function SubmitComplaint() {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ComplaintCreateInput>({
    resolver: zodResolver(complaintCreateSchema),
    mode: 'onBlur',
  });

  const { mutate, isPending } = useComplaintSubmit();

  const onSubmit = (data: ComplaintCreateInput) => {
    mutate(data, {
      onSuccess: (result) => navigate(`/confirm?trackingId=${result.data.trackingId}`),
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Describe the issue</label>
        <textarea
          {...register('description')}
          rows={4}
          className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-primary"
          aria-describedby="desc-error"
        />
        {errors.description && (
          <p id="desc-error" className="text-red-600 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      <fieldset>
        <legend className="block text-sm font-medium mb-2">📍 Location</legend>
        <div className="flex gap-2 mb-2">
          <button type="button" className="btn-secondary" onClick={useGeolocation}>
            Use my location
          </button>
        </div>
        <MapPicker
          onSelect={(lat, lng) => {
            setValue('latitude', lat);
            setValue('longitude', lng);
          }}
        />
      </fieldset>

      <PhotoUpload onUpload={url => setValue('photoUrl', url)} />

      <div>
        <label className="block text-sm font-medium mb-1">📱 Phone number (for tracking)</label>
        <input
          {...register('citizenPhone')}
          type="tel"
          placeholder="+919876543210"
          className="w-full border rounded-lg p-3"
        />
        {errors.citizenPhone && (
          <p className="text-red-600 text-sm mt-1">{errors.citizenPhone.message}</p>
        )}
      </div>

      <button type="submit" disabled={isPending} className="btn-primary w-full py-3">
        {isPending ? 'Submitting…' : 'Submit Complaint'}
      </button>
    </form>
  );
}
```

### Pattern 2: Ward Assignment via turf.js (Cached GeoJSON)

**What:** On complaint creation, backend loads Mumbai ward GeoJSON once at startup, caches in memory, and runs `turf.booleanPointInPolygon` to assign `ward_id`.

**When to use:** Phase 1–3 before PostGIS is set up; zero-infra, runs in Node, fast enough for demo scale (<100 wards, <10k complaints).

**Example:**

```typescript
// backend/src/services/wardService.ts
import * as turf from '@turf/turf';
import { readFileSync } from 'fs';
import { join } from 'path';

interface WardFeature {
  type: 'Feature';
  properties: { id: number; name: string; ward_no: string };
  geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon;
}

interface WardGeoJSON {
  type: 'FeatureCollection';
  features: WardFeature[];
}

let wardCache: WardGeoJSON | null = null;

export function loadWards(): WardGeoJSON {
  if (wardCache) return wardCache;
  const filePath = join(process.cwd(), 'data', 'mumbai-wards.geojson');
  const raw = readFileSync(filePath, 'utf-8');
  wardCache = JSON.parse(raw);
  return wardCache;
}

export function assignWard(latitude: number, longitude: number): number | null {
  const wards = loadWards();
  const point = turf.point([longitude, latitude]); // turf uses [lng, lat]

  for (const feature of wards.features) {
    const polygon = feature.geometry;
    if (turf.booleanPointInPolygon(point, polygon)) {
      return feature.properties.id; // matches wards.id in DB
    }
  }
  return null; // fallback: no ward matched (e.g., outside Mumbai bounds)
}
```

```typescript
// backend/src/services/complaintService.ts
import { Pool } from 'pg';
import { assignWard } from './wardService';

export const complaintService = {
  async create(input: ComplaintCreateInput) {
    const wardId = assignWard(input.latitude, input.longitude);

    const trackingId = await this.generateTrackingId();

    const result = await pool.query(
      `INSERT INTO complaints
        (tracking_id, description, latitude, longitude, status, source, citizen_phone, photo_url, ward_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        trackingId,
        input.description,
        input.latitude,
        input.longitude,
        'submitted',
        'web',
        input.citizenPhone,
        input.photoUrl ?? null,
        wardId,
      ]
    );

    return result.rows[0];
  },

  async generateTrackingId(): Promise<string> {
    // Uses sequence: SELECT nextval('complaint_tracking_seq')
    const result = await pool.query(`SELECT nextval('complaint_tracking_seq')`);
    const seq = result.rows[0].nextval;
    return `GD-${String(seq).padStart(5, '0')}`; // GD-10000, GD-10001, …
  },
};
```

### Pattern 3: Direct Supabase Storage Upload (Frontend → Storage)

**What:** Frontend uploads directly to Supabase Storage using anon key; backend never handles file bytes. Returns public URL stored in `photo_url`.

**When to use:** Free-tier constraint; avoids backend bandwidth/storage; simpler than Cloudinary signed URLs.

**Example:**

```typescript
// frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
```

```tsx
// frontend/src/components/PhotoUpload.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface PhotoUploadProps {
  onUpload: (url: string) => void;
  onRemove: () => void;
}

export default function PhotoUpload({ onUpload, onRemove }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be smaller than 5MB');
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `complaints/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from('complaint-photos')
      .upload(path, file, { contentType: file.type, upsert: false });

    setUploading(false);

    if (uploadError) {
      setError('Upload failed. Please try again.');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('complaint-photos')
      .getPublicUrl(data.path);

    onUpload(publicUrl);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">📷 Add a photo (optional, max 5MB)</label>
      <input
        type="file"
        accept="image/*"
        onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        className="w-full"
        disabled={uploading}
      />
      {preview && (
        <div className="relative w-32 h-32">
          <img src={preview} alt="Preview" className="w-full h-full object-cover rounded" />
          <button
            type="button"
            onClick={() => { URL.revokeObjectURL(preview); setPreview(null); onRemove(); }}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
          >
            ✕
          </button>
        </div>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {uploading && <p className="text-blue-600 text-sm">Uploading…</p>}
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Hand-rolling form validation:** Duplicating logic in frontend and backend → Use shared Zod schemas
- **Storing photos in database or local filesystem:** Not portable, doesn't scale, breaks on free-tier hosting → Use object storage (Supabase/Cloudinary)
- **Using `Math.random()` for tracking IDs:** Collision risk, not sequential → Use PostgreSQL sequence
- **Calling Nominatim on every request without caching:** Rate limit (1 req/sec) will block production → Cache in Redis or in-memory Map with TTL
- **Skipping phone normalization:** Lookup failures when users enter `9876543210` vs `+919876543210` → Normalize to E.164 on input (strip non-digits, prepend +91 if 10 digits)
- **Using `express-validator` only on backend:** Frontend shows different errors than backend → Shared Zod schema

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation (client + server) | Custom validation functions per field | Zod + @hookform/resolvers | Single source of truth, TypeScript inference, i18n-ready messages |
| Tracking ID generation | `Date.now()` + random suffix | PostgreSQL `SEQUENCE` | Guaranteed unique, sequential, concurrency-safe, survives restarts |
| Map click → coordinates | Custom Leaflet event handling | `react-leaflet` `useMapEvents({ click: ... })` | Handles map lifecycle, React context, refs correctly |
| Direct browser → storage upload | Multer + backend file handling | Supabase Storage / Cloudinary unsigned upload | Zero backend bandwidth, CDN delivery, free tier friendly |
| Ward assignment (point-in-polygon) | Custom ray-casting algorithm | `@turf/turf` `booleanPointInPolygon` | Handles holes, MultiPolygon, edge cases; tested, maintained |
| Reverse geocoding | Custom Nominatim wrapper with no cache | In-memory Map cache + TTL (or Redis later) | Nominatim public instance: 1 req/sec hard limit; cache avoids 429 |
| Phone number parsing | Regex replace in multiple places | Single `normalizePhone(input)` utility | E.164 is tricky (country codes, formatting); centralize logic |
| Error response format | Ad-hoc `res.json({ error: ... })` | Centralized error handler middleware | Consistent `{success, message, errors}` contract for frontend |

**Key insight:** Every "custom" solution above has edge cases that cause production bugs (duplicate IDs, validation mismatches, rate limits, CORS issues). The recommended libraries are battle-tested at scale and free.

## Common Pitfalls

### Pitfall 1: Nominatim Rate Limit (1 request/second)
**What goes wrong:** Backend calls Nominatim reverse geocode on every complaint submission; under load or demo burst, requests return 429 Too Many Requests.
**Why it happens:** Public Nominatim instance enforces strict 1 req/sec policy; no API key to increase quota.
**How to avoid:** Implement in-memory cache (Map<string, {wardId, expiry}>) keyed by `"${lat.toFixed(4)},${lng.toFixed(4)}"` with 24h TTL. Pre-geocode demo dataset offline. For production, self-host Nominatim or use Photon.
**Warning signs:** Intermittent 429 errors in logs; ward assignment fails silently.

### Pitfall 2: Tracking ID Collisions in Concurrent Requests
**What goes wrong:** Two simultaneous submissions get same GD-XXXXX if using `MAX(tracking_id) + 1` or timestamp-based generation.
**Why it happens:** Non-atomic read-then-write; race condition between SELECT and INSERT.
**How to avoid:** Use PostgreSQL `SEQUENCE` with `nextval()` — atomic, thread-safe, crash-safe. Format as `GD-` + `LPAD(nextval, 5, '0')` in application code.
**Warning signs:** Duplicate key violation on `tracking_id` unique index.

### Pitfall 3: Phone Lookup Misses Due to Format Mismatch
**What goes wrong:** Citizen enters `9876543210` on tracking page but DB stores `+919876543210`; fuzzy search fails.
**Why it happens:** Input normalization not applied consistently on submit vs lookup.
**How to avoid:** Single `normalizePhone(input)` utility used in both frontend (onBlur) and backend (before insert + before query). Store only E.164. Lookup: `WHERE citizen_phone ILIKE '%' || normalizePhone(input).slice(-6) || '%'`.
**Warning signs:** "Complaint not found" for valid phone numbers.

### Pitfall 4: Leaflet Map Container Size Zero (Invisible Map)
**What goes wrong:** MapPicker renders but map tiles don't appear; only grey box.
**Why it happens:** Leaflet requires container to have explicit height at mount time; React renders before CSS applies.
**How to avoid:** Set `style={{ height: '300px' }}` on `MapContainer`; or use `useMapEvents` in child component after map mounts.
**Warning signs:** Map appears after browser resize; console shows "Map container not found".

### Pitfall 5: Supabase Storage CORS Block on Direct Upload
**What goes wrong:** Browser blocks upload with CORS error when posting to `*.supabase.co`.
**Why it happens:** Supabase bucket CORS policy doesn't allow `localhost:5173` or preview deployments.
**How to avoid:** In Supabase Dashboard → Storage → Bucket → Settings → CORS, add `["http://localhost:5173", "https://*.vercel.app"]` with `allowed_methods: ["POST", "PUT", "HEAD"]`.
**Warning signs:** Network tab shows CORS preflight failure; upload works in production but not local.

### Pitfall 6: React Hook Form + Zod Resolver Type Mismatch
**What goes wrong:** TypeScript errors on `register` or `handleSubmit`; inferred types don't match schema.
**Why it happens:** Zod 4 changed type inference; `z.infer` vs `z.output`; RHF generic confusion.
**How to avoid:** Explicitly type `useForm<ComplaintCreateInput>` where `ComplaintCreateInput = z.input<typeof schema>` (not `z.infer`). Use `@hookform/resolvers/zod` v5+ which supports Zod 4.
**Warning signs:** Red squiggles on `register('field')`; `handleSubmit` payload type is `any`.

## Code Examples

Verified patterns from official sources:

### MapPicker Component (react-leaflet Events Example)
```tsx
// Source: https://react-leaflet.js.org/docs/example-events/
// frontend/src/components/MapPicker.tsx
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface MapPickerProps {
  initialCenter?: [number, number];
  initialZoom?: number;
  onSelect: (lat: number, lng: number) => void;
  height?: string;
}

function LocationMarker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ initialCenter = [19.0760, 72.8777], initialZoom = 12, onSelect, height = '300px' }: MapPickerProps) {
  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom={true}
      style={{ height, width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onSelect={onSelect} />
    </MapContainer>
  );
}
```

### Error Handling Middleware (Express User-Friendly Format)
```typescript
// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(public statusCode: number, message: string, public errors?: string[]) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[ERROR]', err);

  if (err instanceof ZodError) {
    return res.status(200).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map(e => `${e.path.join('.')}: ${e.message}`),
    });
  }

  if (err instanceof AppError) {
    return res.status(200).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Unknown error — don't leak internals
  return res.status(200).json({
    success: false,
    message: 'Something went wrong. Please try again.',
  });
};
```

### PostgreSQL Schema (Full PRD 17 Columns)
```sql
-- backend/src/db/schema.sql
-- Run via node-pg-migrate or directly

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sequence for tracking IDs: GD-XXXXX
CREATE SEQUENCE IF NOT EXISTS complaint_tracking_seq
  AS integer
  START WITH 10000
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Wards table (seeded from GeoJSON)
CREATE TABLE IF NOT EXISTS wards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  ward_no VARCHAR(10) NOT NULL UNIQUE,
  geo_boundary JSONB, -- GeoJSON Polygon/MultiPolygon
  admin_contact VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Complaints table (17 columns per PRD)
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_id VARCHAR(20) NOT NULL UNIQUE, -- GD-XXXXX
  description TEXT NOT NULL,
  category VARCHAR(50),          -- nullable Phase 1, set in Phase 3
  subcategory VARCHAR(50),       -- nullable
  confidence_score REAL,         -- nullable
  ward_id INTEGER REFERENCES wards(id),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'submitted', -- submitted | in_progress | resolved
  source VARCHAR(20) NOT NULL DEFAULT 'web',       -- web | whatsapp
  citizen_phone VARCHAR(20) NOT NULL,              -- E.164 format +91XXXXXXXXXX
  photo_url TEXT,                                  -- Supabase Storage public URL
  cluster_id INTEGER,                              -- nullable, Phase 4
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for query performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_complaints_tracking_id ON complaints(tracking_id);
CREATE INDEX IF NOT EXISTS idx_complaints_citizen_phone ON complaints(citizen_phone);
CREATE INDEX IF NOT EXISTS idx_complaints_ward_id ON complaints(ward_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
```

### Tracking Lookup Endpoint (Exact ID + Fuzzy Phone)
```typescript
// backend/src/routes/tracking.ts
import { Router } from 'express';
import { pool } from '../db/pool';
import { trackingLookupSchema } from '@shared/validation/complaintSchema';
import { validate } from '../middleware/validate';
import { normalizePhone } from '../lib/utils';

const router = Router();

// Public tracking by tracking ID: GET /api/track/:trackingId
router.get('/track/:trackingId', async (req, res) => {
  const trackingId = req.params.trackingId.toUpperCase();
  if (!/^GD-\d{5}$/.test(trackingId)) {
    return res.status(200).json({ success: false, message: 'Invalid tracking ID format' });
  }

  const result = await pool.query(
    `SELECT tracking_id, description, category, status, ward_id, latitude, longitude, created_at
     FROM complaints WHERE tracking_id = $1`,
    [trackingId]
  );

  if (result.rows.length === 0) {
    return res.status(200).json({ success: false, message: 'Complaint not found' });
  }

  return res.status(200).json({ success: true, data: result.rows[0] });
});

// Lookup by phone (fuzzy last 6 digits): GET /api/complaints?phone=...
router.get('/', validate(trackingLookupSchema), async (req, res) => {
  const { trackingId, phone } = req.query;

  if (trackingId) {
    // Exact match (already handled by /track/:trackingId but kept for completeness)
    const result = await pool.query(
      `SELECT * FROM complaints WHERE tracking_id = $1`,
      [trackingId]
    );
    return res.status(200).json({ success: true, data: result.rows });
  }

  if (phone) {
    const normalized = normalizePhone(phone as string); // +91XXXXXXXXXX
    const last6 = normalized.slice(-6);

    const result = await pool.query(
      `SELECT tracking_id, description, category, status, ward_id, created_at
       FROM complaints
       WHERE citizen_phone ILIKE '%' || $1 || '%'
       ORDER BY created_at DESC
       LIMIT 20`,
      [last6]
    );

    return res.status(200).json({ success: true, data: result.rows });
  }

  return res.status(200).json({ success: false, message: 'Tracking ID or phone required' });
});

export default router;
```

### Tailwind Config (Design System from Design Doc)
```js
// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A5F',    // Deep blue — headers, primary buttons
        secondary: '#2A9D8F',  // Teal — accents, resolved status
        alert: '#E9A23B',      // Amber — in_progress status
        critical: '#D64550',   // Red — open/overdue, high-density
        neutral: {
          bg: '#F7F8FA',       // Off-white page background
          text: '#2B2D33',     // Charcoal body text
          border: '#DCE1E7',   // Light gray borders
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        // 8px base unit: 8, 16, 24, 32, 40, 48, 64
      },
    },
  },
  plugins: [],
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `create-react-app` | `Vite` (npm create vite@latest) | 2023 | 10x faster dev server, native ESM, smaller bundles |
| `express-validator` | `Zod` + shared schemas | 2022 | Single validation source, TS inference, no duplication |
| `multer` + local uploads | Direct-to-object-storage (Supabase/Cloudinary) | 2021 | Zero backend bandwidth, CDN, free-tier friendly |
| `PostGIS` for point-in-polygon | `@turf/turf` in Node | 2020 | No DB extension needed, runs anywhere JS runs |
| Custom error formats | `{ success, message, errors }` standard | 2020 | Consistent frontend handling, no CORS preflight issues |
| `jest` + `cypress` | `vitest` + `playwright` | 2023 | Shared Vite config, faster, better mobile testing |

**Deprecated/outdated:**
- `create-react-app`: Unmaintained since 2023; use Vite
- `express-validator`: Duplicates validation logic; Zod enables sharing
- `multer` for photo uploads: Not needed with direct-to-storage pattern
- `moment.js`: Use native `Intl.DateTimeFormat` or `date-fns` (tree-shakeable)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase Storage free tier (5GB egress) sufficient for demo photo uploads | Standard Stack | If demo dataset has many photos, may hit limit → fallback to Cloudinary |
| A2 | Mumbai ward GeoJSON from geohacker/india repo has correct ward boundaries | Ward Assignment | If boundaries wrong, complaints assigned to wrong ward → verify against MCGM official map |
| A3 | `turf.booleanPointInPolygon` performance adequate for <100 wards × <10k complaints | Ward Assignment | If slow, add spatial index (R-tree) or move to PostGIS in Phase 4 |
| A4 | Nominatim public instance rate limit (1 req/sec) won't block demo with caching | Geocoding | If cache miss rate high, 429 errors → pre-geocode demo data offline |
| A5 | PostgreSQL sequence `CACHE 1` ensures no gaps in GD-XXXXX for demo | Tracking ID | Gaps are acceptable; only collision matters. `CACHE 1` is safe. |

## Open Questions

1. **Mumbai ward GeoJSON source**
   - What we know: geohacker/india repo has state/district data; Mumbai wards may be in district folder
   - What's unclear: Exact file path and whether ward boundaries match MCGM official wards
   - Recommendation: Check `district/MUMBAI/` folder in repo; if missing, use MCGM open data portal or manually create simplified polygons from known ward numbers

2. **Supabase vs Cloudinary for photo storage**
   - What we know: Both have free tiers; Supabase simpler (anon key), Cloudinary more features (transformations)
   - What's unclear: Supabase 5GB egress limit vs Cloudinary 25GB bandwidth for demo scale
   - Recommendation: Start with Supabase (simpler auth); migrate to Cloudinary only if egress exceeded

3. **Ward assignment fallback for coordinates outside Mumbai**
   - What we know: `turf.booleanPointInPolygon` returns false for all wards if point outside
   - What's unclear: Should we assign nearest ward, leave null, or reject submission?
   - Recommendation: Leave `ward_id` NULL; log warning; admin can manually assign in Phase 5

4. **Tracking ID sequence start value**
   - What we know: `START WITH 10000` gives GD-10000 first
   - What's unclear: Whether to reserve lower numbers for test data
   - Recommendation: Start at 10000; use `pg_dump`/`COPY` for demo dataset with explicit tracking IDs

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Frontend + Backend | ✓ | 20.19+ (LTS) | — |
| npm | Package management | ✓ | 10.x | — |
| PostgreSQL | Database | ✓ | 16+ (Supabase/Render) | Local Docker |
| Supabase account | Storage + DB hosting | ✓ | Free tier | Render Postgres + local minio |
| Leaflet/OSM tiles | Map rendering | ✓ | CDN (no key) | — |
| Nominatim | Reverse geocoding | ✓ | Public API (rate limited) | Pre-geocode demo data |
| GitHub | Version control | ✓ | — | — |
| Vercel/Netlify | Frontend hosting | ✓ | Free tier | GitHub Pages |
| Render/Railway | Backend hosting | ✓ | Free tier (cold starts) | Fly.io |

**Missing dependencies with no fallback:** None — all core dependencies have free-tier options.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.3 (unit/integration) + Playwright 1.48.1 (E2E) |
| Config file | `frontend/vite.config.ts` (Vitest), `frontend/playwright.config.ts` |
| Quick run command | `cd frontend && npm test` (Vitest watch mode) |
| Full suite command | `cd frontend && npm run test:run && cd ../backend && npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Submit complaint with valid data → returns GD-XXXXX | Integration | `vitest run tests/complaintCreate.test.ts` | ❌ Wave 0 |
| AUTH-01 | Reject description <10 chars | Unit | `vitest run tests/validation.test.ts` | ❌ Wave 0 |
| AUTH-01 | Reject invalid phone format | Unit | `vitest run tests/validation.test.ts` | ❌ Wave 0 |
| AUTH-01 | Photo upload → returns public URL | Integration | `playwright test tests/photoUpload.spec.ts` | ❌ Wave 0 |
| AUTH-01 | Geolocation button → fills lat/lng | E2E | `playwright test tests/geolocation.spec.ts` | ❌ Wave 0 |
| AUTH-01 | Map click → fills lat/lng | E2E | `playwright test tests/mapPin.spec.ts` | ❌ Wave 0 |
| AUTH-03 | Tracking ID format GD-XXXXX sequential | Unit | `vitest run tests/trackingId.test.ts` | ❌ Wave 0 |
| AUTH-03 | Concurrent submissions get unique IDs | Integration | `vitest run tests/concurrency.test.ts` | ❌ Wave 0 |
| AUTH-04 | Track by exact tracking ID → returns complaint | Integration | `vitest run tests/trackById.test.ts` | ❌ Wave 0 |
| AUTH-04 | Track by phone (fuzzy last 6) → returns list | Integration | `vitest run tests/trackByPhone.test.ts` | ❌ Wave 0 |
| AUTH-04 | Track by unknown ID → "not found" message | Unit | `vitest run tests/trackNotFound.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd frontend && npm test` (Vitest watch mode runs affected tests)
- **Per wave merge:** `cd frontend && npm run test:run && cd ../backend && npm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `frontend/tests/validation.test.ts` — Zod schema tests (shared)
- [ ] `frontend/tests/complaintCreate.test.ts` — Submit flow integration
- [ ] `frontend/tests/trackingId.test.ts` — Sequence format + uniqueness
- [ ] `frontend/tests/trackById.test.ts` — Tracking lookup by ID
- [ ] `frontend/tests/trackByPhone.test.ts` — Fuzzy phone lookup
- [ ] `backend/tests/wardService.test.ts` — Point-in-polygon assignment
- [ ] `backend/tests/geocodingService.test.ts` — Nominatim cache behavior
- [ ] `frontend/tests/photoUpload.spec.ts` — Playwright Supabase upload
- [ ] `frontend/tests/mapPin.spec.ts` — Playwright Leaflet click
- [ ] `frontend/tests/geolocation.spec.ts` — Playwright browser geolocation mock
- [ ] `vite.config.ts` — Vitest config with `environment: 'jsdom'`, `globals: true`
- [ ] `playwright.config.ts` — Projects: chromium, mobile-chrome
- [ ] Framework install: `npm install -D vitest @testing-library/react @testing-library/user-event jsdom playwright @playwright/test`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth in Phase 1 (citizen portal is public) |
| V3 Session Management | No | No sessions; stateless tracking via ID/phone |
| V4 Access Control | Yes | Public endpoints only; admin endpoints deferred to Phase 5 |
| V5 Input Validation | **Yes** | Zod schemas on all inputs (frontend + backend) |
| V6 Cryptography | No | No secrets stored; HTTPS enforced by hosting platform |
| V7 Error Handling | **Yes** | Centralized error handler; no stack traces in responses |
| V9 Communication Security | Yes | HTTPS only (enforced by Vercel/Render); CORS restricted to frontend origin |
| V10 Malicious Code | Yes | `helmet` headers; `pg` parameterized queries prevent SQLi |
| V11 Business Logic | Yes | Rate limiting on `/api/complaints` (express-rate-limit) to prevent spam |
| V12 File Upload | **Yes** | Client-side validation (type, size) + Supabase Storage virus scan (automatic) |
| V13 API Security | Yes | No API keys for public endpoints; admin endpoints protected in Phase 5 |
| V14 Configuration | Yes | `dotenv` for secrets; no secrets in code; `helmet` for secure headers |

### Known Threat Patterns for React/Node/PostgreSQL Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL Injection | Tampering | `pg` parameterized queries (`$1`, `$2`); never string concat |
| XSS via complaint description | Tampering | React auto-escapes; `helmet.contentSecurityPolicy()` |
| CSRF | Spoofing | Not applicable (no auth cookies; stateless API) |
| File upload bypass | Tampering | Client MIME/size check + Supabase server-side validation |
| Nominatim rate limit DoS | Denial of Service | In-memory cache with TTL; express-rate-limit on `/complaints` |
| Tracking ID enumeration | Information Disclosure | Sequential IDs are acceptable for demo; Phase 5 adds auth |
| Phone number enumeration | Information Disclosure | Fuzzy search limited to last 6 digits; rate limited |
| CORS misconfiguration | Spoofing | `cors({ origin: process.env.FRONTEND_URL })` — exact origin only |

## Sources

### Primary (HIGH confidence)
- [React Leaflet Events Example](https://react-leaflet.js.org/docs/example-events/) — Map click handler pattern `[VERIFIED: context7]`
- [node-postgres Pooling Guide](https://node-postgres.com/features/pooling) — Connection pool best practices `[VERIFIED: context7]`
- [Supabase Storage Standard Uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads) — Direct upload from browser `[VERIFIED: context7]`
- [React Hook Form useForm + Zod Resolver](https://react-hook-form.com/docs/useform#resolver) — Schema validation integration `[VERIFIED: context7]`
- [Zod Documentation](https://zod.dev/) — TypeScript-first validation `[VERIFIED: context7]`
- [@turf/turf booleanPointInPolygon](https://turfjs.org/docs/api/booleanPointInPolygon) — Point-in-polygon API `[VERIFIED: context7]`
- [PostgreSQL CREATE SEQUENCE](https://www.postgresql.org/docs/current/sql-createsequence.html) — Sequence syntax `[VERIFIED: context7]`
- [Nominatim Reverse Geocoding API](https://nominatim.org/release-docs/develop/api/Reverse/) — Endpoint + parameters `[VERIFIED: context7]`

### Secondary (MEDIUM confidence)
- [geohacker/india GeoJSON repository](https://github.com/geohacker/india) — Mumbai ward boundaries source `[CITED: github.com/geohacker/india]`
- [Vite Getting Started](https://vitejs.dev/guide/) — Project scaffolding `[CITED: vitejs.dev]`
- [Tailwind CSS Configuration](https://tailwindcss.com/docs/configuration) — Design system mapping `[CITED: tailwindcss.com]`

### Tertiary (LOW confidence)
- Nominatim Usage Policy (rate limits) — inferred from community knowledge; not directly fetched `[ASSUMED]`
- Mumbai ward count (227 wards) — commonly cited but not verified against current MCGM data `[ASSUMED]`
- Supabase Storage free tier limits (5GB egress) — from pricing page memory `[ASSUMED]`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — All versions verified via npm registry; libraries are mature and widely adopted
- Architecture: HIGH — Patterns derived from official documentation and established best practices
- Pitfalls: HIGH — Based on documented limitations (Nominatim rate limit, Leaflet sizing, sequence concurrency)
- Code examples: HIGH — Sourced directly from official library documentation
- Ward GeoJSON source: MEDIUM — Repository exists but exact file path not confirmed this session
- Environment availability: MEDIUM — Assumes standard free-tier services available; not probed in this environment

**Research date:** 2026-09-09
**Valid until:** 2026-10-09 (30 days — stack is stable; only version bumps expected)