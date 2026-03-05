# US-108: Submit When Not Fully Eligible

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-108 |
| **Phase** | 2 – Applicant Application Flow |
| **Related Stories** | US-108 (Submit even if not fully eligible) |
| **Persona** | Diana Torres (Applicant) |
| **Priority** | Must Have |
| **Parent Dependencies** | US-107 (review step), backend POST /api/applications, eligibility engine |
| **Estimated Effort** | 2–3 hours |
| **Branch Name** | `feat/us-108-submit-not-eligible` |
| **Output Verification** | Submission succeeds when eligibility < 6; eligibility result stored with application; backend never returns error solely for low eligibility. |

---

## Business Requirements

1. **No block on eligibility**: The system must allow the applicant to submit the application even when the eligibility panel shows "Not Eligible" (fewer than 6 rules passing). The backend must NOT return 400 or 403 solely because eligibility score is less than 6. The reviewer makes the final determination.

2. **Store eligibility on submit**: When POST /api/applications is called, the backend must run the same eligibility engine (six rules) on the submitted data and store the result with the application: at least eligibility_score (X), eligibility_total (6), and eligibility_details (e.g. JSON array of { id, name, pass, message } for each rule). Status is set to SUBMITTED.

3. **Warning only**: On the review screen (US-107), when the applicant is not fully eligible, show a clear warning (e.g. "Your application does not meet all eligibility criteria. You may still submit; the reviewer will make the final determination."). The "Submit Application" button remains enabled. No modal or block that requires the user to confirm "I know I'm not eligible" unless product explicitly requires it.

4. **Validation vs eligibility**: Backend must still validate all required fields, formats, and business rules (dates, amounts, etc.). Return 400 for validation errors (e.g. missing required field, invalid EIN). Do not return 400 for low eligibility score.

5. **Status and history**: New applications are created with status SUBMITTED. Optionally record in status_history (application_id, old_status, new_status, changed_by_id, created_at) for audit.

6. **Response**: On success, return 201 with the created application object including eligibility_score, eligibility_total, eligibility_details (or equivalent). Frontend uses this to redirect and optionally show success message.

---

## Technical Approach

### Components

```
backend/src/
├── controllers/applicationController.js  # create(): run eligibilityEngine.run(body), INSERT application with eligibility_* fields, status SUBMITTED; never reject for score < 6
├── services/eligibilityEngine.js          # run(data) → { results, score, total, eligible }; same as frontend
└── routes/applications.js                 # POST / → requireRole APPLICANT → applicationController.create

frontend/src/
└── pages/ReviewSubmit.jsx                # Warning banner when !eligible; Submit calls POST; no disable for eligibility
```

### Data Flow

```
User on review screen, eligibility shows "Not Eligible – 4 of 6"
  → Warning banner visible; "Submit Application" enabled
  → User clicks Submit → POST /api/applications with full form payload
  → Backend: validate required fields and formats; run eligibilityEngine.run(payload); INSERT application (status SUBMITTED, eligibility_score=4, eligibility_total=6, eligibility_details=...)
  → Response 201 { id, status, eligibilityScore, eligibilityTotal, ... }
  → Frontend: store app id, redirect to /application/:id or /dashboard; optional toast "Application submitted"
```

### Key Implementation Details

* **create() controller**: Build insert from req.body (map camelCase to DB columns). Call eligibilityEngine.run() with same field mapping; insert eligibility_score, eligibility_total, eligibility_details (JSON). Do not add a condition like if (!eligibility.eligible) return res.status(400).
* **Validation**: Validate required fields, EIN format, date rules, numeric ranges. Return 400 with message only for these. Eligibility result is stored for information only.
* **Frontend**: In ReviewSubmit, compute eligible (e.g. from eligibilityEngine.run(formData).eligible). If !eligible, show warning div; do not set disabled on Submit button for eligibility.

### API Contract

**POST /api/applications**  
**Body:** All application fields (organizationName, ein, organizationType, yearFounded, annualOperatingBudget, fullTimeEmployees, primaryContactName, primaryContactEmail, primaryContactPhone, organizationAddress, missionStatement, projectTitle, projectCategory, projectDescription, targetPopulation, estimatedBeneficiaries, totalProjectCost, amountRequested, projectStartDate, projectEndDate, previouslyReceivedGrant).  
**Response 201:** Application object including id, status: "SUBMITTED", eligibilityScore, eligibilityTotal, eligibilityDetails.  
**Response 400:** Only for validation errors (missing/invalid fields), not for low eligibility.

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Submit succeeds when not fully eligible"
    fill form so that e.g. amount requested = 60000 (fails rule 5)
    go to review, see "Not Eligible" and warning
    click Submit Application
    assert 201, redirect; application in list with status SUBMITTED

  TEST "Eligibility stored correctly"
    submit application with known eligibility (e.g. 5 of 6)
    get application by id (as reviewer or applicant)
    assert eligibilityScore=5, eligibilityTotal=6, details array length 6
```

### Unit (backend)

```pseudo
  TEST "create() stores eligibility when score < 6"
    POST with data that yields 4 of 6
    assert application created with eligibility_score=4, status SUBMITTED

  TEST "create() returns 400 for missing required field, not for low eligibility"
```

---

## Implementation Steps

1. **Backend create()**: Ensure eligibility is computed and stored; remove any check that rejects or returns 400 when eligible === false. Validate only required fields and formats.

2. **Frontend ReviewSubmit**: Add or keep warning banner when !eligible; ensure Submit button is not disabled for eligibility. On 201, redirect and show success.

3. **Verify**: Submit with 5 of 6 criteria passes; eligibility stored; reviewer can see eligibility on application detail.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Warning | role="alert" or aria-live so warning announced; do not block focus or submit |

---

## Security Requirements

1. **Authorization**: POST /api/applications only for role APPLICANT; 403 otherwise.
2. **Input**: Validate and sanitize all inputs; use parameterized queries. Eligibility is computed server-side from submitted data only.

---

## Definition of Done

- [ ] System warns when not fully eligible but does not block submission.
- [ ] Backend stores eligibility_score, eligibility_total, eligibility_details for every submission.
- [ ] Backend never returns 400 solely because eligibility score < 6.
- [ ] Reviewer can see stored eligibility result on application detail.
- [ ] Validation errors (missing/invalid fields) still return 400.
