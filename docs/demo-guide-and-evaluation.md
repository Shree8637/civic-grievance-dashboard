# Civic Grievance Intelligence Dashboard — Demo Guide & Evaluation Report

> **Target Audience:** Viva Examiners, Project Reviewers, and Evaluators  
> **Platform Version:** 1.0 (Phases 0–5 Complete)  
> **Date:** September 2026

---

## 1. System Architecture & Overview

The **Civic Grievance Intelligence Dashboard** is an end-to-end civic complaint management platform built specifically for municipal governance (demonstrated with Mumbai BMC wards). It addresses core shortcomings in traditional grievance portals: manual routing delays, unorganized complaints, recurring identical issues, and lack of geospatial visibility.

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite)                   │
│  - Citizen Portal (Submit, GPS Locate, Reference Tracking)   │
│  - Admin Dashboard (Overview, Hotspot Map, Complaints,      │
│                     Analytics with Recharts & Leaflet)     │
└──────────────┬──────────────────────────────▲───────────────┘
               │ HTTP / JSON                  │
               ▼                              │
┌─────────────────────────────────────────────┴───────────────┐
│                    Express.js Backend                       │
│  - REST API (:5000)                                         │
│  - Nearest-Ward Geo Calculation                             │
│  - JWT Authentication & RBAC                                │
│  - Hotspot Orchestration & Analytics Aggregations           │
└──────────────┬──────────────────────────────▲───────────────┘
               │                              │
       ┌───────▼────────┐             ┌───────┴───────────────┐
       │   PostgreSQL   │             │   FastAPI Microservice │
       │  - Complaints  │             │   - TF-IDF + LogReg   │
       │  - 8 Wards     │             │     Classifier (:8000)│
       │  - Clusters    │             │   - DBSCAN Clustering │
       │  - Admin Users │             │   - Text Cohesion     │
       └────────────────┘             └───────────────────────┘
```

---

## 2. Evaluation Metrics & Experimental Results

### 2.1 NLP Classification Model Performance

The classification engine uses a calibrated **TF-IDF Vectorizer + Multinomial Logistic Regression** pipeline trained on domain-specific municipal grievance texts.

- **Total Dataset Size:** 300 samples (240 training, 60 held-out test)
- **Overall Accuracy:** **83.33%**
- **Macro Average F1-Score:** **0.8338**
- **Weighted Average F1-Score:** **0.8338**
- **Average Live Inference Latency:** **< 25 ms**

#### Per-Class Breakdown

| Category | Precision | Recall | F1-Score | Support |
|---|:---:|:---:|:---:|:---:|
| **Water Supply** | 0.8333 | 1.0000 | **0.9091** | 10 |
| **Garbage** | 0.9000 | 0.9000 | **0.9000** | 10 |
| **Streetlights** | 0.8889 | 0.8000 | **0.8421** | 10 |
| **Drainage** | 1.0000 | 0.7000 | **0.8235** | 10 |
| **Other** | 0.8750 | 0.7000 | **0.7778** | 10 |
| **Roads** | 0.6429 | 0.9000 | **0.7500** | 10 |

*Key Insight:* High recall on **Water Supply** (100%) and **Roads** (90%) ensures critical infrastructure disruptions are rarely missed or misclassified.

### 2.2 Geospatial Hotspot Clustering (DBSCAN)

- **Algorithm:** Density-Based Spatial Clustering of Applications with Noise (DBSCAN) with Haversine great-circle metric.
- **Tuning Parameters:**
  - Epsilon ($\epsilon$): `0.8 km` (tuned to Mumbai municipal ward neighborhood density)
  - Minimum Samples (`min_samples`): `2`
- **Text Cohesion Engine:** Pairwise Cosine Similarity over TF-IDF vectors of complaints within each spatial cluster.
  - Clusters with cohesion score $\ge 0.40$ are flagged as **Recurring / Duplicate Incidents** (e.g., multiple citizens reporting the same pipeline burst or pothole stretch).
- **Benchmark on Demo Dataset (104 complaints):**
  - **Identified Hotspots:** 21 distinct clusters
  - **Noise/Individual Points:** Maintained as individual pins without spurious cluster generation
  - **Recomputation Time:** **~85 ms** for complete database sweep

### 2.3 Municipal Operational Metrics (Demo Dataset)

- **Total Seeded Complaints:** 104
- **Active Wards Covered:** 8 (Ward A, Ward C, Ward F/N, Ward G/S, Ward H/W, Ward K/E, Ward L, Ward P/S)
- **Status Breakdown:**
  - Submitted: 63 (60.6%)
  - In Progress: 19 (18.3%)
  - Resolved: 22 (21.1%)
- **Average Resolution Time:** 2.4 days

---

## 3. Recommended Live Demo Script (Step-by-Step Viva Guide)

Follow this verified sequence during the presentation to demonstrate the entire lifecycle seamlessly:

### Step 1: Citizen Submission with Live NLP
1. Open browser to `http://localhost:5173/` (Citizen Portal Landing Page).
2. Click **"Report an Issue"** or navigate to `http://localhost:5173/submit`.
3. In the description field, enter:
   > *"Severe crater potholes near Bandra KFC on Linking Road causing vehicle tyre damage and heavy traffic jams."*
4. Click **"Use My Location"** or select a point on the interactive Leaflet map near Bandra (Ward H/W).
5. Enter a phone number: `9876543210`.
6. Click **"Submit Grievance"**.
7. **Highlight to Evaluator:**
   - Notice how the system **automatically classified** the issue into `Roads & Footpaths` with high confidence.
   - Notice how the system **automatically detected the municipal ward** (`Ward H/W - Bandra West / Khar`) based on coordinates.
   - An official tracking Reference ID is assigned (e.g., `#GD-10105`).

### Step 2: Citizen Real-Time Tracking
1. Copy the reference ID `#GD-10105` or click **"Track Grievance"**.
2. Alternatively visit `http://localhost:5173/track` and search by ID or phone number.
3. **Highlight to Evaluator:**
   - The 3-stage visual progress tracker: **Submitted** (Green) → **In Progress** → **Resolved**.
   - Details showing the assigned ward, auto-classified category, location map preview, and timestamp.

### Step 3: Admin Management & Status Lifecycle
1. Open `http://localhost:5173/admin/login` (or access via Admin sidebar).
2. Login with credentials:
   - **Email:** `admin@grievance.local`
   - **Password:** `admin123`
3. Navigate to **"Complaints"** (`http://localhost:5173/admin/complaints`).
4. **Highlight to Evaluator:**
   - 104 complaints loaded with clean 12/page pagination.
   - Filter toolbar: Filter by Ward (`Ward H/W`), Category (`Roads`), or Status (`Submitted`).
   - Locate the newly submitted complaint (`#GD-10105`).
   - Change the status dropdown to **"In Progress"**, then **"Resolved"**.
   - Notice the live update in the database.

### Step 4: Geospatial Hotspot Map
1. Click **"Hotspot Map"** (`http://localhost:5173/admin/map`).
2. **Highlight to Evaluator:**
   - Density-colored circles indicating cluster severity across Mumbai wards.
   - Click on the Bandra hotspot circle or pin marker.
   - The **Inspector Drawer** slides open showing:
     - Cluster Category (`Roads`)
     - Number of clustered complaints (12+ complaints)
     - Centroid GPS coordinates
     - High text cohesion indicator badge (recurring pothole complaints)
     - Direct links to inspect each individual grievance in that cluster.
   - Demonstrate the **"Recompute Hotspots"** button triggering the live DBSCAN microservice.

### Step 5: Admin Analytics Dashboard
1. Click **"Analytics"** (`http://localhost:5173/admin/analytics`).
2. **Highlight to Evaluator:**
   - **KPI Cards:** Total complaints, Resolution Rate (21%), Low Confidence Flags, Average Turnaround (2.4 days).
   - **Time-Series Stacked Area Chart:** Daily complaint velocity over 14, 30, 60, or 90 days across categories.
   - **Category Distribution Donut Chart:** Visual breakdown of grievances.
   - **Ward Volume Bar Chart:** Workload comparison showing Ward H/W, F/N, and L as high-volume zones.
   - **Resolution Progress Ring:** Circular animated indicator.

---

## 4. How to Run Locally

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL database (local or cloud like Supabase/Neon)

### Starting the Services
1. **FastAPI NLP & Clustering Service:**
   ```powershell
   cd nlp-service
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```
2. **Express Backend API:**
   ```powershell
   cd backend
   node src/server.js
   ```
3. **React Frontend:**
   ```powershell
   cd frontend
   npm run dev
   ```

### Running the End-to-End Automated Test Suite
```powershell
cd backend
node tests/e2e-test.js
```
Expected output: **19 PASSED, 0 FAILED**.

### Re-seeding the Demo Dataset
```powershell
cd backend
node db/seed-demo.js
```
Inserts 72 realistic Mumbai complaints across all 8 wards and 6 categories with staggered dates.
