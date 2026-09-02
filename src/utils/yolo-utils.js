const {getClassName, getClassImagePath} = require("./class-names-utils.js");

function parseYoloPoseOutput(output0, confidenceThreshold = 0.5) {
    const { cpuData, dims } = output0;
    const [batchSize, numDetections, valuesPerDetection] = dims;

    const flat = new Float32Array(numDetections * valuesPerDetection);
    for (let i = 0; i < flat.length; i++) {
        flat[i] = cpuData[i];
    }

    const detections = [];
    for (let i = 0; i < numDetections; i++) {
        const offset = i * valuesPerDetection;
        const confidence = flat[offset + 4];
        if (confidence >= confidenceThreshold) {
            const detection = {
                bbox: {
                    x1: flat[offset + 0],
                    y1: flat[offset + 1],
                    x2: flat[offset + 2],
                    y2: flat[offset + 3]
                },
                confidence: confidence,
                keypoints: []
            };

            for (let j = 0; j < 4; j++) {       // 4 keypoints
                const kpOffset = offset + 6 + j * 3; // Each keypoint has 3 values: x, y, confidence
                detection.keypoints.push({
                    x: flat[kpOffset],
                    y: flat[kpOffset + 1],
                    confidence: flat[kpOffset + 2]
                });
            }
            detections.push(detection);
        }
    }

    detections.sort((a, b) => b.confidence - a.confidence);
    return detections;
}

function parseYoloClassificationOutput(output0, confidenceThreshold = 0.0, selectTopK = 5, game) {
    const { cpuData, dims } = output0;
    const [batchSize, numClasses] = dims;

    const flat = new Float32Array(numClasses);
    for (let i = 0; i < flat.length; i++) {
        flat[i] = cpuData[i];
    }

    const results = [];
    for (let i = 0; i < numClasses; i++) {
        const confidence = flat[i];
        if (confidence < confidenceThreshold) {
            continue;
        }
        results.push({
            classId: i,
            className: getClassName(i, game),
            confidence: confidence,
            imagePath: getClassImagePath(i, game)
        });
    }

    // Select top K results
    results.sort((a, b) => b.confidence - a.confidence);
    return results.slice(0, selectTopK);
}

module.exports = {
    parseYoloPoseOutput,
    parseYoloClassificationOutput
};