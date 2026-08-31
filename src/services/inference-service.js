const onnxService = require('../services/onnx-service');
const ort = require('onnxruntime-node');
const {saveImageBufferAsJPEG} = require('../utils/image-utils');
const InferenceResult = require('../models/inference-result');

async function performInference(imageBuffer) {

    const inferenceImagePath = await saveImageBufferAsJPEG(imageBuffer, '../statics/inference_images', 'inference_result');
    const classificationResults = await onnxService.runPipeline(imageBuffer);
    const numOfCardsDetected = classificationResults.length;

    await InferenceResult.create({
        number_of_cards: numOfCardsDetected,
        original_image_path: inferenceImagePath,
        results: classificationResults.map(result => ({
            bbox: result.bbox,
            keypoints: result.keypoints,
            confidence_score_keypoints: result.confidence,
            warped_image_path: result.warpedImagePath,
            classification_results: result.classification.map(result => ({
                class_name: result.className,
                confidence_score_classification: result.confidence,
                image_path: result.imagePath
            }))
        }))
    })

    return classificationResults;
}

module.exports = {
    performInference
};