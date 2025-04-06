const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Attach token to user object for easy access in controllers
            req.user.token = token;

            next();
        } catch (error) {
            console.error('Token verification error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Create a flexible role-based access control utility
exports.allowRoles = (...roles) => {
    return (req, res, next) => {
        console.log(`[Auth] Request from user role: ${req.user?.role}, allowed roles: ${roles.join(', ')}`);
        
        if (!req.user) {
            console.log('[Auth] No user found in request');
            return res.status(401).json({
                message: 'User authentication required'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            console.log(`[Auth] Access denied - ${req.user.role} not in allowed roles: ${roles.join(', ')}`);
            return res.status(403).json({
                message: `Access denied. Your role (${req.user.role}) is not authorized for this resource. Required roles: ${roles.join(', ')}`
            });
        }
        
        console.log(`[Auth] Access granted for ${req.user.role} to ${req.method} ${req.originalUrl}`);
        next();
    };
};

// Keep the older authorize function for backward compatibility
exports.authorize = (...roles) => {
    console.log('[Auth] Using legacy authorize function');
    return exports.allowRoles(...roles);
}; 