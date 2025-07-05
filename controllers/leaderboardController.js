const Leaderboard = require('../models/Leaderboard');
const ProfileData = require('../models/ProfileData');

// Helper function to update leaderboard entry
const updateLeaderboardEntry = async (username, profileData) => {
    try {
        const leaderboardEntry = await Leaderboard.findOneAndUpdate(
            { username },
            {
                totalPoints: profileData.totalPoints || 0,
                currentStreak: profileData.currentStreak || 0,
                longestStreak: profileData.longestStreak || 0,
                maxLevel: profileData.maxLevel || 0,
                achievementsCount: profileData.achievements?.length || 0,
                rewardsCount: profileData.rewards?.length || 0,
                lastActive: new Date()
            },
            { upsert: true, new: true }
        );
        return leaderboardEntry;
    } catch (error) {
        console.error('Error updating leaderboard entry:', error);
        throw error;
    }
};

// Helper function to update notification count in ProfileData
const updateNotificationCount = async (username) => {
    try {
        const leaderboardEntry = await Leaderboard.findOne({ username });
        if (leaderboardEntry) {
            const unreadCount = leaderboardEntry.notifications.filter(n => !n.isRead).length;
            await ProfileData.findOneAndUpdate(
                { username },
                { leaderboardNotifications: unreadCount }
            );
        }
    } catch (error) {
        console.error('Error updating notification count:', error);
    }
};

// Helper function to reset weekly/monthly competitions
const resetCompetitions = async () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
        // Reset weekly competitions
        await Leaderboard.updateMany(
            { weeklyStartDate: { $lt: startOfWeek } },
            {
                weeklyPoints: 0,
                weeklyStreak: 0,
                weeklyStartDate: now
            }
        );

        // Reset monthly competitions
        await Leaderboard.updateMany(
            { monthlyStartDate: { $lt: startOfMonth } },
            {
                monthlyPoints: 0,
                monthlyStreak: 0,
                monthlyStartDate: now
            }
        );
    } catch (error) {
        console.error('Error resetting competitions:', error);
    }
};

// Get global leaderboard
exports.getGlobalLeaderboard = async (req, res) => {
    try {
        await resetCompetitions();

        const { sortBy = 'totalPoints', limit = 50, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        let sortCriteria = {};
        switch (sortBy) {
            case 'streak':
                sortCriteria = { currentStreak: -1, totalPoints: -1 };
                break;
            case 'level':
                sortCriteria = { maxLevel: -1, totalPoints: -1 };
                break;
            case 'achievements':
                sortCriteria = { achievementsCount: -1, totalPoints: -1 };
                break;
            default:
                sortCriteria = { totalPoints: -1, currentStreak: -1 };
        }

        const leaderboard = await Leaderboard.find()
            .sort(sortCriteria)
            .skip(skip)
            .limit(parseInt(limit))
            .select('username totalPoints currentStreak longestStreak maxLevel achievementsCount rewardsCount lastActive');

        const total = await Leaderboard.countDocuments();

        res.json({
            success: true,
            data: leaderboard,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                hasNext: skip + leaderboard.length < total,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching global leaderboard:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
    }
};

// Get weekly competition leaderboard
exports.getWeeklyLeaderboard = async (req, res) => {
    try {
        await resetCompetitions();

        const { limit = 20 } = req.query;

        const leaderboard = await Leaderboard.find()
            .sort({ weeklyPoints: -1, weeklyStreak: -1 })
            .limit(parseInt(limit))
            .select('username weeklyPoints weeklyStreak');

        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        console.error('Error fetching weekly leaderboard:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch weekly leaderboard' });
    }
};

// Get monthly competition leaderboard
exports.getMonthlyLeaderboard = async (req, res) => {
    try {
        await resetCompetitions();

        const { limit = 20 } = req.query;

        const leaderboard = await Leaderboard.find()
            .sort({ monthlyPoints: -1, monthlyStreak: -1 })
            .limit(parseInt(limit))
            .select('username monthlyPoints monthlyStreak');

        res.json({
            success: true,
            data: leaderboard
        });
    } catch (error) {
        console.error('Error fetching monthly leaderboard:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch monthly leaderboard' });
    }
};

// Get user's ranking
exports.getUserRanking = async (req, res) => {
    try {
        const { username } = req.params;
        await resetCompetitions();

        // Get user's leaderboard entry
        const userEntry = await Leaderboard.findOne({ username });
        if (!userEntry) {
            return res.status(404).json({ success: false, message: 'User not found in leaderboard' });
        }

        // Get global ranking
        const globalRank = await Leaderboard.countDocuments({ totalPoints: { $gt: userEntry.totalPoints } }) + 1;

        // Get weekly ranking
        const weeklyRank = await Leaderboard.countDocuments({ weeklyPoints: { $gt: userEntry.weeklyPoints } }) + 1;

        // Get monthly ranking
        const monthlyRank = await Leaderboard.countDocuments({ monthlyPoints: { $gt: userEntry.monthlyPoints } }) + 1;

        res.json({
            success: true,
            data: {
                username: userEntry.username,
                globalRank,
                weeklyRank,
                monthlyRank,
                totalPoints: userEntry.totalPoints,
                weeklyPoints: userEntry.weeklyPoints,
                monthlyPoints: userEntry.monthlyPoints,
                currentStreak: userEntry.currentStreak
            }
        });
    } catch (error) {
        console.error('Error fetching user ranking:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user ranking' });
    }
};

// Create friend challenge
exports.createChallenge = async (req, res) => {
    try {
        const { challenger, challenged, challengeType = 'points' } = req.body;

        if (challenger === challenged) {
            return res.status(400).json({ success: false, message: 'Cannot challenge yourself' });
        }

        // Check if challenged user exists
        const challengedUser = await Leaderboard.findOne({ username: challenged });
        if (!challengedUser) {
            return res.status(404).json({ success: false, message: 'Challenged user not found' });
        }

        // Check if challenge already exists
        const existingChallenge = await Leaderboard.findOne({
            username: challenged,
            'friendChallenges.challenger': challenger,
            'friendChallenges.status': { $in: ['pending', 'accepted'] }
        });

        if (existingChallenge) {
            return res.status(400).json({ success: false, message: 'Challenge already exists' });
        }

        // Create challenge
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

        const challenge = {
            challenger,
            challenged,
            challengeType,
            status: 'pending',
            createdAt: new Date(),
            expiresAt
        };

        // Add challenge to challenged user's notifications
        await Leaderboard.findOneAndUpdate(
            { username: challenged },
            {
                $push: {
                    friendChallenges: challenge,
                    notifications: {
                        type: 'challenge',
                        title: 'New Challenge!',
                        message: `${challenger} has challenged you to a ${challengeType} competition!`,
                        data: { challenge }
                    }
                }
            }
        );

        // Update notification count for challenged user
        await updateNotificationCount(challenged);

        res.json({
            success: true,
            message: 'Challenge sent successfully',
            data: challenge
        });
    } catch (error) {
        console.error('Error creating challenge:', error);
        res.status(500).json({ success: false, message: 'Failed to create challenge' });
    }
};

// Accept/decline friend challenge
exports.respondToChallenge = async (req, res) => {
    try {
        const { username } = req.params;
        const { challengeId, response } = req.body; // response: 'accepted' or 'declined'

        const leaderboardEntry = await Leaderboard.findOne({ username });
        if (!leaderboardEntry) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const challenge = leaderboardEntry.friendChallenges.id(challengeId);
        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge not found' });
        }

        if (challenge.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Challenge already responded to' });
        }

        challenge.status = response;

        if (response === 'accepted') {
            // Add notification to challenger
            await Leaderboard.findOneAndUpdate(
                { username: challenge.challenger },
                {
                    $push: {
                        notifications: {
                            type: 'challenge',
                            title: 'Challenge Accepted!',
                            message: `${username} has accepted your challenge!`,
                            data: { challengeId, challenged: username }
                        }
                    }
                }
            );

            // Update notification count for challenger
            await updateNotificationCount(challenge.challenger);
        }

        await leaderboardEntry.save();

        // Update notification count for current user
        await updateNotificationCount(username);

        res.json({
            success: true,
            message: `Challenge ${response} successfully`,
            data: challenge
        });
    } catch (error) {
        console.error('Error responding to challenge:', error);
        res.status(500).json({ success: false, message: 'Failed to respond to challenge' });
    }
};

// Get user's challenges
exports.getUserChallenges = async (req, res) => {
    try {
        const { username } = req.params;

        const leaderboardEntry = await Leaderboard.findOne({ username });
        if (!leaderboardEntry) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get incoming challenges
        const incomingChallenges = leaderboardEntry.friendChallenges.filter(
            challenge => challenge.status === 'pending' && challenge.challenged === username
        );

        // Get outgoing challenges
        const outgoingChallenges = leaderboardEntry.friendChallenges.filter(
            challenge => challenge.status === 'pending' && challenge.challenger === username
        );

        // Get active challenges (accepted)
        const activeChallenges = leaderboardEntry.friendChallenges.filter(
            challenge => challenge.status === 'accepted'
        );

        res.json({
            success: true,
            data: {
                incoming: incomingChallenges,
                outgoing: outgoingChallenges,
                active: activeChallenges
            }
        });
    } catch (error) {
        console.error('Error fetching user challenges:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch challenges' });
    }
};

// Get user's notifications
exports.getUserNotifications = async (req, res) => {
    try {
        const { username } = req.params;
        const { limit = 20 } = req.query;

        const leaderboardEntry = await Leaderboard.findOne({ username });
        if (!leaderboardEntry) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const notifications = leaderboardEntry.notifications
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
    try {
        const { username, notificationId } = req.params;

        const result = await Leaderboard.updateOne(
            { username, 'notifications._id': notificationId },
            { $set: { 'notifications.$.isRead': true } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        // Update notification count
        await updateNotificationCount(username);

        res.json({
            success: true,
            message: 'Notification marked as read'
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
};

// Update user's competition points
exports.updateCompetitionPoints = async (req, res) => {
    try {
        const { username } = req.params;
        const { points, streak } = req.body;

        const leaderboardEntry = await Leaderboard.findOne({ username });
        if (!leaderboardEntry) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update weekly points
        leaderboardEntry.weeklyPoints += points || 0;
        if (streak > leaderboardEntry.weeklyStreak) {
            leaderboardEntry.weeklyStreak = streak;
        }

        // Update monthly points
        leaderboardEntry.monthlyPoints += points || 0;
        if (streak > leaderboardEntry.monthlyStreak) {
            leaderboardEntry.monthlyStreak = streak;
        }

        await leaderboardEntry.save();

        res.json({
            success: true,
            message: 'Competition points updated successfully',
            data: {
                weeklyPoints: leaderboardEntry.weeklyPoints,
                monthlyPoints: leaderboardEntry.monthlyPoints
            }
        });
    } catch (error) {
        console.error('Error updating competition points:', error);
        res.status(500).json({ success: false, message: 'Failed to update competition points' });
    }
}; 