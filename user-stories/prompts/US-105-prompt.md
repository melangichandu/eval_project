# US-105: Real-Time Eligibility Feedback

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-105 |
| **Phase** | 2 – Applicant Application Flow |
| **Related Stories** | US-105 (Real-time eligibility feedback) |
| **Persona** | Diana Torres (Applicant) |
| **Priority** | Must Have |
| **Parent Dependencies** | US-104 (application form with fields used by eligibility rules) |
| **Estimated Effort** | 4–5 hours |
| **Branch Name** | `feat/us-105-eligibility-panel` |
| **Output Verification** | Six rules show pass (green)/fail (red)/neutral; overall "Eligible" or "Not Eligible" with count; updates as user types. Logic matches backend. All styles in `frontend/src/index.css`. |

---

## Business Requirements

1. **Eligibility panel**: A visible panel on the application form (e.g. sidebar on desktop, above or below form on mobile) that shows the result of six eligibility rules. Panel updates in real time as the user fills the form (no submit required).

2. **Six rules** (logic must match backend exactly):
   * **Rule 1 – Nonprofit Status**: Organization Type is one of: 501(c)(3), 501(c)(4), Community-Based Organization, Faith-Based Organization. Pass: "Eligible organization type". Fail: "Only nonprofit and community organizations are eligible."
   * **Rule 2 – Minimum Operating History**: (Current Year − Year Founded) ≥ 2. Pass: "Organization has been operating for X years". Fail: "Organization must be at least 2 years old."
   * **Rule 3 – Budget Cap**: Annual Operating Budget < $2,000,000. Pass: "Operating budget is within limit". Fail: "Organizations with budgets of $2M or more are not eligible."
   * **Rule 4 – Funding Ratio**: Amount Requested ≤ 50% of Total Project Cost. Pass: "Requested amount is X% of project cost". Fail: "Requested amount cannot exceed 50% of total project cost."
   * **Rule 5 – Maximum Request**: Amount Requested ≤ $50,000. Pass: "Requested amount is within the $50,000 maximum". Fail: "Maximum grant amount is $50,000."
   * **Rule 6 – Minimum Impact**: Estimated Number of Beneficiaries ≥ 50. Pass: "Project will serve X beneficiaries". Fail: "Project must serve at least 50 beneficiaries."

3. **Per-rule display**: Each rule shows a short name and one of: Pass (green checkmark), Fail (red X), or Not yet evaluated (neutral, e.g. gray circle or dash). When evaluated, show the message text (pass or fail message). When required fields for that rule are empty, show neutral state.

4. **Overall status**: One line or block: either "Eligible – All 6 criteria met" (success styling) or "Not Eligible – X of 6 criteria met" (warning/danger styling). Optional short note: "You may still submit. The reviewer will make the final determination."

5. **Shared logic**: The same six-rule logic must exist in a single, reusable module (e.g. `eligibilityEngine.js`) used by the frontend panel. Backend must use the same rules (same module or duplicated logic) when storing eligibility on submit so that stored result matches what the user saw.

6. **Centralized styles**: All CSS in `frontend/src/index.css`. Add `.eligibility-panel`, `.eligibility-rule`, `.eligibility-pass`, `.eligibility-fail`, `.eligibility-neutral`, `.eligibility-summary`. Use design tokens (--success, --danger, --neutral, --warning). No inline or component-level CSS.

7. **Performance**: Compute eligibility from current form state in the frontend only (no API call per keystroke). Run when relevant fields change (onChange or onBlur); pure function, same input → same output.

---

## Technical Approach

### Components

```
frontend/src/
├── components/
│   └── EligibilityPanel.jsx   # Receives formData prop; calls eligibilityEngine.run(formData); renders 6 rules + summary
├── services/
│   └── eligibilityEngine.js    # run(formData) → { results: [{ id, name, pass, message }], score, total: 6, eligible }
├── pages/
│   └── ApplicationForm.jsx     # Passes eligibilityData (subset of form) to EligibilityPanel; panel visible beside or below form
└── index.css                   # .eligibility-panel, .eligibility-rule, .eligibility-pass/fail/neutral, .eligibility-summary

backend/src/
└── services/
    └── eligibilityEngine.js  # Same rules; run(data) for server-side verification on submit
```

### Data Flow

```
Form state changes (e.g. organizationType, yearFounded, amountRequested, totalProjectCost, estimatedBeneficiaries, annualOperatingBudget)
  → ApplicationForm passes { organizationType, yearFounded, annualOperatingBudget, amountRequested, totalProjectCost, estimatedBeneficiaries } to EligibilityPanel
  → EligibilityPanel calls eligibilityEngine.run(formData)
  → run() returns { results: [ { id, name, pass, message } ], score, total: 6, eligible: boolean }
  → Panel re-renders: map results to rows with icon (✓ / ✗ / ○) and message; show summary line
```

### Key Implementation Details

* **eligibilityEngine.run(formData)**: Accept object with keys organizationType, yearFounded, annualOperatingBudget, amountRequested, totalProjectCost, estimatedBeneficiaries. For each rule, compute pass/fail; if required value is null/undefined, treat as neutral (pass: false, message: e.g. "Complete the form to see eligibility" or rule-specific hint). Return results array (length 6), score (count of pass), total: 6, eligible: score === 6.
* **Panel**: No API call. Pure render from formData. Use CSS classes for green/red/gray (no inline colors). Ensure accessibility: icons have title or sr-only text (Pass/Fail).
* **Backend**: Same rule logic so that when POST /api/applications runs eligibility and stores score/details, the stored result matches frontend for the same inputs.

### API Contract

Eligibility for the panel is computed client-side only. Backend POST /api/eligibility/check (if present) can return same structure for server-side check; POST /api/applications runs eligibility and stores it (US-108).

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Panel shows 6 rules"
    navigate to /apply, assert 6 rule rows in eligibility panel

  TEST "Rule 1 pass when 501(c)(3) selected"
    select Organization Type 501(c)(3)
    assert rule "Nonprofit Status" shows pass (green) and "Eligible organization type"

  TEST "Rule 1 fail when For-Profit selected"
    select For-Profit Business
    assert rule shows fail and "Only nonprofit and community organizations are eligible"

  TEST "Overall status shows Eligible when all 6 pass"
    fill form with values that pass all 6 rules
    assert "Eligible – All 6 criteria met" visible

  TEST "Overall status shows Not Eligible with count when some fail"
    set amount requested 60000 (fails rule 5)
    assert "Not Eligible" and "5 of 6" or similar visible
```

### Unit (eligibilityEngine)

```pseudo
  TEST "run() returns 6 results"
  TEST "Rule 2 pass when yearFounded makes years >= 2"
  TEST "Rule 2 fail when years < 2"
  TEST "Rule 4 pass when requested <= 50% of total cost"
  TEST "Rule 4 fail when requested > 50%"
  TEST "eligible true only when score === 6"
  TEST "neutral when required field missing (e.g. yearFounded null)"
```

---

## Implementation Steps

1. **eligibilityEngine.js** (frontend): Implement run(formData) with exact rule logic. Return { results, score, total: 6, eligible }. Handle null/undefined for each rule (neutral).

2. **Backend eligibilityEngine.js**: Same rules (copy or shared module). Used by POST /api/applications to compute and store eligibility.

3. **EligibilityPanel.jsx**: Props: formData (object with keys used by rules). Call run(formData). Map results to list items with icon (✓/✗/○) and message. Render summary line with eligible ? "Eligible – All 6 criteria met" : "Not Eligible – X of 6 criteria met". Optional note about still being able to submit.

4. **Styles** in index.css: .eligibility-panel, .eligibility-rule, .eligibility-pass (color from --success), .eligibility-fail (--danger), .eligibility-neutral (--neutral), .eligibility-summary. No inline styles.

5. **ApplicationForm**: Pass eligibilityData (subset of form state) to EligibilityPanel. Place panel in layout (sidebar or above/below form). Ensure formData updates when user types so panel re-renders.

6. **Verify**: Panel updates as form changes; logic matches backend; all styles in index.css.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Icons | title or aria-label ("Pass", "Fail", "Not evaluated") or sr-only text |
| Summary | Heading or aria-live so status change is announced |
| Contrast | Pass/fail/neutral use design tokens; ensure 4.5:1 for text |
| Structure | List or grouped region with heading "Eligibility Check" |

---

## Security Requirements

1. **No server call for panel**: Panel uses only client-side logic; no sensitive data sent for real-time check. Backend enforces eligibility on submit.
2. **Consistent logic**: Backend must not accept submissions that would compute a different eligibility result than the frontend for the same data (same rules).

---

## Performance Requirements

1. **Pure function**: run(formData) is synchronous and pure; no async, no side effects. Fast enough to run on every relevant field change.
2. **No debounce required**: Single run per render when formData reference or values change.

---

## Responsive / Device-Aware

| Breakpoint | Panel placement |
|:-----------|:-----------------|
| Mobile | Above or below form (stacked); full width |
| Desktop | Sidebar next to form (e.g. grid 1fr 320px) or above form |

---

## Definition of Done

- [ ] All six rules display with green check (pass), red X (fail), or neutral (not yet evaluated).
- [ ] Overall status shows "Eligible – All 6 criteria met" or "Not Eligible – X of 6 criteria met."
- [ ] Panel updates in real time as form fields change.
- [ ] Eligibility logic in a single reusable module; backend uses same rules on submit.
- [ ] All styles in `frontend/src/index.css` only; no inline or component CSS.
- [ ] Unit tests for eligibilityEngine (pass/fail/neutral for each rule, eligible true only when score 6).
- [ ] E2E or manual: change form values and confirm panel updates correctly.
