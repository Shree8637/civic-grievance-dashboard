# Design & Layout Document
## Civic Grievance Intelligence Dashboard

| | |
|---|---|
| **Author** | Shreeraj Jagtap (Roll No. 48, IT — Div A, Batch A2) |
| **Institution** | Shree L. R. Tiwari College of Engineering (SLRTCE) |
| **Related Docs** | SOP, PRD, Tech Stack Document, Implementation Plan |
| **Scope** | Web application only — no WhatsApp channel |

---

## 1. Design Goals

- **Two audiences, two moods.** The citizen portal should feel like a quick, low-friction utility (think: reporting a pothole, not filling a government form). The admin dashboard should feel like a control room — dense with information, but organized.
- **Trust through clarity.** Citizens are more likely to use this if they can see their complaint was received and can check on it — status visibility matters more than visual flourish.
- **Map-first for admins.** The hotspot map is the single most important screen in the admin experience — everything else (charts, filters, tables) supports it.
- **Low-bandwidth friendly, mobile-first.** As the sole citizen-facing channel, the web portal needs to work well on a phone browser and light mobile data — there's no separate mobile channel to fall back on.

---

## 2. Design System

### 2.1 Color Palette

| Role | Color | Use |
|---|---|---|
| Primary | Deep blue `#1E3A5F` | Headers, primary buttons, nav |
| Secondary | Teal `#2A9D8F` | Accents, active states, "resolved" tags |
| Alert / Urgent | Amber `#E9A23B` | "In progress" status, medium-urgency flags |
| Critical | Red `#D64550` | "Open/overdue" status, high-density hotspot markers |
| Neutral background | Off-white `#F7F8FA` | Page background |
| Neutral text | Charcoal `#2B2D33` | Body text |
| Border/divider | Light gray `#DCE1E7` | Table borders, card outlines |

*Rationale: blue/teal reads as civic/institutional and trustworthy without being sterile; amber/red are reserved specifically for status and urgency so they carry real meaning rather than being decorative.*

### 2.2 Typography

| Use | Typeface | Notes |
|---|---|---|
| Headings | Inter (or system-ui fallback) | Bold, 600–700 weight |
| Body | Inter / system-ui | 400 weight, 16px base on citizen portal, 14px base on dense admin tables |
| Numeric/stat callouts | Inter, 700 weight, larger scale | Used in dashboard KPI cards |

*Free, open-source font (Inter) — consistent with the zero-cost constraint.*

### 2.3 Spacing & Grid

- 8px base spacing unit (8/16/24/32px increments).
- Citizen portal: single-column, max-width ~480px on mobile, centered card layout on desktop.
- Admin dashboard: 12-column responsive grid; sidebar (fixed 240px) + fluid main content area.

### 2.4 Iconography

- Simple line-icon set (e.g. Lucide/Feather-style — free, open-source) for categories: trash (garbage), droplet (water), road (roads), wave/pipe (drainage), lightbulb (streetlight).
- Icons double as quick visual category tags in both the citizen tracking view and admin complaint list.

---

## 3. Information Architecture

```
Civic Grievance Intelligence Dashboard (Web Application)
│
├── Citizen Portal (public)
│   ├── Home / Landing
│   ├── Submit a Complaint
│   ├── Confirmation
│   └── Track a Complaint
│
└── Admin Dashboard (authenticated)
    ├── Login
    ├── Overview (KPI summary)
    ├── Hotspot Map
    ├── Complaint List (table + filters)
    ├── Complaint Detail (status update, category override)
    └── Analytics (trends, category distribution, resolution stats)
```

---

## 4. Citizen Portal — Screen Layouts

### 4.1 Home / Landing
```
┌─────────────────────────────────────┐
│  [Logo]   Civic Grievance Dashboard  │
├─────────────────────────────────────┤
│                                       │
│     "Report a civic issue in         │
│         under 2 minutes"             │
│                                       │
│   [ Report an Issue ]  [ Track ]     │
│                                       │
└─────────────────────────────────────┘
```
Minimal, two clear calls to action. No login required.

### 4.2 Submit a Complaint
```
┌─────────────────────────────────────┐
│  ← Back            Report an Issue   │
├─────────────────────────────────────┤
│  Describe the issue                  │
│  ┌─────────────────────────────────┐ │
│  │ (free text box)                 │ │
│  └─────────────────────────────────┘ │
│                                       │
│  📍 Location                         │
│  [ Use my location ]  [ Pin on map ] │
│  (mini Leaflet map preview)          │
│                                       │
│  📷 Add a photo (optional)           │
│  [ Upload ]                          │
│                                       │
│  📱 Phone number (for tracking)      │
│  [__________________________]        │
│                                       │
│         [ Submit Complaint ]         │
└─────────────────────────────────────┘
```
Category is **not** shown as a field here — it's inferred by NLP after submission, keeping the form short. Manual category selection could be a fallback dropdown if NLP confidence is low, added later.

### 4.3 Confirmation
```
┌─────────────────────────────────────┐
│         ✓ Complaint Submitted        │
│                                       │
│   Your Complaint ID: #GD-10432       │
│                                       │
│   Save this ID — you can check your  │
│   status anytime on the Track page.  │
│                                       │
│        [ Track this complaint ]      │
└─────────────────────────────────────┘
```

### 4.4 Track a Complaint
```
┌─────────────────────────────────────┐
│  Track Your Complaint                │
├─────────────────────────────────────┤
│  Complaint ID or phone number:       │
│  [_____________________] [ Search ]  │
│                                       │
│  ─────────────────────────────────   │
│  #GD-10432 · Garbage 🗑️              │
│  Status: ● In Progress               │
│  Submitted: 2 days ago               │
│  Ward: 12                            │
│  ─────────────────────────────────   │
└─────────────────────────────────────┘
```

---

## 5. Admin Dashboard — Screen Layouts

### 5.1 Overall Shell (applies to all admin screens)
```
┌───────────┬───────────────────────────────────────────┐
│           │  Ward: [All ▾]  Category: [All ▾]  🔍      │
│  Sidebar  ├───────────────────────────────────────────┤
│  ─────    │                                             │
│  Overview │            (main content area)              │
│  Map      │                                             │
│  Comp.    │                                             │
│  List     │                                             │
│  Analytics│                                             │
│           │                                             │
│  [Admin ▾]│                                             │
└───────────┴───────────────────────────────────────────┘
```
Fixed sidebar for navigation, persistent filter bar at the top of the content area (ward/category filters apply across Map, List, and Analytics views).

### 5.2 Overview (landing screen after login)
```
┌───────────────────────────────────────────────────────┐
│  [Open: 142]  [In Progress: 58]  [Resolved: 310]       │
│  [Avg. Resolution: 4.2 days]                            │
├───────────────────────────────────────────────────────┤
│  Top Categories This Week      │  Recent Hotspots       │
│  ▇▇▇▇▇▇▇ Garbage               │  • Ward 12 — Drainage   │
│  ▇▇▇▇▇ Water                   │  • Ward 7 — Garbage     │
│  ▇▇▇ Roads                     │  • Ward 3 — Streetlight │
└───────────────────────────────────────────────────────┘
```
KPI cards up top, two supporting panels below — gives an admin the "state of the city" in one glance before drilling into the map.

### 5.3 Hotspot Map (primary screen)
```
┌───────────────────────────────────────────────────────┐
│  Ward: [All ▾]  Category: [All ▾]  Date: [Last 30d ▾]  │
├───────────────────────────────────────────────────────┤
│                                                           │
│              [ Leaflet map, full width ]                 │
│         ● small cluster   ⬤ large cluster (color =       │
│                              category, size = volume)     │
│                                                           │
├───────────────────────────────────────────────────────┤
│  Legend: 🗑️ Garbage  💧 Water  🛣️ Roads  🌊 Drainage      │
│          💡 Streetlight                                  │
└───────────────────────────────────────────────────────┘
```
Clicking a cluster opens a side panel or popup listing the complaints in that cluster.

### 5.4 Complaint List
```
┌───────────────────────────────────────────────────────┐
│  ID       Category    Ward   Status        Date   ›     │
│  #10432   🗑️ Garbage  12     ● In Progress 2d ago       │
│  #10431   💧 Water    7      ○ Open        3d ago       │
│  #10430   🛣️ Roads    3      ✓ Resolved    5d ago       │
│  ...                                                     │
└───────────────────────────────────────────────────────┘
```
Sortable columns, status shown as colored dot/tag matching the palette in §2.1.

### 5.5 Complaint Detail (opened from list or map popup)
```
┌─────────────────────────────────────┐
│  #10432 — Garbage 🗑️                 │
├─────────────────────────────────────┤
│  "Garbage not collected for a week   │
│   near the main market..."           │
│                                       │
│  Ward: 12   Confidence: 92%          │
│  [ Override category ▾ ]             │
│                                       │
│  Status: [ Open ▾ In Progress ▾      │
│            Resolved ▾ ]              │
│                                       │
│  (mini map showing exact location)   │
│  (photo, if attached)                │
└─────────────────────────────────────┘
```

### 5.6 Analytics
```
┌───────────────────────────────────────────────────────┐
│  Complaint Volume Over Time                             │
│  [ line chart: category-colored lines over date range ] │
├───────────────────────────┬───────────────────────────┤
│  Category Distribution     │  Resolution Rate by Ward   │
│  [ pie/bar chart ]         │  [ bar chart ]              │
└───────────────────────────┴───────────────────────────┘
```

---

## 6. Component Inventory

| Component | Used In |
|---|---|
| Primary button (filled, primary blue) | Submit, Search, Save actions |
| Secondary button (outline) | Back, Cancel |
| Status tag/pill (color-coded) | Complaint list, detail, tracking page |
| KPI card | Overview screen |
| Filter dropdown (ward/category/date) | All admin screens |
| Data table (sortable) | Complaint list |
| Map component (Leaflet) | Submit form (mini), Hotspot map (full), Detail (mini) |
| Chart components (line, bar, pie) | Overview, Analytics |
| Category icon set | List, detail, tracking, map legend |
| Toast/inline confirmation | Post-submission, post status-update |

---

## 7. Responsive Behavior

| Breakpoint | Citizen Portal | Admin Dashboard |
|---|---|---|
| Mobile (<640px) | Primary target — single column, large tap targets, sticky submit button | Sidebar collapses to a bottom nav or hamburger; table becomes stacked cards |
| Tablet (640–1024px) | Comfortable single column, wider map preview | Sidebar visible, content reflows to 2-column where charts allow |
| Desktop (>1024px) | Centered card layout, generous whitespace | Full sidebar + multi-panel layout as sketched above |

*Citizen portal is designed mobile-first since mobile-browser usage is the likely dominant way citizens will access it — as the sole citizen channel, the web portal needs to carry that "quick, on-the-go" experience on its own. Admin dashboard is designed desktop-first since it's an internal tool typically used on office desktops/laptops per the PRD's hardware requirements.*

---

## 8. Accessibility Notes

- Status should never rely on color alone — pair every status color with a label/icon (already reflected in the pill design: "● In Progress", not just a colored dot).
- Form inputs on the citizen portal use clear labels (not placeholder-only text) so screen readers and low-literacy users aren't dependent on placeholder text disappearing on focus.
- Sufficient contrast between the deep blue/teal palette and the off-white background (should be verified against WCAG AA when actual hex values are finalized in code).
- Map interactions (clicking clusters) should have a non-map fallback — the complaint list/table covers the same data for anyone who can't easily interact with the map.

---

## 9. Open Design Questions

- Should the citizen portal support Marathi/Hindi labels now, or is that strictly tied to the "future scope" multilingual NLP work?
- Does the admin dashboard need role-based views (ward-scoped admin vs. city-wide analyst), or is a single admin role sufficient for the academic-project scope?
- Real Mumbai ward GeoJSON boundaries vs. simplified circular/approximate zones for the map — affects how polished the hotspot map looks vs. how much setup time it costs.
