# US-204: Approve or Reject with Award Calculation

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-204 |
| **Phase** | 3 – Reviewer Workflow |
| **Related Stories** | US-204 (Approve or reject with award auto-calculated) |
| **Persona** | Marcus Johnson (Reviewer) |
| **Priority** | Must Have |
| **Parent Dependencies** | US-203 (reviewer detail), award calculator service, PATCH status, POST award preview |
| **Estimated Effort** | 6–8 hours |
| **Branch Name** | `feat/us-204-approve-reject` |
| **Output Verification** | Approve shows award breakdown in modal and stores award; Reject requires comment and stores it; confirmation dialogs; only reviewer. All styles in index.css. |

---

## Business Requirements

1. **Award calculation engine**: Pure function (or service) that, given application data, returns: total score (5 factors, 1–3 points each), award percentage (score/15), and final award amount (Amount Requested × percentage, rounded to nearest $100, cap $50,000). Scoring matrix per challenge spec:
   * Community Impact: 50–200 → 1, 201–1000 → 2, 1001+ → 3
   * Track Record (years): 2–5 → 1, 6–15 → 2, 16+ → 3
   * Category Priority: Arts & Culture, Workforce Development, Other → 1; Youth Programs, Senior Services → 2; Public Health, Neighborhood Safety → 3
   * Financial Need (budget): $500K–$2M → 1, $100K–$500K → 2, under $100K → 3
   * Cost Efficiency (requested % of total): 41–50% → 1, 26–40% → 2, ≤25% → 3

2. **Approve flow**: "Approve" button on reviewer application detail (when status is UNDER_REVIEW). On click: call POST /api/applications/:id/award to get calculated amount and breakdown. Show confirmation modal with: breakdown (each factor, value, score), total score (e.g. 9/15), award percentage, final award amount. Buttons: "Cancel" and "Confirm Approval – $X,XXX". On confirm: PATCH /api/applications/:id/status with status APPROVED; backend runs award calculator, stores award_amount and award_breakdown, updates status and reviewer_id. On success close modal and refresh application or navigate. On error show message.

3. **Reject flow**: "Reject" button (when status UNDER_REVIEW). On click: open modal with required text area "Reason for rejection" (or "Comments") and "Cancel" / "Confirm Rejection". On confirm: PATCH with status REJECTED and comments. Backend must reject if comment is empty (400). On success close modal and refresh; on error show message.

4. **Status transitions**: Only allow: SUBMITTED → UNDER_REVIEW; UNDER_REVIEW → APPROVED or REJECTED. Backend must enforce; return 400 for invalid transition. Optionally provide "Mark under review" button when status is SUBMITTED so reviewer can set UNDER_REVIEW first (then Approve/Reject become available).

5. **Modals**: Focus trap inside modal; Escape key closes modal; "Cancel" closes without submitting. No inline styles; all modal styles in index.css (.modal-overlay, .modal-content, .modal-actions).

6. **Centralized styles**: All CSS in frontend/src/index.css. Buttons and form elements in modals use .btn, .form-group, .error. No inline or component-level CSS.

7. **Consistency**: Typography and button style match the rest of the app; award breakdown readable (table or list).

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── ReviewerApplicationDetail.jsx  # Approve/Reject buttons; modal state; call calculateAward, updateStatus; render modals
├── services/
│   └── api.js                         # calculateAward(id), updateStatus(id, status, comments)
└── index.css                          # .modal-overlay, .modal-content, .modal-actions

backend/src/
├── services/
│   └── awardCalculator.js             # calculate(app) → { breakdown, totalScore, maxScore, awardPercentage, amountRequested, awardAmount }
├── controllers/applicationController.js  # updateStatus: if APPROVED run calculator and store; if REJECTED require comments; status_history
├── routes/applications.js             # PATCH /:id/status, POST /:id/award
```

### Data Flow

```
Approve click
  → POST /api/applications/:id/award → 200 { breakdown, totalScore, awardPercentage, awardAmount }
  → Open modal with breakdown and "Confirm Approval – $X,XXX"
  → User confirms → PATCH /api/applications/:id/status { status: 'APPROVED' }
  → Backend: run awardCalculator.calculate(app), UPDATE application SET award_amount, award_breakdown, status, reviewer_id; INSERT status_history
  → Frontend: close modal, refresh application or navigate

Reject click
  → Open modal with textarea; user enters comment
  → Confirm → PATCH { status: 'REJECTED', comments: '...' }
  → Backend: validate comments non-empty; UPDATE application SET reviewer_comments, status, reviewer_id; INSERT status_history
  → Frontend: close modal, refresh
```

### Key Implementation Details

* **awardCalculator.calculate(app)**: Input application with estimatedBeneficiaries, yearFounded, projectCategory, annualOperatingBudget, amountRequested, totalProjectCost. Return { breakdown: [{ factor, value, score, max }], totalScore, maxScore: 15, awardPercentage, amountRequested, awardAmount }. Round award to nearest 100; cap at 50000.
* **POST /:id/award**: Returns calculation only (no DB write). Used for preview in modal.
* **PATCH /:id/status**: For APPROVED: run calculator, store award_amount and award_breakdown (JSON), set status and reviewer_id. For REJECTED: require body.comments trim length > 0; store reviewer_comments, status, reviewer_id. Insert status_history row. Validate transition (e.g. only UNDER_REVIEW → APPROVED/REJECTED).
* **Frontend modals**: Two modals (approve confirmation, reject form). Focus trap (tab cycles inside modal); on Escape call close. "Confirm" disabled while request in flight to prevent double submit.

### API Contract

**POST /api/applications/:id/award**  
**Response 200:** { breakdown, totalScore, maxScore, awardPercentage, amountRequested, awardAmount }

**PATCH /api/applications/:id/status**  
**Body:** { status: 'APPROVED' | 'REJECTED', comments?: string }  
**Response 200:** Updated application object.  
**Response 400:** Invalid transition or REJECTED with empty comments.

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Approve opens modal with award breakdown"
    open application in UNDER_REVIEW, click Approve
    assert modal visible with total score, percentage, award amount
    assert Confirm button shows amount

  TEST "Confirm Approval updates status and stores award"
    confirm approval in modal
    assert modal closes; application status APPROVED; award amount visible

  TEST "Reject requires comment"
    click Reject, leave comment empty, click Confirm
    assert validation or 400; modal stays or error shown

  TEST "Reject with comment stores and closes"
    enter comment, confirm rejection
    assert status REJECTED; applicant can see comment (US-110)

  TEST "Escape closes modal"
    open approve modal, press Escape
    assert modal closed
```

### Unit (awardCalculator)

```pseudo
  TEST "calculate returns correct total and amount for known inputs"
  TEST "award capped at 50000"
  TEST "award rounded to nearest 100"
```

---

## Implementation Steps

1. **Backend awardCalculator**: Implement calculate(app) with exact scoring matrix; return breakdown, totalScore, awardPercentage, awardAmount (rounded and capped). POST /:id/award calls calculate and returns result (no write). PATCH /:id/status for APPROVED calls calculate, then UPDATE application with award_amount, award_breakdown, status, reviewer_id; INSERT status_history.

2. **Backend reject**: PATCH for REJECTED requires body.comments and trim length > 0; return 400 otherwise. Store reviewer_comments.

3. **Frontend**: ReviewerApplicationDetail – state for showApproveModal, showRejectModal, awardPreview, rejectComment. Approve: onClick call calculateAward(id), set awardPreview and showApproveModal. In modal, Confirm calls updateStatus(id, 'APPROVED'), then close and refresh. Reject: onClick set showRejectModal; Confirm calls updateStatus(id, 'REJECTED', rejectComment); validate non-empty. Modal markup: overlay, content div, table/list for breakdown, buttons. Escape handler: close modal.

4. **Styles**: In index.css add .modal-overlay (fixed, full screen, backdrop), .modal-content (centered card), .modal-actions (button group). Focus trap: query focusable elements inside modal, on Tab at last focus first, on Shift+Tab at first focus last. No inline CSS.

5. **Verify**: Approve stores award; Reject stores comment; only UNDER_REVIEW can be approved/rejected; modals accessible and close on Escape/Cancel.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Focus trap | Tab cycles within modal; focus moved to first focusable on open |
| Escape | Keydown Escape closes modal and returns focus to trigger |
| ARIA | role="dialog", aria-modal="true", aria-labelledby for title |
| Buttons | Confirm and Cancel clearly labeled; 44px min target |

---

## Security Requirements

1. **Authorization**: PATCH and POST /award only for role REVIEWER; 403 for others.
2. **Validation**: Status transitions and required comments validated on server. Do not trust client.

---

## Performance Requirements

1. **Double submit**: Disable Confirm button while PATCH in flight.
2. **Award**: Calculation is server-side only; no heavy client computation.

---

## Definition of Done

- [ ] "Approve" shows award calculation in confirmation modal; "Confirm" stores award and updates status.
- [ ] "Reject" requires comment; "Confirm" stores comment and updates status.
- [ ] Modals have focus trap and Escape to close; no inline or component-level CSS.
- [ ] Award calculator matches spec; amount rounded and capped; breakdown stored.
- [ ] All styles in index.css; typography and buttons consistent.
- [ ] Only reviewers can approve/reject; backend enforces role and transitions.
