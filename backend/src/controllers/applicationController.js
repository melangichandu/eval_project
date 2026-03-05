const { pool } = require('../config/db');
const eligibilityEngine = require('../services/eligibilityEngine');
const awardCalculator = require('../services/awardCalculator');
const path = require('path');
const fs = require('fs');

const EIN_REGEX = /^\d{2}-\d{7}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\(\d{3}\)\s*\d{3}-\d{4}$/;
const currentYear = new Date().getFullYear();

/** Validate create body. Returns error message or null. Never rejects for eligibility. */
function validateCreateBody(body) {
  if (!body || typeof body !== 'object') return 'Invalid request body';
  const s = (v) => (v == null ? '' : String(v).trim());

  if (!s(body.organizationName)) return 'Organization name is required';
  if (s(body.organizationName).length < 2 || s(body.organizationName).length > 100) return 'Organization name must be 2–100 characters';

  if (!s(body.ein)) return 'EIN (Tax ID) is required';
  if (!EIN_REGEX.test(s(body.ein).replace(/\s/g, ''))) return 'EIN must be in format XX-XXXXXXX';

  if (!s(body.organizationType)) return 'Organization type is required';

  const y = body.yearFounded === '' || body.yearFounded == null ? null : Number(body.yearFounded);
  if (y === null || isNaN(y)) return 'Year founded is required';
  if (y < 1800 || y > currentYear) return `Year must be between 1800 and ${currentYear}`;

  const budget = body.annualOperatingBudget === '' || body.annualOperatingBudget == null ? null : Number(body.annualOperatingBudget);
  if (budget === null || isNaN(budget)) return 'Annual operating budget is required';
  if (budget < 0 || budget > 100000000) return 'Budget must be $0–$100,000,000';

  const emp = body.fullTimeEmployees === '' || body.fullTimeEmployees == null ? null : Number(body.fullTimeEmployees);
  if (emp === null || isNaN(emp)) return 'Number of full-time employees is required';
  if (emp < 0 || emp > 9999) return 'Full-time employees must be 0–9999';

  if (!s(body.primaryContactName)) return 'Primary contact name is required';
  if (s(body.primaryContactName).length < 2 || s(body.primaryContactName).length > 50) return 'Primary contact name must be 2–50 characters';

  if (!s(body.primaryContactEmail)) return 'Primary contact email is required';
  if (!EMAIL_REGEX.test(s(body.primaryContactEmail).toLowerCase())) return 'Enter a valid email address';

  if (!s(body.primaryContactPhone)) return 'Primary contact phone is required';
  if (!PHONE_REGEX.test(s(body.primaryContactPhone))) return 'Phone must be in format (XXX) XXX-XXXX';

  if (!s(body.organizationAddress)) return 'Organization address is required';

  if (!s(body.missionStatement)) return 'Mission statement is required';
  if (s(body.missionStatement).length < 20 || s(body.missionStatement).length > 500) return 'Mission statement must be 20–500 characters';

  if (!s(body.projectTitle)) return 'Project title is required';
  if (s(body.projectTitle).length < 5 || s(body.projectTitle).length > 100) return 'Project title must be 5–100 characters';

  if (!s(body.projectCategory)) return 'Project category is required';

  if (!s(body.projectDescription)) return 'Project description is required';
  if (s(body.projectDescription).length < 50 || s(body.projectDescription).length > 2000) return 'Project description must be 50–2000 characters';

  if (!s(body.targetPopulation)) return 'Target population served is required';
  if (s(body.targetPopulation).length < 5 || s(body.targetPopulation).length > 200) return 'Target population must be 5–200 characters';

  const ben = body.estimatedBeneficiaries === '' || body.estimatedBeneficiaries == null ? null : Number(body.estimatedBeneficiaries);
  if (ben === null || isNaN(ben)) return 'Estimated number of beneficiaries is required';
  if (ben < 1 || ben > 1000000) return 'Estimated beneficiaries must be 1–1,000,000';

  const total = body.totalProjectCost === '' || body.totalProjectCost == null ? null : Number(body.totalProjectCost);
  if (total === null || isNaN(total)) return 'Total project cost is required';
  if (total < 100 || total > 10000000) return 'Total project cost must be $100–$10,000,000';

  const amt = body.amountRequested === '' || body.amountRequested == null ? null : Number(body.amountRequested);
  if (amt === null || isNaN(amt)) return 'Amount requested is required';
  if (amt < 100 || amt > 50000) return 'Amount requested must be $100–$50,000';

  const startStr = body.projectStartDate ? s(body.projectStartDate) : '';
  if (!startStr) return 'Project start date is required';
  const startDate = new Date(startStr);
  if (Number.isNaN(startDate.getTime())) return 'Invalid project start date';
  const minStart = new Date();
  minStart.setDate(minStart.getDate() + 30);
  if (startDate < minStart) return 'Project start date must be at least 30 days from today';

  const endStr = body.projectEndDate ? s(body.projectEndDate) : '';
  if (!endStr) return 'Project end date is required';
  const endDate = new Date(endStr);
  if (Number.isNaN(endDate.getTime())) return 'Invalid project end date';
  if (endDate <= startDate) return 'Project end date must be after start date';
  const maxEnd = new Date(startDate);
  maxEnd.setMonth(maxEnd.getMonth() + 24);
  if (endDate > maxEnd) return 'Project end date must be within 24 months of start date';

  return null;
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    applicantId: row.applicant_id,
    organizationName: row.organization_name,
    ein: row.ein,
    organizationType: row.organization_type,
    yearFounded: row.year_founded,
    annualOperatingBudget: Number(row.annual_operating_budget),
    fullTimeEmployees: row.full_time_employees,
    primaryContactName: row.primary_contact_name,
    primaryContactEmail: row.primary_contact_email,
    primaryContactPhone: row.primary_contact_phone,
    organizationAddress: row.organization_address,
    missionStatement: row.mission_statement,
    projectTitle: row.project_title,
    projectCategory: row.project_category,
    projectDescription: row.project_description,
    targetPopulation: row.target_population,
    estimatedBeneficiaries: row.estimated_beneficiaries,
    totalProjectCost: Number(row.total_project_cost),
    amountRequested: Number(row.amount_requested),
    projectStartDate: row.project_start_date,
    projectEndDate: row.project_end_date,
    previouslyReceivedGrant: row.previously_received_grant,
    eligibilityScore: row.eligibility_score,
    eligibilityTotal: row.eligibility_total,
    eligibilityDetails: typeof row.eligibility_details === 'string' ? (() => { try { return JSON.parse(row.eligibility_details); } catch { return row.eligibility_details; } })() : row.eligibility_details,
    awardAmount: row.award_amount != null ? Number(row.award_amount) : null,
    awardBreakdown: row.award_breakdown,
    status: row.status,
    reviewerId: row.reviewer_id,
    reviewerComments: row.reviewer_comments,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
  };
}

async function listMine(req, res, next) {
  try {
    const r = await pool.query(
      `SELECT id, project_title, submitted_at, status, award_amount
       FROM applications WHERE applicant_id = $1 ORDER BY submitted_at DESC`,
      [req.user.id]
    );
    const list = r.rows.map((row) => ({
      id: row.id,
      projectTitle: row.project_title,
      submittedAt: row.submitted_at,
      status: row.status,
      awardAmount: row.award_amount != null ? Number(row.award_amount) : null,
    }));
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function listAll(req, res, next) {
  try {
    const { eligibility, status } = req.query;
    let sql = `
      SELECT a.*, u.full_name AS applicant_name, u.organization_name AS org_name
      FROM applications a
      JOIN users u ON a.applicant_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (eligibility && eligibility !== 'all') {
      if (eligibility === 'eligible') {
        sql += ` AND a.eligibility_score = a.eligibility_total`;
      } else {
        sql += ` AND a.eligibility_score < a.eligibility_total`;
      }
    }
    if (status && status !== 'all') {
      sql += ` AND a.status = $${i}`;
      params.push(status);
      i++;
    }
    sql += ' ORDER BY a.submitted_at ASC NULLS LAST';
    const r = await pool.query(sql, params);
    const list = r.rows.map((row) => ({
      ...mapRow(row),
      applicantName: row.applicant_name,
      orgName: row.org_name,
    }));
    res.json(list);
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    const r = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    const row = r.rows[0];
    if (req.user.role === 'APPLICANT' && row.applicant_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const app = mapRow(row);
    const docs = await pool.query('SELECT id, file_name, file_type, file_size, storage_path, uploaded_at FROM documents WHERE application_id = $1', [id]);
    app.documents = docs.rows.map((d) => ({
      id: d.id,
      fileName: d.file_name,
      fileType: d.file_type,
      fileSize: d.file_size,
      storagePath: d.storage_path,
      uploadedAt: d.uploaded_at,
    }));
    res.json(app);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const body = req.body;
    const validationError = validateCreateBody(body);
    if (validationError) return res.status(400).json({ error: validationError });

    const eligibility = eligibilityEngine.run({
      organizationType: body.organizationType,
      yearFounded: body.yearFounded,
      annualOperatingBudget: body.annualOperatingBudget,
      amountRequested: body.amountRequested,
      totalProjectCost: body.totalProjectCost,
      estimatedBeneficiaries: body.estimatedBeneficiaries,
    });
    const r = await pool.query(
      `INSERT INTO applications (
        applicant_id, organization_name, ein, organization_type, year_founded, annual_operating_budget,
        full_time_employees, primary_contact_name, primary_contact_email, primary_contact_phone,
        organization_address, mission_statement, project_title, project_category, project_description,
        target_population, estimated_beneficiaries, total_project_cost, amount_requested,
        project_start_date, project_end_date, previously_received_grant,
        eligibility_score, eligibility_total, eligibility_details, status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,'SUBMITTED'
      ) RETURNING *`,
      [
        req.user.id,
        body.organizationName,
        body.ein,
        body.organizationType,
        body.yearFounded,
        body.annualOperatingBudget,
        body.fullTimeEmployees,
        body.primaryContactName,
        body.primaryContactEmail,
        body.primaryContactPhone,
        body.organizationAddress,
        body.missionStatement,
        body.projectTitle,
        body.projectCategory,
        body.projectDescription,
        body.targetPopulation,
        body.estimatedBeneficiaries,
        body.totalProjectCost,
        body.amountRequested,
        body.projectStartDate,
        body.projectEndDate,
        !!body.previouslyReceivedGrant,
        eligibility.score,
        eligibility.total,
        JSON.stringify(eligibility.results),
      ]
    );
    const app = mapRow(r.rows[0]);
    await pool.query(
      'INSERT INTO status_history (application_id, old_status, new_status, changed_by_id) VALUES ($1, NULL, $2, $3)',
      [app.id, 'SUBMITTED', req.user.id]
    );
    res.status(201).json(app);
  } catch (err) {
    next(err);
  }
}

async function uploadDocument(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { id } = req.params;
    const r = await pool.query('SELECT id, applicant_id FROM applications WHERE id = $1', [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    if (r.rows[0].applicant_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
    const storagePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');
    await pool.query(
      'INSERT INTO documents (application_id, file_name, file_type, file_size, storage_path) VALUES ($1, $2, $3, $4, $5)',
      [id, req.file.originalname, req.file.mimetype, req.file.size, storagePath]
    );
    res.status(201).json({ message: 'Document uploaded', fileName: req.file.originalname });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    if (!status || !['UNDER_REVIEW', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    if (status === 'REJECTED' && !(comments && comments.trim())) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    const r = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    const row = r.rows[0];
    const allowed = { SUBMITTED: ['UNDER_REVIEW'], UNDER_REVIEW: ['APPROVED', 'REJECTED'] };
    if (!allowed[row.status] || !allowed[row.status].includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition' });
    }
    let awardAmount = null;
    let awardBreakdown = null;
    if (status === 'APPROVED') {
      const calc = awardCalculator.calculate(row);
      awardAmount = calc.awardAmount;
      awardBreakdown = calc;
    }
    await pool.query(
      `UPDATE applications SET status = $1, reviewer_id = $2, reviewer_comments = $3, award_amount = $4, award_breakdown = $5, updated_at = NOW()
       WHERE id = $6`,
      [status, req.user.id, (comments || '').trim(), awardAmount, awardBreakdown ? JSON.stringify(awardBreakdown) : null, id]
    );
    await pool.query(
      'INSERT INTO status_history (application_id, old_status, new_status, changed_by_id, comments) VALUES ($1, $2, $3, $4, $5)',
      [id, row.status, status, req.user.id, (comments || '').trim()]
    );
    const updated = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
    res.json(mapRow(updated.rows[0]));
  } catch (err) {
    next(err);
  }
}

async function calculateAward(req, res, next) {
  try {
    const { id } = req.params;
    const r = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
    if (r.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    const calc = awardCalculator.calculate(r.rows[0]);
    res.json(calc);
  } catch (err) {
    next(err);
  }
}

async function getDocument(req, res, next) {
  try {
    const { id, docId } = req.params;
    const download = req.query.download === '1' || req.query.download === 'true';
    const appRow = await pool.query('SELECT id, applicant_id FROM applications WHERE id = $1', [id]);
    if (appRow.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    const app = appRow.rows[0];
    const isReviewer = req.user.role === 'REVIEWER';
    const isOwner = app.applicant_id === req.user.id;
    if (!isReviewer && !isOwner) return res.status(403).json({ error: 'Access denied' });

    const docRow = await pool.query(
      'SELECT id, file_name, file_type, storage_path FROM documents WHERE id = $1 AND application_id = $2',
      [docId, id]
    );
    if (docRow.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    const doc = docRow.rows[0];
    const fullPath = path.join(process.cwd(), doc.storage_path);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });

    const disposition = download ? 'attachment' : 'inline';
    const filename = doc.file_name || 'document';
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename.replace(/"/g, '\\"')}"`);
    if (doc.file_type) res.setHeader('Content-Type', doc.file_type);
    res.sendFile(fullPath);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listMine,
  listAll,
  getOne,
  create,
  uploadDocument,
  updateStatus,
  calculateAward,
  getDocument,
};
