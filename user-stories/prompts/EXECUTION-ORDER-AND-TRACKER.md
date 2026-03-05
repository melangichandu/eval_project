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
| 2 | US-102 | Log In | ⬜ Not Started | | |
| 3 | US-103 | View My Applications | ⬜ Not Started | | |
| 4 | US-104 | Application Form | ⬜ Not Started | | |
| 5 | US-105 | Eligibility Check | ⬜ Not Started | | |
| 6 | US-106 | Document Upload | ⬜ Not Started | | |
| 7 | US-107 | Review Step | ⬜ Not Started | | |
| 8 | US-108 | Submit Application | ⬜ Not Started | | |
| 9 | US-201 | Reviewer Login and Dashboard | ⬜ Not Started | | |
| 10 | US-202 | List All Applications with Eligibility Status | ⬜ Not Started | | |
| 11 | US-203 | Application Detail with Eligibility Results (Reviewer) | ⬜ Not Started | | |
| 12 | US-204 | Approve or Reject with Award Calculation | ⬜ Not Started | | |
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

*Last updated: 2025-03-05.*
