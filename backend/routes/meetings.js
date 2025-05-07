const express = require('express');
const { 
    createMeeting, 
    getMeetings, 
    getMeetingById, 
    updateMeetingStatus, 
    updateStudentPoints,
    getDepartmentMeetings,
    getStudentMeetings
} = require('../controllers/meetingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes accessible to all authenticated users
router.route('/')
    .post(authorize('faculty'), createMeeting)
    .get(getMeetings);

// HOD only routes - MUST come before the /:id route to avoid conflicts
router.get('/department', authorize('hod'), getDepartmentMeetings);
router.get('/student/:studentId', authorize('hod'), getStudentMeetings);

// Individual meeting routes
router.route('/:id')
    .get(getMeetingById);

// Faculty only routes
router.put('/:id/status', authorize('faculty'), updateMeetingStatus);

// Student only routes
router.put('/:id/student-points', authorize('student'), updateStudentPoints);

module.exports = router; 