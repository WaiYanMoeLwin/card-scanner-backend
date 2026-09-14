const express = require('express');
const router = express.Router();
const { getImage } = require('../controllers/imageControllers.js');

router.get('/images/:imageName', getImage);

module.exports = router;