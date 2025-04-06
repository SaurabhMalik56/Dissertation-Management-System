const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

// GET /api/students/dashboard - Get student dashboard data
router.get('/dashboard', protect, studentController.getDashboard);

// GET /api/students/guide - Get student's assigned guide
router.get('/guide', protect, studentController.getGuide);

// GET /api/students/projects - Get student's projects
router.get('/projects', protect, studentController.getProjects);

// GET /api/students/meetings - Get student's meetings
router.get('/meetings', protect, studentController.getMeetings);

// GET /api/students/notifications - Get student's notifications
router.get('/notifications', protect, studentController.getNotifications);

// PATCH /api/students/notifications/:id/read - Mark notification as read
router.patch('/notifications/:id/read', protect, studentController.markNotificationAsRead);

// PATCH /api/students/notifications/all/read - Mark all notifications as read
router.patch('/notifications/all/read', protect, studentController.markAllNotificationsAsRead);

// GET /api/students/progress/:projectId - Get project progress updates
router.get('/progress/:projectId', protect, studentController.getProgressUpdates);

// GET /api/students/evaluation - Get evaluation results
router.get('/evaluation', protect, studentController.getEvaluationResults);

// GET /api/students/final-submission/:projectId - Get final submission
router.get('/final-submission/:projectId', protect, studentController.getFinalSubmission);

module.exports = router; 