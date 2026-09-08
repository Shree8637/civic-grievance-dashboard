# Civic Grievance Intelligence Dashboard

## What This Is

A two-sided civic intelligence platform for Mumbai: a lightweight complaint-submission experience for citizens (web + WhatsApp) and an analytics dashboard for municipal administrators that turns raw complaint text into categorized, geolocated, trend-ready intelligence using NLP and clustering. Built as a Sem 5 Mini/Major Project at SLRTCE under the Urban Systems theme with a hard zero-cost constraint — all tools and services must be free/open-source.

## Core Value

If everything else fails, **citizens can report issues in under 2 minutes via web or WhatsApp, and administrators can see ward-level hotspots and category trends without reading every complaint individually** — this visibility loop must work.

## Business Context

- **Customer**: Municipal administrators (ward-level staff, department heads) and citizens reporting issues
- **Revenue model**: None — academic project, demo-scale only
- **Success metric**: Classification accuracy on labeled test set + hotspot precision on demo dataset + end-to-end flow working (web/WhatsApp → categorized → mapped on dashboard)
- **Strategy notes**: Zero-cost constraint drives every tech choice; future scope includes multilingual NLP, predictive analytics, official system integration

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Citizen can submit complaint via web form with free-text description, location (map pin/geolocation), optional photo
- [ ] Citizen can submit complaint via WhatsApp Cloud API (free tier) with free-text + location
- [ ] Complaint receives auto-generated tracking ID on submission (both channels)
- [ ] NLP engine classifies complaint text into 5 categories: garbage, water supply, drainage, roads, streetlights
- [ ] Classification confidence score stored; low-confidence complaints flagged for manual review
- [ ] Geospatial clustering (DBSCAN) identifies ward/category hotspots from complaint coordinates
- [ ] Text-similarity clustering groups near-duplicate complaints (same issue reported by multiple people)
- [ ] Admin dashboard shows ward-level heatmap (Leaflet + OpenStreetMap) with hotspot markers sized by density
- [ ] Admin dashboard shows category distribution chart, complaint volume trends over time, resolution statistics
- [ ] Admin can filter complaints by ward, category, date range, status
- [ ] Admin can manually update complaint status (submitted → in progress → resolved)
- [ ] Admin can override NLP category if misclassified
- [ ] Citizen can track complaint status by complaint ID or phone number

### Out of Scope

- Direct integration with official municipal grievance systems — future scope per PRD
- Multilingual (Marathi/Hindi) NLP support — future scope
- Native mobile app — WhatsApp covers mobile-first need for v1
- Automated complaint resolution (routing to departments, SLA enforcement) — v1 focuses on visibility/classification
- Predictive/forecasting analytics — future scope
- SMS and voice-based complaint registration — future scope
- Real-time chat — not core to community value
- Video posts — storage/bandwidth costs, defer to v2+

## Context

- **Academic project**: Sem 5 Mini/Major Project at Shree L. R. Tiwari College of Engineering (SLRTCE)
- **Theme**: Urban Systems
- **Author**: Shreeraj Jagtap (Roll No. 48, IT — Div A, Batch A2)
- **Technical environment**: React/Node.js frontend-backend, Python scikit-learn for NLP, PostgreSQL database
- **Known constraints**: Zero-cost (no paid APIs), demo-scale dataset (thousands of complaints), free-tier hosting (cold starts expected)
- **Prior work**: PRD, Tech Stack, Implementation Plan, Design Layout documents already authored
- **Open questions**: Exact category list (5 listed vs. college brief), synthetic vs. scraped demo dataset, real Mumbai ward GeoJSON vs. simplified zones

## Constraints

- **Cost**: All infrastructure, APIs, and libraries must be free/open-source — no paid keys (hard project constraint)
- **Timeline**: ~11-week build window per implementation plan (adjust to semester calendar)
- **Tech stack**: React + Node/Express + PostgreSQL + Python scikit-learn + Leaflet/OpenStreetMap + WhatsApp Cloud API free tier
- **Dependencies**: WhatsApp Cloud API requires Meta Developer account + verified WhatsApp Business number (test numbers available for dev)
- **Performance**: Dashboard visualizations should load in under ~3s for datasets in thousands-of-complaints range (demo scale)
- **Data Privacy**: Citizen phone numbers used only for tracking/notifications, not exposed on admin dashboard beyond what's needed

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PostgreSQL over MongoDB | Complaint/ward/cluster relationships are relational; aggregation queries for dashboard easier in SQL; PostGIS available for future geospatial needs | ✓ Good |
| Leaflet + OpenStreetMap over Google Maps | No API key, no billing account, no usage cap for demo traffic | ✓ Good |
| scikit-learn (TF-IDF + LR/SVM) as primary NLP | Fast, interpretable, works with modest labeled dataset, no GPU needed; Hugging Face models as stretch upgrade | ✓ Good |
| Python separate service for NLP | Python's NLP/ML ecosystem far more mature than Node's for classification/clustering; worth integration overhead | ✓ Good |
| WhatsApp Cloud API over Twilio | Official API, free tier within Meta's conversation limits; no anti-spam/ban risk | ✓ Good |
| Node.js backend over Django | Keeps JS consistent across frontend/backend; Python scoped to NLP service where it earns its place | ✓ Good |
| Vertical MVP phase structure | Get working app fast, add features slice by slice; each phase delivers end-to-end user capability | — Pending |
| Free-tier hosting (Vercel/Render/Supabase) | Zero cost; cold starts on free tiers documented as known limitation | — Pending |

---

*Last updated: 2026-09-09 after initialization*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state