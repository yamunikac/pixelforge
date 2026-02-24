const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  originalName: { type: String, required: true },
  originalPath: { type: String, required: true },
  processedPath: { type: String },
  originalSize: { type: Number, required: true },   // bytes
  processedSize: { type: Number },                   // bytes
  originalFormat: { type: String },
  processedFormat: { type: String },
  width: { type: Number },
  height: { type: Number },
  // Processing operations applied
  operations: {
    resize: { width: Number, height: Number },
    rotate: Number,
    format: String,
    quality: Number,
    filters: [String],
    removeBackground: Boolean,
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed'],
    default: 'uploaded',
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Image', imageSchema);
