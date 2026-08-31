const {loadOpenCV} = require('../utils/openCV-loader');
const inferenceService = require('../services/inference-service');
const {readImageAsBase64} = require('../utils/image-utils');

const performInference = async (req, res) => {
    const {cv} = await loadOpenCV();
    try {
        const image = req.file;
        if (!image) {
            return res.status(400).json({ error: 'Image is required for inference.' });
        }

        const inferenceResult = await inferenceService.performInference(image.buffer);
        const responseData = {
            number_of_cards: inferenceResult.number_of_cards,
            original_image_path: inferenceResult.original_image_path,
            results: inferenceResult.results.map(result => ({
                bbox: result.bbox,
                keypoints: result.keypoints,
                confidence_score_keypoints: result.confidence_score_keypoints,
                warped_image_path: result.warped_image_path,
                classification_results: result.classification_results.map(classification => ({
                    class_name: classification.class_name,
                    confidence_score_classification: classification.confidence_score_classification,
                    image_path: classification.image_path
                }))
            }))
        };

        for (const result of responseData.results) {
            if (result.warped_image_path) {
                result.warped_image_base64 = await readImageAsBase64(result.warped_image_path);
            }
        }

        res.json(responseData);
    } catch (error) {
        console.error('Error during inference:', error);
        res.status(500).json({ error: 'An error occurred during inference.' });
    }
}
module.exports = {
    performInference
};