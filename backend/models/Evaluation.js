const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
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
    evaluator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    presentationScore: {
        type: Number,
        min: 0,
        max: 100
    },
    contentScore: {
        type: Number,
        min: 0,
        max: 100
    },
    researchScore: {
        type: Number,
        min: 0,
        max: 100
    },
    innovationScore: {
        type: Number,
        min: 0,
        max: 100
    },
    implementationScore: {
        type: Number,
        min: 0,
        max: 100
    },
    comments: {
        type: String
    },
    overallGrade: {
        type: String
    },
    evaluationType: {
        type: String,
        enum: ['mid-term', 'final'],
        required: true
    }
}, {
    timestamps: true
});

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

module.exports = Evaluation; 