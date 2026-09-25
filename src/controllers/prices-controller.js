const {scrapePrices} = require('../services/scraper-service');
const priceServices = require('../services/price-services');

async function scrapeAndStorePrices(req, res) {
    try {
        scrapePrices().then(priceEntries => {
            priceServices.createBulkPriceEntries(priceEntries).then(() => {
                console.log('Successfully scraped and stored price entries.');
            }).catch(err => {
                console.error('Error storing price entries:', err);
            });
        });
        res.status(200).json({ message: 'Prices are being scraped and will be stored in the database shortly.' });
    } catch (error) {
        console.error('Error scraping and storing prices:', error);
        res.status(500).json({ message: 'Error scraping and storing prices', error: error.message });
    }
}

async function getPriceEntriesByCardId(req, res) {
    const { cardId } = req.params;
    try {
        const entries = await priceServices.getPriceEntriesByCardId(cardId);
        if (entries.length === 0) {
            return res.status(404).json({ message: 'No price entries found for the given card ID' });
        }
        res.status(200).json(entries);
    } catch (error) {
        console.error('Error fetching price entries:', error);
        res.status(500).json({ message: 'Error fetching price entries', error: error.message });
    }
}

module.exports = {
    scrapeAndStorePrices,
    getPriceEntriesByCardId
};