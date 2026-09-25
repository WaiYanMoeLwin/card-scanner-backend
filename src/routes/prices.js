const express = require('express');
const router = express.Router();
const { scrapeAndStorePrices, getPriceEntriesByCardId } = require('../controllers/prices-controller');

router.post('/scrape-prices', scrapeAndStorePrices);
router.get('/prices/:cardId', getPriceEntriesByCardId);

module.exports = router;