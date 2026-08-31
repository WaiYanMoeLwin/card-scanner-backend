let cvInstance = null;

async function loadOpenCV() {
    if (cvInstance) {
        return cvInstance;
    }

    const cv = require('opencv-wasm');
    await cv.onRuntimeInitialized;
    cvInstance = cv;
    return cvInstance;
}

module.exports = {
    loadOpenCV
};
