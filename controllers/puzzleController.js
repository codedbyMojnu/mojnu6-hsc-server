const mongoose = require('mongoose');
const Puzzle = require('../models/Puzzle');
const User = require('../models/User');
const ProfileData = require('../models/ProfileData');

// Create a new puzzle
exports.createPuzzle = async (req, res) => {
    try {
        const { title, description, category, difficulty, question, options, answer, explanation, hint, tags, isPublic } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!title || !description || !question || !answer || !explanation || !hint) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Validate options (max 4)
        if (options && options.length > 4) {
            return res.status(400).json({
                success: false,
                message: 'Puzzle cannot have more than 4 options'
            });
        }

        // Get user info
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Create puzzle
        const puzzle = new Puzzle({
            title,
            description,
            category,
            difficulty,
            question,
            options: options || [],
            answer,
            explanation,
            hint,
            tags: tags || [],
            creator: userId,
            creatorUsername: user.username,
            isPublic: isPublic !== false // Default to true
        });

        await puzzle.save();

        // Update creator stats
        await ProfileData.findOneAndUpdate(
            { username: user.username },
            {
                $inc: { totalPoints: 10 }, // Reward for creating puzzle
                $push: { achievements: 'first_puzzle' }
            },
            { upsert: true }
        );

        res.status(201).json({
            success: true,
            message: 'Puzzle created successfully!',
            data: puzzle
        });

    } catch (error) {
        console.error('Error creating puzzle:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create puzzle'
        });
    }
};

// Get puzzle marketplace (approved puzzles)
exports.getPuzzleMarketplace = async (req, res) => {
    try {
        const {
            category,
            difficulty,
            sortBy = 'rating',
            page = 1,
            limit = 20,
            search,
            tags
        } = req.query;

        const skip = (page - 1) * limit;
        const query = { status: 'approved', isPublic: true };

        // Apply filters
        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        if (tags) {
            query.tags = { $in: tags.split(',') };
        }
        if (search) {
            query.$text = { $search: search };
        }

        // Build sort criteria
        let sortCriteria = {};
        switch (sortBy) {
            case 'rating':
                sortCriteria = { 'rating.average': -1, plays: -1 };
                break;
            case 'plays':
                sortCriteria = { plays: -1, 'rating.average': -1 };
                break;
            case 'newest':
                sortCriteria = { createdAt: -1 };
                break;
            case 'oldest':
                sortCriteria = { createdAt: 1 };
                break;
            case 'difficulty':
                sortCriteria = { difficulty: 1 };
                break;
            default:
                sortCriteria = { 'rating.average': -1, plays: -1 };
        }

        const puzzles = await Puzzle.find(query)
            .sort(sortCriteria)
            .skip(skip)
            .limit(parseInt(limit))
            .select('-answer -explanation -hint') // Don't send answers in marketplace
            .populate('creator', 'username');

        const total = await Puzzle.countDocuments(query);

        res.json({
            success: true,
            data: puzzles,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                hasNext: skip + puzzles.length < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching puzzle marketplace:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch puzzle marketplace'
        });
    }
};

// Get featured puzzles
exports.getFeaturedPuzzles = async (req, res) => {
    try {
        const puzzles = await Puzzle.find({
            status: 'featured',
            isPublic: true
        })
            .sort({ featuredAt: -1 })
            .limit(10)
            .select('-answer -explanation -hint')
            .populate('creator', 'username');

        res.json({
            success: true,
            data: puzzles
        });

    } catch (error) {
        console.error('Error fetching featured puzzles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch featured puzzles'
        });
    }
};

// Get puzzle by ID (for playing)
exports.getPuzzleById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const puzzle = await Puzzle.findById(id)
            .populate('creator', 'username');

        if (!puzzle) {
            return res.status(404).json({
                success: false,
                message: 'Puzzle not found'
            });
        }

        if (puzzle.status !== 'approved' && puzzle.status !== 'featured') {
            return res.status(403).json({
                success: false,
                message: 'Puzzle is not available for play'
            });
        }

        // Increment plays count
        await puzzle.incrementPlays();

        // Don't send answer, explanation, or hint initially
        const puzzleForPlay = {
            _id: puzzle._id,
            title: puzzle.title,
            description: puzzle.description,
            category: puzzle.category,
            difficulty: puzzle.difficulty,
            question: puzzle.question,
            options: puzzle.options,
            creator: puzzle.creator,
            rating: puzzle.rating,
            plays: puzzle.plays,
            tags: puzzle.tags
        };

        res.json({
            success: true,
            data: puzzleForPlay
        });

    } catch (error) {
        console.error('Error fetching puzzle:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch puzzle'
        });
    }
};

// Submit puzzle answer
exports.submitPuzzleAnswer = async (req, res) => {
    try {
        const { id } = req.params;
        const { answer, timeSpent } = req.body;
        const userId = req.user.id;

        const puzzle = await Puzzle.findById(id);
        if (!puzzle) {
            return res.status(404).json({
                success: false,
                message: 'Puzzle not found'
            });
        }

        const isCorrect = answer.trim().toLowerCase() === puzzle.answer.trim().toLowerCase();

        if (isCorrect) {
            await puzzle.incrementCompletions();

            // Award points to user
            const user = await User.findById(userId);
            if (user) {
                await ProfileData.findOneAndUpdate(
                    { username: user.username },
                    { $inc: { totalPoints: 5 } }, // Points for solving puzzle
                    { upsert: true }
                );
            }
        }

        // Return result with explanation
        res.json({
            success: true,
            data: {
                isCorrect,
                correctAnswer: puzzle.answer,
                explanation: puzzle.explanation,
                hint: puzzle.hint
            }
        });

    } catch (error) {
        console.error('Error submitting puzzle answer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit answer'
        });
    }
};

// Add review to puzzle
exports.addPuzzleReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userId = req.user.id;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const puzzle = await Puzzle.findById(id);
        if (!puzzle) {
            return res.status(404).json({
                success: false,
                message: 'Puzzle not found'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Add review
        await puzzle.addReview(userId, user.username, rating, comment);

        res.json({
            success: true,
            message: 'Review added successfully',
            data: {
                rating: puzzle.rating,
                reviews: puzzle.reviews
            }
        });

    } catch (error) {
        console.error('Error adding puzzle review:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add review'
        });
    }
};

// Get user's created puzzles
exports.getUserPuzzles = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = { creator: userId };
        if (status) query.status = status;

        const puzzles = await Puzzle.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Puzzle.countDocuments(query);

        res.json({
            success: true,
            data: puzzles,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                hasNext: skip + puzzles.length < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Error fetching user puzzles:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user puzzles'
        });
    }
};

// Update puzzle
exports.updatePuzzle = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const updateData = req.body;

        const puzzle = await Puzzle.findById(id);
        if (!puzzle) {
            return res.status(404).json({
                success: false,
                message: 'Puzzle not found'
            });
        }

        // Check if user owns the puzzle
        if (puzzle.creator.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only update your own puzzles'
            });
        }

        // Only allow updates if puzzle is not approved
        if (puzzle.status === 'approved' || puzzle.status === 'featured') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update approved or featured puzzles'
            });
        }

        // Update puzzle
        Object.assign(puzzle, updateData);
        await puzzle.save();

        res.json({
            success: true,
            message: 'Puzzle updated successfully',
            data: puzzle
        });

    } catch (error) {
        console.error('Error updating puzzle:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update puzzle'
        });
    }
};

// Delete puzzle
exports.deletePuzzle = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const puzzle = await Puzzle.findById(id);
        if (!puzzle) {
            return res.status(404).json({
                success: false,
                message: 'Puzzle not found'
            });
        }

        // Check if user owns the puzzle
        if (puzzle.creator.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own puzzles'
            });
        }

        await Puzzle.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Puzzle deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting puzzle:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete puzzle'
        });
    }
};

// Get creator statistics
exports.getCreatorStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await Puzzle.aggregate([
            { $match: { creator: mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalPuzzles: { $sum: 1 },
                    totalPlays: { $sum: '$plays' },
                    totalCompletions: { $sum: '$completions' },
                    averageRating: { $avg: '$rating.average' },
                    totalCreatorPoints: { $sum: '$creatorPoints' }
                }
            }
        ]);

        const statusCounts = await Puzzle.aggregate([
            { $match: { creator: mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const result = {
            totalPuzzles: stats[0]?.totalPuzzles || 0,
            totalPlays: stats[0]?.totalPlays || 0,
            totalCompletions: stats[0]?.totalCompletions || 0,
            averageRating: Math.round((stats[0]?.averageRating || 0) * 10) / 10,
            totalCreatorPoints: stats[0]?.totalCreatorPoints || 0,
            statusCounts: statusCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        };

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error fetching creator stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch creator statistics'
        });
    }
};

// Report puzzle
exports.reportPuzzle = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        const puzzle = await Puzzle.findById(id);
        if (!puzzle) {
            return res.status(404).json({
                success: false,
                message: 'Puzzle not found'
            });
        }

        // Increment reported count
        puzzle.reportedCount += 1;
        await puzzle.save();

        res.json({
            success: true,
            message: 'Puzzle reported successfully'
        });

    } catch (error) {
        console.error('Error reporting puzzle:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to report puzzle'
        });
    }
};

// Get puzzle categories and difficulties
exports.getPuzzleFilters = async (req, res) => {
    try {
        const categories = await Puzzle.distinct('category');
        const difficulties = await Puzzle.distinct('difficulty');
        const tags = await Puzzle.distinct('tags');

        res.json({
            success: true,
            data: {
                categories,
                difficulties,
                tags: tags.filter(tag => tag) // Remove empty tags
            }
        });

    } catch (error) {
        console.error('Error fetching puzzle filters:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch puzzle filters'
        });
    }
}; 