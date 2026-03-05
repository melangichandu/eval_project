# Prompt Execution Order and Implementation Tracker

This document defines the **order of execution** for implementing prompts (to respect dependencies) and a **tracker** for each prompt’s implementation status.

---

## 1. Execution Order

Prompts must be implemented in an order that respects **Parent Dependencies**. The table below lists prompts in a valid execution sequence. Items in the same step can be implemented in parallel where dependencies allow.

| Step | Prompt(s) | Depends On | Phase |
|:-----|:----------|:-----------|:------|
| 1 | US-101 | — | 1 – Applicant Authentication |
| 2 | US-102 | US-101 (optional), backend auth | 1 – Applicant Authentication |
| 3 | US-103 | US-101/US-102, GET /api/applications | 2 – Applicant Application Flow |
| 3 | US-104 | US-102, form route + validation | 2 – Applicant Application Flow |
| 4 | US-105 | US-104 (form with eligibility fields) | 2 – Applicant Application Flow |
| 4 | US-106 | US-104 (form + document field), POST documents | 2 – Applicant Application Flow |
| 5 | US-107 | US-104, US-105, US-106 | 2 – Applicant Application Flow |
| 6 | US-108 | US-107, POST /api/applications, eligibility engine | 2 – Applicant Application Flow |
| 7 | US-201 | US-102 (login returns role), reviewer seeds | 3 – Reviewer Workflow |
| 8 | US-202 | US-201, GET /api/applications/all | 3 – Reviewer Workflow |
| 9 | US-203 | US-202, GET /api/applications/:id + documents | 3 – Reviewer Workflow |
| 10 | US-204 | US-203, award calculator, PATCH status, POST award | 3 – Reviewer Workflow |
| 11 | US-205 | US-202, summary endpoint | 3 – Reviewer Workflow |
| 11 | US-206 | US-202, query params on list | 3 – Reviewer Workflow |
| 12 | US-109 | US-204 (backend stores award; GET returns awardAmount) | 2 – Applicant Application Flow |
| 12 | US-110 | US-204 (backend stores reviewer_comments; GET returns comments) | 2 – Applicant Application Flow |
| 13 | US-301 | Admin role, route protection, backend admin summary | 4 – Admin |

**Notes:**

* **US-105 and US-106** can be done in parallel after US-104.
* **US-205 and US-206** can be done in parallel after US-202 (and in parallel with US-203/US-204 if desired).
* **US-109 and US-110** depend on backend behavior from US-204; implement after US-204 or in parallel once US-204 backend is in place.
* **US-301** can be implemented after reviewer workflow is in place (e.g. after US-202 or US-204), as long as admin role and route protection exist.

---

## 2. Dependency Graph (Summary)

```
US-101
  └── US-102
        ├── US-103, US-104
        │     └── US-105, US-106
        │           └── US-107
        │                 └── US-108
        │
        ├── US-201
        │     └── US-202
        │           ├── US-203 → US-204 ──┬── US-109 (applicant sees award)
        │           ├── US-205           └── US-110 (applicant sees comments)
        │           └── US-206
        │
        └── US-301 (admin; needs admin role)
```

---

## 3. Implementation Tracker

Use the table below to track status for each prompt. Update **Status** and **Completed** as you go.

| # | Prompt ID | Title | Status | Completed | Notes |
|:--|:----------|:------|:-------|:----------|:------|
| 1 | US-101 | Create Account | ✅ Done | 2025-03-05 | Backend validation, Register.jsx a11y + index.css only. |
| 2 | US-102 | Log In | ✅ Done | 2025-03-05 | POST /login, Login.jsx, PublicOnly; index.css only; role redirect. |
| 3 | US-103 | View My Applications | ✅ Done | 2025-03-05 | Dashboard, table/empty state, index.css only; listMine slim; a11y + retry. |
| 4 | US-104 | Application Form | ✅ Done | 2025-03-05 | Two-section form, validation (EIN/phone/dates/ranges), a11y, index.css only; draft in sessionStorage. |
| 5 | US-105 | Eligibility Check | ✅ Done | 2025-03-05 | eligibilityEngine (FE/BE), EligibilityPanel, index.css only; neutral state; a11y. |
| 6 | US-106 | Document Upload | ✅ Done | 2025-03-05 | File input Section 2; upload after submit; multer 5MB/MIME; ownership check; .file-upload-name in index.css; upload error surfaced. |
| 7 | US-107 | Review Step | ✅ Done | 2025-03-05 | Read-only summary (Org + Project), eligibility, warning, Back to Edit with state; styles in index.css. |
| 8 | US-108 | Submit When Not Fully Eligible | ✅ Done | 2025-03-05 | Backend: validate required/format only, store eligibility, never 400 for score; FE: warning only, success banner. |
| 9 | US-201 | Reviewer Login and Dashboard | ✅ Done | 2025-03-05 | Role redirect in Login; Protected role=REVIEWER, applicant→/dashboard; Layout nav by role; ReviewerDashboard + index.css only; doc title + focus a11y. |
| 10 | US-202 | List All Applications with Eligibility Status | ✅ Done | 2025-03-05 | GET /all REVIEWER-only; listAll ORDER BY submitted_at ASC NULLS LAST; table columns + eligibility badge + StatusBadge + Review link; empty/loading/error + retry; 403 message; index.css only. |
| 11 | US-203 | Application Detail with Eligibility Results (Reviewer) | ✅ Done | 2025-03-05 | GET :id/documents/:docId; stored eligibilityDetails; org/project sections; doc View/Download via getDocumentBlob; Back to Dashboard; index.css only; modals + .application-detail-section, .document-list. |
| 12 | US-204 | Approve or Reject with Award Calculation | ✅ Done | 2025-03-05 | awardCalculator 5 factors; POST /award preview; PATCH status APPROVED stores award; REJECTED requires comments; focus trap + Escape; .modal-overlay; index.css only. |
| 13 | US-205 | Summary Counts by Status on Reviewer Dashboard | ⬜ Not Started | | |
| 14 | US-206 | Filter Applications by Eligibility and Status | ⬜ Not Started | | |
| 15 | US-109 | View Award Amount (Applicant) | ⬜ Not Started | | |
| 16 | US-110 | View Rejection Comments (Applicant) | ⬜ Not Started | | |
| 17 | US-301 | Administrator Summary Report | ⬜ Not Started | | |

**Status legend**

* ⬜ **Not Started**
* 🔄 **In Progress**
* ✅ **Done**

**How to use**

1. Replace the circle (⬜) with 🔄 when you start a prompt and ✅ when it’s fully implemented and verified.
2. Optionally set **Completed** to a date (e.g. `2025-03-04`).
3. Use **Notes** for branch name, blockers, or verification notes.

---

## 4. Quick Reference: Order by Phase

| Phase | Prompts in Order |
|:------|:-----------------|
| 1 – Applicant Authentication | US-101 → US-102 |
| 2 – Applicant Application Flow | US-103, US-104 → US-105, US-106 → US-107 → US-108 → (after US-204) US-109, US-110 |
| 3 – Reviewer Workflow | US-201 → US-202 → US-203 → US-204; and in parallel after US-202: US-205, US-206 |
| 4 – Admin | US-301 |

---

*Last updated: 2025-03-05 (US-204 completed).*
