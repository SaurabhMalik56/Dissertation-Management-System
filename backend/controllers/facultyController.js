const User = require('../models/User');
const Project = require('../models/Project');
const mongoose = require('mongoose');
const Evaluation = require('../models/Evaluation');

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

/**
 * @desc    Get student evaluations for a faculty
 * @route   GET /api/faculty/evaluations/:studentId
 * @access  Private/Faculty
 */
exports.getStudentEvaluations = async (req, res) => {
    try {
        console.log('[Faculty Controller] getStudentEvaluations called');
        
        // Get faculty ID from authenticated user
        const facultyId = req.user.id;
        const { studentId } = req.params;
        
        console.log(`[Faculty Controller] Getting evaluations for student ID: ${studentId}`);

        // Validate that the student is assigned to this faculty
        const student = await User.findOne({
            _id: studentId,
            assignedGuide: facultyId,
            role: 'student'
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found or not assigned to this faculty'
            });
        }

        // Get the project for this student
        const project = await Project.findOne({ student: studentId });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'No project found for this student'
            });
        }

        // Get evaluations for this student
        const evaluations = await Evaluation.find({ 
            student: studentId,
            evaluator: facultyId
        }).sort({ createdAt: -1 });

        // Return with project details
        res.status(200).json({
            success: true,
            evaluations,
            student: {
                _id: student._id,
                name: student.fullName,
                email: student.email
            },
            project: {
                _id: project._id,
                title: project.title
            }
        });
    } catch (error) {
        console.error('[Faculty Controller] Error in getStudentEvaluations:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error getting student evaluations',
            error: error.message
        });
    }
};

/**
 * @desc    Create or update an evaluation for a student
 * @route   POST /api/faculty/evaluations/:studentId
 * @access  Private/Faculty
 */
exports.createEvaluation = async (req, res) => {
    try {
        console.log('[Faculty Controller] createEvaluation called');
        
        // Get faculty ID from authenticated user
        const facultyId = req.user.id;
        const { studentId } = req.params;
        
        console.log(`[Faculty Controller] Creating evaluation for student ID: ${studentId}`);

        // Validate that the student is assigned to this faculty
        const student = await User.findOne({
            _id: studentId,
            assignedGuide: facultyId,
            role: 'student'
        });

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found or not assigned to this faculty'
            });
        }

        // Get the project for this student
        const project = await Project.findOne({ student: studentId });

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'No project found for this student'
            });
        }

        // Extract evaluation data from request body
        const {
            evaluationType,
            presentationScore,
            contentScore,
            researchScore,
            innovationScore,
            implementationScore,
            comments
        } = req.body;

        // Calculate overall grade based on average score
        const totalScore = (
            Number(presentationScore || 0) +
            Number(contentScore || 0) +
            Number(researchScore || 0) +
            Number(innovationScore || 0) +
            Number(implementationScore || 0)
        ) / 5;

        let overallGrade = 'F';
        if (totalScore >= 90) overallGrade = 'A';
        else if (totalScore >= 80) overallGrade = 'B';
        else if (totalScore >= 70) overallGrade = 'C';
        else if (totalScore >= 60) overallGrade = 'D';

        // Check if an evaluation of this type already exists
        let evaluation = await Evaluation.findOne({
            student: studentId,
            evaluator: facultyId,
            evaluationType
        });

        if (evaluation) {
            // Update existing evaluation
            evaluation.presentationScore = presentationScore;
            evaluation.contentScore = contentScore;
            evaluation.researchScore = researchScore;
            evaluation.innovationScore = innovationScore;
            evaluation.implementationScore = implementationScore;
            evaluation.comments = comments;
            evaluation.overallGrade = overallGrade;
            await evaluation.save();

            console.log(`[Faculty Controller] Updated existing evaluation ID: ${evaluation._id}`);
        } else {
            // Create new evaluation
            evaluation = await Evaluation.create({
                project: project._id,
                student: studentId,
                evaluator: facultyId,
                evaluationType,
                presentationScore,
                contentScore,
                researchScore,
                innovationScore,
                implementationScore,
                comments,
                overallGrade
            });

            console.log(`[Faculty Controller] Created new evaluation ID: ${evaluation._id}`);
        }

        // Populate evaluation with needed references
        await evaluation.populate('evaluator', 'name email department');
        await evaluation.populate('project', 'title');

        res.status(201).json({
            success: true,
            evaluation
        });
    } catch (error) {
        console.error('[Faculty Controller] Error in createEvaluation:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error creating evaluation',
            error: error.message
        });
    }
}; 