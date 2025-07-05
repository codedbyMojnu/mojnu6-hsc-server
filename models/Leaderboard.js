const mongoose = require('mongoose');

const LeaderboardSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    totalPoints: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    maxLevel: { type: Number, default: 0 },
    achievementsCount: { type: Number, default: 0 },
    rewardsCount: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    // Weekly competition fields
    weeklyPoints: { type: Number, default: 0 },
    weeklyStreak: { type: Number, default: 0 },
    weeklyStartDate: { type: Date, default: Date.now },
    // Monthly competition fields
    monthlyPoints: { type: Number, default: 0 },
    monthlyStreak: { type: Number, default: 0 },
    monthlyStartDate: { type: Date, default: Date.now },
    // Friend challenges
    friendChallenges: [{
        challenger: { type: String, required: true },
        challenged: { type: String, required: true },
        challengerScore: { type: Number, default: 0 },
        challengedScore: { type: Number, default: 0 },
        status: { type: String, enum: ['pending', 'accepted', 'completed', 'declined'], default: 'pending' },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, default: Date.now },
        challengeType: { type: String, enum: ['points', 'streak', 'level'], default: 'points' }
    }],
    // Notifications
    notifications: [{
        type: { type: String, enum: ['challenge', 'achievement', 'ranking', 'competition'], required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
        data: { type: mongoose.Schema.Types.Mixed, default: {} }
    }]
}, {
    timestamps: true
});

// Indexes for efficient queries
LeaderboardSchema.index({ totalPoints: -1 });
LeaderboardSchema.index({ currentStreak: -1 });
LeaderboardSchema.index({ weeklyPoints: -1 });
LeaderboardSchema.index({ monthlyPoints: -1 });
LeaderboardSchema.index({ lastActive: -1 });

module.exports = mongoose.model('Leaderboard', LeaderboardSchema); 