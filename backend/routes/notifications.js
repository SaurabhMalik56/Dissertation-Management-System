const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  markAsRead, 
  deleteNotification 
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// All notification routes are protected
router.use(protect);

// GET /api/notifications - get all notifications for the current user
router.get('/', getNotifications);

// PATCH /api/notifications/:id - mark a notification as read
router.patch('/:id', markAsRead);

// DELETE /api/notifications/:id - delete a notification
router.delete('/:id', deleteNotification);

module.exports = router; 