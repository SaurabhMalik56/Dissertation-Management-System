const User = require('../models/User');
const Project = require('../models/Project');
const mongoose = require('mongoose');

/**
 * @desc    Get all students assigned to a faculty
 * @route   GET /api/faculty/students
 * @access  Private/Faculty
 */
exports.getAssignedStudents = async (req, res) => {
    try {
        console.log('[Faculty Controller] getAssignedStudents called');
        
        // Get faculty ID from authenticated user
        const facultyId = req.user.id;
        console.log('[Faculty Controller] Faculty ID:', facultyId);

        // Find students where assignedGuide matches the faculty ID
        const students = await User.find({ 
            assignedGuide: facultyId,
            role: 'student'
        }).select('_id fullName email branch course');

        console.log('[Faculty Controller] Found students:', students.length);

        if (!students || students.length === 0) {
            console.log('[Faculty Controller] No students found for faculty ID:', facultyId);
            return res.status(404).json({ 
                success: false,
                message: 'No assigned students found for this faculty' 
            });
        }

        // Get projects for these students
        const studentIds = students.map(student => student._id);
        const projects = await Project.find({ 
            student: { $in: studentIds }
        }).select('student title status progress deadline');

        console.log('[Faculty Controller] Found projects:', projects.length);

        // Map projects to students
        const studentsWithProjects = students.map(student => {
            const studentObj = student.toObject();
            const project = projects.find(p => 
                p.student.toString() === student._id.toString()
            );
            
            if (project) {
                studentObj.project = {
                    _id: project._id,
                    title: project.title,
                    status: project.status,
                    progress: project.progress || 0,
                    deadline: project.deadline
                };
            }
            
            return studentObj;
        });

        console.log('[Faculty Controller] Returning students with projects');
        res.status(200).json(studentsWithProjects);
    } catch (error) {
        console.error('[Faculty Controller] Error in getAssignedStudents:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error getting assigned students',
            error: error.message
        });
    }
}; 