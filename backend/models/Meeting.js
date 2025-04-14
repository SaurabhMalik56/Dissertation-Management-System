const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    meetingNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 4
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'pending'],
        default: 'scheduled'
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    facultyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    studentPoints: {
        type: String,
        default: ''
    },
    meetingSummary: {
        type: String,
        default: ''
    },
    guideRemarks: {
        type: String,
        default: ''
    },
    meetingType: {
        type: String,
        enum: ['initial', 'progress-review', 'final-discussion', 'online', 'in-person'],
        default: 'progress-review'
    },
    duration: {
        type: Number,
        default: 30, // 30 minutes by default
        min: 15,
        max: 120
    }
}, {
    timestamps: true // This automatically adds createdAt and updatedAt fields
});

// Virtual property to get the student (alias for studentId)
meetingSchema.virtual('student').get(function() {
    return this.studentId;
});

// Virtual property to get the guide (alias for facultyId)
meetingSchema.virtual('guide').get(function() {
    return this.facultyId;
});

// Virtual property to get the project (alias for projectId)
meetingSchema.virtual('project').get(function() {
    return this.projectId;
});

// Index for faster queries
meetingSchema.index({ studentId: 1, facultyId: 1 });
meetingSchema.index({ projectId: 1 });
meetingSchema.index({ scheduledDate: 1 });
meetingSchema.index({ meetingNumber: 1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting; 