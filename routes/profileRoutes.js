const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// POST: user+admin
router.post('/', authenticate, profileController.createProfile);

// Admin-only (Need to Fix it for authorization)
router.get('/:username', profileController.getProfile);
router.put('/:username', profileController.replaceProfile);
router.patch('/:username', profileController.updateProfile);
router.patch('/:username/wrong-answer', profileController.addWrongAnswer);
router.delete('/:username', authenticate, authorize('admin'), profileController.deleteProfile);

// Daily streak endpoint
router.post('/:username/daily-streak', authenticate, profileController.checkDailyStreak);

// GET all profiles (public)
router.get('/', profileController.getAllProfiles);

module.exports = router; 