const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, required: true },
  totalMarks: { type: Number, default: 100 },
  attachments: [{ name: String, url: String, type: { type: String } }],
  allowLateSubmission: { type: Boolean, default: false },
  instructions: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
