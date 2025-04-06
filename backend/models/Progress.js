const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
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
    description: {
        type: String,
        required: true
    },
    completionPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    challenges: {
        type: String
    },
    nextSteps: {
        type: String
    }
}, {
    timestamps: true
});

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress; 