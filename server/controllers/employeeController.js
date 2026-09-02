const User = require('../models/User');

exports.getEmployees = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { role: 'employee', isVerified: true };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escaped, 'i');
      query.$or = [{ name: searchRegex }, { employeeId: searchRegex }];
    }
    const employees = await User.find(query).select('-password');
    res.json(employees);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.getEmployeeStats = async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'employee', isVerified: true });
    const departments = await User.aggregate([
      { $match: { role: 'employee', isVerified: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);
    res.json({ totalEmployees, departments });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
