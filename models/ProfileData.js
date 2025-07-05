const mongoose = require('mongoose');

const ProfileDataSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    hintPoints: { type: Number, default: 30 },
    maxLevel: { type: Number, default: 0 },
    takenHintLevels: { type: [Number], default: [] },
    // Daily streak fields
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastPlayedDate: { type: Date, default: null },
    totalPoints: { type: Number, default: 0 },
    // Achievements field
    achievements: { type: [String], default: [] },
    // Rewards field
    rewards: { type: [String], default: [] },
    // Leaderboard notifications count for frontend badge
    leaderboardNotifications: { type: Number, default: 0 },
    // Wrong answers field
    wrongAnswers: {
        type: [
            {
                question: String,
                options: [String],
                hint: String,
                answer: String,
                explanation: String,
                category: String,
                levelNumber: Number
            }
        ],
        default: []
    }
});

module.exports = mongoose.model('ProfileData', ProfileDataSchema); 