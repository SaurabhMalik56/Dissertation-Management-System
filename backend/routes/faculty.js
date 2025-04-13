const express = require('express');
const router = express.Router();
const { getAssignedStudents } = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/auth');

// Fetch all students assigned to a faculty
// GET /api/faculty/students
router.get('/students', protect, authorize('faculty'), getAssignedStudents);

module.exports = router; 