# User Story Implementation Prompts

This folder contains one **detailed, executable prompt** per user story. Each prompt is written so it can be run later to implement that story with the standards below.

---

## Design and coding standards (apply to every story)

* **Single external CSS:** All styles live in one global CSS file (e.g. `frontend/src/index.css`). No inline styles (`style="..."`), no `<style>` tags in components. Add new classes only when needed and define them in that same file.
* **Modern UI/UX:** Clear visual hierarchy, ample spacing (e.g. 8px grid), consistent fonts and buttons, easy navigation. Use semantic HTML and ARIA where appropriate. Touch targets at least 44px where applicable.
* **Consistency:** Reuse design tokens (e.g. `--primary`, `--secondary`, `--radius`, `--font`, `--danger`, `--success`) and existing classes (`.btn`, `.btn-primary`, `.btn-neutral`, `.card`, `.form-group`, `.error`). Typography and button styles must match across the whole application.
* **Security:** Server-side validation for all inputs; parameterized queries or ORM; no secrets in client code; secure auth (e.g. JWT, bcrypt). Do not expose stack traces or internal errors to the user.
* **Performance:** Avoid unnecessary re-renders; fetch only needed data; do not duplicate heavy logic on the client when the server already provides the result.
* **Accessibility:** Label all form controls; ensure keyboard navigation and sufficient color contrast; use roles and live regions where appropriate.

When implementing, start from the existing stylesheet and extend it; do not introduce a second CSS file or component-level style blocks.

---

| ID | Prompt File | User Story |
|:---|:------------|:-----------|
| US-101 | [US-101-prompt.md](US-101-prompt.md) | Create account |
| US-102 | [US-102-prompt.md](US-102-prompt.md) | Log in |
| US-103 | [US-103-prompt.md](US-103-prompt.md) | Applicant dashboard |
| US-104 | [US-104-prompt.md](US-104-prompt.md) | Two-section grant form |
| US-105 | [US-105-prompt.md](US-105-prompt.md) | Real-time eligibility feedback |
| US-106 | [US-106-prompt.md](US-106-prompt.md) | Upload supporting document |
| US-107 | [US-107-prompt.md](US-107-prompt.md) | Review before submit |
| US-108 | [US-108-prompt.md](US-108-prompt.md) | Submit when not fully eligible |
| US-109 | [US-109-prompt.md](US-109-prompt.md) | See award amount when approved |
| US-110 | [US-110-prompt.md](US-110-prompt.md) | See reviewer comments when rejected |
| US-201 | [US-201-prompt.md](US-201-prompt.md) | Reviewer login and dashboard |
| US-202 | [US-202-prompt.md](US-202-prompt.md) | List all applications |
| US-203 | [US-203-prompt.md](US-203-prompt.md) | Application detail (reviewer) |
| US-204 | [US-204-prompt.md](US-204-prompt.md) | Approve/reject with award |
| US-205 | [US-205-prompt.md](US-205-prompt.md) | Summary counts by status |
| US-206 | [US-206-prompt.md](US-206-prompt.md) | Filter applications |
| US-301 | [US-301-prompt.md](US-301-prompt.md) | Administrator summary report |
