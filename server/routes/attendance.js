const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/checkin', auth, roleCheck(['employee']), attendanceController.checkIn);
router.post('/checkout', auth, roleCheck(['employee']), attendanceController.checkOut);
router.get('/my', auth, roleCheck(['employee']), attendanceController.getMyAttendance);
router.get('/today', auth, roleCheck(['employee']), attendanceController.getTodayAttendance);
router.get('/all', auth, roleCheck(['hr']), attendanceController.getAllAttendance);
router.get('/stats', auth, roleCheck(['hr']), attendanceController.getStats);

module.exports = router;
