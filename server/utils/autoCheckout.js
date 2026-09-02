const Attendance = require('../models/Attendance');

// Function to automatically check out employees at 7:00 PM
const autoCheckout = async () => {
  try {
    const now = new Date();
    // Only run this exact logic at 19:00 (7 PM)
    if (now.getHours() === 19 && now.getMinutes() === 0) {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      
      // Find all attendances today that are checked in but NOT checked out
      const activeAttendances = await Attendance.find({
        date: { $gte: startOfDay, $lt: endOfDay },
        checkIn: { $ne: null },
        checkOut: null
      });

      if (activeAttendances.length > 0) {
        console.log(`Auto-checking out ${activeAttendances.length} employees at 7:00 PM`);
        
        const checkOutTime = new Date();
        checkOutTime.setHours(19, 0, 0, 0); // Force it to exactly 7:00 PM

        for (let attendance of activeAttendances) {
          attendance.checkOut = checkOutTime;
          // Calculate working hours
          const diffMs = checkOutTime - new Date(attendance.checkIn);
          attendance.workingHours = diffMs / (1000 * 60 * 60);
          await attendance.save();
        }
      }
    }
  } catch (error) {
    console.error('Error during auto-checkout:', error);
  }
};

const startAutoCheckoutDaemon = () => {
  // Check every 1 minute (60000 ms)
  setInterval(autoCheckout, 60000);
  console.log('Auto-checkout daemon started (checks at 7 PM daily).');
};

module.exports = startAutoCheckoutDaemon;
