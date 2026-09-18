const mongoose = require('mongoose');

const confidenceThresholdSchema = new mongoose.Schema({
    threshold: { type: Number, required: true }
}, { timestamps: true });

const ConfidenceThreshold = mongoose.model('ConfidenceThreshold', confidenceThresholdSchema);

module.exports = ConfidenceThreshold;