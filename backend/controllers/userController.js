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
// @access  Private/HOD
exports.getFaculty = async (req, res) => {
    try {
        const faculty = await User.find({ role: 'faculty' }).select('-password');
        res.json(faculty);
    } catch (error) {
        console.error(error);
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