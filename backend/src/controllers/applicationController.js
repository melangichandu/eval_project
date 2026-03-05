const { pool } = require('../config/db');
const eligibilityEngine = require('../services/eligibilityEngine');
const awardCalculator = require('../services/awardCalculator');
const path = require('path');

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
    eligibilityDetails: row.eligibility_details,
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
      'SELECT * FROM applications WHERE applicant_id = $1 ORDER BY submitted_at DESC',
      [req.user.id]
    );
    const docs = await pool.query('SELECT application_id, file_name, file_type, file_size, uploaded_at FROM documents');
    const docMap = {};
    docs.rows.forEach((d) => {
      if (!docMap[d.application_id]) docMap[d.application_id] = [];
      docMap[d.application_id].push({ fileName: d.file_name, fileType: d.file_type, fileSize: d.file_size, uploadedAt: d.uploaded_at });
    });
    const list = r.rows.map((row) => {
      const app = mapRow(row);
      app.documents = docMap[row.id] || [];
      return app;
    });
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
    sql += ' ORDER BY a.submitted_at ASC';
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

module.exports = {
  listMine,
  listAll,
  getOne,
  create,
  uploadDocument,
  updateStatus,
  calculateAward,
};
