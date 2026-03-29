# Admission Management & CRM (Edumerge assignment)

Web app for college admission: master data, quota-based seat matrix, applicants, government/management allocation flows, fee and document tracking, admission numbers, and role-based dashboards.

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT auth  
- **Frontend:** React 18 (Create React App / `react-scripts`, not Vite), TypeScript, Material UI v6  
- **Roles:**  
  - **admin** — Master setup + seat matrix / quotas only (no applicants or allocation API).  
  - **admission_officer** — Applicants, documents/fees, seat allocation, confirmation.  
  - **management** — Dashboard only (read-only).  
  UI nav and API both enforce this; role comes from JWT + `/auth/me`.

## Prerequisites

- Node.js 18+  
- MongoDB — **replica set** required for allocation transactions (Atlas is already a replica set). For a **local** single-node replica set after install:

```bash
mongod --replSet rs0 --port 27017 --dbpath C:\data\db
```

Then in `mongosh`: `rs.initiate()`.

Alternatively use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) free tier and set `MONGODB_URI` in `backend/.env`.

## Setup

### 1. MongoDB

Ensure MongoDB is reachable, e.g. `mongodb://127.0.0.1:27017/admission_crm`.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env if needed (MONGODB_URI, JWT_SECRET, PORT)
npm install
npm run seed
npm run dev
```

API default: `http://localhost:4000`  
Health check: `GET http://localhost:4000/api/health`

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

App opens at `http://localhost:3000`. The dev server proxies `/api` to `http://localhost:4000` (see `frontend/package.json` `proxy`).

### 4. Demo users (`npm run seed`)

| Email               | Password   | Role               |
|---------------------|------------|--------------------|
| admin@demo.edu      | Demo@123   | Admin              |
| officer@demo.edu    | Demo@123   | Admission officer  |
| mgmt@demo.edu       | Demo@123   | Management (dashboard only) |

Seed also creates sample institution → campus → department → program, academic year **2026**, and intake **100** with quotas KCET 40 / COMEDK 30 / Management 30 plus **5** supernumerary seats.

## Demo journey (local)

1. **Admin:** Sign in → **Master setup** + **Seat matrix** only (no Applicants menu).  
2. **Officer** (`officer@demo.edu`): **Applicants** → create applicant → **Seat allocation** → government or management flow → documents **Verified**, fee **Paid** → **Confirm** → admission number e.g. `INST/2026/UG/CSE/KCET/0001`.  
3. **Management:** Dashboard only — intake vs admitted, quota fill, remaining seats, pending docs count, fee pending sample.

## Business rules implemented

- **Applicant form:** compact create flow (single full-address and guardian fields); government **allotment number** is entered on **Seat allocation**, not when creating the applicant.
- **Documents:** checklist statuses plus optional **document file name** when the officer picks a file (filename only — no server-side file storage).
- Sum of quota seats must equal program total intake (enforced on create/update).  
- No allocation when quota is full; optional **supernumerary** overflow with separate counter.  
- Optional **J&K institution cap** on `Institution` (`jkCapTotal` / `jkCapUsed`).  
- Admission number generated **once** on confirmation (atomic counter per institution/year/branch/quota).  
- Confirmation only if status is **Allocated**, documents **Verified**, fee **Paid**.  
- Allocations use MongoDB **transactions** to keep intake counters consistent.

## Production build (frontend)

```bash
cd frontend
npm run build
```

Serve the `frontend/build` folder with any static host; configure the API base URL (e.g. reverse proxy `/api` to the Express server).

## AI assistance disclosure

This project was developed with **AI assistance** (Cursor / Claude): scaffolding of Express + Mongoose models and routes, React + MUI pages, allocation/transaction logic, dashboard aggregations, README structure, and iterative fixes. You should run and test locally before submission.

**Human review recommended for:** security (JWT secret, HTTPS), production MongoDB tuning, accessibility, and any institution-specific rules not covered in the minimal scope.

## Submission note (Edumerge)

After setup, email **careers@edumerge.com** with subject: **Assignment for Junior Software Developer**, and share the GitHub repository link with this README and a short demo (local steps above or a hosted deployment).
