
const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    Send a notification to a user
// @route   Not directly exposed as an API endpoint
// @access  Internal function
const sendNotification = asyncHandler(async (recipientId, title, message, type = 'info', link = '') => {
  await Notification.create({
    recipient: recipientId,
    title,
    message,
    type,
    link,
    read: false
  });
});

// @desc    Get notifications for the current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json(notifications);
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (notification.recipient.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this notification');
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({ id: notification._id, read: notification.read });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (notification.recipient.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to delete this notification');
  }

  await Notification.deleteOne({ _id: req.params.id });

  res.status(200).json({ id: req.params.id });
});

module.exports = {
  sendNotification,
  getNotifications,
  markAsRead,
  deleteNotification
}; 