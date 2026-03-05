const express = require('express');
const router = express.Router();
const { authRequired, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(authRequired);
router.use(requireRole('ADMIN'));

router.get('/summary', adminController.getSummary);

module.exports = router;
