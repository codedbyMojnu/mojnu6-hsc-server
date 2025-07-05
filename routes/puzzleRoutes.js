const express = require('express');
const router = express.Router();
const puzzleController = require('../controllers/puzzleController');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.get('/marketplace', puzzleController.getPuzzleMarketplace);
router.get('/featured', puzzleController.getFeaturedPuzzles);
router.get('/filters', puzzleController.getPuzzleFilters);
router.get('/:id', puzzleController.getPuzzleById);

// Protected routes (authentication required)
router.use(authenticate);

// Puzzle creation and management
router.post('/', puzzleController.createPuzzle);
router.get('/user/puzzles', puzzleController.getUserPuzzles);
router.put('/:id', puzzleController.updatePuzzle);
router.delete('/:id', puzzleController.deletePuzzle);

// Puzzle interaction
router.post('/:id/answer', puzzleController.submitPuzzleAnswer);
router.post('/:id/review', puzzleController.addPuzzleReview);
router.post('/:id/report', puzzleController.reportPuzzle);

// Creator statistics
router.get('/user/stats', puzzleController.getCreatorStats);

module.exports = router; 