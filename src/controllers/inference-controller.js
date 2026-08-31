const {loadOpenCV} = require('../utils/openCV-loader');
const inferenceService = require('../services/inference-service');

const performInference = async (req, res) => {
    const {cv} = await loadOpenCV();
    try {
        const image = req.file;
        if (!image) {
            return res.status(400).json({ error: 'Image is required for inference.' });
        }

        const classificationResults = await inferenceService.performInference(image.buffer);

        res.json({ results: classificationResults });
    } catch (error) {
        console.error('Error during inference:', error);
        res.status(500).json({ error: 'An error occurred during inference.' });
    }
}
module.exports = {
    performInference
};