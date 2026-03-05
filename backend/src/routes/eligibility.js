const express = require('express');
const router = express.Router();
const eligibilityController = require('../controllers/eligibilityController');

router.post('/check', eligibilityController.check);

module.exports = router;
