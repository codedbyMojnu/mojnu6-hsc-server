const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const mongoose = require('mongoose');

// Get chat messages for a specific challenge/room
exports.getChatMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const skip = (page - 1) * limit;

        const messages = await ChatMessage.find({ roomId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'username')
            .lean();

        // Reverse to get chronological order
        const reversedMessages = messages.reverse();

        const total = await ChatMessage.countDocuments({ roomId });

        res.json({
            success: true,
            data: reversedMessages,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                hasNext: skip + messages.length < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chat messages'
        });
    }
};

// Save chat message to database
exports.saveMessage = async (messageData) => {
    try {
        const { roomId, userId, username, message, messageType = 'text' } = messageData;

        // Validate required fields
        if (!roomId || !message) {
            throw new Error('Room ID and message are required');
        }

        if (!userId) {
            throw new Error('User ID is required');
        }

        // Validate that userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new Error('Invalid user ID format');
        }

        // Check if user exists
        const userExists = await User.findById(userId);
        if (!userExists) {
            throw new Error('User not found');
        }

        const chatMessage = new ChatMessage({
            roomId,
            user: userId,
            username: username || userExists.username,
            message,
            messageType
        });

        await chatMessage.save();

        // Populate user info for real-time broadcast
        const populatedMessage = await ChatMessage.findById(chatMessage._id)
            .populate('user', 'username')
            .lean();

        return populatedMessage;

    } catch (error) {
        console.error('Error saving chat message:', error);
        throw error;
    }
};

// Get user's chat history
exports.getUserChatHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const messages = await ChatMessage.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'username')
            .lean();

        const total = await ChatMessage.countDocuments({ user: userId });

        res.json({
            success: true,
            data: messages,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                hasNext: skip + messages.length < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching user chat history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch chat history'
        });
    }
};

// Delete chat message (for moderation)
exports.deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { userId } = req.user; // From auth middleware

        // Check if user is admin or message owner
        const user = await User.findById(userId);
        const message = await ChatMessage.findById(messageId);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        if (user.role !== 'admin' && message.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this message'
            });
        }

        await ChatMessage.findByIdAndDelete(messageId);

        res.json({
            success: true,
            message: 'Message deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting chat message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete message'
        });
    }
}; 