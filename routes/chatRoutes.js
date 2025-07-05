const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/authMiddleware');

// Get chat messages for a room
router.get('/messages/:roomId', chatController.getChatMessages);

// Get user's chat history
router.get('/history/:userId', authenticate, chatController.getUserChatHistory);

// Delete a message (requires authentication)
router.delete('/messages/:messageId', authenticate, chatController.deleteMessage);

module.exports = router; 