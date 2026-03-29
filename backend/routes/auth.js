const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
  expiresIn: process.env.JWT_EXPIRE || '7d'
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, adminSecret } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: 'All fields required' });
    if (!['student', 'teacher', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

    if (role === 'admin') {
      const { adminSecret } = req.body;
      const secret = process.env.ADMIN_SECRET || 'eduspace-admin-secret';
      if (adminSecret !== secret) return res.status(403).json({ message: 'Invalid admin secret key' });
    } 
    
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role });
    const token = signToken(user._id);

    res.status(201).json({
      token, user,
      message: role === 'teacher' ? 'Registration successful. Awaiting admin approval.' : 'Registration successful.'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(401).json({ message: 'Account deactivated' });

    // If admin, verify secret key
    if (user.role === 'admin') {
      const { adminSecret } = req.body;
      const secret = process.env.ADMIN_SECRET || 'eduspace-admin-secret';
      if (!adminSecret || adminSecret !== secret) {
        return res.status(403).json({ message: 'Invalid admin secret key' });
      }
    }

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('enrolledClasses teachingClasses');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, bio }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Change password
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
