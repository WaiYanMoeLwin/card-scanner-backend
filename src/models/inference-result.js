const mongoose = require("mongoose");

const inferenceResultSchema = new mongoose.Schema({
    number_of_cards: { type: Number, required: true },
    original_image_path: { type: String, required: true },
    results: [
        {
            bbox: {
                x1: { type: Number, required: true },
                y1: { type: Number, required: true },
                x2: { type: Number, required: true },
                y2: { type: Number, required: true }
            },
            keypoints: [
                {
                    x: { type: Number, required: true },
                    y: { type: Number, required: true },
                    confidence: { type: Number, required: true }
                }
            ],
            confidence_score_keypoints: { type: Number, required: true },
            warped_image_path: { type: String, required: true },
            classification_results: [
                {
                    class_name: { type: String, required: true },
                    confidence_score_classification: { type: Number, required: true },
                    image_path: { type: String, required: true }
                }
            ]
        }
    ],
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

const InferenceResult = mongoose.model("InferenceResult", inferenceResultSchema);

module.exports = InferenceResult;