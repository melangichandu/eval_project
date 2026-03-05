# US-106: Upload Supporting Document

## Metadata

| Field | Value |
|:------|:------|
| **Prompt ID** | US-106 |
| **Phase** | 2 – Applicant Application Flow |
| **Related Stories** | US-106 (Upload supporting document) |
| **Persona** | Diana Torres (Applicant) |
| **Priority** | Must Have |
| **Parent Dependencies** | US-104 (form with document field), backend POST /api/applications/:id/documents |
| **Estimated Effort** | 3–4 hours |
| **Branch Name** | `feat/us-106-document-upload` |
| **Output Verification** | User can select PDF/JPG/PNG ≤5MB; file name shown; wrong type/size show error. Backend validates and stores; only applicant's application. All styles in index.css. |

---

## Business Requirements

1. **Placement**: The supporting document upload is part of the application form (Section 2). Label: e.g. "Supporting Document (PDF, JPG, PNG; max 5 MB)" with required indicator. One file per application (replace if user selects another).

2. **Allowed types**: PDF, JPG, PNG only. Client and server must both validate. Reject others with a clear message (e.g. "Only PDF, JPG, and PNG are allowed.").

3. **Max size**: 5 MB. Reject larger files with a clear message (e.g. "File must be 5 MB or smaller."). Validate on client (before upload) and on server (before saving).

4. **After valid selection**: Show the selected file name (and optionally size) below the input. Do not display raw path or internal identifiers to the user.

5. **Upload timing**: Document is uploaded after the application is created (on submit from review screen). Flow: user fills form and selects file → Review & Submit → POST /api/applications (creates application) → POST /api/applications/:id/documents with the file for the new application id. If upload fails, show error; application may already exist (decide whether to allow retry or show "application created but document failed").

6. **Backend**: Accept multipart/form-data with a single file field (e.g. `document`). Verify application exists and belongs to authenticated applicant (403/404 otherwise). Validate MIME type (application/pdf, image/jpeg, image/jpg, image/png) and file size (≤ 5 MB). Store file in configured storage (local volume or S3); save metadata in documents table (application_id, file_name, file_type, file_size, storage_path, uploaded_at). Generate safe storage path (no user-controlled path); sanitize or use generated filename.

7. **Centralized styles**: All CSS in `frontend/src/index.css`. Use .form-group, .error for messages. Add .file-upload-name or similar only in index.css. No inline or component-level CSS.

8. **Consistency**: Same input and button styling as rest of form; error text uses .error and design tokens.

---

## Technical Approach

### Components

```
frontend/src/
├── pages/
│   └── ApplicationForm.jsx     # File input in Section 2; state: file (File | null); validation on change; show fileName
│   └── ReviewSubmit.jsx        # On submit: create application then uploadDocument(applicationId, file)
├── services/
│   └── api.js                 # uploadDocument(applicationId, file) → POST multipart to /api/applications/:id/documents
└── index.css                   # .file-upload, .file-upload-name, .error

backend/src/
├── routes/applications.js      # POST /:id/documents, upload.single('document'), applicationController.uploadDocument
├── controllers/applicationController.js  # Check app belongs to user; validate file; save to storage + DB
├── middleware/
│   └── upload.js              # multer: limits 5MB, fileFilter MIME allow list, diskStorage with safe filename
```

### Data Flow

```
User selects file in Section 2
  → onChange: validate type (file.type in allow list) and size (file.size <= 5*1024*1024)
  → If invalid: set fileError state, clear file; display error
  → If valid: set file state, clear fileError; display file.name
  → On Submit (from review): POST /api/applications → get application id → POST /api/applications/:id/documents with FormData(document: file)
  → Backend: auth, check applicant owns application; multer validates type/size; save file; INSERT documents row
  → On success: clear file state or navigate; on error show API error
```

### Key Implementation Details

* **multer**: fileFilter checks req.file.mimetype in ['application/pdf','image/jpeg','image/jpg','image/png']. limits: { fileSize: 5*1024*1024 }. On LIMIT_FILE_SIZE, return 400 with message "File too large. Maximum size is 5 MB."
* **Storage**: Save to UPLOAD_DIR or S3; store relative path or S3 key in documents.storage_path. Do not use user-provided filename for filesystem path; use application id + timestamp + extension.
* **Frontend FormData**: const form = new FormData(); form.append('document', file). Send with Content-Type multipart (browser sets); do not set Content-Type manually so boundary is included.
* **Authorization**: Only the applicant who owns the application may upload; backend must check application.applicant_id === req.user.id.

### API Contract

**Request:** `POST /api/applications/:id/documents`  
**Headers:** `Authorization: Bearer <JWT>`  
**Body:** multipart/form-data, field name `document`, file (PDF, JPG, or PNG, ≤ 5 MB)

**Response 201:** `{ "message": "Document uploaded", "fileName": "original.pdf" }` or similar  
**Response 400:** Invalid type or size (body: `{ "error": "..." }`)  
**Response 403/404:** Application not found or not owned by user

---

## Tests (Pseudo Code)

### E2E

```pseudo
  TEST "Select valid file shows file name"
    on application form Section 2, select a PDF < 5MB
    assert file name displayed below input

  TEST "Select invalid type shows error"
    select a .docx or .txt file
    assert error "Only PDF, JPG, and PNG" or similar

  TEST "Select file > 5MB shows error"
    select file 6MB
    assert error about size limit

  TEST "Submit with file uploads document"
    fill form, select valid file, go to review, submit
    assert application created and document listed (e.g. on application detail)
```

### Unit (backend)

```pseudo
  TEST "uploadDocument rejects wrong MIME type with 400"
  TEST "uploadDocument rejects file > 5MB with 400"
  TEST "uploadDocument returns 403 when application belongs to another user"
  TEST "uploadDocument saves file and creates documents row for owner"
```

---

## Implementation Steps

1. **Backend**: Configure multer (upload.js) with 5MB limit, MIME filter, safe storage path. Implement uploadDocument controller: verify application ownership, call multer (already in route), insert documents row. Add error handler in app.js for LIMIT_FILE_SIZE and invalid file type (400 with message).

2. **Frontend**: In ApplicationForm Section 2, add <input type="file" accept=".pdf,.jpg,.jpeg,.png">. On change, validate type and size; set file + fileError state. Display file.name when file is set; display fileError when invalid. In ReviewSubmit, after POST /api/applications succeeds, call uploadDocument(app.id, file) if file exists; handle 201 and 4xx.

3. **api.js**: uploadDocument(applicationId, file) builds FormData, POST to /api/applications/${applicationId}/documents with Authorization header; no Content-Type (browser sets multipart).

4. **Styles**: In index.css add .file-upload-name (or reuse .form-group). Error message use .error. No inline CSS.

5. **Verify**: Client and server reject wrong type and >5MB; file name shown; upload succeeds for valid file; only owner can upload.

---

## Accessibility Requirements

| Requirement | Implementation |
|:------------|:---------------|
| Label | <label for="doc-input"> with description of allowed types and size |
| Error | Associate error with input (aria-describedby or adjacent .error with id) |
| Focus | File input focusable; ensure 44px touch target area for the control |

---

## Security Requirements

1. **Server-side validation**: Never trust client; always validate MIME and size on server.
2. **Path safety**: Do not use user-provided filename for filesystem path; generate safe name (e.g. timestamp-applicationId.pdf).
3. **Authorization**: Only applicant who owns the application can upload; return 403 otherwise.
4. **No execution**: Store file as binary; do not execute or interpret content.

---

## Performance Requirements

1. Do not load entire file into memory for preview (showing name is sufficient).
2. Single upload per submit; do not send file multiple times.

---

## Definition of Done

- [ ] User can upload one PDF, JPG, or PNG file up to 5 MB.
- [ ] File name displayed after valid selection; error for wrong format or too large (client and server).
- [ ] Backend validates type and size; stores file safely; records metadata in documents table.
- [ ] Only applicant who owns the application can upload; 403 for others.
- [ ] All styles in `frontend/src/index.css` only.
- [ ] No inline or component-level CSS.
