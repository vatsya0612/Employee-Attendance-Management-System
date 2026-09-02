const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/', auth, roleCheck(['hr']), employeeController.getEmployees);
router.get('/stats', auth, roleCheck(['hr']), employeeController.getEmployeeStats);

module.exports = router;
