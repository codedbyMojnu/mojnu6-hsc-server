const ProfileData = require('../models/ProfileData');
const Leaderboard = require('../models/Leaderboard');
const ACHIEVEMENTS = require('../config/achievements');
const REWARDS = require('../config/rewards');
const Level = require('../models/Level');

// Function to check and award achievements
const checkAchievements = async (profile) => {
    const newAchievements = [];
    let totalPointsEarned = 0;

    // Check each achievement
    Object.values(ACHIEVEMENTS).forEach(achievement => {
        // Skip if already unlocked
        if (profile.achievements.includes(achievement.id)) {
            return;
        }

        // Check if condition is met
        if (achievement.condition(profile)) {
            newAchievements.push(achievement);
            totalPointsEarned += achievement.points;
        }
    });

    // Award achievements and points
    if (newAchievements.length > 0) {
        const achievementIds = newAchievements.map(a => a.id);
        profile.achievements.push(...achievementIds);
        profile.totalPoints += totalPointsEarned;
        await profile.save();
    }

    return {
        newAchievements,
        totalPointsEarned,
        hasNewAchievements: newAchievements.length > 0
    };
};

// Function to check and award rewards
const checkRewards = async (profile, totalLevels = 0) => {
    const newRewards = [];

    // Check level completion rewards
    Object.values(REWARDS.LEVEL_COMPLETION).forEach(reward => {
        // Skip if already unlocked
        if (profile.rewards.includes(reward.id)) {
            return;
        }

        // Check if condition is met
        if (reward.condition(profile, totalLevels)) {
            newRewards.push(reward);
        }
    });

    // Check points earning rewards
    Object.values(REWARDS.POINTS_EARNING).forEach(reward => {
        // Skip if already unlocked
        if (profile.rewards.includes(reward.id)) {
            return;
        }

        // Check if condition is met
        if (reward.condition(profile)) {
            newRewards.push(reward);
        }
    });

    // Award rewards
    if (newRewards.length > 0) {
        const rewardIds = newRewards.map(r => r.id);
        profile.rewards.push(...rewardIds);
        await profile.save();
    }

    return {
        newRewards,
        hasNewRewards: newRewards.length > 0
    };
};

// Function to sync profile with leaderboard
const syncWithLeaderboard = async (profile) => {
    try {
        const leaderboardEntry = await Leaderboard.findOneAndUpdate(
            { username: profile.username },
            {
                totalPoints: profile.totalPoints || 0,
                currentStreak: profile.currentStreak || 0,
                longestStreak: profile.longestStreak || 0,
                maxLevel: profile.maxLevel || 0,
                achievementsCount: profile.achievements?.length || 0,
                rewardsCount: profile.rewards?.length || 0,
                lastActive: new Date()
            },
            { upsert: true, new: true }
        );

        // Update notification count in profile
        if (leaderboardEntry) {
            const unreadCount = leaderboardEntry.notifications.filter(n => !n.isRead).length;
            profile.leaderboardNotifications = unreadCount;
            await profile.save();
        }
    } catch (error) {
        console.error('Error syncing with leaderboard:', error);
    }
};

// POST /api/profile
exports.createProfile = async (req, res) => {
    try {
        const { username, hintPoints = 15, maxLevel = 0, takenHintLevels = [] } = req.body;
        const profile = new ProfileData({ username, hintPoints, maxLevel, takenHintLevels });
        await profile.save();

        // Sync with leaderboard
        await syncWithLeaderboard(profile);

        // Emit WebSocket event for profile creation
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${username}`).emit('profile-updated', profile);
        }

        res.status(201).json({ message: 'Profile created', profile });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// GET /api/profile/:username
exports.getProfile = async (req, res) => {
    try {
        const profile = await ProfileData.findOne({ username: req.params.username });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json(profile);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/profile/:username
exports.replaceProfile = async (req, res) => {
    try {
        const { hintPoints, maxLevel, takenHintLevels } = req.body;
        const profile = await ProfileData.findOneAndUpdate(
            { username: req.params.username },
            { hintPoints, maxLevel, takenHintLevels },
            { new: true, overwrite: true }
        );
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        // Sync with leaderboard
        await syncWithLeaderboard(profile);

        // Emit WebSocket event for profile update
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${req.params.username}`).emit('profile-updated', profile);
        }

        res.json({ message: 'Profile replaced', profile });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// PATCH /api/profile/:username
exports.updateProfile = async (req, res) => {
    try {
        const profile = await ProfileData.findOneAndUpdate(
            { username: req.params.username },
            req.body,
            { new: true }
        );
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        // Update last played date
        profile.lastPlayedDate = new Date();
        await profile.save();

        // Sync with leaderboard
        await syncWithLeaderboard(profile);

        // Check for achievements
        const achievementResult = await checkAchievements(profile);

        // Get total number of levels
        const totalLevels = await Level.countDocuments();
        // Check for rewards with correct totalLevels
        const rewardResult = await checkRewards(profile, totalLevels);

        // Emit WebSocket event for profile update
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${req.params.username}`).emit('profile-updated', profile);
        }

        res.json({
            message: 'Profile updated',
            profile,
            achievements: achievementResult.newAchievements,
            achievementPoints: achievementResult.totalPointsEarned,
            hasNewAchievements: achievementResult.hasNewAchievements,
            rewards: rewardResult.newRewards,
            hasNewRewards: rewardResult.hasNewRewards
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// DELETE /api/profile/:username
exports.deleteProfile = async (req, res) => {
    try {
        const profile = await ProfileData.findOneAndDelete({ username: req.params.username });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        res.json({ message: 'Profile deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/profile
exports.getAllProfiles = async (req, res) => {
    try {
        const profiles = await ProfileData.find();
        res.json(profiles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// POST /api/profile/:username/daily-streak
exports.checkDailyStreak = async (req, res) => {
    try {
        const profile = await ProfileData.findOne({ username: req.params.username });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today

        let lastPlayed = null;
        if (profile.lastPlayedDate) {
            lastPlayed = new Date(profile.lastPlayedDate);
            lastPlayed.setHours(0, 0, 0, 0); // Start of last played day
        }

        let pointsEarned = 0;
        let streakUpdated = false;
        let message = '';

        // Check if user played today
        if (!lastPlayed || lastPlayed.getTime() !== today.getTime()) {
            // Check if it's consecutive day (yesterday)
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (!lastPlayed || lastPlayed.getTime() === yesterday.getTime()) {
                // Consecutive day - increase streak
                profile.currentStreak += 1;
                if (profile.currentStreak > profile.longestStreak) {
                    profile.longestStreak = profile.currentStreak;
                }
                message = `🔥 ${profile.currentStreak} day streak! +10 points`;
            } else {
                // Break in streak - reset to 1
                profile.currentStreak = 1;
                message = '🎯 New streak started! +10 points';
            }

            // Award 10 points for daily login
            pointsEarned = 10;
            profile.totalPoints += pointsEarned;
            streakUpdated = true;
        } else {
            // Already played today
            message = '✅ Already claimed today\'s reward';
        }

        // Update last played date
        profile.lastPlayedDate = new Date();
        await profile.save();

        // Sync with leaderboard
        await syncWithLeaderboard(profile);

        // Check for achievements
        const achievementResult = await checkAchievements(profile);

        // Get total number of levels
        const totalLevels = await Level.countDocuments();
        // Check for rewards with correct totalLevels
        const rewardResult = await checkRewards(profile, totalLevels);

        // Emit WebSocket event for profile update
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${req.params.username}`).emit('profile-updated', profile);
        }

        res.json({
            message,
            pointsEarned,
            streakUpdated,
            achievements: achievementResult.newAchievements,
            achievementPoints: achievementResult.totalPointsEarned,
            hasNewAchievements: achievementResult.hasNewAchievements,
            rewards: rewardResult.newRewards,
            hasNewRewards: rewardResult.hasNewRewards,
            profile: {
                currentStreak: profile.currentStreak,
                longestStreak: profile.longestStreak,
                totalPoints: profile.totalPoints,
                hintPoints: profile.hintPoints,
                achievements: profile.achievements,
                rewards: profile.rewards
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/profile/:username/wrong-answer
exports.addWrongAnswer = async (req, res) => {
    try {
        const { wrongAnswer } = req.body;
        if (!wrongAnswer) {
            return res.status(400).json({ error: 'Missing wrongAnswer in request body' });
        }
        const profile = await ProfileData.findOne({ username: req.params.username });
        if (!profile) return res.status(404).json({ error: 'Profile not found' });
        profile.wrongAnswers.push(wrongAnswer);
        await profile.save();
        // Optionally emit WebSocket event
        const io = req.app.get('io');
        if (io) {
            io.to(`user-${req.params.username}`).emit('profile-updated', profile);
        }
        res.json({ message: 'Wrong answer added', profile });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 