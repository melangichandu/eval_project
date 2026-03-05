# US-203: Application Detail with Eligibility Results (Reviewer)

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-203 |
| **Phase** | 3 – Reviewer Workflow |
| **Related Stories** | US-203 (Open application and see all details plus eligibility) |
| **Persona** | Marcus Johnson (Reviewer) |
| **Priority** | Must Have |
| **Parent Dependencies** | US-202 (list), GET /api/applications/:id returns full application + documents for reviewer |
| **Estimated Effort** | 4–5 hours |
| **Branch Name** | `feat/us-203-reviewer-detail` |
| **Output Verification** | Detail shows all form fields, document list with view/download, eligibility panel. Only reviewers can access any application. All styles in index.css. |

---

## Business Requirements

1. **Route**: Protected page (e.g. `/reviewer/application/:id`). Only role REVIEWER may access. If id is invalid or application not found, show 404 or appropriate message. Provide a clear way back to the reviewer dashboard (e.g. "Back to Dashboard" button or breadcrumb).

2. **Organization Information**: Display all Section 1 fields in a read-only layout with labels and values. Use the same field labels as the application form. Group under a heading (e.g. "Organization Information"). Fields: Organization Name, EIN, Organization Type, Year Founded, Annual Operating Budget, Full-Time Employees, Primary Contact Name, Email, Phone, Organization Address, Mission Statement.

3. **Project Details**: Display all Section 2 fields in a read-only layout under a heading (e.g. "Project Details"). Fields: Project Title, Project Category, Project Description, Target Population, Estimated Beneficiaries, Total Project Cost, Amount Requested, Project Start/End Dates, Previously Received Grant, and reference to supporting document(s).

4. **Eligibility results**: Display the stored eligibility result (from application.eligibilityDetails or equivalent). List all six rules with pass/fail and the message for each. Show overall status (e.g. "Eligible – 6 of 6 criteria met"). Use the same visual treatment as the applicant eligibility panel (green check, red X, via CSS classes .eligibility-pass, .eligibility-fail). Do not recompute eligibility on the client; use stored data only.

5. **Documents**: List uploaded documents with file name. Each document has "View" and/or "Download" action. "View" opens the document in a new browser tab (e.g. presigned URL or download endpoint that returns the file with Content-Disposition inline). "Download" triggers download (Content-Disposition attachment or download attribute). If the application has no documents, show "No document uploaded." Document URLs must be generated server-side (presigned or secure endpoint); do not expose internal storage paths. Authorization: only reviewers (or applicant for own application) may access document URLs.

6. **Centralized styles**: All CSS in frontend/src/index.css. Reuse .card, .form-group–like layout for read-only fields, .eligibility-panel classes, .document-list. Add .application-detail-section, .document-item only in index.css. No inline or component-level CSS.

7. **Consistency**: Typography, section headings, and spacing match the rest of the app. Eligibility block and document list are easy to scan.

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── ReviewerApplicationDetail.jsx  # getApplication(id); render org section, project section, eligibility from stored data, document list with View/Download
├── services/
│   └── api.js                          # getApplication(id) → GET /api/applications/:id
└── index.css                           # .application-detail-section, .document-list, .document-item

backend: GET /api/applications/:id returns full application for reviewer; document list with file name and URL or download endpoint
```

### Data Flow

```
Reviewer navigates to /reviewer/application/:id
  → GET /api/applications/:id with Bearer token (reviewer)
  → Backend: authRequired; if role REVIEWER allow any application; else only own; return application with eligibility_details, documents (id, fileName, fileUrl or downloadUrl)
  → Frontend: set application in state; render Organization section (map fields), Project section, Eligibility (map eligibilityDetails to rows), Documents (map to list with View/Download links)
  → View: window.open(doc.fileUrl, '_blank') or <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">View</a>
  → Download: <a href={doc.downloadUrl} download>Download</a> or same URL with Content-Disposition from server
```

### Key Implementation Details

* **Backend**: For reviewer, return application by id without applicant_id filter. Include documents array: for each document, include fileUrl (presigned or route that streams file) and fileName. Generate presigned URL with short expiry (e.g. 15 min) or serve via authenticated GET /api/applications/:id/documents/:docId that checks reviewer role and streams file.
* **Eligibility**: Use application.eligibilityDetails (array of { id, name, pass, message }). Map to list with class .eligibility-pass or .eligibility-fail based on pass. Do not call eligibilityEngine.run() on client for this view; use stored data.
* **Documents**: If backend returns fileUrl per document, use it for View and Download. If backend returns only storage path, implement GET /api/applications/:id/documents/:docId that reads file and sets Content-Disposition (inline for view, attachment for download) or redirects to presigned URL.

### API Contract

**GET /api/applications/:id**: For reviewer, returns full application including eligibilityScore, eligibilityTotal, eligibilityDetails (array of { id, name, pass, message }), and documents (array of { id, fileName, fileUrl } or { id, fileName } with separate download endpoint).  
**GET /api/applications/:id/documents/:docId** (optional): Returns file stream with appropriate Content-Disposition; auth required; reviewer or applicant owner only.

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Detail shows all organization and project fields"
    open reviewer application detail
    assert Organization section has all Section 1 labels and values
    assert Project section has all Section 2 labels and values

  TEST "Eligibility results displayed from stored data"
    assert 6 rules listed with pass/fail and messages
    assert overall "Eligible" or "Not Eligible" with count

  TEST "Document View opens in new tab"
    click View on a document
    assert new tab/window with document URL

  TEST "Back to Dashboard returns to list"
    click Back to Dashboard
    assert path /reviewer
```

### Unit (backend)

```pseudo
  TEST "getOne returns application for reviewer for any id"
  TEST "getOne returns 403 for applicant accessing another applicant's application"
```

---

## Implementation Steps

1. **Backend**: Ensure GET /api/applications/:id for reviewer returns full application and documents with view/download URL or endpoint. Implement document serving route if not present (auth, check role or ownership, stream file).

2. **Frontend**: ReviewerApplicationDetail – useParams for id; getApplication(id) in useEffect; render Organization block (read-only), Project block, Eligibility block (map eligibilityDetails), Documents block (map to list with View/Download). "Back to Dashboard" links to /reviewer. Loading and 404/error state.

3. **Styles**: In index.css add .application-detail-section, .document-list, .document-item. Reuse .card, eligibility classes. No inline CSS.

4. **Verify**: All fields visible; eligibility from stored data; documents have View/Download; only reviewers can open any application; styles only in index.css.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Headings | h2/h3 for Organization, Project, Eligibility, Documents |
| Links | "View" and "Download" descriptive; target="_blank" with rel="noopener noreferrer" for View |
| Structure | Sections as regions; labels and values associated |

---

## Security Requirements

1. **Authorization**: Only reviewers can access any application; applicants only own. Document URLs or endpoint must verify reviewer or applicant ownership before serving file.
2. **Presigned URLs**: If using S3 presigned, generate server-side with short expiry; do not expose long-lived keys.
3. **No XSS**: Render all application data as text; no dangerouslySetInnerHTML with user content.

---

## Performance Requirements

1. Fetch application once on mount. Lazy load document URLs only when needed if generating presigned on demand.
2. Do not refetch entire list when returning from detail; list can be stale until user refreshes or navigates.

---

## Definition of Done

- [ ] Detail view shows all form fields (Section 1 and Section 2) in read-only form.
- [ ] Uploaded document(s) viewable or downloadable via View/Download.
- [ ] Eligibility check results shown (all six rules with pass/fail and message) from stored data.
- [ ] Only reviewers can access any application; document access authorized.
- [ ] All styles in index.css; no inline or component-level CSS.
- [ ] Back to Dashboard link works; layout and typography consistent.
