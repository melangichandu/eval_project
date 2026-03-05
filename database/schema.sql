-- Maplewood County Grant System - Database Schema
-- PostgreSQL

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  organization_name VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('APPLICANT', 'REVIEWER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Section 1: Organization Information
  organization_name VARCHAR(200) NOT NULL,
  ein VARCHAR(20) NOT NULL,
  organization_type VARCHAR(80) NOT NULL,
  year_founded INTEGER NOT NULL,
  annual_operating_budget DECIMAL(15, 2) NOT NULL,
  full_time_employees INTEGER NOT NULL,
  primary_contact_name VARCHAR(100) NOT NULL,
  primary_contact_email VARCHAR(255) NOT NULL,
  primary_contact_phone VARCHAR(20) NOT NULL,
  organization_address TEXT NOT NULL,
  mission_statement TEXT NOT NULL,
  -- Section 2: Project Details
  project_title VARCHAR(200) NOT NULL,
  project_category VARCHAR(80) NOT NULL,
  project_description TEXT NOT NULL,
  target_population TEXT NOT NULL,
  estimated_beneficiaries INTEGER NOT NULL,
  total_project_cost DECIMAL(15, 2) NOT NULL,
  amount_requested DECIMAL(15, 2) NOT NULL,
  project_start_date DATE NOT NULL,
  project_end_date DATE NOT NULL,
  previously_received_grant BOOLEAN NOT NULL DEFAULT FALSE,
  -- Eligibility (stored on submit)
  eligibility_score INTEGER NOT NULL DEFAULT 0,
  eligibility_total INTEGER NOT NULL DEFAULT 6,
  eligibility_details JSONB,
  -- Award (set on approval)
  award_amount DECIMAL(15, 2),
  award_breakdown JSONB,
  -- Workflow
  status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')),
  reviewer_id UUID REFERENCES users(id),
  reviewer_comments TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by_id UUID NOT NULL REFERENCES users(id),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_applicant ON applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at ON applications(submitted_at);
CREATE INDEX IF NOT EXISTS idx_documents_application ON documents(application_id);
CREATE INDEX IF NOT EXISTS idx_status_history_application ON status_history(application_id);
