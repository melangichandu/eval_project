const { pool } = require('../config/db');

async function getSummary(req, res, next) {
  try {
    const r = await pool.query(
      `SELECT status, COUNT(*)::int AS cnt,
              COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN award_amount ELSE 0 END), 0)::numeric AS awarded
       FROM applications GROUP BY status`
    );
    const summary = {
      submitted: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      totalAwarded: 0,
    };
    for (const row of r.rows) {
      const count = row.cnt;
      const key = row.status === 'SUBMITTED' ? 'submitted'
        : row.status === 'UNDER_REVIEW' ? 'underReview'
        : row.status === 'APPROVED' ? 'approved'
        : row.status === 'REJECTED' ? 'rejected' : null;
      if (key) summary[key] = count;
      if (row.status === 'APPROVED') summary.totalAwarded = Number(row.awarded) || 0;
    }
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary };
