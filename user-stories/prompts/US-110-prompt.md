# US-110: See Reviewer Comments When Rejected

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-110 |
| **Phase** | 2 – Applicant Application Flow |
| **Related Stories** | US-110 (See reviewer comments if rejected) |
| **Persona** | Diana Torres (Applicant) |
| **Priority** | Should Have |
| **Parent Dependencies** | Backend stores reviewer_comments on reject (US-204); GET /api/applications/:id returns reviewerComments for applicant |
| **Estimated Effort** | 2 hours |
| **Branch Name** | `feat/us-110-rejection-comments` |
| **Output Verification** | Rejected application detail shows reviewer comments; only applicant owner sees; no XSS. All styles in index.css. |

---

## Business Requirements

1. **Application detail**: When the applicant views their own application (e.g. `/application/:id`) and the status is REJECTED, display the reviewer's comments (rejection reason) in a dedicated section (e.g. "Reviewer feedback" or "Reason for rejection"). Use a clear heading and readable typography.

2. **When not rejected**: Do not show the reviewer comments section for applications with status SUBMITTED, UNDER_REVIEW, or APPROVED. Optionally show "No feedback yet" or similar for in-progress statuses if it improves clarity.

3. **Data source**: Comments come from the API (GET /api/applications/:id). Backend must include reviewer_comments (or reviewerComments) in the response when the application belongs to the requesting user. Only the applicant who owns the application may see the comments; authorization is enforced on the server.

4. **Security**: Sanitize or escape comment content before rendering. Do not use dangerouslySetInnerHTML with raw API text to prevent XSS. Render as plain text (e.g. React text content or sanitized HTML if product requires limited formatting).

5. **Empty comments**: If the backend ever returns REJECTED with null/empty comments, show a fallback message (e.g. "No additional feedback provided") so the layout does not break and the user is not confused.

6. **Centralized styles**: Add .reviewer-comments or .rejection-feedback in index.css. Use design tokens (e.g. --danger or --neutral for background/border). No inline or component-level CSS. Typography and spacing consistent with the rest of the app.

7. **Accessibility**: Section has an appropriate heading (e.g. h3 "Reviewer feedback"); ensure sufficient contrast for the comment text.

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── ApplicationDetail.jsx   # If status === 'REJECTED' && app.reviewerComments, render section with heading and comment text (escaped)
└── index.css                   # .reviewer-comments or .rejection-feedback

backend: GET /api/applications/:id already returns reviewer_comments; ensure applicant can read own application and field is included
```

### Data Flow

```
GET /api/applications/:id (applicant token)
  → Backend: verify applicant_id === req.user.id; return application including reviewer_comments when status REJECTED
  → Frontend: if app.status === 'REJECTED', render block with app.reviewerComments (or app.reviewer_comments); if empty, show "No additional feedback provided"
  → Render as text (no dangerouslySetInnerHTML with user content)
```

### Key Implementation Details

* **Rendering**: Use { app.reviewerComments } inside a <p> or <div> so React escapes by default. If comments may contain newlines, consider splitting on \n and mapping to <p> or use white-space: pre-line in CSS. Do not inject raw HTML.
* **Backend**: SELECT must include reviewer_comments. Return null or empty string when not set. Only include in response when the requester is the applicant (already enforced by "own application" check).
* **Fallback**: When status is REJECTED and (!app.reviewerComments || app.reviewerComments.trim() === ''), display "No additional feedback provided" or similar.

### API Contract

**GET /api/applications/:id**: For applicant, response includes reviewerComments (string | null). When status is REJECTED, this is the comment entered by the reviewer. Backend must not return other applicants' applications or comments.

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Rejected application shows reviewer comments"
    as applicant, open detail for own rejected application (with comments)
    assert section "Reviewer feedback" or similar visible with comment text

  TEST "Approved application does not show rejection section"
    open approved application detail
    assert no "Reason for rejection" or reviewer comments section

  TEST "Applicant cannot see another applicant's application"
    attempt GET /api/applications/:otherId as applicant
    assert 403 or 404
```

### Unit (frontend)

```pseudo
  TEST "ApplicationDetail renders reviewer comments when status REJECTED and comments present"
  TEST "ApplicationDetail does not render comments section when status APPROVED"
  TEST "ApplicationDetail shows fallback when REJECTED but comments empty"
```

---

## Implementation Steps

1. **Backend**: Confirm GET /api/applications/:id returns reviewer_comments (reviewerComments) and that authorization allows only the applicant owner to read the application.

2. **Frontend ApplicationDetail**: If app.status === 'REJECTED', render a section (e.g. card or block) with heading "Reviewer feedback" or "Reason for rejection". Body: app.reviewerComments ? app.reviewerComments : "No additional feedback provided". Render as text (no dangerouslySetInnerHTML). Add class .reviewer-comments or .rejection-feedback; define in index.css with token-based styling.

3. **Verify**: Rejected app shows comments; approved/submitted do not show section; empty comments show fallback; no inline CSS; no XSS risk.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Heading | Use h3 or aria-labelledby for the comments section |
| Contrast | Comment text meets contrast ratio (use design token for text color) |
| Structure | Section is a distinct region so screen readers can navigate to feedback |

---

## Security Requirements

1. **Authorization**: Only the applicant who owns the application can call GET /api/applications/:id and see comments; 403/404 for others.
2. **XSS**: Do not use dangerouslySetInnerHTML with reviewer comment content. Render as text or sanitize if HTML is ever allowed.
3. **CSP**: No inline styles or scripts; all CSS in index.css.

---

## Definition of Done

- [ ] Rejection reason/comments visible when applicant opens detail for a rejected application.
- [ ] Comments displayed in a clear, readable section; fallback when empty.
- [ ] Only the applicant who owns the application sees comments; backend enforces.
- [ ] Comment content rendered safely (no XSS); no inline or component-level CSS.
- [ ] All styles in index.css; typography and layout consistent.
