const confidenceThresholdService = require('../services/confidence-threshold-service');

const getConfidenceThreshold = async (req, res) => {
    try {
        const confidenceThreshold = await confidenceThresholdService.getConfidenceThreshold();
        if (!confidenceThreshold) {
            return res.status(404).json({ error: 'Confidence threshold not found' });
        }
        res.json(confidenceThreshold);
    } catch (error) {
        console.error('Error retrieving confidence threshold:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the confidence threshold.' });
    }
}

const updateConfidenceThreshold = async (req, res) => {
    const newThreshold = req.body.threshold;

    if (typeof newThreshold !== 'number') {
        return res.status(400).json({ error: 'Threshold must be a number.' });
    }

    try {
        const updatedConfidenceThreshold = await confidenceThresholdService.putConfidenceThreshold(newThreshold);
        res.json(updatedConfidenceThreshold);
    } catch (error) {
        console.error('Error updating confidence threshold:', error);
        res.status(500).json({ error: 'An error occurred while updating the confidence threshold.' });
    }
}

module.exports = {
    getConfidenceThreshold,
    updateConfidenceThreshold
};