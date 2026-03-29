const express = require('express');
const router = express.Router();
const LiveClass = require('../models/LiveClass');
const Class = require('../models/Class');
const { protect, authorize } = require('../middleware/auth');
const crypto = require('crypto');

// Schedule/Start a live class
router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const { title, description, classId } = req.body;
    
    // Check if class exists
    const classObj = await Class.findById(classId);
    if (!classObj) return res.status(404).json({ message: 'Class not found' });
    
    const roomName = `eduspace-${classId}-${crypto.randomBytes(4).toString('hex')}`;
    
    const liveClass = await LiveClass.create({
      title,
      description,
      class: classId,
      teacher: req.user._id,
      roomName,
      isActive: true
    });
    
    res.status(201).json(liveClass);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get active or all live classes for a specific class
router.get('/class/:classId', protect, async (req, res) => {
  try {
    const liveClasses = await LiveClass.find({ class: req.params.classId })
      .populate('teacher', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(liveClasses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single live class by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id)
      .populate('teacher', 'name avatar')
      .populate('class', 'name');
    if (!liveClass) return res.status(404).json({ message: 'Live class not found' });
    res.json(liveClass);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// End a live class
router.put('/:id/end', protect, authorize('teacher'), async (req, res) => {
  try {
    const liveClass = await LiveClass.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      { isActive: false, endedAt: new Date() },
      { new: true }
    );
    if (!liveClass) return res.status(404).json({ message: 'Live class not found or unauthorized' });
    res.json(liveClass);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
