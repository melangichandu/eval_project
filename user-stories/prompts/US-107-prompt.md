# US-107: Review Application Before Submitting

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-107 |
| **Phase** | 2 – Applicant Application Flow |
| **Related Stories** | US-107 (Review application before submitting) |
| **Persona** | Diana Torres (Applicant) |
| **Priority** | Should Have |
| **Parent Dependencies** | US-104 (form), US-105 (eligibility), US-106 (file); form state and file passed to review |
| **Estimated Effort** | 3–4 hours |
| **Branch Name** | `feat/us-107-review-submit` |
| **Output Verification** | Review page shows read-only summary of all answers and eligibility; "Back to Edit" and "Submit Application" work; no data loss. All styles in index.css. |

---

## Business Requirements

1. **Route**: Protected page (e.g. `/apply/review`). Reached from application form via "Review & Submit" (or "Next" from Section 2). Receives form state and selected file via navigation state (e.g. location.state), context, or store. If no form state (e.g. direct URL), redirect to `/apply`.

2. **Read-only summary**: Display all Section 1 and Section 2 answers in a clear, read-only layout. Group by "Organization Information" and "Project Details." Use labels identical to the form. Format dates (e.g. locale), currency (e.g. $1,234.00), and numbers for readability. Do not show editable inputs.

3. **Eligibility summary**: Show the same overall eligibility status as on the form (e.g. "Eligible – All 6 criteria met" or "Not Eligible – X of 6 criteria met"). Optionally list the six rules and their pass/fail state (reuse EligibilityPanel or same data).

4. **Supporting document**: Show the selected file name (and optionally size/type). If no file was selected, show "No document selected" or similar and block or warn on submit if document is required.

5. **Actions**:
   * **"Back to Edit"**: Navigate back to `/apply` without submitting. Preserve all form data and selected file (pass state back or restore from store/sessionStorage).
   * **"Submit Application"**: Validate that required fields and document are present; then create application (POST /api/applications) and upload document (POST /api/applications/:id/documents). On success, redirect to application detail or dashboard and show success feedback. On error, display API error message and allow retry or "Back to Edit."

6. **Warning when not eligible**: If eligibility shows "Not Eligible" (X < 6), display a non-blocking warning (e.g. banner): "Your application does not meet all eligibility criteria. You may still submit; the reviewer will make the final determination." Do not disable Submit for this reason (see US-108).

7. **Centralized styles**: All CSS in `frontend/src/index.css`. Reuse .card, .btn, .btn-primary, .btn-neutral. Add .review-summary, .review-section, .review-eligibility, .review-warning only in index.css. No inline or component-level CSS.

8. **Consistency**: Same typography, button sizes, and spacing as rest of app.

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── ReviewSubmit.jsx        # Reads location.state (form, file); summary; eligibility; warning; Back / Submit
├── components/
│   └── EligibilityPanel.jsx   # Optional: reuse with formData for eligibility summary
└── index.css                   # .review-summary, .review-section, .review-warning
```

### Data Flow

```
User on /apply clicks "Review & Submit"
  → navigate('/apply/review', { state: { form, file } })
  → ReviewSubmit mounts; if !state?.form redirect to /apply
  → Render: summary (form fields grouped), eligibility (run(form) or from state), file name, warning if !eligible
  → "Back to Edit": navigate('/apply', { state: { form, file } }) or restore draft so form is repopulated
  → "Submit Application": validate required + file; POST /api/applications(formData) → get app.id → if file, POST documents → on success navigate to /application/:id or /dashboard
```

### Key Implementation Details

* **State source**: Form and file must be available on review page. Prefer location.state from React Router; fallback: sessionStorage or context. If user lands on /apply/review without state, redirect to /apply.
* **Summary**: Map form keys to labels; format dates (toLocaleDateString), currency (toLocaleString with style currency), numbers. Two sections with headings. Use <dl>/<dt>/<dd> or <p><strong>Label</strong> value</p>; no inputs.
* **Submit payload**: Build request body from form state to match backend expectation (camelCase or snake_case per API). Include all required fields; backend will validate again.
* **Upload after create**: Await POST /api/applications; then if file, await uploadDocument(response.id, file). If upload fails, show error; application may already exist (document can be re-uploaded in a follow-up story if desired).

### API Contract

**POST /api/applications**: Body with all application fields (see US-104/US-108). Returns 201 with created application (id, status SUBMITTED, eligibility stored).  
**POST /api/applications/:id/documents**: Multipart file (see US-106). Called after application create when user selected a file.

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Review page shows summary of form data"
    fill form, go to review
    assert Organization and Project sections visible with correct values

  TEST "Back to Edit returns to form with data"
    from review click "Back to Edit"
    assert on /apply and form fields still filled

  TEST "Submit creates application and redirects"
    fill form, select file, review, click Submit
    assert redirect to dashboard or application detail; application appears in list

  TEST "Warning shown when not eligible"
    fill form so eligibility is Not Eligible
    go to review
    assert warning message visible; Submit still enabled
```

---

## Implementation Steps

1. **ReviewSubmit.jsx**: Read location.state (form, file). If no form, redirect to /apply. Render summary (two sections), eligibility (run eligibilityEngine or reuse EligibilityPanel), file name, optional warning banner. Buttons: Back to Edit (navigate to /apply with state), Submit (validate, POST applications, then upload document if file, then redirect). Loading and error state.

2. **ApplicationForm**: "Review & Submit" navigates to /apply/review with state: { form: formState, file: fileState }.

3. **Styles**: In index.css add .review-summary, .review-section, .review-eligibility, .review-warning (e.g. background --warning tint). No inline CSS.

4. **Verify**: Summary accurate; Back preserves data; Submit creates application and uploads file; warning when not eligible; styles only in index.css.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Headings | Section headings (h2/h3) for Organization, Project, Eligibility |
| Summary | Use semantic structure (dl, or labeled divs) so labels and values are associated |
| Buttons | "Back to Edit" and "Submit Application" clearly labeled, 44px min target |
| Warning | role="alert" or aria-live for eligibility warning so announced |

---

## Security Requirements

1. **Validation**: Backend validates all fields on POST /api/applications; do not trust client. Submit only required data.
2. **No secrets**: Do not log or display token or password on review page.

---

## Performance Requirements

1. Do not refetch data for review; use only state passed from form. Single POST on submit (plus one upload if file).

---

## Definition of Done

- [ ] Read-only summary of all form answers displayed in two sections.
- [ ] Eligibility summary shown; warning when not eligible; Submit still allowed.
- [ ] "Back to Edit" returns to form with data preserved.
- [ ] "Submit Application" creates application and uploads document; redirect on success; error handling.
- [ ] All styles in `frontend/src/index.css` only; typography and buttons consistent.
- [ ] No inline or component-level CSS.
