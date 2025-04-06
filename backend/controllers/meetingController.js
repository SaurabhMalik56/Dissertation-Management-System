const Meeting = require('../models/Meeting');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Create or schedule a meeting
// @route   POST /api/meetings
// @access  Private/Faculty
exports.createMeeting = async (req, res) => {
    try {
        const { 
            projectId, 
            studentId, 
            scheduledDate, 
            meetingNumber, 
            notes 
        } = req.body;

        // Validate meeting number
        if (meetingNumber < 1 || meetingNumber > 4) {
            return res.status(400).json({ 
                message: 'Meeting number must be between 1 and 4' 
            });
        }

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check if faculty is assigned to this project
        if (project.assignedGuide.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'You are not authorized to schedule meetings for this project' 
            });
        }

        // Check if student exists
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Check if meeting already exists for this project and meeting number
        const existingMeeting = await Meeting.findOne({
            project: projectId,
            meetingNumber
        });

        if (existingMeeting) {
            // Update existing meeting instead of creating a new one
            existingMeeting.scheduledDate = scheduledDate;
            existingMeeting.status = 'scheduled';
            existingMeeting.notes = notes || existingMeeting.notes;
            
            await existingMeeting.save();
            
            return res.json({
                message: 'Meeting rescheduled',
                meeting: existingMeeting
            });
        }

        // Create new meeting
        const meeting = await Meeting.create({
            project: projectId,
            student: studentId,
            guide: req.user._id,
            scheduledDate,
            meetingNumber,
            notes
        });

        res.status(201).json(meeting);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all meetings
// @route   GET /api/meetings
// @access  Private
exports.getMeetings = async (req, res) => {
    try {
        const { projectId } = req.query;
        let query = {};

        // Filter by project if provided
        if (projectId) {
            query.project = projectId;
        }

        // Role-based filtering
        if (req.user.role === 'student') {
            // Students can only see their own meetings
            query.student = req.user._id;
        } else if (req.user.role === 'faculty') {
            // Faculty can see meetings where they are the guide
            query.guide = req.user._id;
        }
        // HOD and Admin can see all meetings (with proper filtering)

        const meetings = await Meeting.find(query)
            .populate('project', 'title')
            .populate('student', 'fullName email')
            .populate('guide', 'fullName email')
            .sort({ scheduledDate: 1 });

        res.json(meetings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get meeting by ID
// @route   GET /api/meetings/:id
// @access  Private
exports.getMeetingById = async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.id)
            .populate('project', 'title')
            .populate('student', 'fullName email')
            .populate('guide', 'fullName email');

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Check access rights
        if (req.user.role === 'student' && 
            meeting.student._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'Not authorized to access this meeting' 
            });
        }

        if (req.user.role === 'faculty' && 
            meeting.guide._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'Not authorized to access this meeting' 
            });
        }

        res.json(meeting);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update meeting status
// @route   PUT /api/meetings/:id/status
// @access  Private/Faculty
exports.updateMeetingStatus = async (req, res) => {
    try {
        const { status, feedback } = req.body;

        const meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Check if faculty is the guide for this meeting
        if (meeting.guide.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'You are not authorized to update this meeting' 
            });
        }

        // Update status and feedback
        meeting.status = status;
        if (feedback) {
            meeting.feedback = feedback;
        }

        await meeting.save();

        res.json({ message: `Meeting marked as ${status}`, meeting });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add tasks to meeting
// @route   PUT /api/meetings/:id/tasks
// @access  Private/Faculty
exports.addMeetingTasks = async (req, res) => {
    try {
        const { tasks } = req.body;

        const meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Check if faculty is the guide for this meeting
        if (meeting.guide.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'You are not authorized to add tasks to this meeting' 
            });
        }

        // Add tasks to meeting
        meeting.tasks = tasks;
        await meeting.save();

        res.json({ message: 'Tasks added to meeting', meeting });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update task status
// @route   PUT /api/meetings/:id/tasks/:taskId
// @access  Private/Faculty
exports.updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Check if faculty is the guide for this meeting
        if (meeting.guide.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'You are not authorized to update tasks for this meeting' 
            });
        }

        // Find and update the task
        const task = meeting.tasks.id(req.params.taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.status = status;
        await meeting.save();

        res.json({ message: 'Task status updated', meeting });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get meetings for a department (HOD view)
// @route   GET /api/meetings/department
// @access  Private/HOD
exports.getDepartmentMeetings = async (req, res) => {
    try {
        // Only HODs can access this route
        if (req.user.role !== 'hod') {
            return res.status(403).json({ 
                message: 'Not authorized to access department meetings' 
            });
        }

        const hodDepartment = req.user.department || req.user.branch;
        
        if (!hodDepartment) {
            return res.status(400).json({ 
                message: 'Department information missing from your profile' 
            });
        }

        // Find faculty in the HOD's department
        const facultyInDepartment = await User.find({ 
            role: 'faculty',
            $or: [
                { department: hodDepartment },
                { branch: hodDepartment }
            ]
        }).select('_id');

        const facultyIds = facultyInDepartment.map(faculty => faculty._id);

        // Get meetings where the guide is from the HOD's department
        const meetings = await Meeting.find({ 
            guide: { $in: facultyIds }
        })
        .populate('student', 'fullName email')
        .populate('guide', 'fullName email')
        .populate('project', 'title')
        .sort({ scheduledDate: -1 });

        res.json(meetings);
    } catch (error) {
        console.error('Error fetching department meetings:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
}; 