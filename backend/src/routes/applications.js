const express = require('express');
const router = express.Router();
const { authRequired, requireRole } = require('../middleware/auth');
const applicationController = require('../controllers/applicationController');
const upload = require('../middleware/upload');

router.use(authRequired);

router.get('/', requireRole('APPLICANT'), applicationController.listMine);
router.get('/all', requireRole('REVIEWER'), applicationController.listAll);
router.get('/summary', requireRole('REVIEWER'), applicationController.getSummary);
router.get('/:id/documents/:docId', applicationController.getDocument);
router.get('/:id', applicationController.getOne);
router.post('/', requireRole('APPLICANT'), applicationController.create);
router.post('/:id/documents', requireRole('APPLICANT'), upload.single('document'), applicationController.uploadDocument);
router.patch('/:id/status', requireRole('REVIEWER'), applicationController.updateStatus);
router.post('/:id/award', requireRole('REVIEWER'), applicationController.calculateAward);

module.exports = router;
