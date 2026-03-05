# P08: Public Portal - Permit Details & Documents

## Metadata
| Field | Value |
|:------|:------|
| **Prompt ID** | P08 |
| **Phase** | 2 - Public Portal |
| **Related Stories** | S-89617 (View Permit Details and Documents) |
| **Parent Dependencies** | P07 (Map/Table Toggle must be complete) |
| **Estimated Effort** | 4-6 hours |
| **Branch Name** | `feat/p08-permit-details` |
| **Output Verification** | Vitest unit tests pass, Playwright E2E pass (desktop + mobile + tablet), axe-core 0 violations |

---

## Business Requirements

1. **Permit Detail Side Panel**: Clicking "View Details" on any permit row or map popup opens a slide-out side panel (SidePanel component from P02) showing all public permit fields.

2. **Public Fields Displayed** (show "N/A" if blank):
   - Permit Number, Revision Letter, Permittee/Company Name
   - Legal Description, Product/Commodity, GPS Coordinates
   - County, Mine Name, Authorized Use of Explosives (blasting)
   - Permitted Acres, Permit Term Bonded Acres
   - Date Issued, Expiration Date, Renewal Date

3. **Document Folder Structure**: Documents section shows folders:
   - Application, Inspection Report, Production Reports, Permit Fees, Permit
   - Each folder has "View" and "Download" actions
   - "View" opens document in new browser tab
   - "Download" saves file to user's device

4. **Empty State**: "No documents available" when permit has no documents.

5. **Security**: Restricted/internal documents are NEVER shown to public users. Only folders where `isPublicVisible=true` are rendered.

6. **Escape to Close**: Pressing Escape key closes the side panel.

7. **Centralized Styles**: All CSS in `packages/ui/src/styles/`. No component-level stylesheets.

8. **Responsive**: Mobile (full-screen panel), Tablet (50% overlay), Desktop (400px slide-out).

---

## Technical Approach

### Components

```
packages/ui/src/components/
├── PermitDetail/
│   └── PermitDetail.tsx       # Renders all public fields with N/A fallback
├── DocumentPanel/
│   └── DocumentPanel.tsx      # Folder tree with view/download actions
└── (existing) SidePanel/
    └── SidePanel.tsx          # Reused from P02, Escape key listener
```

### Data Flow

```
Row click / "View Details" button
  → setSidePanelOpen(true), setSelectedPermitId(id)
  → PermitDetail fetches getPermit(id) via GraphQL
  → DocumentPanel fetches getPermitDocuments(id)
  → Only documents with isPublicVisible=true rendered
```

### Key Implementation Details

- **PermitDetail**: Maps API response fields to labeled rows. Null/undefined → "N/A". Dates formatted via `Intl.DateTimeFormat`. GPS coords formatted as "lat, lng".
- **DocumentPanel**: Groups documents by folder type. Each folder expandable. "View" opens pre-signed S3 URL via `window.open(url, '_blank')`. "Download" uses `<a href={url} download>`.
- **SidePanel**: Already built in P02. Accepts `onClose` prop. Has `useEffect` Escape keydown listener. Focus trap inside panel. Close button in header.
- **Styles**: Add `.ok-permit-detail`, `.ok-document-panel`, `.ok-document-folder` classes to `packages/ui/src/styles/components.css`. Responsive overrides in `responsive.css`.

### API Queries (from P03)

```graphql
query GetPermit($id: ID!) {
  permit(id: $id) {
    permitNumber revisionLetter permitteeName companyName
    legalDescription productCommodity latitude longitude
    county mineName authorizedExplosives
    permittedAcres permitTermBondedAcres
    dateIssued expirationDate renewalDate
  }
}

query GetPermitDocuments($permitId: ID!) {
  permitDocuments(permitId: $permitId) {
    id folderType fileName fileUrl isPublicVisible
  }
}
```

---

## Tests (Pseudo Code)

> **IMPORTANT**: In addition to the tests below, this prompt MUST also pass ALL applicable checks from [`CROSS-CUTTING-QUALITY-GATES.md`](./CROSS-CUTTING-QUALITY-GATES.md). Key checks for this UI prompt: HTML meta tags (lang, viewport, theme-color, favicon), CSS completeness (form states, button variants, modals, responsive tables), accessibility (focus indicators, sr-only, touch targets, forced-colors), responsive (no horizontal overflow at 3 viewports), and unit test edge cases (null/undefined/empty/boundary).

### Playwright E2E: `tests/e2e/permit-details/permit-details.spec.ts`

```pseudo
SUITE "Permit Detail Side Panel"

  TEST "View Details opens side panel with permit data"
    navigate to /permits
    click "View Details" on first permit row
    assert side panel visible
    assert panel contains "Permit Number" label with value

  TEST "All public field labels displayed"
    open side panel for a permit
    for each field in [Permit Number, Revision Letter, Permittee, Company,
      Legal Description, Commodity, GPS, County, Mine Name,
      Explosives, Permitted Acres, Bonded Acres,
      Date Issued, Expiration, Renewal]:
      assert label visible in panel

  TEST "Empty fields show N/A"
    open side panel for permit with missing optional fields
    assert at least one field displays "N/A"

  TEST "Document folders displayed (public only)"
    open side panel for permit with documents
    assert at least one document folder visible
    assert no folder with isPublicVisible=false is shown

  TEST "No documents message"
    open side panel for permit with zero documents
    assert "No documents available" visible

  TEST "View button opens document in new tab"
    open side panel → click "View" on a document
    assert new tab/window opened with document URL

  TEST "Download button triggers file download"
    open side panel → click "Download" on a document
    assert download initiated (check download event)

  TEST "Escape key closes panel"
    open side panel
    press Escape
    assert side panel not visible

  TEST "Close button closes panel"
    open side panel
    click close (X) button
    assert side panel not visible

  TEST "Mobile - panel opens full screen"
    set viewport 375x812
    open side panel
    assert panel width ≈ viewport width

  TEST "Tablet - panel opens as 50% overlay"
    set viewport 768x1024
    open side panel
    assert panel width ≈ 50% of viewport

  TEST "Desktop - panel slides out 400px"
    set viewport 1440x900
    open side panel
    assert panel width = 400px

  TEST "axe-core 0 violations with panel open"
    open side panel
    run axe-core analysis
    assert 0 violations
```

### Vitest Unit: `packages/ui/src/components/PermitDetail/__tests__/PermitDetail.test.ts`

```pseudo
SUITE "PermitDetail"

  TEST "formats dates correctly"
    render PermitDetail with dateIssued="2025-01-15"
    assert displays "January 15, 2025" (or locale-appropriate format)

  TEST "formats GPS coordinates"
    render with latitude=35.4676, longitude=-97.5164
    assert displays "35.4676, -97.5164"

  TEST "formats acres with comma separator"
    render with permittedAcres=1500
    assert displays "1,500"

  TEST "shows N/A for null fields"
    render with revisionLetter=null
    assert "N/A" displayed for Revision Letter

  TEST "shows N/A for undefined fields"
    render with mineName=undefined
    assert "N/A" displayed for Mine Name

  TEST "renders all 15 field labels"
    render with full permit data
    assert 15 labeled rows present
```

### Vitest Unit: `packages/ui/src/components/DocumentPanel/__tests__/DocumentPanel.test.ts`

```pseudo
SUITE "DocumentPanel"

  TEST "filters out non-public folders"
    render with docs=[{isPublicVisible:true}, {isPublicVisible:false}]
    assert only 1 document rendered

  TEST "groups documents by folder type"
    render with docs from Application and Permit folders
    assert 2 folder groups rendered

  TEST "shows empty state when no documents"
    render with docs=[]
    assert "No documents available" visible

  TEST "renders View and Download buttons per document"
    render with 1 public document
    assert "View" button present
    assert "Download" button present

  TEST "View button has correct href and target=_blank"
    render with doc.fileUrl="https://s3.example.com/doc.pdf"
    assert View link href matches and target="_blank"
```

---

## Implementation Steps

1. **Write all tests first** (TDD): Create Playwright E2E and Vitest unit test files as specified above.

2. **Add styles** to `packages/ui/src/styles/components.css`:
   - `.ok-permit-detail` — field grid layout
   - `.ok-permit-detail__field` — label/value pairs
   - `.ok-document-panel` — document section container
   - `.ok-document-folder` — collapsible folder with icon
   - `.ok-document-item` — individual doc row with action buttons

3. **Add responsive overrides** to `packages/ui/src/styles/responsive.css`:
   - Mobile: side panel full-width/full-height
   - Tablet: side panel 50% width
   - Desktop: side panel 400px width

4. **Implement PermitDetail component**: Field mapping, N/A fallback, date/coordinate/number formatting.

5. **Implement DocumentPanel component**: Fetch documents, filter `isPublicVisible`, group by folder type, render expandable folders with View/Download actions.

6. **Wire into permit page**: Add "View Details" button to table rows and map popups. On click, open SidePanel with PermitDetail + DocumentPanel.

7. **Run tests**: All new + existing tests must pass. `npm run test && npm run e2e`.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Focus Management | Focus moves to panel on open, returns to trigger on close |
| Focus Trap | Tab cycles within open panel only |
| Escape Key | Closes panel and restores focus |
| ARIA | `role="complementary"`, `aria-label="Permit Details"`, `aria-expanded` on folders |
| Screen Reader | Field labels associated with values, document actions labeled |
| Touch Targets | View/Download buttons ≥ 44px on mobile/tablet |

---

## Security Requirements

1. **No restricted documents**: Client-side filter `isPublicVisible=true` + server-side enforcement in GraphQL resolver
2. **Pre-signed URLs**: S3 URLs expire after 15 minutes, generated server-side only
3. **No `dangerouslySetInnerHTML`**: All permit data rendered as text nodes
4. **CSP compatible**: No inline styles or scripts

---

## Performance Requirements

1. **Panel load**: Permit detail + documents fetch < 500ms
2. **Lazy load documents**: Only fetch documents when panel opens, not on page load
3. **No layout shift**: Panel slides in with CSS transform, no content reflow
4. **Document preview**: PDFs open in browser's native viewer (no custom PDF renderer)

---

## Cost Considerations

1. **S3 pre-signed URLs**: Standard S3 GET pricing (~$0.0004/1000 requests)
2. **No additional libraries**: Uses native browser PDF viewer, no third-party doc viewer
3. **GraphQL query**: Single query per panel open, cached if same permit re-opened

---

## Responsive / Device-Aware

| Component | Mobile (< 768px) | Tablet (768–1024px) | Desktop (> 1024px) |
|:----------|:------------------|:--------------------|:--------------------|
| Side Panel | Full screen, 100vw | 50% width overlay | 400px slide-out from right |
| Field Layout | Single column, stacked | Single column | Single column |
| Document Folders | Accordion, full width | Accordion, full width | Accordion, full width |
| Action Buttons | Full width, 44px height | Inline, 44px height | Inline, 40px height |
| Close Button | Top-right, 44px tap target | Top-right, 44px | Top-right, 36px |

---

## Definition of Done

- [ ] "View Details" opens side panel with all 15 public permit fields
- [ ] Null/undefined fields display "N/A"
- [ ] Dates, coordinates, and acres formatted correctly
- [ ] Document folders grouped and displayed (public-visible only)
- [ ] "View" opens document in new tab via pre-signed URL
- [ ] "Download" saves document to device
- [ ] "No documents available" shown for empty state
- [ ] Restricted documents never visible to public users
- [ ] Escape key and close button both close panel
- [ ] Focus management: trap inside panel, restore on close
- [ ] axe-core: 0 accessibility violations
- [ ] Responsive: full-screen mobile, 50% tablet, 400px desktop
- [ ] All styles in `packages/ui/src/styles/` only — zero component-level CSS
- [ ] All Playwright E2E tests pass (desktop + mobile + tablet viewports)
- [ ] All Vitest unit tests pass
- [ ] ESLint 0 errors, TypeScript 0 type errors
- [ ] No secrets committed
- [ ] **Cross-Cutting**: All applicable checks from `CROSS-CUTTING-QUALITY-GATES.md` pass (see Applicability Matrix)
- [ ] **Edge Cases**: All utility functions tested with null, undefined, empty, and boundary inputs
- [ ] **CSS States**: Any new form elements have hover, focus, disabled, and error styles
- [ ] **No Regressions**: Full test suite passes (`npx turbo run test type-check lint --force`)
