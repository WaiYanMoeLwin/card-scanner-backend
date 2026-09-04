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

    const buffer = Buffer.from(mat.data);
    mat.delete();
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
    if (!fs.existsSync(outputPath)) {
        await fs.promises.mkdir(outputPath, { recursive: true });
    }

    fs.promises.writeFile(`${outputPath}/${outputFileName}`, imageBuffer)
        .catch(err => {
            console.error(`Error saving image to ${outputPath}/${outputFileName}:`, err);
            throw err;
        });
    return `${outputPath}/${outputFileName}`;
}

async function readImage(imagePath) {
    const imageBuffer = await sharp(imagePath).toBuffer();
    return imageBuffer;
}

module.exports = {
    bufferToMat,
    perspectiveTransform,
    matToImageBuffer,
    saveImageBufferAsJPEG,
    readImage
};