const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');
const path = require('path');

// Upload material (teacher)
router.post('/', protect, authorize('teacher'), (req, res, next) => {
  req.uploadFolder = 'materials';
  next();
}, upload.array('files', 10), async (req, res) => {
  try {
    const { title, description, classId, topic, type, link } = req.body;
    const files = (req.files || []).map(f => ({
      name: f.originalname,
      url: `/uploads/materials/${f.filename}`,
      type: path.extname(f.originalname),
      size: f.size
    }));
    const material = await Material.create({
      title, description, class: classId, uploadedBy: req.user._id,
      topic, type, link, files
    });
    const populated = await Material.findById(material._id).populate('uploadedBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get materials for a class
router.get('/class/:classId', protect, async (req, res) => {
  try {
    const materials = await Material.find({ class: req.params.classId })
      .populate('uploadedBy', 'name avatar').sort({ createdAt: -1 });
    res.json(materials);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete material (teacher)
router.delete('/:id', protect, authorize('teacher'), async (req, res) => {
  try {
    await Material.findOneAndDelete({ _id: req.params.id, uploadedBy: req.user._id });
    res.json({ message: 'Material deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
