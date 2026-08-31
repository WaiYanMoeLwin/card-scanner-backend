const ort = require('onnxruntime-node');
const fs = require('fs');
const path = require('path');
const { parseYoloPoseOutput, parseYoloClassificationOutput } = require('../utils/yolo-utils.js');
const {preprocessImage} = require('../services/preprocess-service');
const {postprocessDetections} = require('../services/postprocess-service');
const {perspectiveTransform} = require('../utils/image-utils');

const classificationModelPath = path.join(__dirname, '../../statics/models/classify.onnx');
const detectionModelPath = path.join(__dirname, '../../statics/models/detect.onnx');

let classificationSession = null;
let detectionSession = null;

async function initializeSessions() {
    if (classificationSession && detectionSession) {
        console.log('ONNX sessions are already initialized.');
        return;
    }
    try {
        classificationSession = await ort.InferenceSession.create(classificationModelPath);
        detectionSession = await ort.InferenceSession.create(detectionModelPath);
        console.log('ONNX sessions initialized successfully.');
    } catch (error) {
        console.error('Error initializing ONNX sessions:', error);
    }
}

async function runDetection(inputTensor) {
    if (!detectionSession) {
        throw new Error('Detection session is not initialized. Call initializeSessions() first.');
    }
    const inputName = detectionSession.inputNames[0];
    const results = await detectionSession.run({ [inputName]: inputTensor });
    const detections = parseYoloPoseOutput(results.output0);
    return detections;
}

async function runClassification(inputTensor) {
    if (!classificationSession) {
        throw new Error('Classification session is not initialized. Call initializeSessions() first.');
    }
    const inputName = classificationSession.inputNames[0];
    const results = await classificationSession.run({ [inputName]: inputTensor });
    return parseYoloClassificationOutput(classificationSession, results.output0);
}

async function runPipeline(imageBuffer) {
    const {imageMat, chwArray} = await preprocessImage(imageBuffer, [640, 640]);
        
    const inputTensor = new ort.Tensor('float32', chwArray, [1, 3, 640, 640]);

    const detectionResults = await runDetection(inputTensor);

    const postprocessedResults = await postprocessDetections(detectionResults, imageMat);
    
    const classificationResults = await Promise.all(postprocessedResults.map(async (result) => {
        const {warpedImageBuffer, ...restResult} = result;
        const warpedCHWArray = await preprocessImage(warpedImageBuffer, [330, 460]).then(res => res.chwArray);
        const warpedInputTensor = new ort.Tensor('float32', warpedCHWArray, [1, 3, 460, 330]);
        const classificationResult = await runClassification(warpedInputTensor);
        return {
            ...restResult,
            classification: classificationResult
        };
    }));

    return classificationResults;
}

module.exports = {
    initializeSessions,
    runPipeline,
};