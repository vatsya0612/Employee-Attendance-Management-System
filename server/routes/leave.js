const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.post('/', auth, roleCheck(['employee']), leaveController.createLeave);
router.get('/my', auth, roleCheck(['employee']), leaveController.getMyLeaves);
router.get('/all', auth, roleCheck(['hr']), leaveController.getAllLeaves);
router.put('/:id/approve', auth, roleCheck(['hr']), leaveController.approveLeave);
router.put('/:id/reject', auth, roleCheck(['hr']), leaveController.rejectLeave);

module.exports = router;
