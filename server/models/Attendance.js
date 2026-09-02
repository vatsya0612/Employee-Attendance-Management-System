const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  workingHours: { type: Number },
  status: { type: String, enum: ['present', 'late', 'absent', 'on-leave'], default: 'present' },
  location: { type: { type: String, enum: ['Point'] }, coordinates: { type: [Number] } }
});

module.exports = mongoose.model('Attendance', AttendanceSchema);
