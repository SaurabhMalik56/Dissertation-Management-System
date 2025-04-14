const express = require('express');
const { 
    createMeeting, 
    getMeetings, 
    getMeetingById, 
    updateMeetingStatus, 
    updateStudentPoints,
    getDepartmentMeetings
} = require('../controllers/meetingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Routes accessible to all authenticated users
router.route('/')
    .post(authorize('faculty'), createMeeting)
    .get(getMeetings);

router.route('/:id')
    .get(getMeetingById);

// Faculty only routes
router.put('/:id/status', authorize('faculty'), updateMeetingStatus);

// Student only routes
router.put('/:id/student-points', authorize('student'), updateStudentPoints);

// HOD only routes
router.get('/department', authorize('hod'), getDepartmentMeetings);

module.exports = router; 