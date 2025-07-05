const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// User: Create transaction
router.post('/', transactionController.createTransaction);

// Admin: Get all transactions
router.get('/', transactionController.getAllTransactions);

// Admin: Update transaction by id (PUT, PATCH)
router.put('/:id', transactionController.updateTransactionById);
router.patch('/:id', transactionController.updateTransactionById);

// User: Get all transactions for a specific user
router.get('/user/:username', transactionController.getUserTransactions);

module.exports = router; 