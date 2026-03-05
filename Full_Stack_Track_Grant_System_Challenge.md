# Maplewood County Community Development Grant System

## Full\-Stack Web Development Track

**Document Version:** 1.0
**Date:** March 1, 2026
**Duration:** 7 Working Days
**Track:** Full\-Stack Web Development

---

## Table of Contents

1. [Challenge Overview](#1-challenge-overview)
2. [Business Context & Problem Statement](#2-business-context--problem-statement)
3. [Personas & User Stories](#3-personas--user-stories)
4. [Grant Application Form \- Field Specifications](#4-grant-application-form---field-specifications)
5. [Eligibility Engine](#5-eligibility-engine)
6. [Award Calculation Engine](#6-award-calculation-engine)
7. [Application Workflow](#7-application-workflow)
8. [Technical Architecture & Implementation](#8-technical-architecture--implementation)
9. [UI/UX Requirements](#9-uiux-requirements)
10. [Evaluation Criteria](#10-evaluation-criteria)
11. [Daily Milestones](#11-daily-milestones)
12. [Submission Guidelines](#12-submission-guidelines)
13. [Appendix A \- Sample Data](#appendix-a---sample-data)
14. [Appendix B \- Wireframes](#appendix-b---wireframes)
15. [Appendix C \- Glossary](#appendix-c---glossary)

---

## 1. Challenge Overview

### What You Are Building

You will build a **Community Development Grant Management System** for a fictional county government called **Maplewood County**. This system allows nonprofit organizations to apply online for community development grants of up to $50,000, and allows government staff to review, approve, or reject those applications.

The system has two engines that make it more than a simple form\-and\-review app:

* **Eligibility Engine** \- As the applicant fills out the form, the system checks 6 eligibility rules in real time and shows a green checkmark or red X next to each rule. The applicant can see immediately whether they qualify.
* **Award Calculation Engine** \- When a reviewer approves an application, the system automatically calculates the grant award amount based on a scoring matrix. The reviewer does not manually decide the dollar amount \- the formula does.

### What "Done" Looks Like

By the end of the week, you should have a working application (a Minimum Viable Product) where:

* A nonprofit representative can create an account, log in, fill out a two\-section grant application, see real\-time eligibility feedback, upload a document, and submit
* The applicant can see the status of their applications on a dashboard
* A government reviewer can log in, see pending applications with eligibility recommendations, review details, and approve or reject
* When approved, the award amount is auto\-calculated and displayed to both the reviewer and the applicant
* When rejected, the reviewer's comments are visible to the applicant

### How You Will Be Evaluated

You are **not** expected to build a production\-ready, polished system. You **are** expected to demonstrate:

* Problem\-solving ability using AI\-assisted coding tools
* Understanding of your tech stack
* Thoughtful user experience decisions
* Working end\-to\-end functionality (even if basic)
* Clean, readable code
* A well\-implemented eligibility engine and award calculator

---

## 2. Business Context & Problem Statement

### The Organization

**Maplewood County Government** is a mid\-sized county in the United States with approximately 250,000 residents. The county's Office of Community Development administers a grant program that distributes $2 million annually to local nonprofits for community improvement projects.

### Current Pain Points

**For Applicants (Nonprofits):**

* Must submit paper applications by mail or in person
* No way to know if they even qualify before spending hours on the application
* No visibility into where their application stands after submission
* Award amounts feel arbitrary \- no transparency into how funding decisions are made

**For Government Staff (Reviewers):**

* Paper applications pile up with no prioritization
* Manually checking eligibility criteria is tedious and error\-prone
* Calculating award amounts involves a spreadsheet that only one person understands
* No audit trail of decisions

**For County Leadership:**

* Cannot report on how funds are distributed
* No data on application volumes or processing times
* Compliance risk \- paper trail is unreliable

### The Goal

Build an online grant management portal that:

1. Lets nonprofits apply online and see real\-time eligibility feedback
2. Automatically screens applications against eligibility rules
3. Gives reviewers a clear recommendation and all the data they need
4. Auto\-calculates award amounts using a transparent, consistent formula
5. Provides a dashboard for applicants to track status

---

## 3. Personas & User Stories

### Persona 1: Diana Torres \- The Applicant

| Attribute | Detail |
|:----------|:-------|
| **Age** | 38 |
| **Role** | Executive Director of "Youth Forward," a nonprofit youth mentorship program |
| **Tech Comfort** | Moderate \- uses web apps daily, comfortable with online forms |
| **Goal** | Apply for a Community Development Grant to fund an after\-school mentorship expansion |
| **Frustration** | "I spent 3 days on a paper application last year and got rejected because we didn't meet one criterion I didn't even know about. I wish I could see if we qualify before doing all the work." |

#### Diana's User Stories

| ID | User Story | Priority | Acceptance Criteria |
|:---|:-----------|:---------|:--------------------|
| US\-101 | As an applicant, I want to create an account so I can submit and track grant applications | Must Have | Can register with name, email, phone, organization name, and password. Email validated. Duplicate emails rejected with clear message. |
| US\-102 | As an applicant, I want to log in to my account | Must Have | Log in with email and password. Invalid credentials show clear error. Session persists until logout or 30\-minute timeout. |
| US\-103 | As an applicant, I want to see a dashboard showing my applications | Must Have | Dashboard shows list of all submitted applications. Each row shows: Application ID, Project Title, Date Submitted, Status, Award Amount (if approved). Empty state shows message and "Start New Application" button. |
| US\-104 | As an applicant, I want to fill out a two\-section grant application form | Must Have | Section 1: Organization Information. Section 2: Project Details. Required fields marked with \*. Can navigate between sections. |
| US\-105 | As an applicant, I want to see real\-time eligibility feedback as I fill out the form | Must Have | Each eligibility rule shows a green checkmark when passing or a red X when failing. An overall eligibility status shows "Eligible" or "Not Eligible" with the count (e.g., "5 of 6 criteria met"). |
| US\-106 | As an applicant, I want to upload a supporting document | Must Have | Can upload one PDF, JPG, or PNG file up to 5 MB. File name displayed after upload. Error shown if wrong format or too large. |
| US\-107 | As an applicant, I want to review my application before submitting | Should Have | Read\-only summary of all answers plus eligibility status. Can go back to edit or confirm and submit. |
| US\-108 | As an applicant, I want to submit even if I am not fully eligible | Must Have | The system warns but does not block submission. The reviewer will make the final call. |
| US\-109 | As an applicant, I want to see the award amount if my application is approved | Must Have | Approved applications show the calculated award amount on the dashboard and detail view. |
| US\-110 | As an applicant, I want to see reviewer comments if rejected | Should Have | Rejection reason/comments visible when clicking into the application detail. |

---

### Persona 2: Marcus Johnson \- The Reviewer

| Attribute | Detail |
|:----------|:-------|
| **Age** | 42 |
| **Role** | Grants Analyst at Maplewood County Office of Community Development |
| **Tech Comfort** | High \- uses government software daily |
| **Goal** | Efficiently review grant applications with data\-driven support |
| **Frustration** | "I manually check every eligibility criterion and calculate awards in a spreadsheet. I need the system to do that and let me focus on making the judgment call." |

#### Marcus's User Stories

| ID | User Story | Priority | Acceptance Criteria |
|:---|:-----------|:---------|:--------------------|
| US\-201 | As a reviewer, I want to log in to a reviewer dashboard | Must Have | Reviewer logs in with email and password. System recognizes reviewer role and shows reviewer dashboard. |
| US\-202 | As a reviewer, I want to see a list of all applications with eligibility status | Must Have | Dashboard shows applications sorted by date (oldest first). Each row shows: Application ID, Organization Name, Project Title, Date Submitted, Eligibility Status (Eligible/Not Eligible), Application Status. |
| US\-203 | As a reviewer, I want to open an application and see all details plus eligibility results | Must Have | Detail view shows all form fields, uploaded document (viewable/downloadable), and the eligibility check results (each rule with pass/fail and explanation). |
| US\-204 | As a reviewer, I want to approve or reject with the award auto\-calculated on approval | Must Have | "Approve" button triggers the award calculation engine and displays the calculated amount before confirming. "Reject" button requires a comment. Confirmation dialog before final action. |
| US\-205 | As a reviewer, I want to see summary counts by status | Should Have | Dashboard header shows: X Submitted, Y Under Review, Z Approved ($total awarded), W Rejected. |
| US\-206 | As a reviewer, I want to filter applications by eligibility and status | Should Have | Dropdown filters for Eligibility (All, Eligible, Not Eligible) and Status (All, Submitted, Under Review, Approved, Rejected). |

---

### Persona 3: Director Priya Sharma \- The Administrator (Stretch Goal)

| ID | User Story | Priority | Acceptance Criteria |
|:---|:-----------|:---------|:--------------------|
| US\-301 | As an administrator, I want a summary report of applications by status and total funds awarded | Nice to Have | A page showing counts by status and sum of awarded amounts. |

---

## 4. Grant Application Form \- Field Specifications

### Section 1: Organization Information

| Field Name | Field Type | Required | Validation Rules | Help Text |
|:-----------|:-----------|:---------|:-----------------|:----------|
| Organization Name | Text | Yes | 2\-100 characters | The legal name of your organization |
| EIN (Tax ID) | Text | Yes | Format: XX\-XXXXXXX (2 digits, hyphen, 7 digits) | Your IRS Employer Identification Number |
| Organization Type | Dropdown | Yes | Options: 501(c)(3), 501(c)(4), Community\-Based Organization, Faith\-Based Organization, For\-Profit Business, Government Agency, Individual | Select your organization's classification |
| Year Founded | Number | Yes | 1800 \- current year | The year your organization was established |
| Annual Operating Budget | Currency | Yes | $0 \- $100,000,000 | Your organization's total annual budget |
| Number of Full\-Time Employees | Number | Yes | 0 \- 9999 | Total number of full\-time staff |
| Primary Contact Name | Text | Yes | 2\-50 characters | First and last name of the primary contact |
| Primary Contact Email | Email | Yes | Valid email format | We will send all correspondence to this email |
| Primary Contact Phone | Phone | Yes | Format: (XXX) XXX\-XXXX | A phone number where we can reach you |
| Organization Address | Text | Yes | Street, City, State, Zip | Your organization's physical address |
| Mission Statement | Textarea | Yes | 20\-500 characters | Briefly describe your organization's mission |

### Section 2: Project Details

| Field Name | Field Type | Required | Validation Rules | Help Text |
|:-----------|:-----------|:---------|:-----------------|:----------|
| Project Title | Text | Yes | 5\-100 characters | A descriptive title for your project |
| Project Category | Dropdown | Yes | Options: Youth Programs, Senior Services, Public Health, Neighborhood Safety, Arts & Culture, Workforce Development, Other | Select the category that best fits your project |
| Project Description | Textarea | Yes | 50\-2000 characters | Describe the project goals, activities, and expected outcomes |
| Target Population Served | Text | Yes | 5\-200 characters | Who will benefit from this project? (e.g., "At\-risk youth ages 14\-18 in East Maplewood") |
| Estimated Number of Beneficiaries | Number | Yes | 1 \- 1,000,000 | How many people will directly benefit? |
| Total Project Cost | Currency | Yes | $100 \- $10,000,000 | The total cost of the entire project |
| Amount Requested | Currency | Yes | $100 \- $50,000 | How much grant funding are you requesting? (Max $50,000) |
| Project Start Date | Date | Yes | Must be at least 30 days in the future | When will the project begin? |
| Project End Date | Date | Yes | Must be after start date, within 24 months of start | When will the project be completed? |
| Previously Received Maplewood Grant | Checkbox | No | \- | Check if your organization has received a Maplewood County grant before |
| Supporting Document | File Upload | Yes | PDF, JPG, PNG; max 5 MB | Upload your project proposal, budget breakdown, or supporting documentation |

---

## 5. Eligibility Engine

### How It Works

The eligibility engine evaluates 6 rules in real time as the applicant fills out the form. It does **not** block submission \- it advises. Think of it as a pre\-screening assistant.

### The 6 Eligibility Rules

| Rule # | Rule Name | Logic | Fields Involved | Pass Indicator | Fail Indicator |
|:-------|:----------|:------|:----------------|:---------------|:---------------|
| 1 | Nonprofit Status | Organization Type must be one of: 501(c)(3), 501(c)(4), Community\-Based Organization, Faith\-Based Organization | Organization Type | Green check: "Eligible organization type" | Red X: "Only nonprofit and community organizations are eligible" |
| 2 | Minimum Operating History | (Current Year \- Year Founded) >= 2 | Year Founded | Green check: "Organization has been operating for X years" | Red X: "Organization must be at least 2 years old" |
| 3 | Budget Cap | Annual Operating Budget < $2,000,000 | Annual Operating Budget | Green check: "Operating budget is within limit" | Red X: "Organizations with budgets of $2M or more are not eligible" |
| 4 | Funding Ratio | Amount Requested <= 50% of Total Project Cost | Amount Requested, Total Project Cost | Green check: "Requested amount is X% of project cost" | Red X: "Requested amount cannot exceed 50% of total project cost" |
| 5 | Maximum Request | Amount Requested <= $50,000 | Amount Requested | Green check: "Requested amount is within the $50,000 maximum" | Red X: "Maximum grant amount is $50,000" |
| 6 | Minimum Impact | Estimated Number of Beneficiaries >= 50 | Estimated Number of Beneficiaries | Green check: "Project will serve X beneficiaries" | Red X: "Project must serve at least 50 beneficiaries" |

### Overall Eligibility Display

At the top or side of the form, show an eligibility summary panel:

* **If all 6 pass:** "Eligible \- All 6 criteria met" (green background)
* **If some fail:** "Not Eligible \- X of 6 criteria met" (red/amber background)
* List each rule with its pass/fail icon

### Important Behavior

* Rules evaluate as soon as the relevant field has a value (on blur or on change)
* If a field is empty, the corresponding rule shows a gray/neutral state (not yet evaluated)
* The eligibility result is saved with the application on submission
* The reviewer sees the same eligibility panel on their detail view

### Implementation Guidance

Build the eligibility engine as a **standalone, reusable module/service** that:

* Accepts the form data as input
* Returns an array of rule results (rule name, pass/fail, message)
* Returns an overall eligibility boolean and score (X of 6)
* Can run on both the frontend (for real\-time feedback) and the backend (for validation on submit)

**Key design requirement:** The same eligibility logic should run on both the frontend (for real\-time display) and the backend (for server\-side verification on form submission). Never trust client\-side eligibility alone. Build the engine as a standalone, reusable module \- not hardcoded into your form component.

---

## 6. Award Calculation Engine

### When It Runs

The award calculation engine runs **only** when a reviewer clicks "Approve." The reviewer sees the calculated amount and confirms.

### Scoring Matrix

The system scores each application across 5 factors. Each factor earns 1, 2, or 3 points.

| Factor | What It Measures | 1 Point | 2 Points | 3 Points |
|:-------|:-----------------|:--------|:---------|:---------|
| Community Impact | Estimated beneficiaries | 50 \- 200 | 201 \- 1,000 | 1,001 or more |
| Organization Track Record | Years operating (current year \- year founded) | 2 \- 5 years | 6 \- 15 years | 16 or more years |
| Project Category Priority | Project category | Arts & Culture, Workforce Development, Other | Youth Programs, Senior Services | Public Health, Neighborhood Safety |
| Financial Need | Annual operating budget | $500,000 \- $1,999,999 | $100,000 \- $499,999 | Under $100,000 |
| Cost Efficiency | Requested amount as % of total project cost | 41% \- 50% | 26% \- 40% | 25% or less |

### Award Formula

```
Total Score     = sum of all 5 factor scores (range: 5 to 15)
Award Percentage = Total Score / 15
Award Amount    = Amount Requested × Award Percentage
Award Amount    = round to nearest $100
Award Amount    = cap at $50,000
```

### Worked Example

**Input:**

* Estimated Beneficiaries: 1,500 (Score: 3)
* Years Operating: 8 (Score: 2)
* Project Category: Public Health (Score: 3)
* Annual Budget: $320,000 (Score: 2)
* Amount Requested: $40,000; Total Project Cost: $120,000; Ratio = 33% (Score: 2)

**Calculation:**

* Total Score = 3 \+ 2 \+ 3 \+ 2 \+ 2 = 12
* Award Percentage = 12 / 15 = 0.80 (80%)
* Award Amount = $40,000 x 0.80 = $32,000
* Rounded = $32,000 (already even)
* Under cap = $32,000 (final award)

### Another Example (Lower Score)

**Input:**

* Estimated Beneficiaries: 75 (Score: 1)
* Years Operating: 3 (Score: 1)
* Project Category: Arts & Culture (Score: 1)
* Annual Budget: $900,000 (Score: 1)
* Amount Requested: $25,000; Total Project Cost: $52,000; Ratio = 48% (Score: 1)

**Calculation:**

* Total Score = 1 \+ 1 \+ 1 \+ 1 \+ 1 = 5
* Award Percentage = 5 / 15 = 0.333 (33.3%)
* Award Amount = $25,000 x 0.333 = $8,333
* Rounded = $8,300
* Under cap = $8,300 (final award)

### Implementation Guidance

Build the award calculator as a **pure function** with no side effects. It should:

* Accept the application data as input
* Score each of the 5 factors using the matrix above
* Calculate the total score, award percentage, raw award, rounded award, and capped award
* Return the individual factor scores, the total score, the percentage, and the final award amount

This function runs on the backend only (the reviewer triggers it). The breakdown (each factor's score) should be displayed to the reviewer before they confirm approval.

---

## 7. Application Workflow

### State Machine

```
[Applicant fills form]
    |
    |  Eligibility engine runs in real time
    |  (pass/fail indicators visible on form)
    |
    v
[Applicant submits] ──────> SUBMITTED
                              |  (eligibility score stored)
                              |
                    [Reviewer opens] ──────> UNDER REVIEW
                                              |
                              +---------------+----------------+
                              |                                |
                    [Reviewer approves]              [Reviewer rejects]
                              |                                |
                    Award auto-calculated              Reason required
                              |                                |
                          APPROVED                         REJECTED
                     (award amount stored)          (comments stored)
```

### Status Definitions

| Status | Description | Who Sets It | What Happens |
|:-------|:------------|:------------|:-------------|
| SUBMITTED | Application received | System (on submit) | Eligibility score and results are saved. Appears in reviewer queue. |
| UNDER REVIEW | Reviewer has opened and is reviewing | Reviewer | Status updates on applicant's dashboard. |
| APPROVED | Reviewer approved the application | Reviewer | Award calculation engine runs. Award amount is stored. Applicant sees amount. |
| REJECTED | Reviewer rejected with a reason | Reviewer | Rejection comments are stored. Applicant sees reason. |

### Rules

* Status only moves forward (no going backward)
* Only reviewers can change status
* Each status change records: who, when, and comments
* Applicants can submit even with failing eligibility (the engine advises, it does not block)

---

## 8. Technical Architecture & Implementation

### Tech Stack

Choose any modern full\-stack combination:

| Layer | Option 1 | Option 2 | Option 3 |
|:------|:---------|:---------|:---------|
| Frontend | React | Angular | Vue.js |
| Backend | Node.js / Express | Python / FastAPI | Java / Spring Boot |
| Database | PostgreSQL | MongoDB | SQLite (simplest to set up) |
| File Storage | Local filesystem | Cloud storage (S3, Azure Blob) | Database BLOBs (for MVP) |

### REST API Design

| Action | Method | Endpoint | Auth | Description |
|:-------|:-------|:---------|:-----|:------------|
| Register | POST | /api/auth/register | None | Create applicant account |
| Login | POST | /api/auth/login | None | Authenticate, return token |
| Get my applications | GET | /api/applications | Applicant | List logged\-in user's applications |
| Get all applications | GET | /api/applications/all | Reviewer | List all applications (with filters) |
| Get one application | GET | /api/applications/:id | Both | Full application details (authz check) |
| Submit application | POST | /api/applications | Applicant | Create new application with eligibility result |
| Upload document | POST | /api/applications/:id/documents | Applicant | Upload supporting file |
| Update status | PATCH | /api/applications/:id/status | Reviewer | Change status (approve/reject) |
| Get eligibility check | POST | /api/eligibility/check | Applicant | Server\-side eligibility validation |
| Calculate award | POST | /api/applications/:id/award | Reviewer | Trigger award calculation on approval |

### Database Schema

You need to design and create the following tables (or collections if using a NoSQL database). Use appropriate data types, constraints, and foreign key relationships for your chosen database.

**Table 1: Users**

* Stores both applicants and reviewers
* Key columns: id, email (unique), password hash (never plain text), full name, phone, organization name, role (APPLICANT or REVIEWER), created timestamp

**Table 2: Applications**

* Stores all grant application data
* Must include: a foreign key to the applicant user, all form fields from Section 1 and Section 2 (see Section 4), eligibility results (score, pass/fail, detailed results), award information (amount, scoring breakdown), workflow fields (status, reviewer foreign key, reviewer comments, timestamps)
* Status should default to "SUBMITTED" on creation

**Table 3: Documents**

* Stores metadata about uploaded files
* Key columns: id, foreign key to application, file name, file type, file size, file storage path, upload timestamp

**Table 4: Status History**

* Tracks every status change for audit purposes
* Key columns: id, foreign key to application, old status, new status, foreign key to the user who made the change, comments, timestamp

### Authentication & Authorization

| Feature | Requirement |
|:--------|:------------|
| Registration | Applicants self\-register. Reviewers are pre\-seeded (no self\-registration). |
| Login | Email and password. Return a JWT token (or use session cookies). |
| Password Storage | Hash with bcrypt. Never store plain text. |
| Roles | APPLICANT and REVIEWER. Role determines dashboard and accessible endpoints. |
| Session | JWT expires after 30 minutes. |
| Authorization | Applicants can only see their own applications. Reviewers can see all. Server\-side checks required. |

**Pre\-Seeded Reviewer Accounts:**

| Name | Email | Password |
|:-----|:------|:---------|
| Marcus Johnson | marcus.johnson@maplewood.gov | Reviewer123 |
| Sarah Mitchell | sarah.mitchell@maplewood.gov | Reviewer123 |

### Project Structure

Your project should have a clear separation between frontend and backend, even if they live in the same repository. Key expectations:

* **Frontend folder** \- organized into components (reusable UI pieces like the eligibility panel, status badges), pages (one per screen), and services (API calls, shared logic like the eligibility engine)
* **Backend folder** \- organized into routes, controllers, models, middleware (auth), and services (eligibility engine, award calculator)
* **Database folder** \- schema definition and seed data script for reviewer accounts
* **README.md** at the root

The eligibility engine logic should exist in both the frontend services (for real\-time display) and the backend services (for server\-side verification). The award calculator should only exist on the backend.

### Security Checklist

| Concern | What to Do |
|:--------|:-----------|
| Passwords | Hash with bcrypt (cost factor 10\+) |
| JWT | Sign with a secret key, include user ID and role in payload |
| Authorization | Middleware that checks role before allowing access to endpoints |
| Input Validation | Validate all inputs on the server (do not trust the client) |
| File Uploads | Validate file type and size server\-side |
| SQL Injection | Use parameterized queries or an ORM |
| CORS | Configure to allow only your frontend origin |

---

## 9. UI/UX Requirements

### Design Principles

| Principle | What It Means |
|:----------|:-------------|
| **Clarity** | The user always knows where they are and what to do next |
| **Feedback** | Every action gets a response: loading spinners, success messages, error alerts |
| **Guidance** | The eligibility panel actively guides the applicant toward a successful application |
| **Consistency** | Same patterns throughout: buttons look the same, forms behave the same |
| **Accessibility** | Labels on all form fields, sufficient color contrast, keyboard navigable |

### Required Pages

#### Applicant\-Facing Pages

**Page 1: Landing Page**

* Maplewood County branding
* "Community Development Grant Program" heading
* Brief program description and grant amount (up to $50,000)
* Two buttons: "Register" and "Log In"

**Page 2: Registration Page**

* Fields: Full Name, Email, Phone, Organization Name, Password, Confirm Password
* Inline validation on blur
* Link: "Already have an account? Log in"

**Page 3: Login Page**

* Fields: Email, Password
* Error on invalid credentials
* Link: "Don't have an account? Register"

**Page 4: Applicant Dashboard**

* Welcome message: "Welcome, Diana"
* "Start New Application" button
* Table of applications: Application ID, Project Title, Date Submitted, Status (badge), Award Amount (if approved)
* Empty state: friendly message with call\-to\-action

**Page 5: Application Form (2 Sections)**

* **Section 1: Organization Information** \- all fields from Section 1 spec
* **Section 2: Project Details** \- all fields from Section 2 spec
* **Eligibility Panel** (persistent sidebar or top panel):
  * Shows all 6 rules with green check / red X / gray neutral
  * Overall status: "Eligible \- 6 of 6 criteria met" or "Not Eligible \- 4 of 6 criteria met"
  * Updates in real time as fields change
* Navigation: "Next" button to go from Section 1 to Section 2, "Back" to return
* "Review & Submit" button at end of Section 2

**Page 6: Review & Submit (Pre\-Submit)**

* Read\-only summary of all fields
* Eligibility summary
* If not eligible: yellow warning banner: "Your application does not meet all eligibility criteria. You may still submit, but approval is not guaranteed."
* Buttons: "Back to Edit" and "Submit Application"

**Page 7: Application Detail (Post\-Submit)**

* Read\-only view of all fields
* Current status with badge
* Eligibility results panel
* If approved: award amount displayed prominently with score breakdown
* If rejected: reviewer comments displayed

#### Reviewer\-Facing Pages

**Page 8: Reviewer Dashboard**

* Summary cards: X Submitted, Y Under Review, Z Approved ($total), W Rejected
* Filter dropdowns: Eligibility Status, Application Status
* Table: Application ID, Organization Name, Project Title, Date Submitted, Eligibility (tag), Status (badge)
* Sorted by date (oldest first)

**Page 9: Reviewer \- Application Detail**

* All form fields (read\-only)
* Uploaded document: preview or download link
* Eligibility panel showing all 6 rules with pass/fail
* Action area:
  * "Approve" button \- triggers award calculation, shows breakdown, asks for confirmation
  * "Reject" button \- requires comment, asks for confirmation
* On approve confirmation: shows award breakdown (each factor's score and the final amount)

### Visual Style Guide

| Element | Value |
|:--------|:------|
| Primary Color | #003068 (Dark Blue) |
| Secondary Color | #0066CC (Medium Blue) |
| Success / Eligible | #1A652A (Green) |
| Warning | #D4760A (Orange) |
| Danger / Not Eligible | #993333 (Red) |
| Info / Submitted | #0077B6 (Blue) |
| Neutral / Not Evaluated | #6B7280 (Gray) |
| Background | #F5F5F5 |
| Cards | #FFFFFF |
| Font | System default or "Inter", "Segoe UI", sans\-serif |
| Body Text | 16px |
| Border Radius | 8px |
| Spacing | Multiples of 8px |

### Responsive Design

* Applicant pages should work on mobile (360px minimum width)
* Reviewer pages can be desktop\-only
* Forms go single\-column on mobile
* Eligibility panel moves above the form on mobile (instead of sidebar)

---

## 10. Evaluation Criteria

### Scoring Rubric (100 Points Total)

| Category | Points | What We're Looking For |
|:---------|:-------|:-----------------------|
| **Functionality** | 30 | Does the core workflow work end\-to\-end? |
| **Eligibility Engine** | 15 | Do all 6 rules evaluate correctly? Real\-time feedback works? Runs on both client and server? |
| **Award Calculator** | 10 | Does the formula produce correct results? Is the breakdown displayed? |
| **Code Quality** | 15 | Readable, organized, modular. Engines are reusable modules, not inline spaghetti. |
| **User Experience** | 15 | Intuitive forms, clear eligibility guidance, loading states, error messages. |
| **Problem Solving & AI Usage** | 10 | Smart trade\-offs, effective AI tool usage, can explain the code. |
| **Documentation** | 5 | README with setup instructions, design decisions, known limitations. |

### Functionality Breakdown (30 Points)

| Sub\-Criteria | Points |
|:-------------|:-------|
| Registration & Login (both roles) | 5 |
| Application form with validation | 7 |
| File upload | 3 |
| Applicant dashboard with status | 5 |
| Reviewer dashboard and list | 5 |
| Approve/reject workflow with status update | 5 |

### Eligibility Engine Breakdown (15 Points)

| Sub\-Criteria | Points |
|:-------------|:-------|
| All 6 rules correctly implemented | 6 |
| Real\-time UI feedback (green/red/gray indicators) | 4 |
| Eligibility result stored with application and shown to reviewer | 3 |
| Engine is a reusable module (not hardcoded in form component) | 2 |

### Award Calculator Breakdown (10 Points)

| Sub\-Criteria | Points |
|:-------------|:-------|
| All 5 scoring factors correctly implemented | 5 |
| Formula produces correct award amount | 3 |
| Score breakdown displayed to reviewer on approval | 2 |

---

## 11. Daily Milestones

> **Note:** Full\-stack developers have 7 working days (compared to 5 for Salesforce and Power Platform tracks) because you are building authentication, database setup, API infrastructure, and deployment from scratch \- all of which is provided out\-of\-the\-box on those platforms.

### Day 1 (Monday): Project Setup & Database

**Morning:**

* Read this document completely
* Set up development environment (Node/Python/Java, database, IDE)
* Initialize project repository and folder structure
* Install dependencies (framework, ORM, auth libraries)

**Afternoon:**

* Create database schema (all tables from Section 8)
* Write seed script for reviewer accounts
* Set up the backend server with basic health\-check endpoint
* Test: database connects, seed data loads

**Checkpoint:**

* [ ] Project runs locally (frontend and backend start without errors)
* [ ] Database schema created with all tables
* [ ] Seed data loaded (reviewer accounts exist)

---

### Day 2 (Tuesday): Authentication & Authorization

**Morning:**

* Build registration API endpoint with password hashing (bcrypt)
* Build login API endpoint with JWT token generation
* Build auth middleware to verify JWT and extract user role
* Build role\-based authorization middleware (APPLICANT vs REVIEWER)

**Afternoon:**

* Build registration page (frontend)
* Build login page (frontend)
* Wire frontend to auth API (store token, handle errors)
* Implement protected routes (redirect to login if not authenticated)
* Test: register, log in, access protected page, role\-based redirect

**Checkpoint:**

* [ ] Registration works (password hashed in database)
* [ ] Login works (JWT returned)
* [ ] Protected routes enforce authentication
* [ ] Role\-based access works (applicant vs reviewer see different dashboards)

---

### Day 3 (Wednesday): Application Form & Eligibility Engine

**Morning:**

* Build the eligibility engine module (shared logic \- runs on client and server)
* Build Section 1 of the application form with real\-time eligibility feedback
* Connect eligibility rules to Section 1 fields

**Afternoon:**

* Build Section 2 of the application form with remaining eligibility rules
* Implement file upload (frontend and backend)
* Build the backend endpoint to save the application with server\-side eligibility verification

**Checkpoint:**

* [ ] Two\-section form works with all fields
* [ ] Eligibility panel shows real\-time pass/fail for all 6 rules
* [ ] Application saves to database with eligibility results
* [ ] File upload works

---

### Day 4 (Thursday): Dashboards & Review Workflow

**Morning:**

* Build applicant dashboard showing submitted applications with status badges
* Build reviewer dashboard showing applications with eligibility tags

**Afternoon:**

* Build reviewer detail view with eligibility panel
* Implement approve/reject workflow
* Implement the award calculation engine
* Wire approve action to trigger award calculation and display breakdown

**Checkpoint:**

* [ ] Applicant dashboard shows applications with correct status
* [ ] Reviewer dashboard shows applications with eligibility status
* [ ] Approve triggers award calculation and shows breakdown
* [ ] Reject requires comment
* [ ] Status updates reflected on applicant dashboard

---

### Day 5 (Friday): Detail Views & Polish

**Morning:**

* Build applicant detail view (post\-submit) showing status, eligibility, award (if approved), comments (if rejected)
* Build pre\-submit review screen
* Add filtering on reviewer dashboard

**Afternoon:**

* Fix bugs from Days 1\-4
* Improve error handling and loading states
* Add empty states, confirmation dialogs
* Test edge cases in eligibility engine and award calculator

**Checkpoint:**

* [ ] Application detail views work for both roles
* [ ] Pre\-submit review screen works
* [ ] Filters work on reviewer dashboard
* [ ] No major bugs in core workflow

---

### Day 6 (Monday): End\-to\-End Testing & Bug Fixes

**Morning:**

* Full end\-to\-end testing (register, apply, review, approve/reject)
* Test with multiple applications in different states
* Verify eligibility engine edge cases (boundary values)
* Verify award calculator produces correct amounts

**Afternoon:**

* Fix all critical and high bugs
* Add stretch features if time allows (admin reporting, email notifications, etc.)
* Refactor any messy code from the build days

**Checkpoint:**

* [ ] End\-to\-end flow works without errors
* [ ] Multiple applications tested in various states
* [ ] Eligibility and award engines produce correct results
* [ ] Code is clean and refactored

---

### Day 7 (Tuesday): Documentation & Submission

**Morning:**

* Write README with complete setup instructions
* Document design decisions and known limitations
* Document AI tool usage (what helped, what you corrected)

**Afternoon:**

* Record 3\-5 minute demo video
* Final code review and cleanup
* Final commit and push

**Checkpoint:**

* [ ] README is complete and someone else can set up the app from it
* [ ] Demo video recorded
* [ ] Code committed and pushed

---

## 12. Submission Guidelines

### What to Submit

| Item | Format | Required |
|:-----|:-------|:---------|
| Source Code | Git repository (GitHub, Azure DevOps, or Bitbucket) | Yes |
| README | Markdown file in repository root | Yes |
| Demo Video | 3\-5 minute screen recording | Yes |

### README Template

```markdown
# Maplewood County Community Development Grant Portal

## Tech Stack
- Frontend: [your choice]
- Backend: [your choice]
- Database: [your choice]

## Prerequisites
- [List software needed]

## Setup Instructions
1. Clone the repository
2. [Step-by-step to get it running]

## Test Credentials
- Applicant: Register a new account
- Reviewer: marcus.johnson@maplewood.gov / Reviewer123

## Features Implemented
- [x] Applicant registration and login
- [x] Two-section application form
- [x] Real-time eligibility engine (6 rules)
- [x] Award calculation engine (5 factors)
- [ ] ... etc.

## Eligibility Engine
- [Explain your implementation approach]
- [Where does the logic live? Is it shared client/server?]

## Award Calculator
- [Explain the formula and how you implemented it]

## Known Limitations
- [What doesn't work or is incomplete]

## AI Tool Usage
- [Which AI tools did you use?]
- [One example of how AI helped]
- [One example of where AI was wrong and how you fixed it]
```

### Demo Video

Walk through:

1. Landing page
2. Register as a new applicant
3. Fill out the application form — show eligibility indicators updating in real time
4. Show what happens when an eligibility rule fails (change a field to trigger a failure)
5. Submit the application
6. Show the applicant dashboard with the submitted application
7. Log in as a reviewer
8. Open the application — show eligibility results
9. Approve — show the award calculation breakdown
10. Switch back to applicant — show the approved status and award amount

---

## Appendix A \- Sample Data

### Sample Grant Application

**Section 1: Organization Information**

| Field | Value |
|:------|:------|
| Organization Name | Youth Forward Inc. |
| EIN | 52\-1234567 |
| Organization Type | 501(c)(3) |
| Year Founded | 2015 |
| Annual Operating Budget | $320,000 |
| Number of Full\-Time Employees | 8 |
| Primary Contact Name | Diana Torres |
| Primary Contact Email | diana@youthforward.org |
| Primary Contact Phone | (410) 555\-0142 |
| Organization Address | 742 Oak Street, Maplewood, MD 21201 |
| Mission Statement | Youth Forward empowers at\-risk youth through mentorship, academic support, and leadership development programs. |

**Section 2: Project Details**

| Field | Value |
|:------|:------|
| Project Title | After\-School Mentorship Expansion |
| Project Category | Youth Programs |
| Project Description | Expand our after\-school mentorship program from 2 locations to 5 locations across East Maplewood, serving an additional 200 students with one\-on\-one mentoring, homework help, and career exploration workshops. |
| Target Population Served | At\-risk youth ages 14\-18 in East Maplewood |
| Estimated Number of Beneficiaries | 500 |
| Total Project Cost | $95,000 |
| Amount Requested | $40,000 |
| Project Start Date | 2026\-05\-01 |
| Project End Date | 2027\-04\-30 |
| Previously Received Maplewood Grant | No |
| Supporting Document | project\_proposal.pdf |

**Eligibility Results for This Application:**

| Rule | Result | Reason |
|:-----|:-------|:-------|
| Nonprofit Status | Pass | 501(c)(3) is eligible |
| Minimum Operating History | Pass | 11 years operating |
| Budget Cap | Pass | $320,000 is under $2M |
| Funding Ratio | Pass | $40,000 is 42% of $95,000 (under 50%) |
| Maximum Request | Pass | $40,000 is under $50,000 |
| Minimum Impact | Pass | 500 beneficiaries (50\+ required) |
| **Overall** | **Eligible** | **6 of 6 criteria met** |

**Award Calculation for This Application (if approved):**

| Factor | Value | Score |
|:-------|:------|:------|
| Community Impact | 500 beneficiaries | 2 |
| Track Record | 11 years | 2 |
| Category Priority | Youth Programs | 2 |
| Financial Need | $320,000 budget | 2 |
| Cost Efficiency | 42% ratio | 1 |
| **Total** | | **9 / 15** |
| Award Percentage | | 60% |
| **Award Amount** | $40,000 x 60% | **$24,000** |

---

## Appendix B \- Wireframes

### Application Form with Eligibility Panel

```
┌────────────────────────────────────────────────────────────────────┐
│  MAPLEWOOD COUNTY                                     [Logout]    │
│  Community Development Grant Program                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐ │
│  │ APPLICATION FORM            │  │ ELIGIBILITY CHECK           │ │
│  │                             │  │                             │ │
│  │ Section 1: Organization     │  │ ✅ Nonprofit Status         │ │
│  │ ─────────────────────       │  │ ✅ Operating History (11yr) │ │
│  │                             │  │ ✅ Budget Under $2M         │ │
│  │ Organization Name *         │  │ ❌ Funding Ratio (62%)     │ │
│  │ ┌─────────────────────────┐ │  │ ✅ Under $50K Maximum      │ │
│  │ │ Youth Forward Inc.      │ │  │ ⬜ Minimum Beneficiaries   │ │
│  │ └─────────────────────────┘ │  │                             │ │
│  │                             │  │ Status: NOT ELIGIBLE        │ │
│  │ Organization Type *         │  │ 4 of 6 criteria met         │ │
│  │ ┌───────────────────── ▼ ─┐ │  │                             │ │
│  │ │ 501(c)(3)               │ │  │ You may still submit.       │ │
│  │ └─────────────────────────┘ │  │ The reviewer will make      │ │
│  │                             │  │ the final determination.    │ │
│  │ Year Founded *              │  └─────────────────────────────┘ │
│  │ ┌─────────────────────────┐ │                                  │
│  │ │ 2015                    │ │                                  │
│  │ └─────────────────────────┘ │                                  │
│  │                             │                                  │
│  │ ... (more fields) ...       │                                  │
│  │                             │                                  │
│  │        [Back]   [Next →]    │                                  │
│  └─────────────────────────────┘                                  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

### Reviewer \- Award Calculation Confirmation

```
┌────────────────────────────────────────────────────────────────────┐
│                    APPROVE APPLICATION                             │
│                                                                    │
│  Award Calculation Breakdown                                       │
│  ─────────────────────────────                                    │
│                                                                    │
│  ┌──────────────────────────┬───────┬────────────────────────────┐ │
│  │ Factor                   │ Score │ Reason                     │ │
│  ├──────────────────────────┼───────┼────────────────────────────┤ │
│  │ Community Impact          │  2/3  │ 500 beneficiaries          │ │
│  │ Track Record              │  2/3  │ 11 years operating         │ │
│  │ Category Priority         │  2/3  │ Youth Programs             │ │
│  │ Financial Need            │  2/3  │ $320K budget               │ │
│  │ Cost Efficiency           │  1/3  │ 42% of project cost        │ │
│  ├──────────────────────────┼───────┼────────────────────────────┤ │
│  │ TOTAL SCORE               │  9/15 │                            │ │
│  └──────────────────────────┴───────┴────────────────────────────┘ │
│                                                                    │
│  Amount Requested:   $40,000                                       │
│  Award Percentage:   60.0%                                         │
│  ─────────────────────────────                                    │
│  AWARD AMOUNT:       $24,000                                       │
│                                                                    │
│  Optional Comments:                                                │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│                         [Cancel]    [Confirm Approval - $24,000]   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Appendix C \- Glossary

| Term | Definition |
|:-----|:-----------|
| **MVP** | Minimum Viable Product \- the smallest working version that delivers value |
| **REST API** | A convention for building web APIs using HTTP methods (GET, POST, PUT, PATCH, DELETE) |
| **JWT** | JSON Web Token \- a method for handling authentication where the server issues a signed token on login |
| **bcrypt** | A password hashing algorithm. You store the hash, not the actual password. |
| **Eligibility Engine** | The logic that checks whether an application meets all qualification criteria |
| **Award Calculation Engine** | The formula that computes the grant award amount based on scoring factors |
| **Parameterized Query** | A database query that separates SQL from data values, preventing injection attacks |
| **ORM** | Object\-Relational Mapping \- a library that lets you interact with the database using objects instead of raw SQL (e.g., Sequelize, SQLAlchemy, Prisma) |
| **CORS** | Cross\-Origin Resource Sharing \- a security feature that controls which domains can access your API |
| **Pure Function** | A function that always returns the same output for the same input and has no side effects |

---

**Good luck! We're excited to see what you build.**
