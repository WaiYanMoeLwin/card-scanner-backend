const express = require('express');
const router = express.Router();
const { getConfidenceThreshold, updateConfidenceThreshold } = require('../controllers/confidence-threshold-controller');

router.get('/confidence-threshold', getConfidenceThreshold);
router.put('/confidence-threshold', updateConfidenceThreshold);

module.exports = router;