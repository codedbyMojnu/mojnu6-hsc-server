const mongoose = require('mongoose');

const puzzleSchema = new mongoose.Schema({
    // Basic puzzle information
    title: {
        type: String,
        required: [true, 'Puzzle title is required'],
        trim: true,
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Puzzle description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    category: {
        type: String,
        required: [true, 'Puzzle category is required'],
        enum: ['HTTP', 'REST', 'API', 'Web Development', 'Programming', 'General', 'Advanced'],
        default: 'General'
    },
    difficulty: {
        type: String,
        required: [true, 'Puzzle difficulty is required'],
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        default: 'Beginner'
    },

    // Puzzle content
    question: {
        type: String,
        required: [true, 'Puzzle question is required'],
        trim: true
    },
    options: {
        type: [String],
        default: [],
        validate: {
            validator: function (options) {
                return options.length <= 4; // Max 4 options
            },
            message: 'Puzzle cannot have more than 4 options'
        }
    },
    answer: {
        type: String,
        required: [true, 'Puzzle answer is required'],
        trim: true
    },
    explanation: {
        type: String,
        required: [true, 'Puzzle explanation is required'],
        trim: true
    },
    hint: {
        type: String,
        required: [true, 'Puzzle hint is required'],
        trim: true
    },

    // Creator information
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Puzzle creator is required']
    },
    creatorUsername: {
        type: String,
        required: [true, 'Creator username is required']
    },

    // Community features
    status: {
        type: String,
        enum: ['draft', 'pending', 'approved', 'rejected', 'featured'],
        default: 'pending'
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    isPremium: {
        type: Boolean,
        default: false
    },

    // Statistics
    plays: {
        type: Number,
        default: 0
    },
    completions: {
        type: Number,
        default: 0
    },
    averageTime: {
        type: Number,
        default: 0
    },
    successRate: {
        type: Number,
        default: 0
    },

    // Rating and reviews
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String,
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [300, 'Review comment cannot exceed 300 characters']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Creator rewards
    creatorPoints: {
        type: Number,
        default: 0
    },
    creatorBadges: [{
        type: String,
        enum: ['first_puzzle', 'popular_creator', 'quality_creator', 'community_leader', 'puzzle_master']
    }],

    // Tags and search
    tags: [{
        type: String,
        trim: true
    }],

    // Moderation
    reportedCount: {
        type: Number,
        default: 0
    },
    moderatorNotes: [{
        moderator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        note: String,
        action: {
            type: String,
            enum: ['approved', 'rejected', 'featured', 'warning']
        },
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
    },
    approvedAt: Date,
    featuredAt: Date
}, {
    timestamps: true
});

// Indexes for better performance
puzzleSchema.index({ creator: 1, createdAt: -1 });
puzzleSchema.index({ status: 1, category: 1 });
puzzleSchema.index({ rating: -1, plays: -1 });
puzzleSchema.index({ tags: 1 });
puzzleSchema.index({ title: 'text', description: 'text' });

// Pre-save middleware to update creator username
puzzleSchema.pre('save', async function (next) {
    if (this.isModified('creator') && this.creator) {
        const User = mongoose.model('User');
        const user = await User.findById(this.creator);
        if (user) {
            this.creatorUsername = user.username;
        }
    }
    this.updatedAt = new Date();
    next();
});

// Method to calculate success rate
puzzleSchema.methods.calculateSuccessRate = function () {
    if (this.plays === 0) return 0;
    return Math.round((this.completions / this.plays) * 100);
};

// Method to update rating
puzzleSchema.methods.updateRating = function () {
    if (this.reviews.length === 0) {
        this.rating.average = 0;
        this.rating.count = 0;
        return;
    }

    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = Math.round((totalRating / this.reviews.length) * 10) / 10;
    this.rating.count = this.reviews.length;
};

// Method to add review
puzzleSchema.methods.addReview = function (userId, username, rating, comment) {
    // Remove existing review by this user
    this.reviews = this.reviews.filter(review => review.user.toString() !== userId.toString());

    // Add new review
    this.reviews.push({
        user: userId,
        username,
        rating,
        comment
    });

    // Update rating
    this.updateRating();

    return this.save();
};

// Method to increment plays
puzzleSchema.methods.incrementPlays = function () {
    this.plays += 1;
    this.successRate = this.calculateSuccessRate();
    return this.save();
};

// Method to increment completions
puzzleSchema.methods.incrementCompletions = function () {
    this.completions += 1;
    this.successRate = this.calculateSuccessRate();
    return this.save();
};

module.exports = mongoose.model('Puzzle', puzzleSchema); 