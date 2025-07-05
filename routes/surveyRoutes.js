const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const { requireAuth } = require('../middleware/authMiddleware');

// Submit survey (only for logged-in users)
router.post('/', requireAuth, surveyController.submitSurvey);
// Get survey summary (public)
router.get('/summary', surveyController.getSurveySummary);
// Get all survey responses (public)
router.get('/all', surveyController.getAllSurveys);

module.exports = router; 