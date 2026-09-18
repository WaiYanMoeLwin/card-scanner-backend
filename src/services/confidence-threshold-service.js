

const ConfidenceThreshold = require('../models/confidence-threshold');

async function getConfidenceThreshold() {
    return await ConfidenceThreshold.findOne();
}

async function putConfidenceThreshold(newThreshold) {
    const confidenceThreshold = await ConfidenceThreshold.findOne();
    if (!confidenceThreshold) {
        // If no confidence threshold exists, create a new one
        const newConfidenceThreshold = new ConfidenceThreshold({ threshold: newThreshold });
        return await newConfidenceThreshold.save();
    }

    confidenceThreshold.threshold = newThreshold;
    return await confidenceThreshold.save();
}

module.exports = {
    getConfidenceThreshold,
    putConfidenceThreshold
};