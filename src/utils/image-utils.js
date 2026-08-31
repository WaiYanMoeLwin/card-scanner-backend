const sharp = require('sharp');
const fs = require('fs');
const {loadOpenCV} = require('./openCV-loader');
const path = require('path');

async function bufferToMat(buffer) {
    const {cv} = await loadOpenCV();
    const {data, info} = await sharp(buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    const mat = cv.matFromArray(height, width, cv.CV_8UC4, data);
    return mat;
}

async function perspectiveTransform(srcMat, srcPoints, dstPoints) {
    const {cv} = await loadOpenCV();
    const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, srcPoints.flat());
    const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, dstPoints.flat());

    const M = cv.getPerspectiveTransform(srcPts, dstPts);
    const dstMat = new cv.Mat();
    const dsize = new cv.Size(330, 460);
    cv.warpPerspective(srcMat, dstMat, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

    // Clean up
    srcPts.delete();
    dstPts.delete();
    M.delete();

    return dstMat;
}

async function matToImageBuffer(mat) {
    const {cv} = await loadOpenCV();
    const width = mat.cols;
    const height = mat.rows;
    const channels = mat.channels();
    const rgbaMat = new cv.Mat();
    cv.cvtColor(mat, rgbaMat, cv.COLOR_RGB2RGBA);

    const buffer = Buffer.from(rgbaMat.data);
    rgbaMat.delete();

    const imageBuffer = await sharp(buffer, {
        raw: {
            width: width,
            height: height,
            channels: channels
        }
    }).jpeg({ quality: 90 }).toBuffer();
    return imageBuffer;
}

async function saveImageBufferAsJPEG(imageBuffer, outputPath, filename) {
    const outputFileName = `${filename}_${Date.now()}.jpg`;
    // Create the output directory if it doesn't exist
    await fs.promises.mkdir(outputPath, { recursive: true });

    const absoluteOutputPath = path.resolve(outputPath);

    await fs.promises.writeFile(`${absoluteOutputPath}/${outputFileName}`, imageBuffer);
    return `${absoluteOutputPath}/${outputFileName}`;
}

async function readImageAsBase64(imagePath) {
    sharp.cache(false); // Disable sharp caching to avoid memory issues
    const imageBuffer = await sharp(imagePath).toBuffer();
    return imageBuffer.toString('base64');
}

module.exports = {
    bufferToMat,
    perspectiveTransform,
    matToImageBuffer,
    saveImageBufferAsJPEG,
    readImageAsBase64
};