const classNames = require('../../statics/class_names.json');
const path = require('path');
const CLASS_IMAGE_DIR = '../statics/tcg_card_imgs/';

function getClassName(classId) {
    try {
        return classNames[classId]
    } catch (error) {
        console.error(`Error retrieving class name for classId ${classId}:`, error);
        return null; // Return null or a default value if the classId is not found
    }
}

function getClassImagePath(classId) {
    const className = getClassName(classId);
    if (!className) {
        console.error(`Class name not found for classId ${classId}`);
        return null; // Return null or a default value if the class name is not found
    }
    const absoluteImagePath = path.resolve(CLASS_IMAGE_DIR, `${className}.jpg`);
    return absoluteImagePath;
}

module.exports = {
    getClassName,
    getClassImagePath
};