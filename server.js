const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const levelRoutes = require('./routes/levelRoutes');
const profileRoutes = require('./routes/profileRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const puzzleRoutes = require('./routes/puzzleRoutes');
const chatRoutes = require('./routes/chatRoutes');
const chatController = require('./controllers/chatController');
const ChatMessage = require('./models/ChatMessage');
const http = require('http');
const socketIo = require('socket.io');
const surveyRoutes = require('./routes/surveyRoutes');

dotenv.config();
console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY + '...' : 'NOT SET');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176", "http://localhost:5177"], // Multiple frontend URLs
        methods: ["GET", "POST"]
    }
});

// Store online users
const onlineUsers = new Map(); // roomId -> Map of socketId -> { username, userId }
const roomUsers = new Map(); // roomId -> Set of socketIds

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/puzzles', puzzleRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/survey', surveyRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user to their personal room for profile updates
    socket.on('join-user-room', (username) => {
        socket.join(`user-${username}`);
        console.log(`User ${username} joined their room`);
    });

    // Handle joining chat room
    socket.on('join-chat-room', (data) => {
        console.log('User joining chat room:', data);

        if (!data.roomId || !data.username) {
            console.error('Missing required fields for join:', data);
            return;
        }

        const roomId = `chat-${data.roomId}`;

        // Join the room
        socket.join(roomId);

        // Store user info
        socket.userInfo = {
            username: data.username,
            userId: data.userId,
            roomId: data.roomId
        };

        // Add to online users for this room
        if (!onlineUsers.has(roomId)) {
            onlineUsers.set(roomId, new Map());
        }
        onlineUsers.get(roomId).set(socket.id, {
            username: data.username,
            userId: data.userId
        });

        // Also add to roomUsers for backward compatibility
        if (!roomUsers.has(data.roomId)) {
            roomUsers.set(data.roomId, new Set());
        }
        roomUsers.get(data.roomId).add(socket.id);

        // Notify others in the room
        socket.to(roomId).emit('user-joined', {
            username: data.username,
            userId: data.userId,
            message: `${data.username} joined the chat 👋`
        });

        // Send current online users to the joining user
        const currentRoomUsers = Array.from(onlineUsers.get(roomId).values());
        socket.emit('online-users', currentRoomUsers);

        // Update online users for all users in the room
        io.to(roomId).emit('online-users-updated', currentRoomUsers);

        console.log(`User ${data.username} joined chat room: ${data.roomId}`);
        console.log(`Online users in ${data.roomId}:`, currentRoomUsers.map(u => u.username));
    });

    // Handle leaving chat room
    socket.on('leave-chat-room', (roomId) => {
        console.log('User leaving chat room:', roomId);

        if (!roomId) {
            console.error('Missing roomId for leave');
            return;
        }

        const chatRoomId = `chat-${roomId}`;

        // Remove from online users
        if (onlineUsers.has(chatRoomId)) {
            onlineUsers.get(chatRoomId).delete(socket.id);

            // If no users left in room, remove the room
            if (onlineUsers.get(chatRoomId).size === 0) {
                onlineUsers.delete(chatRoomId);
            }
        }

        // Remove from roomUsers
        if (roomUsers.has(roomId)) {
            roomUsers.get(roomId).delete(socket.id);
            if (roomUsers.get(roomId).size === 0) {
                roomUsers.delete(roomId);
            }
        }

        // Notify others in the room
        if (socket.userInfo) {
            socket.to(chatRoomId).emit('user-left', {
                username: socket.userInfo.username,
                userId: socket.userInfo.userId,
                message: `${socket.userInfo.username} left the chat 👋`
            });

            // Update online users for remaining users
            const remainingUsers = onlineUsers.has(chatRoomId)
                ? Array.from(onlineUsers.get(chatRoomId).values())
                : [];
            io.to(chatRoomId).emit('online-users-updated', remainingUsers);

            console.log(`User ${socket.userInfo.username} left chat room: ${roomId}`);
            console.log(`Remaining users in ${roomId}:`, remainingUsers.map(u => u.username));
        }

        // Leave the room
        socket.leave(chatRoomId);

        // Clear user info
        socket.userInfo = null;
    });

    // Handle sending messages
    socket.on('send-message', async (data) => {
        console.log('Received message data:', data);

        // Validate required fields
        if (!data.roomId || !data.userId || !data.message) {
            console.error('Missing required fields:', {
                hasRoomId: !!data.roomId,
                hasUserId: !!data.userId,
                hasMessage: !!data.message
            });
            socket.emit('message-error', {
                message: `Missing required fields: ${!data.roomId ? 'roomId, ' : ''}${!data.userId ? 'userId, ' : ''}${!data.message ? 'message' : ''}`.replace(/,\s*$/, '')
            });
            return;
        }

        try {
            // Save message to database
            const newMessage = new ChatMessage({
                roomId: data.roomId,
                user: data.userId,
                username: data.username || 'Anonymous',
                message: data.message,
                messageType: data.messageType || 'text'
            });

            const savedMessage = await newMessage.save();
            console.log('Message saved:', savedMessage);

            // Broadcast to all users in the room
            io.to(`chat-${data.roomId}`).emit('new-message', {
                _id: savedMessage._id,
                roomId: savedMessage.roomId,
                userId: savedMessage.user,
                username: savedMessage.username,
                message: savedMessage.message,
                messageType: savedMessage.messageType,
                createdAt: savedMessage.createdAt,
                formattedTime: new Date(savedMessage.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })
            });

        } catch (error) {
            console.error('Error saving message:', error);
            socket.emit('message-error', { message: 'Failed to send message. Please try again.' });
        }
    });

    // Handle help requests
    socket.on('request-help', async (data) => {
        console.log('Received help request data:', data);

        // Validate required fields
        if (!data.roomId || !data.userId || !data.question) {
            console.error('Missing required fields for help request:', {
                hasRoomId: !!data.roomId,
                hasUserId: !!data.userId,
                hasQuestion: !!data.question
            });
            socket.emit('help-error', {
                message: `Missing required fields: ${!data.roomId ? 'roomId, ' : ''}${!data.userId ? 'userId, ' : ''}${!data.question ? 'question' : ''}`.replace(/,\s*$/, '')
            });
            return;
        }

        try {
            // Save help request to database
            const newMessage = new ChatMessage({
                roomId: data.roomId,
                user: data.userId,
                username: data.username || 'Anonymous',
                message: data.question,
                messageType: 'help-request'
            });

            const savedMessage = await newMessage.save();
            console.log('Help request saved:', savedMessage);

            // Broadcast to all users in the room
            io.to(`chat-${data.roomId}`).emit('help-request', {
                _id: savedMessage._id,
                roomId: savedMessage.roomId,
                userId: savedMessage.user,
                username: savedMessage.username,
                message: savedMessage.message,
                messageType: savedMessage.messageType,
                createdAt: savedMessage.createdAt,
                formattedTime: new Date(savedMessage.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                })
            });

        } catch (error) {
            console.error('Error saving help request:', error);
            socket.emit('help-error', { message: 'Failed to send help request. Please try again.' });
        }
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
        console.log('User typing start:', data.username);
        // Only send to other users in the room, not the typing user
        socket.to(`chat-${data.roomId}`).emit('user-typing', {
            username: data.username,
            isTyping: true
        });
    });

    socket.on('typing-stop', (data) => {
        console.log('User typing stop:', data.username);
        // Only send to other users in the room, not the typing user
        socket.to(`chat-${data.roomId}`).emit('user-typing', {
            username: data.username,
            isTyping: false
        });
    });

    // Get online users for a room
    socket.on('get-online-users', (roomId) => {
        const roomOnlineUsers = Array.from(roomUsers.get(roomId) || [])
            .map(sid => onlineUsers.get(sid))
            .filter(user => user && user.roomId === roomId)
            .map(user => ({ username: user.username, userId: user.userId }));

        socket.emit('online-users', roomOnlineUsers);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Clean up user data
        if (socket.userInfo) {
            const { username, roomId } = socket.userInfo;
            const chatRoomId = `chat-${roomId}`;

            // Remove from online users
            if (onlineUsers.has(chatRoomId)) {
                onlineUsers.get(chatRoomId).delete(socket.id);

                // If no users left in room, remove the room
                if (onlineUsers.get(chatRoomId).size === 0) {
                    onlineUsers.delete(chatRoomId);
                } else {
                    // Notify others in the room
                    socket.to(chatRoomId).emit('user-left', {
                        username: username,
                        userId: socket.userInfo.userId,
                        message: `${username} disconnected from the chat 👋`
                    });

                    // Update online users for remaining users
                    const remainingUsers = Array.from(onlineUsers.get(chatRoomId).values());
                    io.to(chatRoomId).emit('online-users-updated', remainingUsers);

                    console.log(`User ${username} disconnected from room: ${roomId}`);
                    console.log(`Remaining users in ${roomId}:`, remainingUsers.map(u => u.username));
                }
            }

            // Remove from roomUsers
            if (roomUsers.has(roomId)) {
                roomUsers.get(roomId).delete(socket.id);
                if (roomUsers.get(roomId).size === 0) {
                    roomUsers.delete(roomId);
                }
            }
        }
    });
});

// Make io available to routes
app.set('io', io);

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.log(err));