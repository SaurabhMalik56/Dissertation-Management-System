const express = require('express');
const { 
    getUsers, 
    getUserById, 
    updateUser, 
    deleteUser, 
    getFaculty, 
    getStudents, 
    assignGuide 
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Admin only routes
router.route('/')
    .get(authorize('admin', 'hod'), getUsers);

router.route('/:id')
    .get(authorize('admin'), getUserById)
    .put(authorize('admin'), updateUser)
    .delete(authorize('admin'), deleteUser);

// HOD routes
router.get('/faculty', authorize('hod', 'admin'), getFaculty);
router.put('/:studentId/assign-guide/:guideId', authorize('hod'), assignGuide);

// HOD and Faculty routes
router.get('/students', authorize('hod', 'faculty', 'admin'), getStudents);

module.exports = router; 