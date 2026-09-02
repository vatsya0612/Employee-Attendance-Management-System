const Notification = require('../models/Notification');

exports.getMyNotifications = async (req, res) => {
  try {
    const userRole = req.user.role; // 'employee' or 'hr'
    const userId = req.user.id;

    // Fetch personal notifications, broadcast notifications to ALL, or role-specific broadcasts
    const notifications = await Notification.find({
      $or: [
        { recipient: userId }, // specific to this user
        { recipientRole: 'all' }, // broadcast to everyone
        { recipientRole: userRole } // broadcast to this user's role (e.g. all HRs)
      ]
    }).sort({ createdAt: -1 }).limit(50);

    // Add a virtual 'read' flag if the user's ID is in the readBy array (for broadcast logic)
    const processedNotifications = notifications.map(notif => {
      const obj = notif.toObject();
      obj.isRead = notif.recipient ? notif.isRead : notif.readBy.includes(userId);
      return obj;
    });

    res.json(processedNotifications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ msg: 'Notification not found' });

    if (notification.recipient) {
      // It's a personal notification
      if (notification.recipient.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }
      notification.isRead = true;
    } else {
      // It's a broadcast, add to readBy array
      if (!notification.readBy.includes(req.user.id)) {
        notification.readBy.push(req.user.id);
      }
    }
    
    await notification.save();
    res.json({ msg: 'Marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// HR ONLY: Send announcement or personal message
exports.sendNotification = async (req, res) => {
  try {
    if (req.user.role !== 'hr') {
      return res.status(403).json({ msg: 'Only HR can send notifications manually' });
    }

    const { recipient, title, message, type } = req.body;
    // recipient could be 'all', 'employee', or a specific user ID

    let newNotification = new Notification({
      sender: req.user.id,
      title,
      message,
      type: type || 'announcement'
    });

    if (recipient === 'all') {
      newNotification.recipientRole = 'all';
    } else if (recipient === 'employee') {
      newNotification.recipientRole = 'employee';
    } else {
      newNotification.recipient = recipient;
      newNotification.recipientRole = 'specific';
      newNotification.type = type || 'personal';
    }

    await newNotification.save();
    res.json(newNotification);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
