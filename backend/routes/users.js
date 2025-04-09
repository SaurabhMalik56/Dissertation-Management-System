const express = require('express');
const { 
    getUsers, 
    getUserById, 
    updateUser, 
    deleteUser, 
    getFaculty, 
    getStudents, 
    assignGuide,
    updateProfile
} = require('../controllers/userController');
const { protect, authorize, allowRoles } = require('../middleware/auth');

const router = express.Router();

// Add logging middleware
router.use((req, res, next) => {
    console.log(`API Request: ${req.method} ${req.originalUrl}`);
    console.log('Headers:', JSON.stringify(req.headers));
    console.log('User role from token:', req.user?.role);
    next();
});

// All routes are protected
router.use(protect);

// Route for any user to update their own profile
router.put('/profile', updateProfile);

// Admin and HOD routes for listing all users
router.route('/')
    .get(allowRoles('admin', 'hod'), getUsers);

// SPECIFIC ROUTES FIRST
// -----------------------
// HOD and Admin routes - explicitly using the new allowRoles utility
router.get('/faculty', allowRoles('hod', 'admin'), getFaculty);

// Keep the fallback route just in case
router.get('/hod-faculty', (req, res) => {
    console.log('[Fallback] HOD faculty endpoint called - User role:', req.user?.role);
    if (req.user && (req.user.role === 'hod' || req.user.role === 'admin')) {
        console.log('[Fallback] Authorized - proceeding to getFaculty');
        getFaculty(req, res);
    } else {
        console.log('[Fallback] Unauthorized access attempt');
        res.status(403).json({ message: 'Unauthorized' });
    }
});

// HOD and Faculty routes
router.get('/students', allowRoles('hod', 'faculty', 'admin'), getStudents);

// PARAMETERIZED ROUTES LAST
// -------------------------
router.route('/:id')
    .get(allowRoles('admin'), getUserById)
    .put(allowRoles('admin'), updateUser)
    .delete(allowRoles('admin'), deleteUser);

router.put('/:studentId/assign-guide/:guideId', authorize('hod'), assignGuide);

module.exports = router; 