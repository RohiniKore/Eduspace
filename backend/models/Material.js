const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  files: [{ name: String, url: String, type: { type: String }, size: Number }],
  topic: { type: String, default: 'General' },
  type: { type: String, enum: ['document', 'video', 'link', 'other'], default: 'document' },
  link: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
