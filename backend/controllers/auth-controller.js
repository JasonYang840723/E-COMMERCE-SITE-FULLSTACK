const crypto = require('crypto');
const cloudinary = require('cloudinary');
const path = require('path');

const User = require('../models/user');
const SendEmail = require('../utils/sendEmail');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const sendToken = require('../utils/jwtToken');

// Register a user   => /api/v1/signup
const userSignUp = catchAsyncErrors(async (req, res, next) => {
  let result;
  if (!req.body.avatar) {
    result = await cloudinary.v2.uploader.upload(path.join(__dirname, '../config/default_avatar.jpg'), {
      folder: 'avatars',
      width: 150,
      crop: 'scale',
    });
  } else {
    result = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: 'avatars',
      width: 150,
      crop: 'scale',
    });
  }

  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: result.public_id,
      url: result.secure_url,
    },
  });

  sendToken(user, 201, res, req);
});

// Login User  =>  /api/v1/login
const userLogin = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // Checks if email and password is entered by user
  if (!email || !password) {
    return next(new ErrorHandler('Please enter email & password', 400));
  }

  // Finding user in database
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorHandler('Invalid Email or Password', 401));
  }

  // Checks if password is correct or not
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid Email or Password', 401));
  }

  //Get user token
  sendToken(user, 200, res, req);
});

// Logout user   =>   /api/v1/logout
const userLogout = catchAsyncErrors(async (req, res, next) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out',
  });
});

// Forgot Password   =>  /api/v1/password/forgot
const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler('User not found with this email', 404));
  }
  // Get reset token
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  // Create reset password url
  const resetUrl = `${req.protocol}://${req.get('host')}/password/reset/${resetToken}`;

  try {
    await new SendEmail(user, resetUrl).sendPasswordReset();
    res.status(200).json({
      success: true,
      message: `Email sent to: ${user.email}`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    console.log(error);
    await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(error.message, 500));
  }
});

// Reset Password   =>  /api/v1/password/reset/:token
const resetPassword = catchAsyncErrors(async (req, res, next) => {
  // Hash token in URL
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  //Get user with resetPassword token,and check token is expired or not
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
    //$gt: Date.now() means greater(latter) than right now
  });

  if (!user) {
    return next(new ErrorHandler('Password reset token is invalid or has been expired', 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler('Password does not match', 400));
  }

  // Setup new password
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res, req);
});

// Get currently logged in user details   =>   /api/v1/me
const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});

// Update / Change password   =>  /api/v1/password/update
const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');

  // Require user typing old password then we check the password
  const isMatched = await user.comparePassword(req.body.oldPassword);
  if (!isMatched) {
    return next(new ErrorHandler('Old password is incorrect'));
  }

  user.password = req.body.password;
  await user.save();

  sendToken(user, 200, res, req);
});

// Update user profile   =>   /api/v1/me/update
const updateUserProfile = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  // Update avatar
  if (req.body.avatar !== '') {
    const user = await User.findById(req.user.id);

    const image_id = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(image_id);

    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: 'avatars',
      width: 150,
      crop: 'scale',
    });

    newUserData.avatar = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });
  res.status(200).json({
    success: true,
    user,
  });
});

// Admin Routes

// Get all users   =>   /api/v1/admin/users
const getAllUsersByAdmin = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});
// Get user details   =>   /api/v1/admin/user/:id
const getUserDetailsByAdmin = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler(`User does not found with id: ${req.params.id}`));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// Update user profile by admin   =>   /api/v1/admin/user/:id
const updateUserByAdmin = catchAsyncErrors(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user,
  });
});
// Delete user   =>   /api/v1/admin/user/:id
const deleteUserByAdmin = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler(`User does not found with id: ${req.params.id}`));
  }

  // Remove avatar from cloudinary
  const image_id = user.avatar.public_id;
  await cloudinary.v2.uploader.destroy(image_id);
  await user.remove();

  res.status(200).json({
    success: true,
  });
});

exports.userSignUp = userSignUp;
exports.userLogin = userLogin;
exports.userLogout = userLogout;

exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;

exports.getUserProfile = getUserProfile;
exports.updatePassword = updatePassword;
exports.updateUserProfile = updateUserProfile;

exports.getAllUsersByAdmin = getAllUsersByAdmin;
exports.getUserDetailsByAdmin = getUserDetailsByAdmin;
exports.updateUserByAdmin = updateUserByAdmin;
exports.deleteUserByAdmin = deleteUserByAdmin;
