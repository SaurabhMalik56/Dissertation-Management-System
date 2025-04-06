const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { fullName, email, password, role, branch, course, department } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user data object
        const userData = {
            fullName,
            email,
            password,
            role
        };

        // Add branch and course for students
        if (role === 'student') {
            userData.branch = branch;
            userData.course = course;
        }

        // Add department and branch for HOD
        if (role === 'hod') {
            if (!branch) {
                return res.status(400).json({ message: 'Department/Branch is required for HOD' });
            }
            userData.branch = branch;
            userData.department = branch; // Store branch in both fields for compatibility
        }

        // Create the user
        const user = await User.create(userData);

        if (user) {
            res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                branch: user.branch,
                course: user.course,
                department: user.department,
                token: generateToken(user._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Authenticate user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check for user email
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            branch: user.branch,
            course: user.course,
            department: user.department,
            token: generateToken(user._id)
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Register an admin (only for initial setup)
// @route   POST /api/auth/admin
// @access  Public (should be restricted in production)
exports.registerAdmin = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        // Check if admin already exists
        const adminExists = await User.findOne({ role: 'admin' });

        if (adminExists) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        // Create admin
        const admin = await User.create({
            fullName,
            email,
            password,
            role: 'admin'
        });

        if (admin) {
            res.status(201).json({
                _id: admin._id,
                fullName: admin.fullName,
                email: admin.email,
                role: admin.role,
                token: generateToken(admin._id)
            });
        } else {
            res.status(400).json({ message: 'Invalid admin data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};