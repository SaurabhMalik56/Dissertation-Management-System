const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    technologies: {
        type: [String],
        required: true
    },
    problemStatement: {
        type: String,
        required: true
    },
    expectedOutcome: {
        type: String,
        required: true
    },
    guidePreference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    guide: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    hodAssigned: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    feedback: {
        type: String
    },
    department: {
        type: String,
        required: true
    },
    panelMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    progress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, {
    timestamps: true
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project; 