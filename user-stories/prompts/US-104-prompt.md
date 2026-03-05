# US-104: Two-Section Grant Application Form

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-104 |
| **Phase** | 2 – Applicant Application Flow |
| **Related Stories** | US-104 (Two-section grant application form) |
| **Persona** | Diana Torres (Applicant) |
| **Priority** | Must Have |
| **Parent Dependencies** | US-102 (login), application form route and backend validation spec |
| **Estimated Effort** | 6–8 hours |
| **Branch Name** | `feat/us-104-application-form` |
| **Output Verification** | Both sections render with all required fields; navigation preserves data; validation matches challenge spec. All styles in `frontend/src/index.css`. |

---

## Business Requirements

1. **Route**: Protected page (e.g. `/apply`). APPLICANT only. Single form split into two sections with "Next" / "Back" navigation. Form state must persist when switching sections (no data loss).

2. **Section 1 – Organization Information** (all required unless noted):
   * Organization Name (2–100 chars)
   * EIN (Tax ID): format XX-XXXXXXX (2 digits, hyphen, 7 digits)
   * Organization Type: dropdown — 501(c)(3), 501(c)(4), Community-Based Organization, Faith-Based Organization, For-Profit Business, Government Agency, Individual
   * Year Founded: number, 1800–current year
   * Annual Operating Budget: currency, $0–$100,000,000
   * Number of Full-Time Employees: 0–9999
   * Primary Contact Name (2–50 chars)
   * Primary Contact Email (valid email)
   * Primary Contact Phone: format (XXX) XXX-XXXX
   * Organization Address (street, city, state, zip)
   * Mission Statement (20–500 chars)

3. **Section 2 – Project Details**:
   * Project Title (5–100 chars)
   * Project Category: dropdown — Youth Programs, Senior Services, Public Health, Neighborhood Safety, Arts & Culture, Workforce Development, Other
   * Project Description (50–2000 chars)
   * Target Population Served (5–200 chars)
   * Estimated Number of Beneficiaries (1–1,000,000)
   * Total Project Cost: $100–$10,000,000
   * Amount Requested: $100–$50,000
   * Project Start Date: date, at least 30 days in future
   * Project End Date: after start date, within 24 months of start
   * Previously Received Maplewood Grant: checkbox (optional)
   * Supporting Document: file upload (see US-106; required per spec)

4. **Navigation**: "Next" from Section 1 to Section 2. "Back" from Section 2 to Section 1. At end of Section 2, "Review & Submit" (or equivalent) to go to review step (US-107). Required fields marked with * (or "required" text).

5. **Validation**: Client-side validation on blur and/or submit for required fields, formats (EIN, email, phone), ranges, and date rules. Show errors next to fields or in a summary. Server-side must enforce the same rules on submit (separate story).

6. **Centralized styles**: All CSS in `frontend/src/index.css`. Reuse `.form-group`, `.card`, `.btn`, `.btn-primary`, `.btn-neutral`, `.error`. Add `.form-section`, `.form-navigation` only in index.css. No inline or component-level CSS.

7. **Consistency**: Same input height, font size, border-radius, and button style as Register/Login. Labels and help text pattern consistent.

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── ApplicationForm.jsx     # Two sections, state for all fields, section index, Next/Back, validation
└── index.css                    # .form-section, .form-navigation, field layout; reuse .form-group
```

### Data Flow

```
User on /apply → state: section (1 or 2), form object (all field keys)
  → Section 1: render org fields; "Next" sets section=2 (state preserved)
  → Section 2: render project fields + file input; "Back" sets section=1; "Review & Submit" navigate to /apply/review with state (or context)
  → Optional: persist draft to sessionStorage key so refresh doesn't lose data
```

### Key Implementation Details

* **Form state**: Single object (e.g. form state) with keys matching API: organizationName, ein, organizationType, yearFounded, annualOperatingBudget, fullTimeEmployees, primaryContactName, primaryContactEmail, primaryContactPhone, organizationAddress, missionStatement, projectTitle, projectCategory, projectDescription, targetPopulation, estimatedBeneficiaries, totalProjectCost, amountRequested, projectStartDate, projectEndDate, previouslyReceivedGrant. File held in separate state (file object).
* **Validation**: Implement validators for EIN (regex e.g.^\d{2}-\d{7}$), email, phone, dates (start >= today+30, end > start, end <= start+24 months), numeric ranges. Call on blur and on "Next" / "Review & Submit". Set local error state per field or summary.
* **Dropdowns**: Organization Type and Project Category options array matching challenge spec exactly. Use <select> with <option> for each.

### API Contract (for later submit – US-108)

Backend will accept POST /api/applications with body matching these field names (camelCase or snake_case per backend). Validation rules must align with this spec (lengths, ranges, date rules).

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Section 1 shows all organization fields"
    navigate to /apply
    assert Section 1 heading and all 11 org fields visible

  TEST "Next goes to Section 2 without losing data"
    fill Section 1 (e.g. org name), click Next
    assert Section 2 visible, go Back, assert org name still filled

  TEST "Section 2 shows all project fields"
    go to Section 2
    assert project title, category, description, beneficiaries, costs, dates, checkbox, file input

  TEST "Required fields show validation"
    leave required field empty, click Next or Submit
    assert error message or invalid state
```

### Unit (frontend)

```pseudo
  TEST "EIN validator rejects invalid format"
  TEST "Date validator: start date must be future, end after start"
```

---

## Implementation Steps

1. **Add styles** in index.css: .form-section, .form-navigation, any layout for two-column or full-width form. Reuse .form-group, .card, .btn. Ensure no inline CSS in ApplicationForm.

2. **ApplicationForm.jsx**: State for section (1|2) and form object (all keys). Render Section 1 or Section 2 based on section. Handlers: handleChange (update form state), handleFile (set file state), Next (set section 2), Back (set section 1), Review & Submit (navigate to /apply/review with state or pass via location.state).

3. **Validation**: Implement validation functions; call on blur and before Next/Review. Set errors in state; display via .error class. Optional: sessionStorage for draft.

4. **Dropdowns**: Define ORG_TYPES and CATEGORIES arrays; map to <option>. Ensure values match backend enum/spec.

5. **Verify**: All fields from challenge spec present; navigation preserves data; validation runs; styles only in index.css.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Labels | Every input has <label for="id"> and input id |
| Required | aria-required, visible * or "required" |
| Errors | aria-invalid, aria-describedby pointing to error element |
| Sections | Headings (h2) for "Section 1", "Section 2" |
| Tab order | Logical: Section 1 fields → Next → Section 2 fields → Back / Review |

---

## Security Requirements

1. **Submit**: Validation and persistence happen on submit (US-108); this story is form UI only. Do not send data to server until user clicks Submit on review screen.
2. **No inline scripts**: Event handlers via React; no eval or inline handlers in HTML.

---

## Performance Requirements

1. **Controlled inputs**: Use single form state object; avoid lifting to global store unless needed for review step.
2. **Re-renders**: Do not cause full-page re-render on every keystroke; normal controlled input is acceptable.

---

## Responsive / Device-Aware

| Element | Mobile | Desktop |
|:--------|:-------|:--------|
| Form layout | Single column, full width | Single column, max width or with sidebar (eligibility) |
| Buttons | Full width or stacked, 44px min | Inline Next/Back |
| Inputs | Full width, 44px min touch target | Full width within container |

---

## Definition of Done

- [ ] Section 1 (Organization Information) and Section 2 (Project Details) implemented with all specified fields.
- [ ] Required fields marked; navigation between sections preserves data.
- [ ] Client-side validation for required, format, and ranges; errors displayed.
- [ ] All styles in `frontend/src/index.css` only; typography and buttons consistent.
- [ ] Dropdown options match challenge spec. EIN, dates, and numeric ranges validated.
- [ ] "Review & Submit" navigates to review step with form and file state available.
