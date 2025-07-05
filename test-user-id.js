const jwt = require('jsonwebtoken');
require('dotenv').config();

// Test JWT token structure
function testJWTStructure() {
    console.log('🔍 Testing JWT Token Structure...\n');

    // Create a test token with user ID
    const testPayload = {
        userId: '507f1f77bcf86cd799439011',
        username: 'testuser',
        role: 'user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
    };

    const token = jwt.sign(testPayload, process.env.JWT_SECRET || 'your-secret-key');

    console.log('📝 Test Token:', token);
    console.log('📋 Token Payload:', testPayload);

    // Decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('🔓 Decoded Token:', decoded);
    console.log('🆔 User ID from token:', decoded.userId);

    console.log('\n✅ JWT Token structure test completed!');
}

testJWTStructure(); 