const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

/**
 * @desc    Update the authenticated user's profile (name, bio, preferences)
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, theme, dailyGoal } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.notFound('User not found');

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (theme !== undefined) user.preferences.theme = theme;
  if (dailyGoal !== undefined) user.preferences.dailyGoal = dailyGoal;

  await user.save();

  new ApiResponse(200, { user: user.toSafeObject() }, 'Profile updated successfully').send(res);
});

/**
 * @desc    Upload/replace the authenticated user's avatar image
 * @route   PUT /api/users/avatar
 * @access  Private
 */
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No image file provided');
  }

  const user = await User.findById(req.user._id);

  // Remove the previous avatar from Cloudinary if one exists
  if (user.avatar?.publicId) {
    await cloudinary.uploader.destroy(user.avatar.publicId).catch(() => null);
  }

  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'flashcard-app/avatars', resource_type: 'image' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(req.file.buffer);
  });

  user.avatar = { url: uploadResult.secure_url, publicId: uploadResult.public_id };
  await user.save();

  new ApiResponse(200, { user: user.toSafeObject() }, 'Avatar updated successfully').send(res);
});

module.exports = { updateProfile, updateAvatar };
