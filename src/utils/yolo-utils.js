const {getClassName, getClassImagePath} = require("./class-names-utils.js");

function parseYoloPoseOutput(output0, confidenceThreshold = 0.5) {
    const { cpuData, dims } = output0;
    const [batchSize, numDetections, valuesPerDetection] = dims;

    const flat = Array.from(cpuData).flat().map(Number);
    const detections = [];
    for (let b = 0; b < batchSize; b++) {
        for (let i = 0; i < numDetections; i++) {
            const offset = b * numDetections * valuesPerDetection + i * valuesPerDetection;
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
    }

    detections.sort((a, b) => b.confidence - a.confidence);
    return detections;
}

function parseYoloClassificationOutput(output0, confidenceThreshold = 0.0, selectTopK = 5, game) {
    const { cpuData, dims } = output0;
    const [batchSize, numClasses] = dims;
    const flat = Array.from(cpuData).flat().map(Number);
    
    const flattenedResults = flat.map((confidence, classId) => [classId, confidence]);
    const rankedResults = flattenedResults.toSorted((a, b) => b[1] - a[1]).slice(0, selectTopK);
    const results = rankedResults
        .filter(([classId, confidence]) => confidence >= confidenceThreshold)
        .map(([classId, confidence]) => ({
            classId,
            className: getClassName(classId, game),
            confidence,
            imagePath: getClassImagePath(classId, game)
        }));

    return results;
}

function parseYoloClassificationBatchOutput(output0, confidenceThreshold = 0.0, selectTopK = 5, game) {
    const { cpuData, dims } = output0;
    const [batchSize, numClasses] = dims;
    const flat = Array.from(cpuData).flat().map(Number);

    const results = [];
    for (let b = 0; b < batchSize; b++) {
        const offset = b * numClasses;
        const flattenedResults = flat.slice(offset, offset + numClasses).map((confidence, classId) => [classId, confidence]);

        const rankedResults = flattenedResults.toSorted((a, b) => b[1] - a[1]).slice(0, selectTopK);

        if (rankedResults[0][1] < confidenceThreshold) {
            results.push(null);
        } else {
            const filteredResults = rankedResults
                .map(([classId, confidence]) => ({
                    classId,
                    className: getClassName(classId, game),
                    confidence,
                    imagePath: getClassImagePath(classId, game)
                }));
            results.push(filteredResults);
        }
    }
    return results;
}

module.exports = {
    parseYoloPoseOutput,
    parseYoloClassificationOutput,
    parseYoloClassificationBatchOutput
};