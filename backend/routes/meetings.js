const express = require('express');
const { 
    createMeeting, 
    getMeetings, 
    getMeetingById, 
    updateMeetingStatus, 
    addMeetingTasks, 
    updateTaskStatus 
} = require('../controllers/meetingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes accessible by all roles (with role-based filtering)
router.route('/')
    .get(getMeetings)
    .post(authorize('faculty'), createMeeting);

router.route('/:id')
    .get(getMeetingById);

// Faculty only routes
router.put('/:id/status', authorize('faculty'), updateMeetingStatus);
router.put('/:id/tasks', authorize('faculty'), addMeetingTasks);
router.put('/:id/tasks/:taskId', authorize('faculty'), updateTaskStatus);

module.exports = router; 