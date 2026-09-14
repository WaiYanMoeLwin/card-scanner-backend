const { readImage } = require('../utils/image-utils');

const getImage = async (req, res) => {
    const imageName = req.params.imageName;
    const game = req.query.game || 'dg_bt7'; // Default to 'dg7' if no game is specified
    if (!imageName) {
        return res.status(400).json({ error: 'Image name is required.' });
    }

    const imagePath = `./statics/tcg_cards/${game}/images/${imageName}.jpg`;

    try {
        const imageBuffer = await readImage(imagePath);
        res.set('Content-Type', 'image/jpeg');
        res.send(imageBuffer);
    } catch (error) {
        console.error('Error retrieving image:', error);
        res.status(500).json({ error: 'An error occurred while retrieving the image.' });
    }
}

module.exports = {
    getImage
};