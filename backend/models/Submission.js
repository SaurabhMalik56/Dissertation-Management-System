const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    abstract: {
        type: String,
        required: true
    },
    keywords: {
        type: [String]
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileName: {
        type: String
    },
    fileSize: {
        type: Number
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true
});

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission; 