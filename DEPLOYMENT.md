# 🚀 Civic Grievance Intelligence Dashboard — Deployment Guide

This guide walks you through deploying the complete Civic Grievance Intelligence Dashboard to production using free tiers:

| Component | Technology | Target Platform | Free Tier |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 19 + Vite | **Vercel** | Free |
| **Backend API** | Node.js + Express | **Render** | Free |
| **NLP Microservice** | Python + FastAPI | **Render** | Free |
| **Database** | PostgreSQL | **Supabase** | Free (Already Connected) |

---

## 📋 Table of Contents
1. [Step 1: Commit and Push to GitHub](#step-1-commit-and-push-to-github)
2. [Step 2: Deploy NLP Microservice on Render](#step-2-deploy-nlp-microservice-on-render)
3. [Step 3: Deploy Backend API on Render](#step-3-deploy-backend-api-on-render)
4. [Step 4: Deploy Frontend on Vercel](#step-4-deploy-frontend-on-vercel)
5. [Step 5: Connect and Verify End-to-End](#step-5-connect-and-verify-end-to-end)
6. [Alternative: Deploy via Render Blueprint (render.yaml)](#alternative-deploy-via-render-blueprint)
7. [Environment Variables Reference](#environment-variables-reference)

---

## Step 1: Commit and Push to GitHub

The repository is already configured with `.gitignore` to safely omit sensitive credentials (`.env` files) while including the trained classification model (`classifier.joblib`).

Run the following in your project root terminal (`d:\idea_lab_05`):

```bash
# 1. Stage all files
git add .

# 2. Create the commit
git commit -m "feat: complete civic grievance dashboard ready for deployment"

# 3. Create a repository on GitHub (e.g. named civic-grievance-dashboard)
# 4. Link your remote repository (replace with your GitHub URL):
git remote add origin https://github.com/<YOUR_USERNAME>/civic-grievance-dashboard.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy NLP Microservice on Render

Render hosts Python web services seamlessly on its free tier.

1. Go to [dashboard.render.com](https://dashboard.render.com) and log in.
2. Click **New +** → **Web Service**.
3. Choose **Build and deploy from a Git repository** and connect your `civic-grievance-dashboard` repo.
4. Fill in the service configuration:
   - **Name:** `civic-nlp-service`
   - **Region:** Singapore / Frankfurt / Oregon (nearest to you or your Supabase region)
   - **Branch:** `main`
   - **Root Directory:** `nlp-service`
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. Click **Advanced** → **Add Environment Variable**:
   - `PYTHON_VERSION` = `3.11.9`
   - `DATABASE_URL` = *(Your Supabase connection string)*
   - `MODEL_PATH` = `./models/classifier.joblib`
   - `CONFIDENCE_THRESHOLD` = `0.6`
6. Click **Create Web Service**.
7. Once deployed, note down the service URL, e.g.:
   ```
   https://civic-nlp-service.onrender.com
   ```
8. Verify it by visiting `https://civic-nlp-service.onrender.com/health` in your browser. You should see:
   `{"status": "ok", "model_loaded": true}`.

---

## Step 3: Deploy Backend API on Render

1. On [Render Dashboard](https://dashboard.render.com), click **New +** → **Web Service**.
2. Select the same GitHub repository.
3. Configure the service:
   - **Name:** `civic-backend`
   - **Region:** Same region as NLP service
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`
4. Click **Advanced** → **Add Environment Variable**:
   - `NODE_VERSION` = `20`
   - `DATABASE_URL` = *(Your Supabase connection string)*
   - `JWT_SECRET` = *(Generate a random 32+ character string or use your local one)*
   - `NLP_SERVICE_URL` = `https://civic-nlp-service.onrender.com` *(from Step 2)*
   - `UPLOAD_DIR` = `./uploads`
   - `FRONTEND_URL` = `*` *(We will restrict this to your Vercel URL in Step 5)*
5. Click **Create Web Service**.
6. Wait for the build to finish. Your backend will be available at:
   ```
   https://civic-backend.onrender.com
   ```
7. Verify it by visiting `https://civic-backend.onrender.com/api/health`. You should see:
   `{"status": "ok", "timestamp": "..."}`.

---

## Step 4: Deploy Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** → **Project**.
3. Import your `civic-grievance-dashboard` GitHub repository.
4. In the **Configure Project** screen:
   - **Project Name:** `civic-grievance-dashboard` (or custom)
   - **Framework Preset:** `Vite`
   - **Root Directory:** Click **Edit** and select `frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `dist` (default)
5. Expand **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://civic-backend.onrender.com/api` *(Make sure to include `/api` at the end!)*
6. Click **Deploy**.
7. Within ~45 seconds, your frontend will be live at:
   ```
   https://your-project.vercel.app
   ```

---

## Step 5: Connect and Verify End-to-End

### 1. Update Backend CORS (Security)
Now that your Vercel frontend is live:
1. Go to Render → `civic-backend` → **Environment**.
2. Update `FRONTEND_URL` to:
   ```
   https://your-project.vercel.app
   ```
3. Save changes (Render will trigger a quick redeploy).

### 2. End-to-End Test Walkthrough
1. **Submit Complaint:**
   - Go to `https://your-project.vercel.app/submit`
   - Type a description: *"Massive water leak near Central Library blocking the lane"*
   - Observe the live NLP indicator auto-detecting **Water Supply** with high confidence.
   - Attach a photo and pin location.
   - Click **Submit Complaint** → Note your tracking ID (e.g., `GD-10008`).
2. **Track Complaint:**
   - Go to `https://your-project.vercel.app/track`
   - Enter your reference ID or phone number.
   - Verify that the status timeline, GIS coordinates, and uploaded evidence photo load cleanly.
3. **Admin Dashboard:**
   - Go to `https://your-project.vercel.app/admin/login`
   - Log in with your admin credentials (`admin@civic.gov` / `Admin@123`).
   - Test:
     - **Overview:** Review KPI tiles and recent activity.
     - **Analytics:** Inspect resolution breakdown, cluster topics, and department velocity.
     - **GIS Map:** Explore hotspot clusters and ward filters.
     - **Grievances:** Change status to **In Progress** or **Resolved** and add an admin note.

---

## Alternative: Deploy via Render Blueprint

We have included a pre-configured `render.yaml` blueprint in the repository root.

If you prefer deploying both backend and NLP service together in one click:
1. Push this repo to GitHub.
2. Go to [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints).
3. Click **New Blueprint Instance**.
4. Select your repo.
5. Render will automatically detect both services from `render.yaml`!
6. Provide the `DATABASE_URL` prompt when asked.

---

## Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `PORT` | Listening port (Render sets automatically) | `5000` |
| `DATABASE_URL` | Supabase PostgreSQL URI | `postgresql://postgres:...@...supabase.com:5432/postgres` |
| `JWT_SECRET` | Secret key for signing admin auth tokens | `min-32-character-random-hex-string` |
| `NLP_SERVICE_URL` | Public URL of the deployed NLP service | `https://civic-nlp-service.onrender.com` |
| `FRONTEND_URL` | URL of the frontend for CORS whitelist | `https://your-app.vercel.app` |
| `UPLOAD_DIR` | Directory where uploaded files are kept | `./uploads` |

### NLP Service (`nlp-service/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase PostgreSQL URI (for DB clustering queries) | `postgresql://postgres:...@...supabase.com:5432/postgres` |
| `MODEL_PATH` | Relative or absolute path to trained model | `./models/classifier.joblib` |
| `CONFIDENCE_THRESHOLD` | Threshold for category suggestion acceptance | `0.6` |

### Frontend (`frontend/.env`)
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Complete backend API endpoint | `https://civic-backend.onrender.com/api` |

---

🎉 **You are now ready to deploy! Everything is prepared, built, and verified.**
