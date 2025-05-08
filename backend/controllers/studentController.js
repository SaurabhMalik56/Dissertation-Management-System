const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Project = require('../models/Project');
const Meeting = require('../models/Meeting');
const Progress = require('../models/Progress');
const Notification = require('../models/Notification');
const Evaluation = require('../models/Evaluation');
const Submission = require('../models/Submission');

// @desc    Get student dashboard data
// @route   GET /api/students/dashboard
// @access  Private (Student only)
const getDashboard = asyncHandler(async (req, res) => {
  // Ensure user is a student
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Not authorized - student access only');
  }

  // Get projects
  const projects = await Project.find({ student: req.user.id })
    .populate('guide', 'name email department officeLocation')
    .sort({ createdAt: -1 });

  // Get meetings
  const meetings = await Meeting.find({ student: req.user.id })
    .populate('faculty', 'name email department')
    .sort({ dateTime: 1 })
    .limit(10);

  // Get guide
  let guide = null;
  if (projects.length > 0 && projects[0].guide) {
    guide = await User.findById(projects[0].guide)
      .select('name email department position officeLocation phone officeHours expertise bio');
  }

  // Get notifications
  const notifications = await Notification.find({ 
    recipient: req.user.id,
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  }).sort({ createdAt: -1 });

  // Count submissions this month
  const thisMonth = new Date();
  thisMonth.setDate(1); // First day of current month
  thisMonth.setHours(0, 0, 0, 0);
  
  const submissionsThisMonth = await Progress.countDocuments({
    student: req.user.id,
    createdAt: { $gte: thisMonth }
  });

  res.status(200).json({
    projects,
    meetings,
    guide,
    notifications,
    submissionsThisMonth
  });
});

// @desc    Get student's assigned guide
// @route   GET /api/students/guide
// @access  Private (Student only)
const getGuide = asyncHandler(async (req, res) => {
  // Ensure user is a student
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Not authorized - student access only');
  }

  // Find the student's projects
  const project = await Project.findOne({ 
    student: req.user.id,
    status: 'approved'
  }).sort({ createdAt: -1 });

  if (!project || !project.guide) {
    res.status(404);
    throw new Error('No assigned guide found. Submit and get a project approved first.');
  }

  // Get guide details
  const guide = await User.findById(project.guide)
    .select('name email department position officeLocation phone officeHours expertise bio profileImage');

  if (!guide) {
    res.status(404);
    throw new Error('Guide not found');
  }

  res.status(200).json(guide);
});

// @desc    Get student's projects
// @route   GET /api/students/projects
// @access  Private (Student only)
const getProjects = asyncHandler(async (req, res) => {
  // Ensure user is a student
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Not authorized - student access only');
  }

  const projects = await Project.find({ student: req.user.id })
    .populate('guide', 'name email department')
    .sort({ createdAt: -1 });

  res.status(200).json(projects);
});

// @desc    Get student's meetings
// @route   GET /api/students/meetings
// @access  Private (Student only)
const getMeetings = asyncHandler(async (req, res) => {
  // Ensure user is a student
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Not authorized - student access only');
  }

  const meetings = await Meeting.find({ student: req.user.id })
    .populate('faculty', 'name email department')
    .sort({ dateTime: 1 });

  res.status(200).json(meetings);
});

// @desc    Get student's notifications
// @route   GET /api/students/notifications
// @access  Private (Student only)
const getNotifications = asyncHandler(async (req, res) => {
  // Ensure user is a student
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Not authorized - student access only');
  }

  const notifications = await Notification.find({ recipient: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json(notifications);
});

// @desc    Mark notification as read
// @route   PATCH /api/students/notifications/:id/read
// @access  Private (Student only)
const markNotificationAsRead = asyncHandler(async (req, res) => {
  // Ensure user is a student
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Not authorized - student access only');
  }

  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Ensure the notification belongs to this student
  if (notification.recipient.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this notification');
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({ success: true });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/students/notifications/all/read
// @access  Private (Student only)
const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  // Ensure user is a student
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Not authorized - student access only');
  }

  await Notification.updateMany(
    { recipient: req.user.id, read: false },
    { read: true }
  );

  res.status(200).json({ success: true });
});

// @desc    Get project progress updates
// @route   GET /api/students/progress/:projectId
// @access  Private (Student only)
const getProgressUpdates = asyncHandler(async (req, res) => {
  // Ensure user is a student
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Not authorized - student access only');
  }

  // Check if project exists and belongs to the student
  const project = await Project.findById(req.params.projectId);
  
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.student.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this project');
  }

  // Get progress updates
  const progressUpdates = await Progress.find({ project: req.params.projectId })
    .populate('project', 'title')
    .sort({ createdAt: -1 });

  res.status(200).json(progressUpdates);
});

// @desc    Get evaluation results
// @route   GET /api/students/evaluation
// @access  Private (Student only)
const getEvaluationResults = asyncHandler(async (req, res) => {
  // Ensure user is a student
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Not authorized - student access only');
  }

  // Instead of looking up by submission, look up by student ID directly
  const evaluation = await Evaluation.findOne({ student: req.user.id })
    .populate('evaluator', 'name email department')
    .populate('project', 'title')
    .sort({ createdAt: -1 }); // Get the most recent evaluation

  if (!evaluation) {
    res.status(404);
    throw new Error('No evaluation found for your dissertation yet.');
  }

  // Add project title to the response if not already included by populate
  let responseData = evaluation.toObject();
  
  if (!responseData.projectTitle && evaluation.project) {
    responseData.projectTitle = evaluation.project.title || 'Unnamed Project';
  }

  res.status(200).json(responseData);
});

// @desc    Get final submission
// @route   GET /api/students/final-submission/:projectId
// @access  Private (Student only)
const getFinalSubmission = asyncHandler(async (req, res) => {
  // Ensure user is a student
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Not authorized - student access only');
  }

  // Check if project exists and belongs to the student
  const project = await Project.findById(req.params.projectId);
  
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.student.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this project');
  }

  // Get submission
  const submission = await Submission.findOne({ project: req.params.projectId })
    .sort({ createdAt: -1 });

  if (!submission) {
    res.status(404);
    throw new Error('No submission found for this project');
  }

  res.status(200).json(submission);
});

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Private (Student only)
const getProfile = asyncHandler(async (req, res) => {
  // Ensure user is a student
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Not authorized - student access only');
  }

  const student = await User.findById(req.user.id)
    .select('-password');

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  res.status(200).json(student);
});

// @desc    Update student profile
// @route   PUT /api/students/profile
// @access  Private (Student only)
const updateProfile = asyncHandler(async (req, res) => {
  // Ensure user is a student
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Not authorized - student access only');
  }

  const { fullName, phone, bio, batch } = req.body;

  // Find student
  const student = await User.findById(req.user.id);

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  // Update fields
  if (fullName) student.fullName = fullName;
  if (phone) student.phone = phone;
  if (bio !== undefined) student.bio = bio;
  if (batch) student.batch = batch;

  // Save changes
  const updatedStudent = await student.save();

  // Return updated user without password
  const responseUser = {
    _id: updatedStudent._id,
    fullName: updatedStudent.fullName,
    email: updatedStudent.email,
    role: updatedStudent.role,
    department: updatedStudent.department,
    branch: updatedStudent.branch,
    rollNumber: updatedStudent.rollNumber,
    batch: updatedStudent.batch,
    phone: updatedStudent.phone,
    bio: updatedStudent.bio
  };

  res.status(200).json(responseUser);
});

module.exports = {
  getDashboard,
  getGuide,
  getProjects,
  getMeetings,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getProgressUpdates,
  getEvaluationResults,
  getFinalSubmission,
  getProfile,
  updateProfile
}; 