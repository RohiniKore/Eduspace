const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/auth');

// Mark attendance (teacher)
router.post('/', protect, authorize('teacher'), async (req, res) => {
  try {
    const { classId, date, records, topic } = req.body;
    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ class: classId, date: dateObj });
    if (attendance) {
      attendance.records = records;
      attendance.topic = topic;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        class: classId, date: dateObj, markedBy: req.user._id, records, topic
      });
    }
    const populated = await Attendance.findById(attendance._id).populate('records.student', 'name email avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get attendance for a class
router.get('/class/:classId', protect, async (req, res) => {
  try {
    const attendance = await Attendance.find({ class: req.params.classId })
      .populate('records.student', 'name email').sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get my attendance (student)
router.get('/my/:classId', protect, authorize('student'), async (req, res) => {
  try {
    const records = await Attendance.find({
      class: req.params.classId,
      'records.student': req.user._id
    }).sort({ date: -1 });

    const myAttendance = records.map(a => ({
      date: a.date,
      topic: a.topic,
      status: a.records.find(r => r.student.toString() === req.user._id.toString())?.status || 'absent'
    }));
    res.json(myAttendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get attendance for specific date
router.get('/class/:classId/date/:date', protect, authorize('teacher'), async (req, res) => {
  try {
    const date = new Date(req.params.date);
    date.setHours(0, 0, 0, 0);
    const attendance = await Attendance.findOne({ class: req.params.classId, date })
      .populate('records.student', 'name email avatar');
    res.json(attendance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
