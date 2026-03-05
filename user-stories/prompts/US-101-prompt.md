# US-101: Create Account

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-101 |
| **Phase** | 1 – Applicant Authentication |
| **Related Stories** | US-101 (Create account) |
| **Persona** | Diana Torres (Applicant) |
| **Priority** | Must Have |
| **Parent Dependencies** | None (project setup, backend server, DB schema) |
| **Estimated Effort** | 3–4 hours |
| **Branch Name** | `feat/us-101-create-account` |
| **Output Verification** | Backend: register returns 201 and JWT; duplicate email returns 400. Frontend: form submits, redirects to dashboard; validation and errors visible. All styles in `frontend/src/index.css` only. |

---

## Business Requirements

1. **Registration page**: A dedicated page (e.g. `/register`) where an applicant can create an account. Page is only accessible when the user is not authenticated; if already logged in, redirect to applicant dashboard.

2. **Form fields** (all required):
   * Full Name (min 2 characters, max 100)
   * Email (valid format, stored lowercase)
   * Phone (required; placeholder or hint e.g. (XXX) XXX-XXXX)
   * Organization Name (required)
   * Password (min 8 characters)
   * Confirm Password (must match Password)

3. **Validation**:
   * Client-side: validate on blur and on submit; show inline or summary errors (e.g. "Passwords do not match", "Email format invalid", "Password must be at least 8 characters").
   * Server-side: same rules enforced. Duplicate email returns HTTP 400 with a single, clear message (e.g. "An account with this email already exists"). Do not reveal whether the email exists for other error types (security).

4. **Success**: On successful registration (201), store the returned JWT and user object (e.g. in localStorage or project-standard auth store), then redirect to the applicant dashboard (`/dashboard`). Do not display the raw token in the UI.

5. **Centralized styles**: All CSS in `frontend/src/index.css`. No inline styles, no `<style>` in components. Reuse design tokens (e.g. `--primary`, `--radius`, `--font`) and existing classes (`.btn`, `.btn-primary`, `.card`, `.form-group`, `.error`).

6. **Consistency**: Typography (font family, sizes), button sizes, border-radius, and spacing must match the rest of the application. Use the same label/input patterns as the login page.

7. **Link to login**: Provide a link "Already have an account? Log in" pointing to `/login`.

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── Register.jsx           # Registration form, validation, submit, redirect
├── services/
│   └── api.js                 # register(body) → POST /api/auth/register
├── App.jsx                    # Route /register, PublicOnly wrapper
└── index.css                  # All styles (add .register-page, form classes if needed)

backend/src/
├── routes/
│   └── auth.js                # POST /register → authController.register
├── controllers/
│   └── authController.js       # Validate, check duplicate email, bcrypt hash, insert user, JWT
├── middleware/
│   └── auth.js                # (JWT helpers; no auth required for register)
└── config/
    └── db.js                  # Pool for user insert
```

### Data Flow

```
User fills form → Client validation on blur/submit
  → On submit: POST /api/auth/register with { fullName, email, phone, organizationName, password }
  → Backend: trim/lowercase email, check duplicate (SELECT by email), bcrypt.hash(password, 10), INSERT user (role APPLICANT), jwt.sign({ id, email, role }, secret, { expiresIn: '30m' })
  → Response 201 { token, user: { id, email, fullName, phone, organizationName, role } }
  → Frontend: store token and user, redirect to /dashboard
  → On 400: display error message (e.g. duplicate email)
```

### Key Implementation Details

* **Backend**: Use parameterized query for `SELECT id FROM users WHERE email = $1` and for `INSERT INTO users (...) VALUES ($1,...)`. Hash password with `bcrypt.hash(password, 10)` (or higher). Return `user` without `password_hash`. JWT payload: `{ id: user.id, email: user.email, role: user.role }`, expiry 30m.
* **Frontend**: Controlled inputs for each field. On submit, if client validation fails, set error state and do not call API. On API 400/500, set error state from `response.json().error`. On 201, call `setAuth(data.token, data.user)` (or equivalent), then `navigate('/dashboard')`.
* **Styles**: Add only classes needed (e.g. `.register-page`, `.form-actions`) in `index.css`. Use `.form-group .error` for field-level errors. Buttons: `.btn`, `.btn-primary`; ensure min-height 44px for touch targets.

### API Contract

**Request:** `POST /api/auth/register`  
**Body (JSON):**
```json
{
  "fullName": "string (required)",
  "email": "string (required, will be lowercased)",
  "phone": "string (required)",
  "organizationName": "string (required)",
  "password": "string (required, min 8)"
}
```

**Response 201:**
```json
{
  "token": "JWT string",
  "user": {
    "id": "uuid",
    "email": "string",
    "fullName": "string",
    "phone": "string",
    "organizationName": "string",
    "role": "APPLICANT"
  }
}
```

**Response 400:** `{ "error": "An account with this email already exists" }` or validation message.  
**Response 500:** `{ "error": "Internal server error" }` (do not expose stack traces).

---

## Tests (Pseudo Code)

### E2E (Playwright or manual)

```pseudo
SUITE "Registration (US-101)"

  TEST "Register page shows when not logged in"
    navigate to /register
    assert page contains "Create an account" or similar heading
    assert form has fields: Full Name, Email, Phone, Organization Name, Password, Confirm Password

  TEST "Duplicate email shows error"
    navigate to /register
    fill form with email that already exists in DB
    submit
    assert error message like "account with this email already exists"
    assert still on /register

  TEST "Successful registration redirects to dashboard"
    navigate to /register
    fill form with new unique email and valid data
    submit
    assert redirect to /dashboard
    assert dashboard shows (e.g. "Welcome" or application list / empty state)

  TEST "Passwords must match"
    fill form with password "Secret123" and confirm "Different123"
    submit (client-side)
    assert validation error "Passwords do not match" or similar

  TEST "Link to login present"
    navigate to /register
    assert link "Already have an account? Log in" or similar exists and points to /login
```

### Unit (backend, e.g. Jest/supertest)

```pseudo
SUITE "POST /api/auth/register"

  TEST "returns 201 and token for valid body"
    POST with valid fullName, email, phone, organizationName, password
    assert status 201
    assert body has token (string), user (object with id, email, role APPLICANT)
    assert user in DB with hashed password (bcrypt check)

  TEST "returns 400 for duplicate email"
    insert user with email "existing@test.com"
    POST with same email
    assert status 400
    assert body.error contains "already exists" or similar

  TEST "returns 400 for missing required field"
    POST without email
    assert status 400
```

---

## Implementation Steps

1. **Backend**: Implement `POST /api/auth/register` in `authController.register`: validate body, check duplicate email, bcrypt hash, insert user with role APPLICANT, generate JWT, return 201 with token and user. Use parameterized queries.

2. **Add styles** to `frontend/src/index.css`: any new classes for register page (e.g. `.register-page`, `.form-actions`). Reuse `.form-group`, `.btn`, `.btn-primary`, `.error`. Ensure no inline or component-level CSS.

3. **Frontend**: Implement or update `Register.jsx`: form state for all fields, client validation (required, email format, password length, passwords match), call `register()` from api service on submit, handle 201 (store auth, redirect) and 4xx/5xx (set error). Add route `/register` with PublicOnly wrapper in App.

4. **Wire api service**: Ensure `api.register(body)` sends POST to `/api/auth/register` with JSON body and returns response; handle non-JSON errors.

5. **Verify**: No inline or internal CSS; all styles in `index.css`. Buttons and typography consistent with login/landing. Run backend and frontend tests.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Labels | Every input has a visible `<label>` with `for` matching input `id` |
| Required | Required fields indicated (e.g. asterisk or "required" text) and `aria-required="true"` |
| Errors | Error message associated with field (e.g. `aria-describedby` or adjacent `.error` with `id`) |
| Focus | Logical tab order; focus not trapped; submit button focusable |
| Contrast | Error text and labels meet contrast ratio (e.g. use `--danger`, `--neutral` from design tokens) |
| Touch targets | Buttons and links min 44px height/width where applicable |

---

## Security Requirements

1. **Passwords**: Never log or return plain-text password. Store only bcrypt hash (cost factor 10 or higher).
2. **Duplicate email**: Return same generic message for "email taken" and "validation error" where appropriate to avoid user enumeration.
3. **Input**: Trim and sanitize (e.g. email toLowerCase). Validate length and format server-side.
4. **SQL**: Use parameterized queries or ORM for all DB access. No string concatenation for SQL.
5. **CSP / no inline**: No inline styles or scripts; all CSS in `index.css`.

---

## Performance Requirements

1. **No unnecessary re-renders**: Use controlled inputs without lifting entire form state to a global store unless needed.
2. **Single request**: One POST on submit; no repeated calls on blur for registration.
3. **Bundle**: Do not add heavy libraries for validation; use native or existing project utilities.

---

## Responsive / Device-Aware

| Element | Mobile (< 768px) | Desktop (≥ 768px) |
|:--------|:------------------|:-------------------|
| Form width | Full width with padding | Max width e.g. 440px, centered |
| Buttons | Full width or stacked, 44px min height | Inline, 44px min height |
| Inputs | Full width, 44px min touch target | Full width within container |

---

## Definition of Done

- [ ] User can register with fullName, email, phone, organizationName, password (and confirm password).
- [ ] Email is validated (format and uniqueness); duplicate email returns 400 with clear message.
- [ ] Password is hashed with bcrypt (cost ≥ 10) and never stored or returned in plain text.
- [ ] On success, JWT and user are stored and user is redirected to `/dashboard`.
- [ ] All styles in `frontend/src/index.css` only — zero inline or component-level CSS.
- [ ] Typography and buttons consistent with the application.
- [ ] "Already have an account? Log in" link present and points to `/login`.
- [ ] Accessibility: labels, required indicators, error association, 44px touch targets where applicable.
- [ ] Backend uses parameterized queries; no SQL injection risk.
- [ ] Tests: register flow and duplicate-email behavior verified (E2E or manual; backend unit tests if present).
