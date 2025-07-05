const REWARDS = {
    // Level Completion Rewards
    LEVEL_COMPLETION: {
        FINISH_GAME: {
            id: 'FINISH_GAME',
            name: 'Win a T-Shirt',
            description: 'Complete all levels in the game',
            icon: '👕',
            type: 'level_completion',
            condition: (profile, totalLevels) => profile.maxLevel >= totalLevels,
            pointsRequired: null,
            levelRequired: 'all'
        },
        LEVEL_500: {
            id: 'LEVEL_500',
            name: 'Get a Notepad',
            description: 'Complete 500 levels',
            icon: '📓',
            type: 'level_completion',
            condition: (profile) => profile.maxLevel >= 500,
            pointsRequired: null,
            levelRequired: 500
        },
        LEVEL_100: {
            id: 'LEVEL_100',
            name: 'Get a Pen',
            description: 'Complete 100 levels',
            icon: '✒️',
            type: 'level_completion',
            condition: (profile) => profile.maxLevel >= 100,
            pointsRequired: null,
            levelRequired: 100
        },
        LEVEL_50: {
            id: 'LEVEL_50',
            name: 'Get a Sticker',
            description: 'Complete 50 levels',
            icon: '🏷️',
            type: 'level_completion',
            condition: (profile) => profile.maxLevel >= 50,
            pointsRequired: null,
            levelRequired: 50
        },
        LEVEL_25: {
            id: 'LEVEL_25',
            name: 'Get a Keychain',
            description: 'Complete 25 levels',
            icon: '🔑',
            type: 'level_completion',
            condition: (profile) => profile.maxLevel >= 25,
            pointsRequired: null,
            levelRequired: 25
        }
    },

    // Points Earning Rewards
    POINTS_EARNING: {
        POINTS_10000: {
            id: 'POINTS_10000',
            name: 'Win a T-Shirt',
            description: 'Earn 10,000 total points',
            icon: '👕',
            type: 'points_earning',
            condition: (profile) => profile.totalPoints >= 10000,
            pointsRequired: 10000,
            levelRequired: null
        },
        POINTS_5000: {
            id: 'POINTS_5000',
            name: 'Get a Hoodie',
            description: 'Earn 5,000 total points',
            icon: '🧥',
            type: 'points_earning',
            condition: (profile) => profile.totalPoints >= 5000,
            pointsRequired: 5000,
            levelRequired: null
        },
        POINTS_2000: {
            id: 'POINTS_2000',
            name: 'Get a Cap',
            description: 'Earn 2,000 total points',
            icon: '🧢',
            type: 'points_earning',
            condition: (profile) => profile.totalPoints >= 2000,
            pointsRequired: 2000,
            levelRequired: null
        },
        POINTS_1000: {
            id: 'POINTS_1000',
            name: 'Get a Mug',
            description: 'Earn 1,000 total points',
            icon: '☕',
            type: 'points_earning',
            condition: (profile) => profile.totalPoints >= 1000,
            pointsRequired: 1000,
            levelRequired: null
        },
        POINTS_500: {
            id: 'POINTS_500',
            name: 'Get a Notepad',
            description: 'Earn 500 total points',
            icon: '📓',
            type: 'points_earning',
            condition: (profile) => profile.totalPoints >= 500,
            pointsRequired: 500,
            levelRequired: null
        },
        POINTS_250: {
            id: 'POINTS_250',
            name: 'Get a Pencil',
            description: 'Earn 250 total points',
            icon: '✏️',
            type: 'points_earning',
            condition: (profile) => profile.totalPoints >= 250,
            pointsRequired: 250,
            levelRequired: null
        },
        POINTS_100: {
            id: 'POINTS_100',
            name: 'Get a Sticker',
            description: 'Earn 100 total points',
            icon: '🏷️',
            type: 'points_earning',
            condition: (profile) => profile.totalPoints >= 100,
            pointsRequired: 100,
            levelRequired: null
        }
    }
};

module.exports = REWARDS; 