const eligibilityEngine = require('../services/eligibilityEngine');

function check(req, res, next) {
  try {
    const result = eligibilityEngine.run(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { check };
