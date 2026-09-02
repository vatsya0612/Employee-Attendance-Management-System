const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All users can get their notifications and mark them as read
router.get('/', auth, notificationController.getMyNotifications);
router.put('/:id/read', auth, notificationController.markAsRead);

// Only HR can send announcements or personal messages
router.post('/send', auth, roleCheck(['hr']), notificationController.sendNotification);

module.exports = router;
