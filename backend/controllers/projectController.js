const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Notification = require('../models/Notification');
const Submission = require('../models/Submission');
const { sendNotification } = require('./notificationController');
const fs = require('fs');
const path = require('path');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private (Admin and HOD only)
const getAllProjects = asyncHandler(async (req, res) => {
  // Only admin and HOD can view all projects
  if (req.user.role !== 'admin' && req.user.role !== 'hod') {
    res.status(403);
    throw new Error('Not authorized to view all projects');
  }

  // HODs can only see projects from their department
  let query = {};
  if (req.user.role === 'hod') {
    const hodDepartment = req.user.department || req.user.branch;
    
    // Query projects directly by department first
    const projectsByDepartment = await Project.find({ 
      department: hodDepartment 
    });
    
    // Also get students from this HOD's department (for backward compatibility)
    const studentsInDepartment = await User.find({ 
      role: 'student',
      $or: [
        { department: hodDepartment },
        { branch: hodDepartment }
      ]
    }).select('_id');
    
    const studentIds = studentsInDepartment.map(student => student._id);
    
    // Combine both approaches
    query = {
      $or: [
        { department: hodDepartment },
        { student: { $in: studentIds } }
      ]
    };
    
    console.log(`[Projects] Fetching projects for HOD of department: ${hodDepartment}`);
    console.log(`[Projects] Found ${studentsInDepartment.length} students in department`);
  }

  const projects = await Project.find(query)
    .populate('student', 'fullName email department branch')
    .populate('guide', 'fullName email department branch')
    .sort({ createdAt: -1 });

  console.log(`[Projects] Returning ${projects.length} projects`);
  res.status(200).json(projects);
});

// @desc    Get projects for current student
// @route   GET /api/projects/student
// @access  Private
const getStudentProjects = asyncHandler(async (req, res) => {
  // If faculty, hod, or admin, they need to provide a student ID
  if (req.user.role !== 'student' && !req.query.studentId) {
    res.status(400);
    throw new Error('Student ID is required for non-student users');
  }

  const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;

  // Faculty can only see projects they are guiding
  if (req.user.role === 'faculty' && !req.user.isGuide) {
    const projects = await Project.find({ 
      student: studentId,
      guide: req.user.id
    })
      .populate('student', 'name email department')
      .populate('guide', 'name email department')
      .sort({ createdAt: -1 });

    res.status(200).json(projects);
    return;
  }

  // HODs can only see projects from their department
  if (req.user.role === 'hod') {
    const student = await User.findById(studentId);
    if (!student || student.department !== req.user.department) {
      res.status(403);
      throw new Error('Not authorized to view projects from other departments');
    }
  }

  const projects = await Project.find({ student: studentId })
    .populate('student', 'name email department')
    .populate('guide', 'name email department')
    .sort({ createdAt: -1 });

  res.status(200).json(projects);
});

// @desc    Get a specific project
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id)
    .populate('student', 'name email department branch')
    .populate('guide', 'name email department branch');

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check permissions
  const isOwner = project.student && project.student._id && project.student._id.toString() === req.user.id;
  const isGuide = project.guide && project.guide._id && project.guide._id.toString() === req.user.id;
  
  // HOD permission - allow if student is from their department or if project's department matches HOD's
  const isHod = req.user.role === 'hod' && (
    (project.student && (
      (project.student.department && project.student.department === req.user.department) ||
      (project.student.branch && project.student.branch === req.user.department)
    )) || 
    (project.department === req.user.department) ||
    (project.department === req.user.branch)
  );
  
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isGuide && !isHod && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this project');
  }

  res.status(200).json(project);
});

// @desc    Submit a new project proposal
// @route   POST /api/projects/proposal
// @access  Private (Student only)
const submitProposal = asyncHandler(async (req, res) => {
  // Only students can submit proposals
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Only students can submit proposals');
  }

  const { title, description, problemStatement, technologies, department, expectedOutcome } = req.body;

  console.log('Request body:', req.body);
  console.log('Department from request:', department);
  console.log('Expected outcome from request:', expectedOutcome);

  if (!title || !description || !problemStatement || !technologies || !expectedOutcome) {
    res.status(400);
    throw new Error('Please include all required fields');
  }

  // Check for department - use from request body or fallback to user profile
  const projectDepartment = department || req.user.department || req.user.branch;
  
  if (!projectDepartment) {
    res.status(400);
    throw new Error('Department information is missing. Please ensure your profile has a department or branch specified.');
  }

  // Check if student already has a pending or approved proposal
  const existingProject = await Project.findOne({
    student: req.user.id,
    status: { $in: ['pending', 'approved'] }
  });

  if (existingProject) {
    res.status(400);
    throw new Error('You already have a pending or approved project proposal');
  }

  // Find HOD for the student's department
  const hod = await User.findOne({ role: 'hod', department: projectDepartment });

  // Allow proposal submission even if no HOD is found
  let hodId = null;
  if (hod) {
    hodId = hod._id;
    console.log(`HOD found for department ${projectDepartment}:`, hod.name);
  } else {
    console.log(`No HOD found for department: ${projectDepartment}, but allowing proposal submission`);
  }

  try {
    // Create the project proposal
    const project = await Project.create({
      title,
      description,
      problemStatement,
      technologies: Array.isArray(technologies) ? technologies : technologies.split(',').map(tech => tech.trim()),
      expectedOutcome,
      department: projectDepartment,
      student: req.user.id,
      status: 'pending',
      hodAssigned: hodId // This will be null if no HOD was found
    });

    // Send notification to HOD only if one was found
    if (hod) {
      await sendNotification(
        hod._id,
        'New Project Proposal',
        `${req.user.name} has submitted a new project proposal: ${title}`,
        'proposal',
        `proposals/${project._id}`
      );
    }

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500);
    throw new Error(`Failed to create project: ${error.message}`);
  }
});

// @desc    Submit a progress update
// @route   POST /api/projects/progress
// @access  Private (Student only)
const updateProgress = asyncHandler(async (req, res) => {
  // Only students can submit progress updates
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Only students can submit progress updates');
  }

  const { projectId, title, description, completionPercentage, challenges, nextSteps } = req.body;

  if (!projectId || !title || !description || completionPercentage < 0) {
    res.status(400);
    throw new Error('Please include all required fields');
  }

  // Check if project exists and belongs to the student
  const project = await Project.findById(projectId);
  
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.student.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to update this project');
  }

  // Create the progress update
  const progressUpdate = await Progress.create({
    project: projectId,
    student: req.user.id,
    title,
    description,
    completionPercentage,
    challenges,
    nextSteps
  });

  // Update the project's progress
  project.progress = completionPercentage;
  project.lastUpdated = Date.now();
  await project.save();

  // Send notification to guide if assigned
  if (project.guide) {
    await sendNotification(
      project.guide,
      'New Progress Update',
      `${req.user.name} has submitted a progress update for ${project.title}`,
      'progress',
      `progress/${progressUpdate._id}`
    );
  }

  res.status(201).json(progressUpdate);
});

// @desc    Submit final dissertation
// @route   POST /api/projects/final-submission
// @access  Private (Student only)
const submitFinalDissertation = asyncHandler(async (req, res) => {
  // Only students can submit final dissertation
  if (req.user.role !== 'student') {
    res.status(403);
    throw new Error('Only students can submit final dissertation');
  }

  const { projectId, title, abstract, keywords } = req.body;

  if (!projectId || !title || !abstract || !req.file) {
    res.status(400);
    throw new Error('Please include all required fields and upload your dissertation PDF');
  }

  // Check if project exists and belongs to the student
  const project = await Project.findById(projectId);
  
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  if (project.student.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to submit for this project');
  }

  // Check if project is approved
  if (project.status !== 'approved') {
    res.status(400);
    throw new Error('Only approved projects can have final submissions');
  }

  // Create file path for storage
  const filePath = `/uploads/${req.file.filename}`;
  
  // Create the submission
  const submission = await Submission.create({
    project: projectId,
    student: req.user.id,
    title,
    abstract,
    keywords,
    fileUrl: filePath,
    fileName: req.file.originalname,
    fileSize: req.file.size,
    status: 'pending'
  });

  // Update project status
  project.status = 'submitted';
  project.lastUpdated = Date.now();
  await project.save();

  // Send notification to guide
  if (project.guide) {
    await sendNotification(
      project.guide,
      'Final Dissertation Submitted',
      `${req.user.name} has submitted their final dissertation for ${project.title}`,
      'submission',
      `submissions/${submission._id}`
    );
  }

  // Send notification to HOD
  if (project.hodAssigned) {
    await sendNotification(
      project.hodAssigned,
      'Final Dissertation Submitted',
      `${req.user.name} has submitted their final dissertation for ${project.title}`,
      'submission',
      `submissions/${submission._id}`
    );
  }

  res.status(201).json(submission);
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin and HOD only)
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Only admin, HOD, and assigned guide can update projects
  const isHod = req.user.role === 'hod' && project.hodAssigned && 
                project.hodAssigned.toString() === req.user.id;
  const isGuide = req.user.role === 'faculty' && project.guide && 
                 project.guide.toString() === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isHod && !isGuide && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to update this project');
  }

  // Different roles can update different fields
  const updateData = {};
  
  // Anyone authorized can update these fields
  if (req.body.comments) updateData.comments = req.body.comments;
  
  // Only HODs and admins can update these fields
  if ((isHod || isAdmin) && req.body.title) updateData.title = req.body.title;
  if ((isHod || isAdmin) && req.body.description) updateData.description = req.body.description;
  if ((isHod || isAdmin) && req.body.problemStatement) updateData.problemStatement = req.body.problemStatement;
  if ((isHod || isAdmin) && req.body.technologies) updateData.technologies = req.body.technologies;
  
  // Only HODs can assign guides
  if (isHod && req.body.guide) {
    // Verify the guide exists and is a faculty member
    const guide = await User.findById(req.body.guide);
    if (!guide || guide.role !== 'faculty') {
      res.status(400);
      throw new Error('Invalid guide - must be a faculty member');
    }
    updateData.guide = req.body.guide;
    
    // Send notification to the newly assigned guide
    await sendNotification(
      req.body.guide,
      'New Project Assignment',
      `You have been assigned as a guide for project: ${project.title}`,
      'project',
      `projects/${project._id}`
    );
    
    // Send notification to the student
    await sendNotification(
      project.student,
      'Guide Assigned',
      `${guide.name} has been assigned as your guide for your project: ${project.title}`,
      'project',
      `guide`
    );
  }

  updateData.lastUpdated = Date.now();

  const updatedProject = await Project.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('student', 'name email department')
   .populate('guide', 'name email department');

  res.status(200).json(updatedProject);
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin only)
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Only admin can delete projects
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized - admin only');
  }

  await Project.findByIdAndDelete(req.params.id);

  res.status(200).json({ id: req.params.id });
});

// @desc    Update project status
// @route   PATCH /api/projects/:id/status
// @access  Private (HOD only)
const updateProjectStatus = asyncHandler(async (req, res) => {
  const { status, comments, guide } = req.body;

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Please provide a valid status');
  }

  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check if user is HOD of the project's department
  const student = await User.findById(project.student);
  
  if (req.user.role !== 'admin' && 
     (req.user.role !== 'hod' || (student.department !== req.user.department && student.branch !== req.user.department))) {
    res.status(403);
    throw new Error('Not authorized - only department HOD can update project status');
  }

  // Log the request for debugging
  console.log('[Project Status Update] Request body:', req.body);
  console.log('[Project Status Update] Current project guide:', project.guide);
  
  // Update project status and other fields
  project.status = status;
  if (comments) project.comments = comments;
  
  // Handle guide assignment if provided in the request
  if (guide) {
    console.log(`[Project Status Update] Updating guide from ${project.guide} to ${guide}`);
    
    // Verify the guide exists and is a faculty member
    const guideUser = await User.findById(guide);
    if (!guideUser || guideUser.role !== 'faculty') {
      res.status(400);
      throw new Error('Invalid guide - must be a faculty member');
    }
    
    // Set the guide
    project.guide = guide;
    
    // Send notification to the newly assigned guide
    await sendNotification(
      guide,
      'New Project Assignment',
      `You have been assigned as a guide for project: ${project.title}`,
      'project',
      `projects/${project._id}`
    );
    
    // Send notification to the student
    await sendNotification(
      project.student,
      'Guide Assigned',
      `${guideUser.fullName || guideUser.name} has been assigned as your guide for your project: ${project.title}`,
      'project',
      `guide`
    );
  }
  
  project.lastUpdated = Date.now();
  await project.save();
  
  console.log('[Project Status Update] Updated project:', {
    id: project._id,
    status: project.status,
    guide: project.guide
  });

  // Send notification to student about status change
  let notificationMessage = '';
  if (status === 'approved') {
    notificationMessage = `Your project proposal "${project.title}" has been approved.`;
  } else if (status === 'rejected') {
    notificationMessage = `Your project proposal "${project.title}" has been rejected. Please check the comments for details.`;
  }

  if (notificationMessage) {
    await sendNotification(
      project.student,
      `Project ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      notificationMessage,
      'proposal',
      `projects/${project._id}`
    );
  }

  res.status(200).json(project);
});

// @desc    Get project progress updates
// @route   GET /api/projects/:id/progress
// @access  Private
const getProjectProgress = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }

  // Check permissions
  const isOwner = project.student.toString() === req.user.id;
  const isGuide = project.guide && project.guide.toString() === req.user.id;
  const isHod = req.user.role === 'hod';
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isGuide && !isHod && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this project progress');
  }

  const progress = await Progress.find({ project: req.params.id })
    .sort({ createdAt: -1 });

  res.status(200).json(progress);
});

module.exports = {
  getAllProjects: getAllProjects,
  getProjects: getAllProjects, // Alias for getProjects used in routes
  getStudentProjects,
  getProjectById,
  submitProposal,
  updateProgress,
  submitFinalDissertation,
  updateProject,
  deleteProject,
  updateProjectStatus,
  getProjectProgress,
  createProject: submitProposal, // Alias for createProject used in routes
  assignGuideToProject: updateProject, // Temporary alias
  updateProjectProgress: updateProgress, // Alias for updateProjectProgress
  assignPanelMembers: updateProject // Temporary alias
}; 