# US-103: Applicant Dashboard

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-103 |
| **Phase** | 2 – Applicant Application Flow |
| **Related Stories** | US-103 (Applicant dashboard) |
| **Persona** | Diana Torres (Applicant) |
| **Priority** | Must Have |
| **Parent Dependencies** | US-101/US-102 (auth), GET /api/applications implemented |
| **Estimated Effort** | 3–4 hours |
| **Branch Name** | `feat/us-103-applicant-dashboard` |
| **Output Verification** | Dashboard shows list of applicant's applications with required columns; empty state when none. Only applicant's data; 403 for non-applicant. All styles in `frontend/src/index.css`. |

---

## Business Requirements

1. **Dashboard page**: Protected route (e.g. `/dashboard`). Only users with role APPLICANT may access; redirect others to login or reviewer dashboard. Show welcome message using user's first name (e.g. "Welcome, Diana").

2. **Primary action**: "Start New Application" button (primary CTA) linking to the application form (e.g. `/apply`).

3. **When applications exist**: Display a table (or card list) with one row per application. Each row must show:
   * Application ID (e.g. full UUID or truncated such as first 8 chars + "…")
   * Project Title
   * Date Submitted (formatted, e.g. locale date)
   * Status (e.g. SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED — use consistent labels/badges)
   * Award Amount (if status is APPROVED; formatted as currency, e.g. $24,000; otherwise "—" or blank)
   * Action: "View" (or similar) linking to application detail (e.g. `/application/:id`).

4. **When no applications**: Empty state with a short, friendly message (e.g. "You haven't submitted any applications yet.") and a prominent "Start New Application" button. Do not show an empty table.

5. **Loading and errors**: Show a loading indicator while fetching. On API error (4xx/5xx), display a user-friendly message and optionally a retry action. Do not expose stack traces or internal errors.

6. **Centralized styles**: All CSS in `frontend/src/index.css`. Add classes such as `.dashboard-welcome`, `.applications-table`, `.empty-state`, `.status-badge` only in that file. No inline or component-level CSS.

7. **Consistency**: Table or list uses same typography, button style, and spacing as the rest of the app. Status badges and currency formatting consistent across views.

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── ApplicantDashboard.jsx   # Fetch list, welcome, table/empty state, "Start New Application"
├── components/
│   └── StatusBadge.jsx          # Renders status with correct class (e.g. .badge-approved)
├── services/
│   └── api.js                   # getMyApplications() → GET /api/applications (Bearer token)
└── index.css                     # .applications-table, .empty-state, status badges, etc.

backend/src/
├── routes/applications.js        # GET / (authRequired, requireRole('APPLICANT')) → applicationController.listMine
├── controllers/applicationController.js  # listMine: SELECT * FROM applications WHERE applicant_id = $1 ORDER BY submitted_at DESC
```

### Data Flow

```
User navigates to /dashboard (authenticated, APPLICANT)
  → Protected route renders ApplicantDashboard
  → useEffect: getMyApplications() → GET /api/applications with Authorization: Bearer <token>
  → Backend: verify JWT, check role APPLICANT, SELECT applications WHERE applicant_id = req.user.id
  → Response: array of { id, projectTitle, submittedAt, status, awardAmount, ... }
  → Frontend: set list in state; render table or empty state; "View" links to /application/:id
```

### Key Implementation Details

* **Backend**: Middleware chain: authRequired (extract user from JWT), requireRole('APPLICANT'). Query must use req.user.id (from JWT) in WHERE clause. Return only columns needed for list view. Order by submitted_at DESC (newest first) unless spec says otherwise.
* **Frontend**: On mount, call getMyApplications(). Map response to rows; format date (e.g. new Date(submittedAt).toLocaleDateString()), format awardAmount (e.g. Number(amount).toLocaleString() with currency). Use StatusBadge with status prop for consistent styling.
* **Empty state**: When list.length === 0, render empty state block instead of table.

### API Contract

**Request:** `GET /api/applications`  
**Headers:** `Authorization: Bearer <JWT>`

**Response 200:** Array of application objects, each including at least: `id`, `projectTitle`, `submittedAt`, `status`, `awardAmount` (null if not approved).  
**Response 401:** Missing or invalid token.  
**Response 403:** Valid token but role not APPLICANT.

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Dashboard shows when logged in as applicant"
    login as applicant, navigate to /dashboard
    assert "Welcome" or user name visible
    assert "Start New Application" button visible

  TEST "Dashboard shows application list when applicant has applications"
    seed 1 application for applicant, login, go to /dashboard
    assert table has at least 1 row with Project Title, Date, Status
    assert "View" or similar link present

  TEST "Empty state when no applications"
    login as applicant with zero applications
    assert empty state message visible
    assert "Start New Application" in empty state

  TEST "Applicant cannot access reviewer dashboard"
    login as applicant, navigate to /reviewer
    assert redirected to /dashboard or 403
```

### Unit (backend)

```pseudo
  TEST "listMine returns only applications for authenticated applicant"
  TEST "listMine returns 403 when role is REVIEWER"
```

---

## Implementation Steps

1. **Backend**: Ensure GET /api/applications is implemented with authRequired + requireRole('APPLICANT'), query by applicant_id, return list with required fields.

2. **Frontend**: ApplicantDashboard – getStoredUser() for welcome name; getMyApplications() in useEffect; loading state; error state; conditional render: list.length > 0 ? table : empty state. "Start New Application" links to /apply; "View" links to /application/:id.

3. **Styles**: In index.css add .applications-table (and thead/tbody if table), .empty-state, ensure .badge-* classes exist for status. No inline CSS.

4. **StatusBadge**: Component that accepts status prop and renders span with appropriate class (e.g. badge-submitted, badge-approved). Classes defined in index.css.

5. **Verify**: Only applicant's applications shown; empty state and list state both render correctly; styles consistent.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Table | Use <table>, <thead>, <tbody>, <th>, <td>; optionally scope="col" on headers |
| Links | "View" and "Start New Application" are focusable, descriptive (avoid "Click here") |
| Empty state | Heading or paragraph so screen readers understand context |
| Loading | Announce loading state (e.g. aria-busy or live region) |

---

## Security Requirements

1. **Authorization**: Backend must filter by applicant_id from JWT; never return another applicant's data.
2. **Token**: GET /api/applications requires valid JWT; 401 if missing/expired, 403 if wrong role.

---

## Performance Requirements

1. Fetch list once on mount; do not refetch on every render.
2. Return only fields needed for list (id, projectTitle, submittedAt, status, awardAmount) to keep payload small.

---

## Responsive / Device-Aware

| Element | Mobile | Desktop |
|:--------|:-------|:--------|
| Table | Horizontal scroll if needed; or card list per row |
| Buttons | Full width or 44px min height |
| Empty state | Centered, readable text |

---

## Definition of Done

- [ ] Dashboard shows list of all submitted applications for the logged-in applicant.
- [ ] Each row shows: Application ID, Project Title, Date Submitted, Status, Award Amount (if approved).
- [ ] Empty state shows message and "Start New Application" button.
- [ ] "Start New Application" links to application form.
- [ ] "View" links to application detail for that id.
- [ ] All styles in `frontend/src/index.css` only.
- [ ] Only APPLICANT can access; 403 for others. Backend filters by applicant_id.
- [ ] Loading and error states handled.
- [ ] Status and currency formatting consistent.
