const Survey = require('../models/Survey');

// POST /api/survey
exports.submitSurvey = async (req, res) => {
    try {
        const username = req.user?.username;
        if (!username) return res.status(401).json({ error: 'Unauthorized' });
        const { rating, happyIfClosed, suggestion } = req.body;
        if (!rating || happyIfClosed === undefined) {
            return res.status(400).json({ error: 'Rating and happyIfClosed are required.' });
        }
        // Check if user already submitted
        const existing = await Survey.findOne({ user: username });
        if (existing) {
            return res.status(409).json({ error: 'You have already submitted the survey.' });
        }
        const survey = new Survey({ rating, happyIfClosed, suggestion, user: username });
        await survey.save();
        res.status(201).json({ message: 'Survey submitted', survey });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/survey/summary (public)
exports.getSurveySummary = async (req, res) => {
    try {
        const surveys = await Survey.find();
        const total = surveys.length;
        const avgRating = total > 0 ? (surveys.reduce((sum, s) => sum + s.rating, 0) / total).toFixed(2) : 0;
        const happyCount = surveys.filter(s => s.happyIfClosed === true).length;
        const unhappyCount = surveys.filter(s => s.happyIfClosed === false).length;
        const suggestions = surveys.filter(s => s.suggestion && s.suggestion.trim() !== '').map(s => ({ suggestion: s.suggestion, user: s.user, createdAt: s.createdAt }));
        res.json({ total, avgRating, happyCount, unhappyCount, suggestions });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/survey/all (public)
exports.getAllSurveys = async (req, res) => {
    try {
        const surveys = await Survey.find().sort({ createdAt: -1 });
        res.json(surveys);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 