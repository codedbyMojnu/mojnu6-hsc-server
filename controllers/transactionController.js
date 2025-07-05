const Transaction = require('../models/Transaction');

// User: Create a new transaction
exports.createTransaction = async (req, res) => {
    try {
        const { username, transactionId, selectedPackage } = req.body;
        const transaction = new Transaction({ username, transactionId, selectedPackage });
        await transaction.save();
        res.status(201).json(transaction);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Admin: Get all transactions
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find();
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Admin: Update a transaction by username (PUT/PATCH)
exports.updateTransactionByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const update = req.body;
        const transaction = await Transaction.findOneAndUpdate(
            { username },
            update,
            { new: true }
        );
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(transaction);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Admin: Update a transaction by id (PUT/PATCH)
exports.updateTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const update = req.body;
        const transaction = await Transaction.findByIdAndUpdate(
            id,
            update,
            { new: true }
        );
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }
        res.json(transaction);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// User: Get all transactions for a specific user
exports.getUserTransactions = async (req, res) => {
    try {
        const { username } = req.params;
        const transactions = await Transaction.find({ username });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}; 