const User = require('../models/User');

// @desc    Get all users (with filtering by role and branch)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const { role, branch } = req.query;
        let query = {};

        if (role) {
            query.role = role;
        }

        if (branch) {
            query.branch = branch;
        }

        const users = await User.find(query).select('-password');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get faculty users for guide assignment
// @route   GET /api/users/faculty
// @access  Private/HOD,Admin
exports.getFaculty = async (req, res) => {
    try {
        console.log('[Controller] getFaculty called by user:', req.user.fullName);
        console.log('[Controller] User role:', req.user.role);
        
        // Double-check authorization here too
        if (req.user.role !== 'hod' && req.user.role !== 'admin') {
            console.log('[Controller] Unauthorized access attempt in getFaculty controller');
            return res.status(403).json({ 
                message: 'You are not authorized to access faculty data',
                role: req.user.role,
                requiredRoles: ['hod', 'admin']
            });
        }
        
        const faculty = await User.find({ role: 'faculty' }).select('-password');
        console.log(`[Controller] Found ${faculty.length} faculty members`);
        res.json(faculty);
    } catch (error) {
        console.error('[Controller] Error in getFaculty:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get student users in a specific department
// @route   GET /api/users/students
// @access  Private/HOD & Faculty
exports.getStudents = async (req, res) => {
    try {
        const { branch } = req.query;
        const query = { role: 'student' };

        if (branch) {
            query.branch = branch;
        }

        const students = await User.find(query).select('-password');
        res.json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get a user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const { fullName, email, role, branch, course } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If changing email, check if it's already taken
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Update user fields
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (role) user.role = role;
        if (branch) user.branch = branch;
        if (course) user.course = course;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            role: updatedUser.role,
            branch: updatedUser.branch,
            course: updatedUser.course
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.deleteOne();
        
        res.json({ message: 'User removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Assign a guide to a student
// @route   PUT /api/users/:studentId/assign-guide/:guideId
// @access  Private/HOD
exports.assignGuide = async (req, res) => {
    try {
        const { studentId, guideId } = req.params;

        // Find the student
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Find the guide
        const guide = await User.findById(guideId);
        if (!guide || guide.role !== 'faculty') {
            return res.status(404).json({ message: 'Faculty guide not found' });
        }

        // Assign guide to student
        student.assignedGuide = guideId;
        await student.save();

        // Add student to guide's assigned students
        if (!guide.assignedStudents.includes(studentId)) {
            guide.assignedStudents.push(studentId);
            await guide.save();
        }

        res.json({ message: 'Guide assigned successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user's own profile
// @route   PUT /api/users/profile
// @access  Private (all authenticated users)
exports.updateProfile = async (req, res) => {
    try {
        const { fullName, email, department, phone } = req.body;
        const userId = req.user.id;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If changing email, check if it's already taken
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Update user fields
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (department) user.department = department;
        if (phone) user.phone = phone;

        const updatedUser = await user.save();

        // Create response object with token
        const response = {
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            role: updatedUser.role,
            department: updatedUser.department,
            phone: updatedUser.phone,
            token: req.user.token // Make sure the token is included
        };

        res.json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update student's guide (for HOD dashboard)
// @route   PUT /api/users/students/:id/guide
// @access  Private/HOD
exports.updateStudentGuide = async (req, res) => {
    try {
        console.log(`[Controller] updateStudentGuide called for student: ${req.params.id}`);
        console.log(`[Controller] Guide ID from request body: ${req.body.guideId}`);
        
        // Validate required parameters
        const studentId = req.params.id;
        const { guideId } = req.body;
        
        if (!guideId) {
            return res.status(400).json({ message: 'Guide ID is required in the request body' });
        }
        
        // Find the student by ID and ensure they have a student role
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            console.log(`[Controller] Student not found or not a student role: ${studentId}`);
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // Find the guide by ID and ensure they have a faculty role
        const guide = await User.findById(guideId);
        if (!guide || guide.role !== 'faculty') {
            console.log(`[Controller] Guide not found or not a faculty role: ${guideId}`);
            return res.status(404).json({ message: 'Faculty guide not found' });
        }
        
        // Store the previous guide ID for reference (to update their assignedStudents list)
        const previousGuideId = student.assignedGuide;
        console.log(`[Controller] Previous guide ID: ${previousGuideId}, New guide ID: ${guideId}`);
        
        // Update the student document with the new guide ID
        student.assignedGuide = guideId;
        await student.save();
        console.log(`[Controller] Updated student's assignedGuide to ${guideId}`);
        
        // Add the student to the new guide's assignedStudents array if not already present
        if (!guide.assignedStudents.includes(studentId)) {
            guide.assignedStudents.push(studentId);
            await guide.save();
            console.log(`[Controller] Student ${studentId} added to guide ${guideId}'s assignedStudents array`);
        }
        
        // If there was a previous guide different from the new one, remove the student from their list
        if (previousGuideId && previousGuideId.toString() !== guideId) {
            const previousGuide = await User.findById(previousGuideId);
            if (previousGuide) {
                console.log(`[Controller] Removing student ${studentId} from previous guide ${previousGuideId}'s assignedStudents array`);
                previousGuide.assignedStudents = previousGuide.assignedStudents
                    .filter(id => id.toString() !== studentId);
                await previousGuide.save();
                console.log(`[Controller] Student ${studentId} removed from previous guide ${previousGuideId}'s assignedStudents array`);
            } else {
                console.log(`[Controller] Previous guide ${previousGuideId} not found, skipping removal`);
            }
        }
        
        // Find any projects associated with this student and update their guide as well
        try {
            // Use the Project model to update the student's projects
            const Project = require('../models/Project');
            const studentProjects = await Project.find({ student: studentId });
            
            if (studentProjects.length > 0) {
                console.log(`[Controller] Found ${studentProjects.length} projects for student ${studentId}`);
                
                for (const project of studentProjects) {
                    project.guide = guideId;
                    project.lastUpdated = Date.now();
                    await project.save();
                    console.log(`[Controller] Updated guide for project ${project._id}`);
                }
            }
        } catch (projectError) {
            console.error('[Controller] Error updating projects:', projectError);
            // Continue even if project update fails
        }
        
        // Send notification to the student about the guide assignment
        try {
            const { sendNotification } = require('./notificationController');
            await sendNotification(
                studentId,
                'Guide Assigned',
                `${guide.fullName || guide.name} has been assigned as your guide.`,
                'guide',
                'guide'
            );
            console.log(`[Controller] Notification sent to student ${studentId}`);
        } catch (notificationError) {
            console.error('[Controller] Error sending notification:', notificationError);
            // Continue even if notification fails
        }
        
        console.log(`[Controller] Guide successfully updated for student ${studentId}`);
        // Return a success response with the updated student information
        res.status(200).json({
            success: true,
            message: 'Guide assigned successfully',
            student: {
                _id: student._id,
                fullName: student.fullName,
                email: student.email,
                assignedGuide: student.assignedGuide
            }
        });
    } catch (error) {
        console.error('[Controller] Error in updateStudentGuide:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
}; 