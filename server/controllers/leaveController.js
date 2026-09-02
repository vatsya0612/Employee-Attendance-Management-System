const Leave = require('../models/Leave');
const User = require('../models/User');

exports.createLeave = async (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  try {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);
    
    if (eDate < sDate) {
      return res.status(400).json({ msg: 'End date must be after start date' });
    }
    
    const diffTime = eDate - sDate;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    if (user.leaveBalance < days) {
      return res.status(400).json({ msg: 'Insufficient leave balance' });
    }
    
    const leave = new Leave({
      employee: req.user.id,
      leaveType: leaveType.toLowerCase(),
      startDate: sDate,
      endDate: eDate,
      days,
      reason
    });
    await leave.save();

    // Create Notification for HR
    const Notification = require('../models/Notification');
    await Notification.create({
      recipientRole: 'hr',
      type: 'leave_request',
      title: 'New Leave Request',
      message: `${user.name} has requested leave from ${sDate.toLocaleDateString()} to ${eDate.toLocaleDateString()}.`,
      sender: req.user.id
    });

    res.json(leave);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user.id }).sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getAllLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;
    let leaves = await Leave.find(query).populate('employee', 'name employeeId department leaveBalance role').sort({ createdAt: -1 });
    leaves = leaves.filter(l => l.employee && l.employee.role === 'employee');
    res.json(leaves);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.approveLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate('employee');
    if (!leave) return res.status(404).json({ msg: 'Leave not found' });
    if (leave.status !== 'pending') return res.status(400).json({ msg: 'Leave is already processed' });
    
    leave.status = 'approved';
    await User.findByIdAndUpdate(leave.employee._id, { $inc: { leaveBalance: -leave.days } });
    
    await leave.save();

    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: leave.employee._id,
      recipientRole: 'specific',
      type: 'leave_approved',
      title: 'Leave Request Approved',
      message: `Your leave request for ${leave.days} day(s) has been approved.`,
      sender: req.user.id
    });

    res.json(leave);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.rejectLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ msg: 'Leave not found' });
    if (leave.status !== 'pending') return res.status(400).json({ msg: 'Leave is already processed' });
    
    leave.status = 'rejected';
    await leave.save();

    const Notification = require('../models/Notification');
    await Notification.create({
      recipient: leave.employee._id,
      recipientRole: 'specific',
      type: 'leave_rejected',
      title: 'Leave Request Rejected',
      message: `Your leave request for ${leave.days} day(s) has been rejected.`,
      sender: req.user.id
    });

    res.json(leave);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
