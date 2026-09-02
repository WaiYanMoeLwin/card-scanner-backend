const path = require('path');
const CLASS_NAMES_PATHS = {
    'dg7': path.join(__dirname, '../../statics/tcg_cards/dg_bt7/class_names.json'),
    'op14': path.join(__dirname, '../../statics/tcg_cards/op14/class_names.json')
};
const CLASS_IMAGE_DIRS = {
    'dg7': path.join(__dirname, '../../statics/tcg_cards/dg_bt7/images'),
    'op14': path.join(__dirname, '../../statics/tcg_cards/op14/images')
};

const classNames = {
    'dg7': require(CLASS_NAMES_PATHS['dg7']),
    'op14': require(CLASS_NAMES_PATHS['op14'])
}

function getClassName(classId, game) {
    try {
        return classNames[game][classId]
    } catch (error) {
        console.error(`Error retrieving class name for classId ${classId}:`, error);
        return null; // Return null or a default value if the classId is not found
    }
}

function getClassImagePath(classId, game) {
    const className = getClassName(classId, game);
    if (!className) {
        console.error(`Class name not found for classId ${classId}`);
        return null; // Return null or a default value if the class name is not found
    }
    const absoluteImagePath = path.resolve(CLASS_IMAGE_DIRS[game], `${className}.jpg`);
    return absoluteImagePath;
}

module.exports = {
    getClassName,
    getClassImagePath
};