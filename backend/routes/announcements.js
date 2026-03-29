const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const Class = require('../models/Class');
const { protect, authorize } = require('../middleware/auth');

// Create announcement
router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const { classId, content, attachments } = req.body;
    const cls = await Class.findOne({ _id: classId, teacher: req.user._id });
    if (!cls) return res.status(403).json({ message: 'Not authorized' });

    const announcement = await Announcement.create({
      class: classId, author: req.user._id, content, attachments: attachments || []
    });
    await Class.findByIdAndUpdate(classId, { $push: { announcements: announcement._id } });
    const populated = await Announcement.findById(announcement._id).populate('author', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get announcements for a class
router.get('/class/:classId', protect, async (req, res) => {
  try {
    const announcements = await Announcement.find({ class: req.params.classId })
      .populate('author', 'name avatar')
      .populate('comments.author', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add comment
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { author: req.user._id, content } } },
      { new: true }
    ).populate('comments.author', 'name avatar').populate('author', 'name avatar');
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete announcement (teacher)
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    const ann = await Announcement.findOneAndDelete({ _id: req.params.id, author: req.user._id });
    if (ann) await Class.findByIdAndUpdate(ann.class, { $pull: { announcements: ann._id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
