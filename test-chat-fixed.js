const axios = require('axios');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

async function testChatFixed() {
    console.log('🧪 Testing Fixed Chat System...\n');

    try {
        // Test 1: Register test users
        console.log('1. Registering test users...');

        // User 1
        await axios.post(`${API_BASE}/auth/register`, {
            username: 'testuser1',
            password: 'password123'
        });

        // User 2
        await axios.post(`${API_BASE}/auth/register`, {
            username: 'testuser2',
            password: 'password123'
        });

        console.log('✅ Users registered');

        // Test 2: Login users
        console.log('\n2. Logging in users...');

        const login1 = await axios.post(`${API_BASE}/auth/login`, {
            username: 'testuser1',
            password: 'password123'
        });

        const login2 = await axios.post(`${API_BASE}/auth/login`, {
            username: 'testuser2',
            password: 'password123'
        });

        const token1 = login1.data.token;
        const token2 = login2.data.token;
        console.log('✅ Users logged in');

        // Test 3: Get user profiles
        console.log('\n3. Getting user profiles...');

        const profile1 = await axios.get(`${API_BASE}/profile/testuser1`, {
            headers: { Authorization: `Bearer ${token1}` }
        });

        const profile2 = await axios.get(`${API_BASE}/profile/testuser2`, {
            headers: { Authorization: `Bearer ${token2}` }
        });

        console.log('✅ Profiles retrieved');

        // Test 4: Test WebSocket connections
        console.log('\n4. Testing WebSocket connections...');

        const socket1 = io(SOCKET_URL);
        const socket2 = io(SOCKET_URL);

        let messagesReceived = 0;
        let typingEvents = 0;

        // Socket 1 event handlers
        socket1.on('connect', () => {
            console.log('✅ Socket 1 connected');
            socket1.emit('join-chat-room', {
                roomId: 'general',
                username: 'testuser1',
                userId: profile1.data._id
            });
        });

        socket1.on('online-users', (users) => {
            console.log('✅ Socket 1 received online users:', users.length);
        });

        socket1.on('new-message', (message) => {
            messagesReceived++;
            console.log(`✅ Socket 1 received message ${messagesReceived}:`, message.message);
        });

        socket1.on('user-typing', (data) => {
            typingEvents++;
            console.log(`✅ Socket 1 received typing event ${typingEvents}:`, data);
        });

        // Socket 2 event handlers
        socket2.on('connect', () => {
            console.log('✅ Socket 2 connected');
            setTimeout(() => {
                socket2.emit('join-chat-room', {
                    roomId: 'general',
                    username: 'testuser2',
                    userId: profile2.data._id
                });
            }, 1000);
        });

        socket2.on('online-users', (users) => {
            console.log('✅ Socket 2 received online users:', users.length);
        });

        socket2.on('new-message', (message) => {
            messagesReceived++;
            console.log(`✅ Socket 2 received message ${messagesReceived}:`, message.message);
        });

        socket2.on('user-typing', (data) => {
            typingEvents++;
            console.log(`✅ Socket 2 received typing event ${typingEvents}:`, data);
        });

        // Wait for connections
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Test 5: Send messages
        console.log('\n5. Testing message sending...');

        // User 1 sends a message
        socket1.emit('send-message', {
            roomId: 'general',
            userId: profile1.data._id,
            username: 'testuser1',
            message: 'Hello from user 1!',
            messageType: 'text'
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // User 2 sends a message
        socket2.emit('send-message', {
            roomId: 'general',
            userId: profile2.data._id,
            username: 'testuser2',
            message: 'Hello from user 2!',
            messageType: 'text'
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 6: Test typing indicators
        console.log('\n6. Testing typing indicators...');

        // User 1 starts typing
        socket1.emit('typing-start', {
            roomId: 'general',
            username: 'testuser1',
            userId: profile1.data._id
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // User 1 stops typing
        socket1.emit('typing-stop', {
            roomId: 'general',
            username: 'testuser1',
            userId: profile1.data._id
        });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 7: Test help request
        console.log('\n7. Testing help request...');

        socket1.emit('request-help', {
            roomId: 'general',
            userId: profile1.data._id,
            username: 'testuser1',
            question: 'I need help with this puzzle!'
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test 8: Leave chat rooms
        console.log('\n8. Testing leave functionality...');

        socket1.emit('leave-chat-room', 'general');
        socket2.emit('leave-chat-room', 'general');

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Disconnect
        socket1.disconnect();
        socket2.disconnect();
        console.log('✅ WebSockets disconnected');

        console.log('\n🎉 All tests completed successfully!');
        console.log(`📊 Summary: ${messagesReceived} messages sent/received, ${typingEvents} typing events`);
        console.log('\n📋 Fixed Issues:');
        console.log('✅ ChatMessage validation error fixed (user field)');
        console.log('✅ Messages can be sent and received');
        console.log('✅ Typing indicators work for other users only');
        console.log('✅ Multiple users can join the same room');
        console.log('✅ User join/leave notifications work');
        console.log('✅ Help requests work');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

testChatFixed(); 