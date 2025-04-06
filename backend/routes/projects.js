const express = require('express');
const { 
    createProject, 
    getProjects, 
    getProjectById, 
    updateProjectStatus, 
    assignGuideToProject, 
    updateProjectProgress, 
    assignPanelMembers,
    getStudentProjects,
    submitProposal,
    updateProgress,
    submitFinalDissertation,
    updateProject,
    deleteProject,
    getProjectProgress
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');
const multer = require('multer');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept only PDF files for final submission
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// All routes are protected
router.use(protect);

// Routes accessible by all roles (with appropriate filtering)
router.route('/')
    .get(getProjects)
    .post(authorize('student'), createProject);

router.route('/:id')
    .get(getProjectById);

// HOD routes
router.put('/:id/status', authorize('hod'), updateProjectStatus);
router.put('/:id/assign-guide/:guideId', authorize('hod'), assignGuideToProject);

// Faculty routes
router.put('/:id/progress', authorize('faculty'), updateProjectProgress);

// Admin routes
router.put('/:id/panel', authorize('admin'), assignPanelMembers);

// GET /api/projects/student - Get projects for current student
router.get('/student', getStudentProjects);

// POST /api/projects/proposal - Submit a new project proposal
router.post('/proposal', submitProposal);

// POST /api/projects/progress - Submit a progress update
router.post('/progress', updateProgress);

// POST /api/projects/final-submission - Submit final dissertation
router.post(
  '/final-submission', 
  upload.single('file'), 
  submitFinalDissertation
);

// PUT /api/projects/:id - Update project (admin and hod only)
router.put('/:id', updateProject);

// DELETE /api/projects/:id - Delete project (admin only)
router.delete('/:id', deleteProject);

// PATCH /api/projects/:id/status - Update project status (hod only)
router.patch('/:id/status', updateProjectStatus);

// GET /api/projects/:id/progress - Get project progress updates
router.get('/:id/progress', getProjectProgress);

module.exports = router; 