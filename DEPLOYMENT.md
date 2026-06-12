# Production Deployment Guide (Render & Supabase)

This guide provides step-by-step instructions to deploy both the **Frontend** (React/Vite) and **Backend** (Node.js/Sequelize) of the Institute App on Render, connecting to your live **Supabase PostgreSQL** database.

You can deploy both frontend and backend together automatically using a single **Render Blueprint** (Option 1) or deploy them manually one by one (Option 2).

---

## Architecture Overview

```
┌─────────────────────────────────┐
│      Frontend (React/Vite)      │  --> Hosted on Render (Static Site)
│ (User opens app in browser)     │
└──────────────┬──────────────────┘
               │ (API Requests over HTTPS)
               ▼
┌─────────────────────────────────┐
│   Backend (Node.js/Sequelize)   │  --> Hosted on Render (Web Service)
│    (Handles APIs & Database)    │
└──────────────┬──────────────────┘
               │ (Secure SSL Queries)
               ▼
┌─────────────────────────────────┐
│   Database (PostgreSQL/Supabase)│  --> Hosted on Supabase (Cloud Database)
│   (Stores ambition_tutorials db)│
└─────────────────────────────────┘
```

---

## Step 1: Connect to Supabase (Database)

Ensure you have your Supabase PostgreSQL connection string ready. It should look like this:
```ini
postgresql://postgres.[PROJECT_ID]:[YOUR_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```
> [!TIP]
> Use the port `6543` (transaction pooler) connection string from Supabase settings for serverless/hosted web app deployments to manage connection spikes efficiently.

---

## Option 1: Unified Deployment via Render Blueprint (Recommended)

This method deploys both services together automatically, handles all compile settings, and wires the live backend URL directly to the frontend using the `render.yaml` file in your repository.

1. Sign up/Log in to [Render.com](https://render.com/).
2. On your Render dashboard, click **New +** -> **Blueprint**.
3. Connect your GitHub repository containing the `Institute_App` codebase.
4. Name your blueprint group (e.g. `institute-app-deployment`).
5. Render will automatically detect the `render.yaml` file and prompt you for configuration details:
   - **`DATABASE_URL`**: Paste your Supabase connection string.
   - **`JWT_SECRET`**: Render will generate a cryptographically secure value automatically (you can customize it if you wish).
6. Click **Apply**.
7. Render will automatically provision:
   - Your backend service (`institute-app-backend`) with the dynamic health check `/health` path.
   - Your frontend static site (`institute-app-frontend`) with the build configuration and compile-time backend URL variable `VITE_API_URL`.

---

## Option 2: Manual Service-by-Service Deployment

Use this option if you want to deploy the services separately or customize details outside the Blueprint specification.

### Part A: Deploy the Backend (Render Web Service)

1. Click **New +** -> **Web Service** on the Render dashboard.
2. Connect your GitHub repository.
3. Configure the service parameters:
   - **Name:** `institute-app-backend`
   - **Language:** `Node`
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Click **Advanced** and add the following **Environment Variables**:
   - `PORT` = `5000` *(Or let Render assign dynamically)*
   - `DATABASE_URL` = *(Your Supabase connection string)*
   - `JWT_SECRET` = *(Create a secure, random string for signing JWT tokens)*
5. Set the **Health Check Path** under the service Advanced settings:
   - **Health Check Path:** `/health`
6. Click **Create Web Service**. 
7. Once the build finishes, copy the live URL of your backend (e.g., `https://institute-app-backend.onrender.com`).

### Part B: Deploy the Frontend (Render Static Site)

1. On the Render dashboard, click **New +** -> **Static Site**.
2. Connect the same GitHub repository.
3. Configure the static site parameters:
   - **Name:** `institute-app-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
4. Click **Advanced** and add the following **Environment Variable**:
   - `VITE_API_URL` = *(Your live Render backend URL, e.g. `https://institute-app-backend.onrender.com`)*
5. Click **Create Static Site**.

---

## Step 4: Verification & Operations

1. Open your live frontend URL in the browser.
2. Confirm that registration, logins, and API operations reach your Render backend.
3. Because Sequelize is configured to auto-sync, it will automatically populate your Supabase database schema on startup:
   - If tables do not exist, Sequelize's `sync()` creates them.
   - If you want to insert the default role settings and sample datasets, run the seed script locally pointing to your Supabase URL (e.g., `DATABASE_URL=postgresql://... node seed.js`).
