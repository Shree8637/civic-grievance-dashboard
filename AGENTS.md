<!-- GSD:project-start source:PROJECT.md -->

## Project

**Civic Grievance Intelligence Dashboard**

A two-sided civic intelligence platform for Mumbai: a lightweight complaint-submission experience for citizens (web + WhatsApp) and an analytics dashboard for municipal administrators that turns raw complaint text into categorized, geolocated, trend-ready intelligence using NLP and clustering. Built as a Sem 5 Mini/Major Project at SLRTCE under the Urban Systems theme with a hard zero-cost constraint — all tools and services must be free/open-source.

**Core Value:** If everything else fails, **citizens can report issues in under 2 minutes via web or WhatsApp, and administrators can see ward-level hotspots and category trends without reading every complaint individually** — this visibility loop must work.

### Constraints

- **Cost**: All infrastructure, APIs, and libraries must be free/open-source — no paid keys (hard project constraint)
- **Timeline**: ~11-week build window per implementation plan (adjust to semester calendar)
- **Tech stack**: React + Node/Express + PostgreSQL + Python scikit-learn + Leaflet/OpenStreetMap + WhatsApp Cloud API free tier
- **Dependencies**: WhatsApp Cloud API requires Meta Developer account + verified WhatsApp Business number (test numbers available for dev)
- **Performance**: Dashboard visualizations should load in under ~3s for datasets in thousands-of-complaints range (demo scale)
- **Data Privacy**: Citizen phone numbers used only for tracking/notifications, not exposed on admin dashboard beyond what's needed

<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->

## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
