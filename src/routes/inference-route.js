const express = require('express');
const router = express.Router();
const inferenceController = require('../controllers/inference-controller.js');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/inference', upload.single('image'), inferenceController.performInference);

router.get('/warped-image', inferenceController.getWarpedImage);

module.exports = router;