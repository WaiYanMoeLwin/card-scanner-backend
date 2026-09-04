const ort = require('onnxruntime-node');
const fs = require('fs');
const path = require('path');
const { parseYoloPoseOutput, parseYoloClassificationOutput, parseYoloClassificationBatchOutput } = require('../utils/yolo-utils.js');
const {preprocessImage} = require('../services/preprocess-service');
const {postprocessDetections} = require('../services/postprocess-service');
const {perspectiveTransform} = require('../utils/image-utils');

const classificationModelPath = path.join(__dirname, '../../statics/models/classify.onnx');
const detectionModelPath = path.join(__dirname, '../../statics/models/detect3.onnx');
const opClassificationModelPath = path.join(__dirname, '../../statics/models/op_cls.onnx');

let classificationSession = new Map();
let detectionSession = null;
let initPromise = null;
async function initializeSessions() {
    if (initPromise) {
        return initPromise;
    }
    initPromise = (async () => {
        const [dg7, op14, detection] = await Promise.all([
            ort.InferenceSession.create(classificationModelPath, { intraOpNumThreads: 4, interOpNumThreads: 1 }),
            ort.InferenceSession.create(opClassificationModelPath, { intraOpNumThreads: 4, interOpNumThreads: 1 }),
            ort.InferenceSession.create(detectionModelPath, { intraOpNumThreads: 4, interOpNumThreads: 1 })
        ]);
        classificationSession.set('dg7', dg7);
        classificationSession.set('op14', op14);
        detectionSession = detection;
    })();
    return initPromise;
}

async function runDetection(inputTensor) {
    if (!detectionSession) {
        throw new Error('Detection session is not initialized. Call initializeSessions() first.');
    }
    const inputName = detectionSession.inputNames[0];
    const startTime = process.hrtime.bigint();
    const results = await detectionSession.run({ [inputName]: inputTensor });
    const endTime = process.hrtime.bigint();
    console.log(`Detection completed in ${endTime - startTime} ns (from ${startTime} to ${endTime}).`);
    const detections = parseYoloPoseOutput(results.output0);
    for (const tensor of Object.values(results)) {
        tensor.dispose();
    }
    inputTensor.dispose();
    return detections;
}

async function runClassification(inputTensor, game) {
    if (!classificationSession.has(game)) {
        throw new Error(`Classification session for game '${game}' is not initialized. Call initializeSessions() first.`);
    }
    const session = classificationSession.get(game);
    const inputName = session.inputNames[0];
    const startTime = process.hrtime.bigint();
    const results = await session.run({ [inputName]: inputTensor });
    const endTime = process.hrtime.bigint();
    const classificationResults = parseYoloClassificationOutput(results.output0, 0.0, 5, game);
    for (const tensor of Object.values(results)) {
        tensor.dispose();
    }
    inputTensor.dispose();
    console.log(`Classification completed in ${endTime - startTime} ns (from ${startTime} to ${endTime}).`);
    return classificationResults;
}

async function runClassificationInBatch(inputTensors, game) {
    if (!classificationSession.has(game)) {
        throw new Error(`Classification session for game '${game}' is not initialized. Call initializeSessions() first.`);
    }
    const session = classificationSession.get(game);
    const inputName = session.inputNames[0];
    const startTime = process.hrtime.bigint();
    const results = await session.run({ [inputName]: inputTensors });
    const endTime = process.hrtime.bigint();
    const classificationResults = parseYoloClassificationBatchOutput(results.output0, 0.0, 5, game);
    for (const tensor of Object.values(results)) {
        tensor.dispose();
    }
    inputTensors.dispose();
    console.log(`Batch classification completed in ${endTime - startTime} ns (from ${startTime} to ${endTime}).`);
    return classificationResults;
}

async function runPipeline(imageBuffer, game) {
    const startTime = Date.now();
    const {imageMat, chwArray} = await preprocessImage(imageBuffer, [640, 640]);
        
    const inputTensor = new ort.Tensor('float32', chwArray, [1, 3, 640, 640]);

    const detectionResults = await runDetection(inputTensor);
    const detectionTime = Date.now();
    console.log(`Detection completed in ${detectionTime - startTime} ms.`);
    // console.log(`Memory usage after detection (external, rss, heapUsed): ${process.memoryUsage().external}, ${process.memoryUsage().rss}, ${process.memoryUsage().heapUsed}`);

    const postprocessedResults = await postprocessDetections(detectionResults, imageMat);
    const postprocessTime = Date.now();
    console.log(`Postprocessing completed in ${postprocessTime - detectionTime} ms.`);
    // console.log(`Memory usage after postprocessing (external, rss, heapUsed): ${process.memoryUsage().external}, ${process.memoryUsage().rss}, ${process.memoryUsage().heapUsed}`);
    
    const clsInputCHWArrays = new Float32Array(postprocessedResults.length * 3 * 460 * 330);
    await Promise.all(postprocessedResults.map(async (result, index) => {
        const {warpedImageBuffer} = result;
        const warpedCHWArray = await preprocessImage(warpedImageBuffer, [330, 460]).then(res => {res.imageMat.delete(); return res.chwArray;});
        // const warpedInputTensor = new ort.Tensor('float32', warpedCHWArray, [1, 3, 460, 330]);
        // const classificationResult = await runClassification(warpedInputTensor, game);
        clsInputCHWArrays.set(warpedCHWArray, index * 3 * 460 * 330);
        // return {
        //     ...restResult,
        //     classification: classificationResult
        // };
    }));
    const clsInputTensors = new ort.Tensor('float32', clsInputCHWArrays, [postprocessedResults.length, 3, 460, 330]);

    const classificationResults = await runClassificationInBatch(clsInputTensors, game);
    const classificationTime = Date.now();
    console.log(`Classification completed in ${classificationTime - postprocessTime} ms.`);
    // console.log(`Memory usage after classification (external, rss, heapUsed): ${process.memoryUsage().external}, ${process.memoryUsage().rss}, ${process.memoryUsage().heapUsed}`);
    
    const finalResults = postprocessedResults.map((result, index) => ({
        ...result,
        classification: classificationResults[index]
    })).filter(result => result.classification !== null);
    console.log(`Total number of cards detected: ${postprocessedResults.length}`);
    console.log(`Total number of cards classified: ${finalResults.length}`);
    console.log(`Total pipeline time: ${classificationTime - startTime} ms.`);

    return finalResults;
}

module.exports = {
    initializeSessions,
    runPipeline,
};