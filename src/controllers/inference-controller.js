const inferenceService = require('../services/inference-service');
const { readImage } = require('../utils/image-utils');

const performInference = async (req, res) => {
    const game = req.query.game || 'dg7'; // Default to 'dg7' if no game is specified
    console.log(`Performing inference for game: ${game}`);
    const startTime = Date.now();
    try {
        const image = req.file;
        if (!image) {
            return res.status(400).json({ error: 'Image is required for inference.' });
        }

        const inferenceResult = await inferenceService.performInference(image.buffer, game);
        const inferenceTime = Date.now();
        console.log(`Inference completed in ${inferenceTime - startTime} ms.`);
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

        // for (const result of responseData.results) {
        //     if (result.warped_image_path) {
        //         result.warped_image_base64 = await readImageAsBase64(result.warped_image_path);
        //     }
        // }
        // const base64Time = Date.now();
        // console.log(`Base64 encoding completed in ${base64Time - inferenceTime} ms.`);
        
        res.json(responseData);
        const endTime = Date.now();
        console.log(`Inference completed successfully. ${responseData.number_of_cards} cards detected.`);
        console.log(`Total time taken: ${endTime - startTime} ms. (from ${startTime} to ${endTime})`);
        console.log('--------------------------------------------------');
    } catch (error) {
        console.error('Error during inference:', error);
        res.status(500).json({ error: 'An error occurred during inference.' });
    }
}

const getWarpedImage = async (req, res) => {
    const warpedImagePath = req.query.warped_image_path;
    if (!warpedImagePath) {
        return res.status(400).json({ error: 'Warped image path is required.' });
    }
    
    try {
        const imageBuffer = await readImage(warpedImagePath);
        res.set('Content-Type', 'image/jpeg');
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error retrieving warped image:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the warped image.' });
    }
}
module.exports = {
    performInference,
    getWarpedImage
};