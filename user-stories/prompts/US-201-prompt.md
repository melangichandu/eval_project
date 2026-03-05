# US-201: Reviewer Login and Dashboard

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-201 |
| **Phase** | 3 – Reviewer Workflow |
| **Related Stories** | US-201 (Reviewer login and dashboard) |
| **Persona** | Marcus Johnson (Reviewer) |
| **Priority** | Must Have |
| **Parent Dependencies** | US-102 (login returns role), backend seeds REVIEWER users |
| **Estimated Effort** | 2–3 hours |
| **Branch Name** | `feat/us-201-reviewer-dashboard` |
| **Output Verification** | Reviewer login redirects to /reviewer; reviewer dashboard route protected; nav shows reviewer link. All styles in index.css. |

---

## Business Requirements

1. **Login**: Reviewers use the same login page and POST /api/auth/login as applicants. Backend returns user with role "REVIEWER". Reviewers are pre-seeded only; no self-registration for reviewers.

2. **Role-based redirect**: After successful login, if user.role === 'REVIEWER', redirect to reviewer dashboard (e.g. `/reviewer`). If user.role === 'APPLICANT', redirect to `/dashboard`. Implement in Login page or auth callback.

3. **Reviewer dashboard route**: Route e.g. `/reviewer` is protected. Only users with role REVIEWER may access. If an applicant navigates to /reviewer, redirect to /dashboard (or show 403). If not authenticated, redirect to /login.

4. **Dashboard content**: The reviewer dashboard page can initially show a welcome or title (e.g. "Reviewer Dashboard") and a brief description. Full content (application list, filters, summary counts) is implemented in US-202, US-205, US-206. Ensure the layout uses the same header and main content pattern as the rest of the app.

5. **Navigation**: In the header or nav, when the user is a reviewer, show a link to the reviewer dashboard (e.g. "Reviewer Dashboard" or "Review"). When the user is an applicant, show "Dashboard" (applicant). Use the same Layout/nav component; determine link visibility from stored user.role. Do not show applicant "Dashboard" as primary for reviewers.

6. **Centralized styles**: All CSS in frontend/src/index.css. Reuse .main-content, .card, .btn, typography. No inline or component-level CSS. Reviewer dashboard looks part of the same application.

7. **Consistency**: Same font family, button style, header, and spacing as applicant pages.

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── ReviewerDashboard.jsx   # Placeholder or full list (US-202); protected, REVIEWER only
├── App.jsx                     # Route /reviewer with Protected role="REVIEWER"; Login redirect by role
├── components/
│   └── Layout.jsx              # Nav: if user.role === 'REVIEWER' show link to /reviewer; else show /dashboard
└── index.css                   # Reuse only; no new inline
```

### Data Flow

```
User logs in with reviewer credentials
  → POST /api/auth/login → 200 { token, user: { ..., role: 'REVIEWER' } }
  → setAuth(token, user); navigate('/reviewer')
User navigates to /reviewer
  → Protected checks getStoredUser().role === 'REVIEWER'; else redirect to / or /dashboard
  → Render ReviewerDashboard (content per US-202 later)
Layout: getStoredUser() → if role REVIEWER, show "Reviewer Dashboard" link to /reviewer; if APPLICANT, show "Dashboard" to /dashboard
```

### Key Implementation Details

* **Login.jsx**: After api.login(), read data.user.role. navigate(data.user.role === 'REVIEWER' ? '/reviewer' : '/dashboard').
* **Protected route**: <Route path="reviewer" element={<Protected role="REVIEWER"><ReviewerDashboard /></Protected>} />. Protected component: if !user or !token redirect to /login; if role prop and user.role !== role redirect to /dashboard (when role is REVIEWER, reject applicants).
* **Layout**: getStoredUser(); if user.role === 'REVIEWER' render <Link to="/reviewer">Reviewer Dashboard</Link>; else <Link to="/dashboard">Dashboard</Link>. Logout and user name as existing.

### API Contract

No new endpoints. POST /api/auth/login returns role. Reviewer seeds: e.g. marcus.johnson@maplewood.gov / Reviewer123 with role REVIEWER (see challenge doc).

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Reviewer login redirects to /reviewer"
    login as marcus.johnson@maplewood.gov
    assert current path is /reviewer

  TEST "Applicant cannot access /reviewer"
    login as applicant, navigate to /reviewer
    assert redirect to /dashboard or 403

  TEST "Reviewer dashboard shows when reviewer logged in"
    login as reviewer
    assert "Reviewer Dashboard" or similar heading; nav shows reviewer link
```

---

## Implementation Steps

1. **Login redirect**: In Login.jsx after successful login, navigate to user.role === 'REVIEWER' ? '/reviewer' : '/dashboard'.

2. **Route**: Add route for /reviewer with Protected role="REVIEWER" and element ReviewerDashboard.

3. **Protected**: Extend Protected to accept role prop; if role is provided and user.role !== role, redirect (reviewer → /dashboard for applicant; applicant → /reviewer for reviewer if needed).

4. **Layout**: In Layout nav, if user.role === 'REVIEWER' show link to /reviewer; else show link to /dashboard. Same styling for links.

5. **ReviewerDashboard**: Render at least a heading and optional short description; table/list added in US-202. No inline CSS.

6. **Verify**: Reviewer login → /reviewer; applicant login → /dashboard; applicant hitting /reviewer redirects; nav shows correct link per role.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Page title | Document title or h1 "Reviewer Dashboard" so context is clear |
| Nav | Links have descriptive text ("Reviewer Dashboard", "Dashboard") |
| Focus | After redirect, focus on main content or first heading |

---

## Security Requirements

1. **Role on server**: Reviewer-only endpoints (e.g. GET /api/applications/all) must check role REVIEWER; return 403 for applicants.
2. **No client-only protection**: Frontend redirect is UX; backend must enforce role on every reviewer endpoint.

---

## Definition of Done

- [ ] Reviewer can log in with email and password; system recognizes role and shows reviewer dashboard.
- [ ] Reviewer dashboard route is protected; only REVIEWER can access; applicant redirected.
- [ ] Nav shows "Reviewer Dashboard" for reviewer and "Dashboard" for applicant.
- [ ] All styles in index.css; no inline or component-level CSS.
- [ ] Layout and typography consistent with the rest of the application.
