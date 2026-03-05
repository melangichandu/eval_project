# US-102: Log In

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-102 |
| **Phase** | 1 – Applicant Authentication |
| **Related Stories** | US-102 (Log in) |
| **Persona** | Diana Torres (Applicant); also used by Marcus (Reviewer) |
| **Priority** | Must Have |
| **Parent Dependencies** | US-101 (optional; login works independently), backend auth routes |
| **Estimated Effort** | 2–3 hours |
| **Branch Name** | `feat/us-102-login` |
| **Output Verification** | Valid credentials return 200 + JWT; invalid return 401. Frontend redirects APPLICANT to /dashboard, REVIEWER to /reviewer. All styles in `frontend/src/index.css` only. |

---

## Business Requirements

1. **Login page**: A dedicated page (e.g. `/login`) with Email and Password fields. Accessible only when not authenticated; if already logged in, redirect to `/dashboard` (applicant) or `/reviewer` (reviewer).

2. **Form fields**: Email (required), Password (required). Submit on button click or Enter key.

3. **Authentication**: Backend validates credentials (email lookup, bcrypt.compare). Invalid credentials return HTTP 401 with a single message (e.g. "Invalid email or password") to avoid user enumeration. Valid credentials return 200 with `{ token, user }`; JWT expiry 30 minutes.

4. **Role-based redirect**: After successful login, read `user.role`. If APPLICANT, redirect to `/dashboard`. If REVIEWER, redirect to `/reviewer`. Store token and user in the same way as registration.

5. **Centralized styles**: All CSS in `frontend/src/index.css`. No inline or `<style>`. Reuse `.form-group`, `.btn`, `.btn-primary`, `.card`, `.error`.

6. **Link to register**: "Don't have an account? Register" linking to `/register`.

7. **Consistency**: Same form layout, button style, and typography as Register and rest of app.

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── Login.jsx              # Email, password form; submit; redirect by role
├── services/
│   └── api.js                 # login(email, password) → POST /api/auth/login; setAuth(token, user)
├── App.jsx                    # Route /login, PublicOnly wrapper
└── index.css                  # Reuse existing; no new inline styles

backend/src/
├── routes/auth.js             # POST /login → authController.login
├── controllers/authController.js  # Find user by email, bcrypt.compare, JWT sign, return user + token
```

### Data Flow

```
User enters email + password → Submit
  → POST /api/auth/login { email, password }
  → Backend: trim/lowercase email, SELECT user by email; if !user or !bcrypt.compare(password, user.password_hash) return 401; else jwt.sign, return 200 { token, user }
  → Frontend: setAuth(token, user); if user.role === 'REVIEWER' navigate('/reviewer'); else navigate('/dashboard')
  → On 401: display body.error (e.g. "Invalid email or password")
```

### Key Implementation Details

* **Backend**: Single 401 message for both "user not found" and "wrong password". JWT payload: `{ id, email, role }`, expiresIn: '30m'. Return user without password_hash.
* **Frontend**: Controlled inputs. On 401, set error state from response. Do not store or log password in state beyond submit.
* **PublicOnly**: In App, wrap Login (and Register) so that if token exists, redirect to dashboard or reviewer based on stored user role.

### API Contract

**Request:** `POST /api/auth/login`  
**Body:** `{ "email": "string", "password": "string" }`

**Response 200:** `{ "token": "JWT", "user": { "id", "email", "fullName", "phone", "organizationName", "role" } }`  
**Response 401:** `{ "error": "Invalid email or password" }`

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Invalid credentials show error"
    POST with wrong password (or unknown email)
    assert status 401, message "Invalid email or password"

  TEST "Applicant login redirects to /dashboard"
    login as applicant
    assert current path is /dashboard

  TEST "Reviewer login redirects to /reviewer"
    login as reviewer (seeded account)
    assert current path is /reviewer

  TEST "Login page has link to register"
    navigate to /login
    assert link to /register present
```

### Unit (backend)

```pseudo
  TEST "returns 200 and token for valid credentials"
  TEST "returns 401 for wrong password"
  TEST "returns 401 for unknown email"
```

---

## Implementation Steps

1. **Backend**: Implement `authController.login`: find user by email, bcrypt.compare, on success JWT + return user (no password_hash); on failure 401 with single message.

2. **Frontend**: Login.jsx – form state (email, password), submit handler, call api.login(), on success setAuth + navigate by role; on error set error state. PublicOnly wrapper in App.

3. **Styles**: Ensure no inline CSS; use index.css classes only.

4. **Verify**: Role-based redirect and 401 behavior.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Labels | `<label for="email">`, `<label for="password">` with matching input ids |
| Errors | Error message in DOM, associated or adjacent to form |
| Focus | Tab order: email → password → submit → register link |
| Touch targets | Submit button min 44px |

---

## Security Requirements

1. **401 message**: Same text for invalid email and invalid password.
2. **No password in logs or client**: Do not log or store password after submit.
3. **JWT**: Signed with secret from env; 30m expiry. Include only id, email, role in payload.

---

## Performance Requirements

1. Single POST per login; no preflight or duplicate requests.
2. Clear password from component state after submit (or do not keep in state longer than needed).

---

## Definition of Done

- [ ] User can log in with email and password.
- [ ] Invalid credentials show "Invalid email or password" (401).
- [ ] Session (JWT) persists until logout or 30-minute expiry.
- [ ] APPLICANT redirects to /dashboard; REVIEWER to /reviewer.
- [ ] All styles in `frontend/src/index.css` only.
- [ ] "Don't have an account? Register" link present.
- [ ] No inline or component-level CSS.
