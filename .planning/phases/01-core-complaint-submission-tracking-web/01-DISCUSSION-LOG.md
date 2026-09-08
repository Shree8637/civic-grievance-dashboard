# Discussion Log: Phase 1 — Core Complaint Submission & Tracking (Web)

**Date:** 2026-09-09
**Participants:** User (visionary) + Agent (builder)

---

## Area: Tracking ID Format

**Options presented:**
1. GD-XXXXX (like design) — Prefix + 5-digit sequential (e.g., GD-10432)
2. UUID — Standard UUID v4
3. Short code (6-8 chars) — Base62 encoded
4. Let me specify

**User selection:** GD-XXXXX (like design)

**Rationale captured:** Matches design mockup, human-readable, sequential for demo visibility

---

## Area: Location Selection UX

**Options presented:**
1. Geolocation first, map as fallback
2. Map pin first, geolocation as option
3. Both equally prominent
4. Let me specify

**User selection:** Both equally prominent

**Rationale captured:** Gives users choice; mobile users may prefer geolocation, desktop users may prefer map pin

---

## Area: Photo Storage

**Options presented:**
1. Base64 in PostgreSQL
2. Local filesystem (Render/Railway)
3. Cloudinary/Supabase Storage (free tier)
4. Skip photos for v1
5. Let me specify

**User selection:** Cloudinary/Supabase Storage (free tier)

**Rationale captured:** Zero-cost constraint; persistent unlike ephemeral filesystem; CDN for fast loads

---

## Area: Form Validation

**Options presented:**
1. Minimal — required: description + location + phone
2. Standard — add char limits & format checks
3. Strict — plus profanity/spam filter
4. Let me specify

**User selection:** Standard — add char limits & format checks

**Rules captured:**
- Description: required, 10–2000 characters
- Location: required (either geolocation success or map pin placed)
- Phone: required, Indian format regex (+91 XXXXXXXXXX)
- Photo: optional, max 5MB, image/* MIME types

---

## Area: Tracking Lookup Behavior

**Options presented:**
1. Exact match only
2. Fuzzy + exact
3. Phone shows all, ID shows one
4. Let me specify

**User selection:** Fuzzy + exact — tracking ID exact match; phone supports partial (last 4–6 digits)

**Rationale captured:** Tracking IDs are precise; phone numbers users may misremember or type partially

---

## Area: Complaint Statuses

**Options presented:**
1. Just Submitted
2. Submitted + In Progress + Resolved
3. Submitted + Acknowledged + Resolved
4. Let me specify

**User selection:** Submitted + In Progress + Resolved

**Rationale captured:** Schema supports full lifecycle from Phase 1; admin dashboard (Phase 5) updates status

---

## Area: API Design

**Options presented:**
1. Standard REST
2. REST + tracking endpoint
3. Let me specify

**User selection:** Standard REST

**Endpoints captured:**
- POST /api/complaints
- GET /api/complaints/:id
- GET /api/complaints?phone=...
- GET /api/track/:trackingId

---

## Area: Error Handling

**Options presented:**
1. Standard HTTP codes + JSON body
2. User-friendly messages
3. Let me specify

**User selection:** User-friendly messages

**Format captured:** HTTP 200 with `{ success: false, message: 'User-friendly text' }`

---

## Area: Ward Assignment

**Options presented:**
1. Auto-assign from coordinates
2. User selects ward
3. Skip ward in Phase 1
4. Let me specify

**User selection:** Auto-assign from coordinates

**Method captured:** Nominatim (free) or ward boundary GeoJSON point-in-polygon

---

## Area: Database Schema

**Options presented:**
1. Per PRD data model exactly
2. Minimal for Phase 1
3. Let me specify

**User selection:** Per PRD data model exactly

**Columns captured:** All 17 columns from PRD including nullable category/confidence/cluster for future phases

---

## Area: Phone Number Format

**Options presented:**
1. E.164 format (+91XXXXXXXXXX)
2. Raw input + normalized column
3. Let me specify

**User selection:** E.164 format (+91XXXXXXXXXX)

**Normalization captured:** Strip spaces/dashes/parentheses; prepend +91 if 10 digits; validate 10 digits after country code

---

## Deferred Ideas Noted

- Marathi/Hindi labels on citizen portal → Future scope (multilingual NLP)
- Category field on submit form → Phase 3 (NLP classification)
- Photo upload progress indicator → Phase 6 polish
- Offline support / PWA → Future scope
- Email notifications on status change → Phase 6 (v2 NOTF-01)

---

## Agent Discretion Items

- Used design document layouts as primary reference for UI decisions
- Inferred standard REST + separate tracking endpoint from PRD API list
- Applied zero-cost constraint to photo storage decision
- Matched status values to design document (Section 5.5)
- Chose E.164 for Indian phone context per project location (Mumbai)