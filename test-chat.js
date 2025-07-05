const mongoose = require('mongoose');
const ChatMessage = require('./models/ChatMessage');
const User = require('./models/User');
require('dotenv').config();

async function populateChatMessages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing chat messages
        await ChatMessage.deleteMany({});
        console.log('Cleared existing chat messages');

        // Find or create a test user
        let testUser = await User.findOne({ username: 'test_user' });
        if (!testUser) {
            testUser = new User({
                username: 'test_user',
                password: 'test123',
                role: 'user'
            });
            await testUser.save();
            console.log('Created test user');
        }

        // Sample chat messages for the general room
        const sampleMessages = [
            {
                roomId: 'general',
                user: testUser._id,
                username: testUser.username,
                message: 'Hello everyone! 👋 Ready to tackle some puzzles?',
                messageType: 'text',
                createdAt: new Date(Date.now() - 300000) // 5 minutes ago
            },
            {
                roomId: 'general',
                user: testUser._id,
                username: testUser.username,
                message: 'I\'m stuck on Level 3. Can anyone help me understand HTTP status codes?',
                messageType: 'help-request',
                createdAt: new Date(Date.now() - 240000) // 4 minutes ago
            },
            {
                roomId: 'general',
                user: testUser._id,
                username: testUser.username,
                message: 'Just completed Level 5! 🎉 The REST API concepts are getting clearer now.',
                messageType: 'text',
                createdAt: new Date(Date.now() - 180000) // 3 minutes ago
            },
            {
                roomId: 'general',
                user: testUser._id,
                username: testUser.username,
                message: 'Anyone else finding the PUT vs PATCH distinction tricky?',
                messageType: 'text',
                createdAt: new Date(Date.now() - 120000) // 2 minutes ago
            },
            {
                roomId: 'general',
                user: testUser._id,
                username: testUser.username,
                message: 'Thanks for the help everyone! This community is awesome! 🙏',
                messageType: 'text',
                createdAt: new Date(Date.now() - 60000) // 1 minute ago
            }
        ];

        // Insert sample messages
        await ChatMessage.insertMany(sampleMessages);
        console.log('Created sample chat messages');

        // Display created messages
        const messages = await ChatMessage.find({ roomId: 'general' })
            .sort({ createdAt: 1 })
            .populate('user', 'username');

        console.log('\n📝 Sample chat messages created:');
        messages.forEach((msg, index) => {
            console.log(`${index + 1}. [${msg.formattedTime}] ${msg.username}: ${msg.message}`);
        });

        console.log('\n✅ Chat messages populated successfully!');
        console.log('You can now test the chat room functionality');

    } catch (error) {
        console.error('Error populating chat messages:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

populateChatMessages(); 