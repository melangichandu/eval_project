# US-109: See Award Amount When Approved

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-109 |
| **Phase** | 2 – Applicant Application Flow |
| **Related Stories** | US-109 (See award amount if approved) |
| **Persona** | Diana Torres (Applicant) |
| **Priority** | Must Have |
| **Parent Dependencies** | Backend stores award_amount on approval (US-204); GET /api/applications and GET /api/applications/:id return awardAmount |
| **Estimated Effort** | 2 hours |
| **Branch Name** | `feat/us-109-award-amount-display` |
| **Output Verification** | Approved applications show award amount on dashboard and application detail; formatted as currency. Only applicant's data. All styles in index.css. |

---

## Business Requirements

1. **Dashboard**: In the applicant dashboard application list (US-103), for each application with status APPROVED, display the award amount in the "Award Amount" column (or equivalent). Format as currency (e.g. $24,000) using a consistent locale or formatter. For non-approved statuses (SUBMITTED, UNDER_REVIEW, REJECTED), show "—" or blank so the column layout is consistent.

2. **Application detail**: When the applicant views their own application (e.g. `/application/:id`) and the status is APPROVED, display the award amount prominently (e.g. near the status badge or in a dedicated "Award" section). Optionally show a short note that the amount was calculated based on the program's criteria. For non-approved applications, do not show an award amount (or show "—").

3. **Data source**: Award amount comes only from the API (GET /api/applications and GET /api/applications/:id). Backend must include award_amount (or awardAmount) in the response when status is APPROVED. Do not compute or recalculate the award on the client.

4. **Authorization**: Applicants may only see their own applications. Backend must filter by applicant_id; do not expose other applicants' award amounts.

5. **Centralized styles**: Use existing table/card and typography classes. Add .award-amount or .application-detail-award only in index.css if needed. Award amount can be emphasized (e.g. font-weight, size) via CSS class only. No inline styles.

6. **Consistency**: Currency formatting (e.g. toLocaleString with style: 'currency', currency: 'USD') consistent across dashboard and detail. Same number format in both places.

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── ApplicantDashboard.jsx  # In table row: status === 'APPROVED' ? formatCurrency(app.awardAmount) : '—'
│   └── ApplicationDetail.jsx   # If status APPROVED, show award amount in prominent block/section
└── index.css                   # .award-amount, .application-detail-award (optional)

backend: ensure list and getOne return award_amount for applications; no code change if already returned
```

### Data Flow

```
GET /api/applications (list) → each item has awardAmount (number | null)
  → Dashboard: map row, awardAmount != null ? $X,XXX : '—'
GET /api/applications/:id (detail) → application has awardAmount when status APPROVED
  → ApplicationDetail: if status === 'APPROVED' render award section with formatCurrency(awardAmount)
```

### Key Implementation Details

* **Format helper**: e.g. formatCurrency(amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount). Use wherever award is displayed.
* **Backend**: SELECT must include award_amount (or alias awardAmount in mapRow). Return null for non-approved; return value when status is APPROVED.
* **Detail view**: Place award amount near status (e.g. "Status: Approved | Award: $24,000") or in a card "Award Amount" with the value. Use CSS class for emphasis.

### API Contract

**GET /api/applications** and **GET /api/applications/:id**: Response objects include `awardAmount` (number | null). When status is APPROVED, awardAmount is the calculated amount; otherwise null.

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Dashboard shows award for approved application"
    as applicant with one approved application (award 24000)
    go to dashboard
    assert cell or text shows $24,000 or 24000 formatted as currency

  TEST "Detail shows award for approved application"
    open application detail for approved application
    assert award amount visible and formatted

  TEST "Dashboard and detail do not show award for rejected application"
    application status REJECTED
    assert award column/cell shows — or empty; detail has no award section
```

---

## Implementation Steps

1. **Backend**: Confirm GET /api/applications and GET /api/applications/:id include award_amount (awardAmount) in response. If not, add to SELECT and to mapRow or response mapping.

2. **Frontend**: In ApplicantDashboard, for each row render award column: app.awardAmount != null ? formatCurrency(app.awardAmount) : '—'. In ApplicationDetail, when app.status === 'APPROVED' and app.awardAmount != null, render award block with formatCurrency(app.awardAmount). Add .award-amount or similar in index.css if needed; no inline CSS.

3. **Verify**: Approved apps show amount; others do not; format consistent; only own applications visible.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Context | Award amount has label (e.g. "Award amount" or table header "Award Amount") so screen readers understand |
| Format | Use consistent currency format; avoid raw number without unit |

---

## Security Requirements

1. **Authorization**: Backend returns only applicant's applications; award amount is part of that response. No separate endpoint that could leak other users' awards.

---

## Definition of Done

- [ ] Approved applications show calculated award amount on dashboard.
- [ ] Approved applications show award amount on application detail view.
- [ ] Amount formatted as currency consistently; non-approved show — or no amount.
- [ ] All styles in index.css only; no inline CSS.
- [ ] Data from API only; no client-side calculation.
