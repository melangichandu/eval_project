# US-206: Filter Applications by Eligibility and Status

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-206 |
| **Phase** | 3 – Reviewer Workflow |
| **Related Stories** | US-206 (Filter by eligibility result and status) |
| **Persona** | Marcus Johnson (Reviewer) |
| **Priority** | Must Have |
| **Parent Dependencies** | US-202 (reviewer list), GET /api/applications supports query params |
| **Estimated Effort** | 4–5 hours |
| **Branch Name** | `feat/us-206-filters` |
| **Output Verification** | Two dropdowns (Eligibility, Status); list updates via server-side filter; URL or state reflects selection. All styles in index.css. |

---

## Business Requirements

1. **Eligibility filter**: A dropdown (or select) with options: "All", "Eligible", "Not Eligible". Selection triggers a new request to the server with a query parameter (e.g. eligibility=eligible | not_eligible). "All" means no eligibility filter. List shows only applications matching the selected eligibility (based on stored eligibility result: eligible = eligibilityScore === eligibilityTotal and both present; not eligible = otherwise).

2. **Status filter**: A dropdown with options: "All", "Submitted", "Under Review", "Approved", "Rejected". Selection triggers a new request with a query parameter (e.g. status=SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED). "All" means no status filter. List shows only applications with the selected status.

3. **Server-side filtering**: Backend GET /api/applications (for reviewer) must accept query parameters: eligibility (optional: "eligible" | "not_eligible"), status (optional: SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED). Apply filters in the database query (WHERE eligibility_score = eligibility_total AND eligibility_score IS NOT NULL for eligible; WHERE (eligibility_score IS NULL OR eligibility_score < eligibility_total) for not_eligible; WHERE status = ? for status). Return only matching rows. Pagination (if any) applies after filters.

4. **Combined filters**: Both filters can be applied at once. Example: Eligibility = "Eligible", Status = "Submitted" returns only submitted applications that are eligible.

5. **Default**: On load, both filters default to "All" (no query params). After user changes a filter, update the list immediately (debounce optional, not required for dropdown change).

6. **UI placement**: Filters appear above the application list on the reviewer dashboard. Label each dropdown ("Eligibility", "Status"). Use native select or custom dropdown; ensure accessible (label, focus, keyboard).

7. **Centralized styles**: All CSS in frontend/src/index.css. Add .filters-row, .filter-group, .filter-select. No inline or component-level CSS.

8. **Consistency**: Typography and form controls match the rest of the app. Filters do not submit a form; they trigger a data fetch on change.

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── ReviewerDashboard.jsx   # state: eligibilityFilter, statusFilter; two selects; on change set state and call getApplications(filters)
├── services/
│   └── api.js                  # getApplications({ eligibility?, status? }) → GET /api/applications?eligibility=&status=
└── index.css                   # .filters-row, .filter-group, .filter-select

backend: GET /api/applications?eligibility=eligible|not_eligible&status=SUBMITTED|... → WHERE clauses
```

### Data Flow

```
Reviewer opens dashboard
  → GET /api/applications (no params) → full list (or default)
  → User selects Eligibility "Eligible" → set state, GET /api/applications?eligibility=eligible
  → User selects Status "Submitted" → GET /api/applications?eligibility=eligible&status=SUBMITTED
  → List re-renders with server response
```

### Key Implementation Details

* **Backend**: In list handler (GET /api/applications), after auth and role check, read query.eligibility and query.status. Build WHERE: if eligibility === 'eligible' add (eligibility_score IS NOT NULL AND eligibility_score = eligibility_total); if eligibility === 'not_eligible' add (eligibility_score IS NULL OR eligibility_score < eligibility_total). If status add AND status = ?. Run query with these conditions. Return applications array.
* **Frontend**: ReviewerDashboard holds eligibilityFilter ('all'|'eligible'|'not_eligible') and statusFilter ('all'|'SUBMITTED'|...). Two <select> elements with onChange updating state and calling getApplications({ eligibility: eligibilityFilter === 'all' ? undefined : eligibilityFilter, status: statusFilter === 'all' ? undefined : statusFilter }). Pass params to API; rebuild list from response.
* **URL (optional)**: Update URL search params when filters change (e.g. useSearchParams) so bookmarking or back button restores filters; on load read params and set initial state. Not strictly required for DoD but improves UX.

### API Contract

**GET /api/applications**  
**Query params:** eligibility (optional: "eligible" | "not_eligible"), status (optional: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED").  
**Response 200:** { applications: Application[] } (or { applications, total } if paginated).  
**Auth:** Bearer token, role REVIEWER.

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Eligibility filter updates list"
    select "Eligible"
    assert list only shows eligible applications
    select "Not Eligible"
    assert list only shows not-eligible applications
    select "All"
    assert list shows all

  TEST "Status filter updates list"
    select "Submitted"
    assert list only shows submitted
    select "All"
    assert list shows all statuses

  TEST "Combined filters"
    set Eligibility "Eligible", Status "Approved"
    assert list shows only approved and eligible applications
```

### Unit (backend)

```pseudo
  TEST "list with eligibility=eligible returns only eligible apps"
  TEST "list with status=SUBMITTED returns only submitted"
  TEST "list with both params applies AND"
```

---

## Implementation Steps

1. **Backend**: Add query parsing for eligibility and status in GET /api/applications. Implement WHERE conditions for eligibility (eligible vs not_eligible) and status. Ensure reviewer still sees only allowed set (all applications); filters narrow that set.

2. **Frontend**: ReviewerDashboard – add two selects with labels. State: eligibilityFilter, statusFilter. On change: update state, call getApplications with current filters (only send param if not 'all'). Render list from response. Loading state during fetch.

3. **Styles**: In index.css add .filters-row (flex or grid), .filter-group (label + select), .filter-select. Match existing form styling. No inline CSS.

4. **Verify**: Each filter alone and combined produces correct subset; server returns correct counts; no inline or component-level CSS.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Labels | Each select has a visible <label> with for=id; id on select |
| Focus | Keyboard navigable; focus order: Eligibility → Status → list |
| Announcements | Optionally announce "List updated" after filter change (aria-live) |

---

## Security Requirements

1. **Authorization**: Filtered list still only for role REVIEWER; same auth as list.
2. **Validation**: Accept only allowed enum values for eligibility and status; ignore unknown params.

---

## Performance Requirements

1. **Single request per filter change**: One GET with new params; replace list. No client-side filtering of a full list unless list is small and not paginated (prefer server-side).
2. **Debounce**: Not required for select change; immediate fetch is acceptable.

---

## Definition of Done

- [ ] Eligibility dropdown (All, Eligible, Not Eligible) filters list via server.
- [ ] Status dropdown (All, Submitted, Under Review, Approved, Rejected) filters list via server.
- [ ] Both filters can be applied together; results match server logic.
- [ ] All styles in index.css; no inline or component-level CSS.
- [ ] Filters accessible (labels, keyboard); behavior consistent with dashboard.
