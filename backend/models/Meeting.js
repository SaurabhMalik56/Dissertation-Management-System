const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
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
    guide: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
        default: 'scheduled'
    },
    meetingNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 4
    },
    notes: {
        type: String
    },
    feedback: {
        type: String
    },
    tasks: [{
        description: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'completed'],
            default: 'pending'
        }
    }]
}, {
    timestamps: true
});

const Meeting = mongoose.model('Meeting', meetingSchema);

module.exports = Meeting; 