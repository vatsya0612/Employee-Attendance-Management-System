const Attendance = require('../models/Attendance');
const User = require('../models/User');

exports.checkIn = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ msg: 'Latitude and longitude required' });
    }
    const { officeLat, officeLng, officeRadiusMeters } = require('../config/officeLocation');
    const { distanceMeters } = require('../utils/distance');
    const dist = distanceMeters(latitude, longitude, officeLat, officeLng);
    if (dist > officeRadiusMeters) {
      return res.status(400).json({ msg: 'You are outside office premises', outside: true });
    }
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Check-in allowed only between 10:00 AM and 10:30 AM
    if (hours < 10 || (hours === 10 && minutes > 30) || hours > 10) {
      return res.status(400).json({ msg: 'Check-in is only allowed between 10:00 AM and 10:30 AM.' });
    }

    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    let attendance = await Attendance.findOne({
      employee: req.user.id,
      date: { $gte: startOfDay, $lt: endOfDay }
    });

    if (attendance && attendance.checkIn) {
      return res.status(400).json({ msg: 'Already checked in today' });
    }

    const checkInTime = new Date();
    const status = 'present';

    attendance = new Attendance({
      employee: req.user.id,
      date: startOfDay,
      checkIn: checkInTime,
      status,
      location: { type: 'Point', coordinates: [longitude, latitude] }
    });
    await attendance.save();

    // Create Notification for HR
    const Notification = require('../models/Notification');
    await Notification.create({
      recipientRole: 'hr',
      type: 'check_in',
      title: 'Employee Checked In',
      message: `${req.user.name || 'An employee'} has checked in at ${checkInTime.toLocaleTimeString()}.`,
      sender: req.user.id
    });

    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.checkOut = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    let attendance = await Attendance.findOne({
      employee: req.user.id,
      date: { $gte: startOfDay, $lt: endOfDay }
    });
    
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ msg: 'Have not checked in today' });
    }
    if (attendance.checkOut) {
      return res.status(400).json({ msg: 'Already checked out today' });
    }
    
    attendance.checkOut = now;
    const diff = Math.abs(attendance.checkOut - attendance.checkIn);
    attendance.workingHours = diff / (1000 * 60 * 60);
    
    await attendance.save();

    // Create Notification for HR
    const Notification = require('../models/Notification');
    await Notification.create({
      recipientRole: 'hr',
      type: 'check_out',
      title: 'Employee Checked Out',
      message: `${req.user.name || 'An employee'} has checked out at ${now.toLocaleTimeString()}. Working hours: ${Math.floor(attendance.workingHours)}h ${Math.floor((attendance.workingHours % 1) * 60)}m.`,
      sender: req.user.id
    });

    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { employee: req.user.id };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const attendance = await Attendance.find(query).sort({ date: -1 });
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    const attendance = await Attendance.findOne({
      employee: req.user.id,
      date: { $gte: startOfDay, $lt: endOfDay }
    });
    res.json(attendance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getAllAttendance = async (req, res) => {
  try {
    const { date, status, search } = req.query;
    let query = {};
    if (date) {
      const parsedDate = new Date(date);
      const endOfDay = new Date(parsedDate);
      endOfDay.setDate(endOfDay.getDate() + 1);
      query.date = { $gte: parsedDate, $lt: endOfDay };
    }
    if (status) query.status = status;
    
    let attendances = await Attendance.find(query).populate('employee', 'name employeeId department position role isVerified').sort({ date: -1 });
    
    // Filter out HR users and unverified users
    attendances = attendances.filter(a => a.employee && a.employee.role === 'employee' && a.employee.isVerified);

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      attendances = attendances.filter(a => 
        a.employee && (searchRegex.test(a.employee.name) || searchRegex.test(a.employee.employeeId))
      );
    }
    res.json(attendances);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    const totalEmployees = await User.countDocuments({ role: 'employee', isVerified: true });
    const attendances = await Attendance.find({ date: { $gte: startOfDay, $lt: endOfDay } }).populate('employee', 'role isVerified');
    
    let presentToday = 0, lateToday = 0, absentToday = 0;
    attendances.forEach(a => {
      if (a.employee && a.employee.role === 'employee' && a.employee.isVerified) {
        if (a.status === 'present') presentToday++;
        else if (a.status === 'late') lateToday++;
      }
    });
    absentToday = Math.max(0, totalEmployees - presentToday - lateToday);
    
    res.json({ total: totalEmployees, present: presentToday, late: lateToday, absent: absentToday });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
