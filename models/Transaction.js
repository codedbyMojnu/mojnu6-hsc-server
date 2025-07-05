const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    username: { type: String, required: true },
    transactionId: { type: String, required: true },
    selectedPackage: { type: String, required: true },
    approveStatus: { type: String, default: "pending" }
}, {
    timestamps: true // 👈 Automatically adds `createdAt` and `updatedAt`
});

module.exports = mongoose.model('Transaction', transactionSchema);
