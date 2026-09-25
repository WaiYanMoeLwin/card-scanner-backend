const mongoose = require('mongoose');

const priceSchema = new mongoose.Schema({
    card_id: { type: String, required: true },
    card_name: { type: String, required: true },
    date: { type: Date, required: true },
    prices: {
        ungraded: { type: Number, default: null },
        psa10: { type: Number, default: null }
    }
}, { timestamps: true });

priceSchema.index({ card_id: 1, card_name: 1, date: -1 }, { unique: true });

priceSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.date = ret.date.toISOString().split('T')[0]; // Format date as YYYY-MM-DD
        return ret;
    }
})

const Price = mongoose.model('Price', priceSchema);

module.exports = Price;