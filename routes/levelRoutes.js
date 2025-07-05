const express = require('express');
const router = express.Router();
const {
    getLevels, addLevel, updateLevel, deleteLevel
} = require('../controllers/levelController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get('/', getLevels);
router.post('/', authenticate, authorize('admin'), addLevel);
router.put('/:id', authenticate, authorize('admin'), updateLevel);
router.delete('/:id', authenticate, authorize('admin'), deleteLevel);

module.exports = router;