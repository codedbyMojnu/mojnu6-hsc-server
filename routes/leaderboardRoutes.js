const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const { authenticate } = require('../middleware/authMiddleware');

// Global leaderboard routes
router.get('/global', leaderboardController.getGlobalLeaderboard);
router.get('/weekly', leaderboardController.getWeeklyLeaderboard);
router.get('/monthly', leaderboardController.getMonthlyLeaderboard);

// User ranking routes
router.get('/ranking/:username', leaderboardController.getUserRanking);

// Friend challenge routes (protected)
router.post('/challenge', authenticate, leaderboardController.createChallenge);
router.put('/challenge/:username/respond', authenticate, leaderboardController.respondToChallenge);
router.get('/challenges/:username', authenticate, leaderboardController.getUserChallenges);

// Notification routes (protected)
router.get('/notifications/:username', authenticate, leaderboardController.getUserNotifications);
router.put('/notifications/:username/:notificationId/read', authenticate, leaderboardController.markNotificationRead);

// Competition points update (protected)
router.put('/competition/:username/points', authenticate, leaderboardController.updateCompetitionPoints);

module.exports = router; 