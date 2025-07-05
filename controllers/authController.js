const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const ProfileData = require('../models/ProfileData');
const sendEmail = require('../config/sendEmail');
const crypto = require('crypto');

exports.register = async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        // Auto-create profile data after user registration
        await ProfileData.create({ username: user.username });

        // Generate token for immediate login
        const token = jwt.sign({
            userId: user._id.toString(),
            username: user.username,
            role: user.role
        }, process.env.JWT_SECRET);

        res.status(201).json({
            message: 'User created',
            token
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({
        userId: user._id.toString(),
        username: user.username,
        role: user.role
    }, process.env.JWT_SECRET);
    res.json({ token });
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
    try {
        const { emailOrUsername } = req.body;
        const user = await User.findOne({
            $or: [
                { email: emailOrUsername },
                { username: emailOrUsername }
            ]
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        // Generate a 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetPasswordToken = code;
        user.resetPasswordExpires = Date.now() + 1000 * 60 * 15; // 15 min
        await user.save();
        await sendEmail({
            to: user.email,
            subject: 'Password Reset Code',
            text: `Your password reset code is: ${code}`,
            html: `<p>Your password reset code is: <b>${code}</b></p>`
        });
        res.json({ message: 'Reset code sent to your email.' });
    } catch (err) {
        console.error('ForgotPassword error:', err);
        res.status(500).json({ error: err.message });
    }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
    try {
        const { emailOrUsername, code, newPassword } = req.body;
        const user = await User.findOne({
            $or: [
                { email: emailOrUsername },
                { username: emailOrUsername }
            ],
            resetPasswordToken: code,
            resetPasswordExpires: { $gt: Date.now() }
        });
        if (!user) return res.status(400).json({ error: 'Invalid or expired code.' });
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        res.json({ message: 'Password has been reset. You can now log in.' });
    } catch (err) {
        console.error('ResetPassword error:', err);
        res.status(500).json({ error: err.message });
    }
};