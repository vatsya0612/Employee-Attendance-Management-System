const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendVerificationEmail } = require('../utils/sendEmail');

// Generate random 6-digit numeric OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.register = async (req, res) => {
  const { name, email, password, employeeId, department, position } = req.body;
  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{6,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ msg: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character.' });
  }

  try {
    let user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user) {
      if (user.isVerified) {
        return res.status(400).json({ msg: 'An account with this email address already exists. Please sign in.' });
      }

      // If user exists but is not verified, refresh OTP and user details
      const otp = generateOTP();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

      user.name = name;
      user.password = password; // pre-save hook will hash if modified
      user.employeeId = employeeId;
      user.department = department;
      user.position = position;
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      await sendVerificationEmail(user.email, otp);
      return res.json({
        msg: 'A verification code has been sent to your email address.',
        email: user.email,
        requiresVerification: true
      });
    }

    // Check unique employeeId
    const existingEmp = await User.findOne({ employeeId });
    if (existingEmp) {
      return res.status(400).json({ msg: 'Employee ID is already in use.' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user = new User({
      name,
      email: email.toLowerCase().trim(),
      password,
      employeeId,
      department,
      position,
      isVerified: false,
      otp,
      otpExpires
    });

    await user.save();
    await sendVerificationEmail(user.email, otp);

    res.json({
      msg: 'Registration successful! Please check your email for the 6-digit verification code.',
      email: user.email,
      requiresVerification: true
    });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: err.message || 'Server error during registration' });
  }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    if (!email || !otp) {
      return res.status(400).json({ msg: 'Email and OTP code are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ msg: 'User account not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'Account is already verified. Please sign in.' });
    }

    const cleanOtp = otp.toString().trim();
    if (!user.otp || user.otp !== cleanOtp) {
      return res.status(400).json({ msg: 'Invalid verification code. Please check your email and try again.' });
    }

    if (user.otpExpires && user.otpExpires < new Date()) {
      return res.status(400).json({ msg: 'Verification code has expired. Click "Resend Code" for a new one.' });
    }

    // Mark user as verified and clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        msg: 'Gmail address verified successfully!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          department: user.department,
          position: user.position,
          leaveBalance: user.leaveBalance,
          photo: user.photo
        }
      });
    });
  } catch (err) {
    console.error('OTP Verification error:', err.message);
    res.status(500).json({ msg: 'Server error during verification' });
  }
};

exports.resendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      return res.status(400).json({ msg: 'Email address is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ msg: 'User account not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'Account is already verified. Please sign in.' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();

    await sendVerificationEmail(user.email, otp);

    res.json({ msg: 'A new 6-digit verification code has been sent to your email.' });
  } catch (err) {
    console.error('Resend OTP error:', err.message);
    res.status(500).json({ msg: 'Server error during OTP resend' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ msg: 'Please provide both email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    // Check if Gmail is verified
    if (!user.isVerified) {
      // Auto-generate & send OTP if missing or expired
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      await user.save();

      await sendVerificationEmail(user.email, otp);

      return res.status(400).json({
        msg: 'Please verify your Gmail address before logging in. A 6-digit verification code has been sent to your email.',
        requiresVerification: true,
        email: user.email
      });
    }

    const payload = { user: { id: user.id } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
          department: user.department,
          position: user.position,
          leaveBalance: user.leaveBalance,
          photo: user.photo
        }
      });
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ msg: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  const { name, photo } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (name) user.name = name;
    if (photo) user.photo = photo;

    await user.save();
    res.json({ msg: 'Profile updated successfully', user });
  } catch (err) {
    console.error('Update profile error:', err.message);
    res.status(500).json({ msg: 'Server error during profile update' });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Incorrect current password' });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ msg: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 special character.' });
    }

    user.password = newPassword;
    await user.save();
    res.json({ msg: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err.message);
    res.status(500).json({ msg: 'Server error during password change' });
  }
};
