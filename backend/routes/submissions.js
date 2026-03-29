const express = require('express');
const router = express.Router();
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const path = require('path');

// Submit assignment (student)
router.post('/', protect, authorize('student'), (req, res, next) => {
  req.uploadFolder = 'submissions';
  next();
}, upload.array('files', 5), async (req, res) => {
  try {
    const { assignmentId, classId, content } = req.body;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    const isLate = new Date() > new Date(assignment.dueDate);
    if (isLate && !assignment.allowLateSubmission) {
      return res.status(400).json({ message: 'Submission deadline has passed' });
    }

    const attachments = (req.files || []).map(f => ({
      name: f.originalname,
      url: `/uploads/submissions/${f.filename}`,
      type: path.extname(f.originalname)
    }));

    const existing = await Submission.findOne({ assignment: assignmentId, student: req.user._id });
    if (existing) {
      existing.content = content;
      existing.attachments = attachments;
      existing.isLate = isLate;
      existing.submittedAt = new Date();
      await existing.save();
      return res.json(existing);
    }

    const submission = await Submission.create({
      assignment: assignmentId, student: req.user._id, class: classId,
      content, attachments, isLate
    });
    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get submissions for an assignment (teacher)
router.get('/assignment/:assignmentId', protect, authorize('teacher', 'admin'), async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate('student', 'name email avatar').sort({ submittedAt: -1 });
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my submission for an assignment (student)
router.get('/my/:assignmentId', protect, authorize('student'), async (req, res) => {
  try {
    const submission = await Submission.findOne({
      assignment: req.params.assignmentId, student: req.user._id
    });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Grade submission (teacher)
router.put('/:id/grade', protect, authorize('teacher'), async (req, res) => {
  try {
    const { marks, feedback } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { marks, feedback, status: 'graded' },
      { new: true }
    ).populate('student', 'name email');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all my submissions (student)
router.get('/my-all/list', protect, authorize('student'), async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate('assignment', 'title dueDate totalMarks').populate('class', 'name subject');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
