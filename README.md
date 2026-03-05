# Maplewood County Community Development Grant Portal

Full-stack grant management system for the Maplewood County Community Development Grant Program. Applicants can register, submit applications with real-time eligibility feedback, and track status. Reviewers can list, filter, review, and approve or reject applications with auto-calculated award amounts.

## Tech Stack

- **Frontend:** React 18, Vite, React Router
- **Backend:** Node.js, Express
- **Database:** PostgreSQL
- **File storage:** Local filesystem (Docker volume); replace with S3 for AWS

## Prerequisites

- Node.js 18+
- Docker and Docker Compose (or `docker compose` v2)
- Git

## Setup Instructions

### Option A: Run with Docker Compose (recommended)

1. Clone the repository and go to the project root.

2. Create a `.env` file (optional; defaults work for local):

   ```bash
   cp .env.example .env
   # Edit .env to set JWT_SECRET and other values if desired.
   ```

3. Build and start all services:

   ```bash
   docker compose up -d --build
   ```

4. Seed reviewer accounts (run once after first start):

   ```bash
   docker compose run --rm -e DATABASE_URL=postgresql://postgres:postgres@postgres:5432/grantdb backend node scripts/seedReviewers.js
   ```

5. Open the app:

   - **App (via frontend container):** http://localhost:4000  
     If port 4000 is in use, change the frontend port in `docker-compose.yml` (e.g. `"4001:80"`).
   - **Backend API only:** http://localhost:8080  
   - **Health check:** http://localhost:8080/health

### Option B: Run locally without Docker

1. **PostgreSQL:** Create a database (e.g. `grantdb`) and run the schema:

   ```bash
   psql -U postgres -d grantdb -f database/schema.sql
   ```

2. **Backend:**

   ```bash
   cd backend
   cp ../.env.example .env
   # Set DATABASE_URL and JWT_SECRET in .env
   npm install
   node scripts/seedReviewers.js   # seed reviewers (uses DATABASE_URL from .env)
   npm run dev
   ```

   Backend runs at http://localhost:8080.

3. **Frontend:**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Frontend runs at http://localhost:4000 and proxies `/api` to the backend.

## Test Credentials

- **Applicant:** Register a new account from the landing page.
- **Reviewer:**  
  - Marcus Johnson: `marcus.johnson@maplewood.gov` / `Reviewer123`  
  - Sarah Mitchell: `sarah.mitchell@maplewood.gov` / `Reviewer123`

## Features Implemented

- [x] Applicant registration and login
- [x] Reviewer login (pre-seeded)
- [x] Two-section application form (Organization Info, Project Details)
- [x] Real-time eligibility engine (6 rules) on form and server-side on submit
- [x] File upload (PDF, JPG, PNG; max 5 MB)
- [x] Pre-submit review screen with eligibility warning
- [x] Applicant dashboard with application list and status
- [x] Reviewer dashboard with filters (eligibility, status) and summary counts
- [x] Reviewer application detail with eligibility panel
- [x] Approve with award calculation and breakdown; reject with required comment
- [x] Applicant view of approved award and rejection comments
- [x] JWT auth (30 min expiry), bcrypt passwords, role-based routes

## Eligibility Engine

- Implemented as a **shared module** used in both frontend and backend.
- **Frontend:** `frontend/src/services/eligibilityEngine.js` — runs on field change for real-time UI (green/red/gray).
- **Backend:** `backend/src/services/eligibilityEngine.js` — same rules; runs on POST `/api/applications` and result is stored with the application.
- Six rules: Nonprofit type, 2+ years operating, budget &lt; $2M, requested ≤ 50% of project cost, requested ≤ $50K, ≥ 50 beneficiaries.

## Award Calculator

- **Backend only:** `backend/src/services/awardCalculator.js`.
- Five factors (1–3 points each): Community Impact, Track Record, Category Priority, Financial Need, Cost Efficiency.
- Formula: `(TotalScore / 15) × Amount Requested`, rounded to nearest $100, cap $50,000.
- Breakdown is returned on POST `/api/applications/:id/award` and stored when status is set to APPROVED.

## API Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST   | /api/auth/register | No  | Register applicant |
| POST   | /api/auth/login    | No  | Login (returns JWT) |
| GET    | /api/applications  | Applicant | My applications |
| GET    | /api/applications/all | Reviewer | All applications (query: eligibility, status) |
| GET    | /api/applications/:id | Both | One application (authz by role) |
| POST   | /api/applications  | Applicant | Submit new application |
| POST   | /api/applications/:id/documents | Applicant | Upload file |
| PATCH  | /api/applications/:id/status | Reviewer | Set status (UNDER_REVIEW, APPROVED, REJECTED) |
| POST   | /api/applications/:id/award | Reviewer | Get award calculation |
| POST   | /api/eligibility/check | No | Server-side eligibility check (body: form data) |

## Known Limitations

- File storage is local (or Docker volume); for AWS, integrate S3 and presigned URLs.
- No email notifications or admin report page (stretch goals).
- Reviewer “Mark Under Review” is a separate action; workflow could auto-set UNDER_REVIEW on first open if desired.

## AWS Deployment (outline)

As per the implementation plan:

1. Push images to ECR; use RDS PostgreSQL and S3 for storage.
2. Run ECS (Fargate) for frontend and backend; ALB with path-based routing (`/api` → backend, default → frontend).
3. Store `DATABASE_URL` and `JWT_SECRET` in Secrets Manager; grant ECS task role access to S3 and secrets.
4. Run `database/schema.sql` and the reviewer seed (or equivalent) against RDS when provisioning.

## License

Internal / evaluation use.
