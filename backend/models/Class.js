const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  subject: { type: String, required: true },
  section: { type: String, default: '' },
  classCode: { type: String, unique: true, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  coverColor: { type: String, default: '#4F46E5' },
  isArchived: { type: Boolean, default: false },
  announcements: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Announcement' }]
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
