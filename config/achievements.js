const ACHIEVEMENTS = {
    // First steps
    FIRST_LOGIN: {
        id: 'FIRST_LOGIN',
        name: 'Welcome!',
        description: 'Complete your first login',
        icon: '👋',
        points: 5,
        condition: (profile) => profile.achievements.length === 0
    },

    FIRST_LEVEL: {
        id: 'FIRST_LEVEL',
        name: 'Getting Started',
        description: 'Complete your first level',
        icon: '🎯',
        points: 10,
        condition: (profile) => profile.maxLevel >= 1
    },

    // Streak achievements
    STREAK_3: {
        id: 'STREAK_3',
        name: 'On Fire!',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        points: 15,
        condition: (profile) => profile.currentStreak >= 3
    },

    STREAK_7: {
        id: 'STREAK_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '⚡',
        points: 25,
        condition: (profile) => profile.currentStreak >= 7
    },

    STREAK_30: {
        id: 'STREAK_30',
        name: 'Dedication Master',
        description: 'Maintain a 30-day streak',
        icon: '👑',
        points: 100,
        condition: (profile) => profile.currentStreak >= 30
    },

    // Level achievements
    LEVEL_5: {
        id: 'LEVEL_5',
        name: 'Puzzle Explorer',
        description: 'Complete 5 levels',
        icon: '🧩',
        points: 20,
        condition: (profile) => profile.maxLevel >= 5
    },

    LEVEL_10: {
        id: 'LEVEL_10',
        name: 'Puzzle Master',
        description: 'Complete 10 levels',
        icon: '🏆',
        points: 50,
        condition: (profile) => profile.maxLevel >= 10
    },

    // Points achievements
    POINTS_100: {
        id: 'POINTS_100',
        name: 'Point Collector',
        description: 'Earn 100 total points',
        icon: '⭐',
        points: 30,
        condition: (profile) => profile.totalPoints >= 100
    },

    POINTS_500: {
        id: 'POINTS_500',
        name: 'Point Hunter',
        description: 'Earn 500 total points',
        icon: '💎',
        points: 75,
        condition: (profile) => profile.totalPoints >= 500
    },

    // Hint achievements
    HINT_MASTER: {
        id: 'HINT_MASTER',
        name: 'Hint Master',
        description: 'Use hints on 5 different levels',
        icon: '💡',
        points: 25,
        condition: (profile) => profile.takenHintLevels.length >= 5
    },

    // Special achievements
    PERFECT_STREAK: {
        id: 'PERFECT_STREAK',
        name: 'Perfect Streak',
        description: 'Complete 5 levels without using hints',
        icon: '🌟',
        points: 50,
        condition: (profile) => {
            // This is a simplified condition - in reality you'd need to track hint usage per level
            return profile.maxLevel >= 5 && profile.takenHintLevels.length === 0;
        }
    }
};

module.exports = ACHIEVEMENTS; 