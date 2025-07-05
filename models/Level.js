/* eslint-disable */
const mongoose = require('mongoose');

const levelSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: [true, 'Question text cannot be empty.'],
            trim: true, // Removes unnecessary whitespace from the beginning and end
        },
        options: {
            type: [String], // Defines an array of strings
            default: [], // Default to empty array
            trim: true,
        },
        hint: {
            type: String, // Defines an array of strings
            required: true,
        },
        answer: {
            type: String,
            required: [true, 'An answer is required.'],
            trim: true,
        },
        explanation: {
            type: String,
            required: [true, 'An explanation is required to help users learn.'],
            trim: true,
        },
        category: {
            type: String,
            enum: [
                'MATH',
                'PHYSICS',
                'CHEMISTRY',
                'BIOLOGY',
                'ENGLISH'
            ],
            default: 'MATH',
            required: true
        },
    },
    {
        // Automatically adds `createdAt` and `updatedAt` fields
        timestamps: true,
    }
);

module.exports = mongoose.model('Level', levelSchema);