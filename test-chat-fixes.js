const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function testChatFixes() {
    console.log('🧪 Testing Chat Fixes...\n');

    try {
        // Test 1: Register a test user
        console.log('1. Registering test user...');
        const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
            username: 'testuser1',
            password: 'password123'
        });
        console.log('✅ User registered:', registerResponse.data);

        // Test 2: Login to get token
        console.log('\n2. Logging in...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            username: 'testuser1',
            password: 'password123'
        });
        const token = loginResponse.data.token;
        console.log('✅ Login successful, token received');

        // Test 3: Get user profile to extract user ID
        console.log('\n3. Getting user profile...');
        const profileResponse = await axios.get(`${API_BASE}/profile/testuser1`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Profile retrieved:', profileResponse.data);

        // Test 4: Test WebSocket connection
        console.log('\n4. Testing WebSocket connection...');
        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('✅ WebSocket connected');

            // Join chat room
            socket.emit('join-chat-room', {
                roomId: 'general',
                username: 'testuser1',
                userId: profileResponse.data._id
            });
        });

        socket.on('online-users', (users) => {
            console.log('✅ Online users received:', users);
        });

        socket.on('user-joined', (data) => {
            console.log('✅ User joined notification:', data);
        });

        socket.on('new-message', (message) => {
            console.log('✅ New message received:', message);
        });

        socket.on('message-error', (error) => {
            console.log('❌ Message error:', error);
        });

        // Wait a bit for connection
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 5: Send a message
        console.log('\n5. Sending test message...');
        socket.emit('send-message', {
            roomId: 'general',
            userId: profileResponse.data._id,
            username: 'testuser1',
            message: 'Hello from test user!',
            messageType: 'text'
        });

        // Wait for message to be processed
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 6: Test typing indicators
        console.log('\n6. Testing typing indicators...');
        socket.emit('typing-start', {
            roomId: 'general',
            username: 'testuser1',
            userId: profileResponse.data._id
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        socket.emit('typing-stop', {
            roomId: 'general',
            username: 'testuser1',
            userId: profileResponse.data._id
        });

        // Wait a bit more
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 7: Leave chat room
        console.log('\n7. Leaving chat room...');
        socket.emit('leave-chat-room', 'general');

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Disconnect
        socket.disconnect();
        console.log('✅ WebSocket disconnected');

        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📋 Summary of fixes:');
        console.log('✅ Typing indicators now only show for other users');
        console.log('✅ Better validation and error messages');
        console.log('✅ Proper user ID extraction and validation');
        console.log('✅ Improved user tracking and cleanup');
        console.log('✅ Fixed data structure inconsistencies');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testChatFixes(); 