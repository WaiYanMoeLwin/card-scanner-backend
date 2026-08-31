const {bufferToMat} = require('../utils/image-utils.js');
const {loadOpenCV} = require('../utils/openCV-loader.js');

const MODEL_INPUT_SIZE = 640;

const preprocessImage = async (imageBuffer, modelInputSize = [MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]) => {
    if (!(modelInputSize instanceof Array && modelInputSize.length === 2)) {
        modelInputSize = [modelInputSize, modelInputSize];
    }
    const {cv} = await loadOpenCV();
    const mat = await bufferToMat(imageBuffer);

    const rgb = new cv.Mat();
    cv.cvtColor(mat, rgb, cv.COLOR_RGBA2RGB);

    const resized = new cv.Mat();
    cv.resize(rgb, resized, new cv.Size(modelInputSize[0], modelInputSize[1]));

    const floatMat = new cv.Mat();
    resized.convertTo(floatMat, cv.CV_32F, 1.0 / 255.0);

    const chwArray = matToCHWArray(floatMat, cv, modelInputSize);

    // Clean up
    rgb.delete();
    resized.delete();
    floatMat.delete();

    return {'imageMat': mat, 'chwArray': chwArray};
}

const matToCHWArray = (mat, cv, size) => {
    if (!(size instanceof Array && size.length === 2)) {
        size = [size, size];
    }
    const data = mat.data32F;
    const chwArray = new Float32Array(size[0] * size[1] * 3);
    const channel_size = size[0] * size[1];

    for (let i = 0; i < channel_size; i++) {
        chwArray[i] = data[i * 3]; // R
        chwArray[i + channel_size] = data[i * 3 + 1]; // G
        chwArray[i + 2 * channel_size] = data[i * 3 + 2]; // B
    }
    return chwArray;
}

module.exports = {
    preprocessImage,
    MODEL_INPUT_SIZE
};