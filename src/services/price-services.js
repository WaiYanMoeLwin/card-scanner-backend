const Price = require('../models/price');

const priceServices = {
    // async createPriceEntry(cardId, cardName, prices) {
    //     const priceEntry = new Price({
    //         card_id: cardId,
    //         card_name: cardName,
    //         date: new Date(),
    //         prices: {
    //             ungraded: prices.ungraded || null,
    //             psa10: prices.psa10 || null
    //         }
    //     });
    //     return await priceEntry.save();
    // },

    async createBulkPriceEntries(priceEntries) {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }); // Get today's date in YYYY-MM-DD format

        return await Price.bulkWrite(
            priceEntries.map(entry => ({
                updateOne: {
                    filter: { card_id: entry.card_id, card_name: entry.card_name, date: today },
                    update: {
                        $set: {
                            prices: {
                                ungraded: entry.prices.ungraded,
                                psa10: entry.prices.psa10
                            }
                        }
                    },
                    upsert: true
                }
            }))
        )
    },

    async getPriceEntriesByCardId(cardId) {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
        const entries = await Price.find({
            card_id: cardId,
            date: { $gte: yesterday }
        }).sort({ date: -1, card_name: 1 }).exec();
        return entries;
    },
}

module.exports = priceServices;