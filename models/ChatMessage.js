const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    // Room/Challenge identifier
    roomId: {
        type: String,
        required: [true, 'Room ID is required'],
        index: true
    },

    // User who sent the message
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User is required']
    },

    // Username for quick access (denormalized)
    username: {
        type: String,
        required: [true, 'Username is required']
    },

    // Message content
    message: {
        type: String,
        required: [true, 'Message content is required'],
        trim: true,
        maxlength: [500, 'Message cannot exceed 500 characters']
    },

    // Message type (text, help-request, system, etc.)
    messageType: {
        type: String,
        enum: ['text', 'help-request', 'system', 'achievement', 'challenge'],
        default: 'text'
    },

    // Message metadata
    isEdited: {
        type: Boolean,
        default: false
    },

    editedAt: {
        type: Date
    },

    // Moderation
    isDeleted: {
        type: Boolean,
        default: false
    },

    deletedAt: {
        type: Date
    },

    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Reactions (future feature)
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        emoji: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for better performance
chatMessageSchema.index({ roomId: 1, createdAt: -1 });
chatMessageSchema.index({ user: 1, createdAt: -1 });
chatMessageSchema.index({ messageType: 1 });

// Virtual for formatted timestamp
chatMessageSchema.virtual('formattedTime').get(function () {
    return this.createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
});

// Ensure virtuals are included in JSON
chatMessageSchema.set('toJSON', { virtuals: true });
chatMessageSchema.set('toObject', { virtuals: true });

// Pre-save middleware to validate and update username if user changes
chatMessageSchema.pre('save', async function (next) {
    try {
        // If user is modified and we have a user ID, try to get the username
        if (this.isModified('user') && this.user) {
            const User = mongoose.model('User');
            const userDoc = await User.findById(this.user);
            if (userDoc) {
                this.username = userDoc.username;
            }
        }

        // Ensure we have a username
        if (!this.username) {
            this.username = 'Anonymous';
        }

        next();
    } catch (error) {
        console.error('Error in ChatMessage pre-save middleware:', error);
        // If we can't get the username, use a fallback
        if (!this.username) {
            this.username = 'Anonymous';
        }
        next();
    }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema); 