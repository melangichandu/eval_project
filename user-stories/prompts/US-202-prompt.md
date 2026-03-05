# US-202: List All Applications with Eligibility Status

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-202 |
| **Phase** | 3 – Reviewer Workflow |
| **Related Stories** | US-202 (List all applications with eligibility status) |
| **Persona** | Marcus Johnson (Reviewer) |
| **Priority** | Must Have |
| **Parent Dependencies** | US-201 (reviewer dashboard), GET /api/applications/all |
| **Estimated Effort** | 4–5 hours |
| **Branch Name** | `feat/us-202-reviewer-list` |
| **Output Verification** | Dashboard shows table with required columns; sorted oldest first; "Review" opens detail. All styles in index.css. |

---

## Business Requirements

1. **Endpoint**: GET /api/applications/all (authenticated, role REVIEWER only). Returns all applications (no filter by applicant). Each item includes: id, organizationName (or applicant org name), projectTitle, submittedAt, eligibilityScore, eligibilityTotal, status. Order by submittedAt ascending (oldest first) unless spec says otherwise.

2. **Eligibility display**: For each row, show "Eligible" when eligibilityScore === eligibilityTotal (e.g. 6 of 6); otherwise "Not Eligible". Use consistent styling (e.g. badge or colored text via CSS class).

3. **Columns**: Application ID (truncated or last 8 chars), Organization Name, Project Title, Date Submitted, Eligibility Status (Eligible/Not Eligible), Application Status (SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED — use consistent labels), and action "Review" (or "View") linking to /reviewer/application/:id.

4. **Loading and errors**: Show loading state while fetching. On 403/500, show user-friendly message; optionally retry. Do not expose stack traces.

5. **Empty state**: When the list is empty (no applications in system), show a message (e.g. "No applications yet.") instead of an empty table.

6. **Centralized styles**: All CSS in frontend/src/index.css. Add .reviewer-table, .reviewer-table th, .reviewer-table td, .badge-eligible, .badge-not-eligible, status badge classes. Use design tokens for colors. No inline or component-level CSS. Table responsive (e.g. horizontal scroll on small screens).

7. **Consistency**: Typography, table spacing, and button/link style match the rest of the app.

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── ReviewerDashboard.jsx  # getAllApplications(); render table; columns per spec; "Review" link
├── components/
│   └── StatusBadge.jsx         # Reuse for application status
├── services/
│   └── api.js                 # getAllApplications() → GET /api/applications/all
└── index.css                   # .reviewer-table, .badge-eligible, .badge-not-eligible

backend/src/
├── routes/applications.js      # GET /all, requireRole('REVIEWER'), applicationController.listAll
├── controllers/applicationController.js  # listAll: SELECT with optional filters; order by submitted_at ASC
```

### Data Flow

```
ReviewerDashboard mounts
  → getAllApplications() → GET /api/applications/all with Bearer token
  → Backend: authRequired, requireRole('REVIEWER'), SELECT applications (join users for org name if needed), order by submitted_at ASC
  → Response: array of { id, projectTitle, submittedAt, status, eligibilityScore, eligibilityTotal, organizationName or orgName }
  → Frontend: set list in state; map to table rows; eligibility = score === total ? 'Eligible' : 'Not Eligible'; StatusBadge(status); link to /reviewer/application/:id
```

### Key Implementation Details

* **listAll**: No applicant_id filter. Join users to get applicant name or org name for display. ORDER BY submitted_at ASC. Return fields needed for list only (id, projectTitle, submittedAt, status, eligibilityScore, eligibilityTotal, organizationName or applicant org).
* **Frontend**: Table with thead (Application ID, Organization, Project Title, Date Submitted, Eligibility, Status, Action). tbody map list to tr; "Review" is <Link to={`/reviewer/application/${app.id}`}>Review</Link>. Format date with toLocaleDateString(). Eligibility: <span className={app.eligibilityScore === app.eligibilityTotal ? 'badge-eligible' : 'badge-not-eligible'}>{eligible ? 'Eligible' : 'Not Eligible'}</span>.
* **Status**: Use StatusBadge component with app.status; ensure .badge-submitted, .badge-under-review, .badge-approved, .badge-rejected exist in index.css.

### API Contract

**Request:** GET /api/applications/all  
**Headers:** Authorization: Bearer <JWT>

**Response 200:** Array of { id, projectTitle, submittedAt, status, eligibilityScore, eligibilityTotal, organizationName or orgName, applicantName (optional) }.  
**Response 403:** Not reviewer.

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Reviewer dashboard shows application list"
    login as reviewer, ensure at least one application exists
    assert table has columns: Application ID, Organization, Project Title, Date, Eligibility, Status
    assert at least one row; "Review" link present

  TEST "Eligibility shows Eligible when 6 of 6"
    application with eligibilityScore=6, eligibilityTotal=6
    assert cell shows "Eligible" with expected styling

  TEST "Click Review opens application detail"
    click "Review" on first row
    assert navigate to /reviewer/application/:id

  TEST "List sorted oldest first"
    assert first row submittedAt <= second row submittedAt
```

### Unit (backend)

```pseudo
  TEST "listAll returns all applications for reviewer"
  TEST "listAll returns 403 for applicant"
```

---

## Implementation Steps

1. **Backend**: Implement listAll in applicationController: SELECT applications (join users for applicant/org name), ORDER BY submitted_at ASC. Route GET /all with authRequired and requireRole('REVIEWER').

2. **Frontend**: ReviewerDashboard – useEffect getAllApplications(); loading and error state; map list to table rows with required columns; eligibility badge; StatusBadge; Link to /reviewer/application/:id. Empty state when list.length === 0.

3. **Styles**: In index.css add .reviewer-table, thead/th, tbody/td, .badge-eligible, .badge-not-eligible. Ensure status badge classes exist. Responsive: overflow-x auto on table container if needed. No inline CSS.

4. **Verify**: Only reviewers can load list; sort order correct; eligibility and status display correctly; "Review" navigates to detail.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Table | <table>, <thead>, <tbody>, <th scope="col">, <td> |
| Links | "Review" is descriptive; avoid "Click here" |
| Empty state | Message when no rows; heading or paragraph for context |

---

## Security Requirements

1. **Authorization**: GET /api/applications/all only for role REVIEWER; 403 for others. Use parameterized queries.
2. **Data**: Return only fields needed for list; do not expose sensitive applicant data beyond what is required.

---

## Performance Requirements

1. Fetch list once on mount. Return only list-needed fields from API to keep payload small.
2. Consider pagination or virtual scroll only if list is very large (optional for this story).

---

## Responsive / Device-Aware

| Element | Mobile | Desktop |
|:--------|:-------|:--------|
| Table | Horizontal scroll or card list per row | Full table |
| Links | 44px min touch target | Same |

---

## Definition of Done

- [ ] Dashboard shows applications sorted by date (oldest first).
- [ ] Each row shows: Application ID, Organization Name, Project Title, Date Submitted, Eligibility (Eligible/Not Eligible), Status.
- [ ] "Review" link opens application detail.
- [ ] All styles in index.css; no inline or component-level CSS.
- [ ] Only reviewers can access; backend returns 403 for applicants.
- [ ] Loading and empty state handled.
