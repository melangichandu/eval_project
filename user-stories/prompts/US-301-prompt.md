# US-301: Administrator Summary Report

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-301 |
| **Phase** | 4 – Admin |
| **Related Stories** | US-301 (Admin sees summary: counts by status, total funds awarded) |
| **Persona** | Admin (system administrator) |
| **Priority** | Must Have |
| **Parent Dependencies** | Admin role and route protection, backend summary for admin |
| **Estimated Effort** | 4–5 hours |
| **Branch Name** | `feat/us-301-admin-summary` |
| **Output Verification** | Admin dashboard shows counts by status and total funds awarded; only ADMIN role can access. All styles in index.css. |

---

## Business Requirements

1. **Admin-only route**: A dedicated route (e.g. /admin or /admin/summary) protected so that only users with role ADMIN can access. Applicants and reviewers who hit this route receive 403 or redirect to their dashboard or login. Unauthenticated users redirect to login.

2. **Summary content**: On the admin summary page, display:
   * **Counts by status**: Same as reviewer summary—Submitted, Under Review, Approved, Rejected—but calculated across all applications in the system (no per-reviewer restriction). Use the same labels and layout pattern as US-205 for consistency.
   * **Total funds awarded**: Sum of award_amount for all applications with status APPROVED. Display as a single prominent value (e.g. "Total funds awarded: $X,XXX" or "Total awarded: $X,XXX"). Format as currency (no decimals for whole dollars).

3. **Data source**: Backend provides an admin-only endpoint (e.g. GET /api/admin/summary or GET /api/applications/summary with role ADMIN). Response: { submitted, underReview, approved, rejected, totalAwarded }. Same shape as reviewer summary but scope is all applications. Option: single GET /api/applications/summary that returns different scope based on role (reviewer = all apps they can see, admin = all apps). Either way, admin must not see reviewer-scoped data; admin sees system-wide counts.

4. **Layout**: Summary section with four status counts (cards or row) and a separate block or card for "Total funds awarded". Clear heading (e.g. "Grant program summary" or "Application summary"). Optionally add a brief note that this view is for administrators.

5. **Navigation**: Provide a way to reach the admin summary (e.g. "Admin" link in nav when user is admin, or direct URL). Provide a way back (e.g. "Dashboard" or "Back") if admin has another dashboard; otherwise this page can be the main admin landing.

6. **Centralized styles**: All CSS in frontend/src/index.css. Reuse .summary-counts, .summary-item from US-205 where possible; add .admin-summary or .total-awarded-block if needed. No inline or component-level CSS.

7. **Consistency**: Typography, cards, and number formatting match the rest of the app (and reviewer summary where applicable).

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── AdminSummary.jsx        # Protected route; fetch GET /api/admin/summary; render counts + total awarded
├── services/
│   └── api.js                  # getAdminSummary() → GET /api/admin/summary
├── router or App.jsx           # Route /admin or /admin/summary with AdminSummary; guard: require role ADMIN
└── index.css                   # reuse .summary-counts, .summary-item; .total-awarded-block

backend:
├── routes/
│   └── admin.js or applications.js   # GET /api/admin/summary (or /api/applications/summary with admin scope)
├── middleware/
│   └── requireAdmin.js         # require role === 'ADMIN'; 403 else
```

### Data Flow

```
Admin navigates to /admin (or /admin/summary)
  → Route guard: if !user or user.role !== 'ADMIN' → redirect or 403
  → GET /api/admin/summary with Bearer token
  → Backend: requireAdmin; SELECT status, COUNT(*), SUM(award_amount) FROM applications GROUP BY status; build { submitted, underReview, approved, rejected, totalAwarded }
  → Frontend: render summary block (four counts) + total awarded block
```

### Key Implementation Details

* **Backend**: New route GET /api/admin/summary. Middleware: authRequired, then requireAdmin (check req.user.role === 'ADMIN'; if not return 403). Handler: same aggregation as reviewer summary but no filter by reviewer_id—all applications. Return { submitted, underReview, approved, rejected, totalAwarded }.
* **Frontend**: AdminSummary page. On mount call getAdminSummary(). Render section with heading; four summary items (reuse structure from US-205); then a block for totalAwarded with formatted currency. Loading and error state (403 → show "Access denied" or redirect).
* **Route guard**: In React, if role is stored in context or from /me, guard the admin route: if user.role !== 'ADMIN' redirect to / or /reviewer. Optionally hide "Admin" link in nav for non-admins.

### API Contract

**GET /api/admin/summary**  
**Auth:** Bearer token, role ADMIN only.  
**Response 200:** { submitted: number, underReview: number, approved: number, rejected: number, totalAwarded: number }  
**Response 403:** Forbidden (non-admin).

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Admin sees summary and total awarded"
    login as admin, go to /admin
    assert four status counts visible
    assert total funds awarded visible and formatted as currency

  TEST "Non-admin cannot access admin summary"
    login as reviewer, navigate to /admin
    assert 403 or redirect to dashboard

  TEST "Unauthenticated cannot access"
    open /admin without login
    assert redirect to login or 401
```

### Unit (backend)

```pseudo
  TEST "admin summary returns system-wide counts and totalAwarded"
  TEST "admin summary returns 403 for reviewer"
  TEST "admin summary returns 401 for unauthenticated"
```

---

## Implementation Steps

1. **Backend**: Add requireAdmin middleware (check req.user.role === 'ADMIN'). Add GET /api/admin/summary using that middleware; implement aggregation over all applications; return { submitted, underReview, approved, rejected, totalAwarded }.

2. **Frontend**: Add route /admin (or /admin/summary) rendering AdminSummary. Guard: if user.role !== 'ADMIN' redirect. AdminSummary: fetch getAdminSummary(), render summary counts and total awarded block. Reuse summary layout from US-205; add total awarded section.

3. **Styles**: Use index.css only; reuse .summary-counts, .summary-item; add .total-awarded-block if needed. No inline or component-level CSS.

4. **Nav**: If app has role-based nav, add "Admin" link visible only when user.role === 'ADMIN'.

5. **Verify**: Only admin can access; counts and total awarded correct; layout and typography consistent; all styles in index.css.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Heading | Page has h1 (e.g. "Grant program summary") |
| Structure | Section/region for summary; semantic list or grid for counts |
| Numbers | Currency and counts readable by screen readers |

---

## Security Requirements

1. **Authorization**: Admin summary endpoint and route only for role ADMIN; 403 for reviewer and applicant.
2. **Data scope**: Admin sees system-wide data only; no exposure of other users’ PII beyond what’s necessary for counts and total (e.g. no list of applicants on this page unless required by another story).

---

## Performance Requirements

1. **Single aggregation**: One query for counts and sum; no N+1.
2. **Caching**: Optional short TTL cache for admin summary; not required for MVP.

---

## Definition of Done

- [ ] Admin-only route shows summary counts (Submitted, Under Review, Approved, Rejected) and total funds awarded.
- [ ] Only users with role ADMIN can access the page and API; others get 403 or redirect.
- [ ] Data from server; total awarded is sum of approved award_amount.
- [ ] All styles in index.css; no inline or component-level CSS.
- [ ] Layout and typography consistent with rest of app (and reviewer summary where applicable).
