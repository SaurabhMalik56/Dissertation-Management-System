const Meeting = require('../models/Meeting');
const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

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
            title,
            meetingType, 
            guideNotes,
            duration
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
        if (project.guide && project.guide.toString() !== req.user._id.toString()) {
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
            projectId: projectId,
            meetingNumber: meetingNumber
        });

        if (existingMeeting) {
            // Update existing meeting instead of creating a new one
            existingMeeting.scheduledDate = scheduledDate;
            existingMeeting.status = 'scheduled';
            existingMeeting.title = title || `Meeting ${meetingNumber}`;
            existingMeeting.guideNotes = guideNotes || existingMeeting.guideNotes;
            existingMeeting.meetingType = meetingType || existingMeeting.meetingType;
            existingMeeting.duration = duration || existingMeeting.duration;
            
            await existingMeeting.save();
            
            // Create notification for student
            await Notification.create({
                recipient: studentId,
                title: 'Meeting Rescheduled',
                message: `Your meeting "${existingMeeting.title}" has been rescheduled for ${new Date(scheduledDate).toLocaleString()}`,
                type: 'meeting',
                link: `/student/meetings/${existingMeeting._id}`
            });
            
            return res.json({
                message: 'Meeting rescheduled',
                meeting: existingMeeting
            });
        }

        // Create default title if not provided
        const meetingTitle = title || `Meeting ${meetingNumber} with ${student.fullName}`;

        // Create new meeting
        const meeting = await Meeting.create({
            title: meetingTitle,
            projectId: projectId,
            studentId: studentId,
            facultyId: req.user._id,
            scheduledDate,
            meetingNumber,
            guideNotes: guideNotes || '',
            meetingType: meetingType || 'progress-review',
            duration: duration || 30,
            status: 'scheduled'
        });

        // Create notification for student
        await Notification.create({
            recipient: studentId,
            title: 'New Meeting Scheduled',
            message: `A new meeting "${meetingTitle}" has been scheduled for ${new Date(scheduledDate).toLocaleString()}`,
            type: 'meeting',
            link: `/student/meetings/${meeting._id}`
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
            query.projectId = projectId;
        }

        // Role-based filtering
        if (req.user.role === 'student') {
            // Students can only see their own meetings
            query.studentId = req.user._id;
        } else if (req.user.role === 'faculty') {
            // Faculty can see meetings where they are the guide
            query.facultyId = req.user._id;
        }
        // HOD and Admin can see all meetings (with proper filtering)

        const meetings = await Meeting.find(query)
            .populate('projectId', 'title')
            .populate('studentId', 'fullName email')
            .populate('facultyId', 'fullName email department')
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
            .populate('projectId', 'title description technologies')
            .populate('studentId', 'fullName email')
            .populate('facultyId', 'fullName email department');

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Check access rights
        if (req.user.role === 'student' && 
            meeting.studentId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'Not authorized to access this meeting' 
            });
        }

        if (req.user.role === 'faculty' && 
            meeting.facultyId._id.toString() !== req.user._id.toString()) {
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
        const { status, guideRemarks } = req.body;

        const meeting = await Meeting.findById(req.params.id);

        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }

        // Check if faculty is the guide for this meeting
        if (meeting.facultyId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'You are not authorized to update this meeting' 
            });
        }

        // Update status and feedback
        meeting.status = status;
        if (guideRemarks) {
            meeting.guideRemarks = guideRemarks;
        }

        await meeting.save();

        // Create notification for student
        await Notification.create({
            recipient: meeting.studentId,
            title: `Meeting ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: `Your meeting "${meeting.title}" has been marked as ${status}`,
            type: 'meeting',
            link: `/student/meetings/${meeting._id}`
        });

        res.json({ message: `Meeting marked as ${status}`, meeting });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update student points for a meeting
// @route   PUT /api/meetings/:id/student-points
// @access  Private/Student
exports.updateStudentPoints = async (req, res) => {
    try {
        const { studentPoints } = req.body;
        
        const meeting = await Meeting.findById(req.params.id);
        
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        
        // Check if student is authorized
        if (meeting.studentId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: 'You are not authorized to update this meeting'
            });
        }
        
        // Update student points
        meeting.studentPoints = studentPoints;
        await meeting.save();
        
        // Create notification for faculty
        await Notification.create({
            recipient: meeting.facultyId,
            title: 'Student Added Discussion Points',
            message: `${req.user.fullName} has added discussion points for meeting "${meeting.title}"`,
            type: 'meeting',
            link: `/faculty/meetings/${meeting._id}`
        });
        
        res.json({ message: 'Student points updated successfully', meeting });
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
            facultyId: { $in: facultyIds }
        })
        .populate('studentId', 'fullName email')
        .populate('facultyId', 'fullName email')
        .populate('projectId', 'title')
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