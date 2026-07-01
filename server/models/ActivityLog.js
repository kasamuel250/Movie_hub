const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  type: { type: String, enum: ['comment', 'login', 'watch', 'message', 'register'], required: true },
  description: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
