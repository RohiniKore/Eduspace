const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { protect, authorize } = require('../middleware/auth');

const adminOnly = [protect, authorize('admin')];

// Get all users
router.get('/users', ...adminOnly, async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
    const users = await User.find(query).skip((page - 1) * limit).limit(Number(limit)).sort({ createdAt: -1 });
    const total = await User.countDocuments(query);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve teacher
router.put('/users/:id/approve', ...adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Teacher approved', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reject/deactivate user
router.put('/users/:id/deactivate', ...adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false, isApproved: false }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deactivated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reactivate user
router.put('/users/:id/activate', ...adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
    res.json({ message: 'User activated', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete user
router.delete('/users/:id', ...adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all classes
router.get('/classes', ...adminOnly, async (req, res) => {
  try {
    const classes = await Class.find().populate('teacher', 'name email').sort({ createdAt: -1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete class
router.delete('/classes/:id', ...adminOnly, async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Dashboard stats
router.get('/stats', ...adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalTeachers, totalStudents, pendingTeachers, totalClasses, totalAssignments] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher', isApproved: false }),
      Class.countDocuments(),
      Assignment.countDocuments()
    ]);
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt isApproved');
    res.json({ totalUsers, totalTeachers, totalStudents, pendingTeachers, totalClasses, totalAssignments, recentUsers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Pending teachers
router.get('/pending-teachers', ...adminOnly, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', isApproved: false, isActive: true }).sort({ createdAt: -1 });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
