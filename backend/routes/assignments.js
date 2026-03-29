const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment');
const Class = require('../models/Class');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const path = require('path');

// Create assignment
router.post('/', protect, authorize('teacher'), (req, res, next) => {
  req.uploadFolder = 'assignments';
  next();
}, upload.array('files', 5), async (req, res) => {
  try {
    const { title, description, classId, dueDate, totalMarks, instructions, allowLateSubmission } = req.body;
    const cls = await Class.findOne({ _id: classId, teacher: req.user._id });
    if (!cls) return res.status(403).json({ message: 'Not authorized for this class' });

    const attachments = (req.files || []).map(f => ({
      name: f.originalname,
      url: `/uploads/assignments/${f.filename}`,
      type: path.extname(f.originalname)
    }));

    const assignment = await Assignment.create({
      title, description, class: classId, teacher: req.user._id,
      dueDate, totalMarks: totalMarks || 100, instructions,
      allowLateSubmission: allowLateSubmission === 'true',
      attachments
    });
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get assignments for a class
router.get('/class/:classId', protect, async (req, res) => {
  try {
    const assignments = await Assignment.find({ class: req.params.classId })
      .populate('teacher', 'name').sort({ dueDate: 1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single assignment
router.get('/:id', protect, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('teacher', 'name email');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update assignment
router.put('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      req.body, { new: true }
    );
    if (!assignment) return res.status(404).json({ message: 'Not found or not authorized' });
    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete assignment
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    await Assignment.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
