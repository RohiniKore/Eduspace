const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Class = require('../models/Class');
const User = require('../models/User');
const { protect, authorize, requireApproved } = require('../middleware/auth');

// Create class (teacher)
router.post('/', protect, authorize('teacher'), requireApproved, async (req, res) => {
  try {
    const { name, description, subject, section, coverColor } = req.body;
    const classCode = uuidv4().substring(0, 7).toUpperCase();
    const newClass = await Class.create({
      name, description, subject, section, coverColor,
      classCode, teacher: req.user._id
    });
    await User.findByIdAndUpdate(req.user._id, { $push: { teachingClasses: newClass._id } });
    const populated = await Class.findById(newClass._id).populate('teacher', 'name email avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Join class (student)
router.post('/join', protect, authorize('student'), async (req, res) => {
  try {
    const { classCode } = req.body;
    const cls = await Class.findOne({ classCode, isArchived: false });
    if (!cls) return res.status(404).json({ message: 'Class not found with this code' });
    if (cls.students.includes(req.user._id)) return res.status(400).json({ message: 'Already enrolled' });

    cls.students.push(req.user._id);
    await cls.save();
    await User.findByIdAndUpdate(req.user._id, { $push: { enrolledClasses: cls._id } });
    const populated = await Class.findById(cls._id).populate('teacher', 'name email avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my classes
router.get('/my', protect, async (req, res) => {
  try {
    let classes;
    if (req.user.role === 'teacher') {
      classes = await Class.find({ teacher: req.user._id }).populate('teacher', 'name email avatar').populate('students', 'name email');
    } else if (req.user.role === 'student') {
      classes = await Class.find({ students: req.user._id }).populate('teacher', 'name email avatar');
    } else {
      classes = await Class.find().populate('teacher', 'name email').populate('students', 'name');
    }
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single class
router.get('/:id', protect, async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id)
      .populate('teacher', 'name email avatar bio')
      .populate('students', 'name email avatar');
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update class (teacher)
router.put('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Class not found or not authorized' });
    const updated = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('teacher', 'name email');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Remove student from class
router.delete('/:id/students/:studentId', protect, authorize('teacher'), async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, teacher: req.user._id });
    if (!cls) return res.status(404).json({ message: 'Not authorized' });
    await Class.findByIdAndUpdate(req.params.id, { $pull: { students: req.params.studentId } });
    await User.findByIdAndUpdate(req.params.studentId, { $pull: { enrolledClasses: req.params.id } });
    res.json({ message: 'Student removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Regenerate class code
router.post('/:id/regenerate-code', protect, authorize('teacher'), async (req, res) => {
  try {
    const classCode = uuidv4().substring(0, 7).toUpperCase();
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      { classCode }, { new: true }
    );
    if (!cls) return res.status(404).json({ message: 'Not authorized' });
    res.json({ classCode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Leave class (student)
router.post('/:id/leave', protect, authorize('student'), async (req, res) => {
  try {
    await Class.findByIdAndUpdate(req.params.id, { $pull: { students: req.user._id } });
    await User.findByIdAndUpdate(req.user._id, { $pull: { enrolledClasses: req.params.id } });
    res.json({ message: 'Left class successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
