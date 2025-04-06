const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['student', 'faculty', 'hod', 'admin'],
        required: true
    },
    branch: {
        type: String,
        required: function() {
            return this.role === 'student' || this.role === 'hod';
        },
        trim: true
    },
    department: {
        type: String,
        required: function() {
            return this.role === 'hod';
        },
        trim: true
    },
    course: {
        type: String,
        required: function() {
            return this.role === 'student';
        },
        trim: true
    },
    assignedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    assignedGuide: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 