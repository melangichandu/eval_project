# US-205: Summary Counts by Status on Reviewer Dashboard

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-205 |
| **Phase** | 3 – Reviewer Workflow |
| **Related Stories** | US-205 (Summary counts: Submitted, Under Review, Approved, Rejected) |
| **Persona** | Marcus Johnson (Reviewer) |
| **Priority** | Must Have |
| **Parent Dependencies** | US-202 (reviewer dashboard list), backend counts endpoint or aggregated in list response |
| **Estimated Effort** | 2–3 hours |
| **Branch Name** | `feat/us-205-summary-counts` |
| **Output Verification** | Dashboard shows X Submitted, Y Under Review, Z Approved ($total), W Rejected. Counts and total match backend. All styles in index.css. |

---

## Business Requirements

1. **Summary block**: On the reviewer dashboard (same page as the application list), display a summary section with four counts:
   * **Submitted**: Count of applications with status SUBMITTED.
   * **Under Review**: Count of applications with status UNDER_REVIEW.
   * **Approved**: Count of applications with status APPROVED, plus total funds awarded (sum of award_amount for approved applications). Display as "Z Approved ($X,XXX total)" or "Z Approved – $X,XXX total".
   * **Rejected**: Count of applications with status REJECTED.

2. **Data source**: Counts and total must come from the server (single source of truth). Options: (a) GET /api/applications/summary returns { submitted, underReview, approved, rejected, totalAwarded }; (b) or GET /api/applications (list) response includes a summary object with these fields. Reviewer sees only applications they are allowed to see (all applications in the system for reviewer role). Counts must reflect the same dataset as the list (e.g. if filters are applied to list, summary may be global or filtered—spec: summary is global for reviewer, not filtered by eligibility/status filter from US-206).

3. **Placement**: Summary appears above the application list (or in a sidebar). Use cards or a compact row of four items. Each item: label (e.g. "Submitted") and count; for Approved also show total amount formatted as currency ($X,XXX).

4. **Formatting**: Numbers formatted with locale (e.g. 1,234). Currency with no decimals for whole amounts (e.g. $45,000). Use consistent typography from index.css.

5. **Centralized styles**: All CSS in frontend/src/index.css. Add classes such as .summary-counts, .summary-item. No inline or component-level CSS.

6. **Consistency**: Matches dashboard layout; responsive if dashboard is responsive (summary stacks or wraps on small screens).

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── ReviewerDashboard.jsx   # fetch summary (or from list response); render summary block then list
├── services/
│   └── api.js                  # getApplicationsSummary() → GET /api/applications/summary (or summary in list response)
└── index.css                   # .summary-counts, .summary-item

backend: GET /api/applications/summary (auth, role REVIEWER) → { submitted, underReview, approved, rejected, totalAwarded }
  OR: GET /api/applications returns { summary: {...}, applications: [...] }
```

### Data Flow

```
Reviewer opens dashboard
  → GET /api/applications/summary (or GET /api/applications with summary)
  → Backend: COUNT(*) GROUP BY status; SUM(award_amount) WHERE status = 'APPROVED'
  → Frontend: render summary block with four items; then render list (existing US-202)
```

### Key Implementation Details

* **Backend**: New route GET /api/applications/summary. Auth required; if role !== REVIEWER return 403. Query: SELECT status, COUNT(*), SUM(award_amount) FROM applications GROUP BY status; then build { submitted, underReview, approved, rejected, totalAwarded }. totalAwarded is sum of award_amount where status = 'APPROVED' (or 0).
* **Frontend**: On mount, call getApplicationsSummary(). State: summary = { submitted, underReview, approved, rejected, totalAwarded }. Render a row or grid of four .summary-item elements. Format totalAwarded as currency (e.g. new Intl.NumberFormat('en-US', { style: 'currency', maximumFractionDigits: 0 }).format(totalAwarded)).
* **Alternative**: If list endpoint already returns all applications for reviewer, summary could be computed client-side from that list—but server-side summary is preferred for consistency and performance when list is paginated.

### API Contract

**GET /api/applications/summary**  
**Auth:** Bearer token, role REVIEWER.  
**Response 200:**  
{ submitted: number, underReview: number, approved: number, rejected: number, totalAwarded: number }

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Summary shows four counts"
    open reviewer dashboard
    assert "Submitted" count visible
    assert "Under Review" count visible
    assert "Approved" with total amount visible
    assert "Rejected" count visible

  TEST "Approved total matches sum of approved awards"
    create/seed approved apps with known award amounts
    assert displayed total equals sum
```

### Unit (backend)

```pseudo
  TEST "summary returns counts by status and totalAwarded for APPROVED"
  TEST "summary returns 403 for non-reviewer"
```

---

## Implementation Steps

1. **Backend**: Add GET /api/applications/summary. In applicationController or applications route: authRequired, requireReviewer; run aggregation query; return { submitted, underReview, approved, rejected, totalAwarded }.

2. **Frontend**: ReviewerDashboard – add getApplicationsSummary() call in useEffect (parallel to list fetch or before). Render summary block above list: four items with labels and counts; Approved item also shows formatted totalAwarded.

3. **Styles**: In index.css add .summary-counts (container), .summary-item (each card/cell). Use existing .card or grid. No inline CSS.

4. **Verify**: Counts match database; total awarded correct; only reviewers see summary; layout responsive if required.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Structure | Section or region with heading "Application summary" or aria-label |
| Numbers | Use semantic markup; ensure screen reader reads counts and currency correctly |

---

## Security Requirements

1. **Authorization**: Summary endpoint only for role REVIEWER; 403 for applicant or unauthenticated.

---

## Performance Requirements

1. **Single query**: Use one aggregation query (GROUP BY status, SUM for approved) rather than multiple COUNT queries.
2. **Cache**: Optional short-lived cache (e.g. 30s) for summary if list is heavy; not required for MVP.

---

## Definition of Done

- [ ] Reviewer dashboard shows Submitted, Under Review, Approved (with total $), Rejected counts.
- [ ] Data from server; counts and total awarded correct.
- [ ] All styles in index.css; no inline or component-level CSS.
- [ ] Summary only visible to reviewers; layout consistent with dashboard.
