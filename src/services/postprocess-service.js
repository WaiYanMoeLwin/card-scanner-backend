const {perspectiveTransform, matToImageBuffer, saveImageBufferAsJPEG, drawBoundingBoxOnImage} = require('../utils/image-utils.js');

async function postprocessDetections(detectionResults, mat, modelInputSize = 640) {
    const postprocessedResults = await Promise.all(detectionResults.map(async (detection, index) => {
        detection = await rescaleImage(detection, mat.cols, mat.rows, modelInputSize);
        const {bbox, keypoints} = detection;
        const {x1, y1, x2, y2} = bbox;

        const srcPoints = keypoints.map(kp => [kp.x, kp.y]);
        // Define destination points for the 330x460 rectangle
        const dstPoints = [
            [0, 0],
            [330, 0],
            [330, 460],
            [0, 460]
        ];

        const warpedMat = await perspectiveTransform(mat, srcPoints, dstPoints);
        const warpedImageBuffer = await matToImageBuffer(warpedMat);
        const warpedImagePath = await saveImageBufferAsJPEG(warpedImageBuffer, '../statics/warped_images', `warped_card_${index}`);
        
        return {
            ...detection,
            warpedImageBuffer,
            warpedImagePath
        }
    }));
    return postprocessedResults;
}



async function rescaleImage(detection, originalWidth, originalHeight, modelInputSize) {
    const scaleX = originalWidth / modelInputSize;
    const scaleY = originalHeight / modelInputSize;

    const rescaledBbox = {
        x1: detection.bbox.x1 * scaleX,
        y1: detection.bbox.y1 * scaleY,
        x2: detection.bbox.x2 * scaleX,
        y2: detection.bbox.y2 * scaleY
    };

    const rescaledKeypoints = detection.keypoints.map(kp => ({
        x: kp.x * scaleX,
        y: kp.y * scaleY,
        confidence: kp.confidence
    }));

    return {
        ...detection,
        bbox: rescaledBbox,
        keypoints: rescaledKeypoints
    };
}

module.exports = {
    postprocessDetections,
    rescaleImage
};