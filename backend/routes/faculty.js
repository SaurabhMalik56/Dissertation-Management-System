const express = require('express');
const router = express.Router();
const { protect, allowRoles } = require('../middleware/auth');
const User = require('../models/User');
const Project = require('../models/Project');
const facultyController = require('../controllers/facultyController');

// GET /api/faculty/students
// Get all students assigned to the logged-in faculty
router.get('/students', protect, allowRoles('faculty'), async (req, res) => {
    try {
        console.log('[Faculty API] Getting students for faculty ID:', req.user.id);
        
        // Find students where this faculty is assigned as guide
        const students = await User.find({
            assignedGuide: req.user.id,
            role: 'student'
        }).select('_id fullName email branch course');
        
        console.log('[Faculty API] Found students:', students.length);
        
        if (!students || students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No students assigned to this faculty'
            });
        }
        
        // Get projects for the students
        const studentIds = students.map(student => student._id);
        const projects = await Project.find({
            student: { $in: studentIds }
        }).select('student title status');
        
        console.log('[Faculty API] Found projects:', projects.length);
        
        // Combine student and project data
        const studentsWithProjects = students.map(student => {
            const studentObj = student.toObject();
            const project = projects.find(p => 
                p.student.toString() === student._id.toString()
            );
            
            if (project) {
                studentObj.project = {
                    _id: project._id,
                    title: project.title,
                    status: project.status
                };
            }
            
            return studentObj;
        });
        
        res.status(200).json(studentsWithProjects);
    } catch (error) {
        console.error('[Faculty API] Error getting assigned students:', error);
        res.status(500).json({
            success: false,
            message: 'Server error getting assigned students',
            error: error.message
        });
    }
});

// GET /api/faculty/evaluations/:studentId
// Get evaluations for a specific student
router.get('/evaluations/:studentId', protect, allowRoles('faculty'), facultyController.getStudentEvaluations);

// POST /api/faculty/evaluations/:studentId
// Create/update an evaluation for a student
router.post('/evaluations/:studentId', protect, allowRoles('faculty'), facultyController.createEvaluation);

module.exports = router; 