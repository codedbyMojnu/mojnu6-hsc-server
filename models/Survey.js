const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
    rating: { type: Number, min: 1, max: 5, required: true },
    happyIfClosed: { type: Boolean, required: true },
    suggestion: { type: String, default: '' },
    user: { type: String, default: null }, // Optional: username or userId
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Survey', surveySchema); 