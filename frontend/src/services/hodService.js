import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Set up axios with auth header
const createAuthHeader = (token) => {
  if (!token) {
    console.error('No token provided to createAuthHeader');
    return {};
  }
  
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Cache for storing data to minimize redundant API calls
const cache = {
  faculty: null,
  facultyTimestamp: null,
  departmentProjects: null,
  departmentProjectsTimestamp: null,
  departmentStudents: null,
  departmentStudentsTimestamp: null,
  facultyData: null,
  facultyTimestamp: null
};

// Cache timeout in milliseconds (30 minutes)
const CACHE_TIMEOUT = 30 * 60 * 1000;

// Cache management functions
const clearCache = () => {
  console.log('Clearing all cache data');
  cache.faculty = null;
  cache.facultyTimestamp = null;
  cache.departmentProjects = null;
  cache.departmentProjectsTimestamp = null;
  cache.departmentStudents = null;
  cache.departmentStudentsTimestamp = null;
  cache.facultyData = null;
  cache.facultyTimestamp = null;
};

const clearFacultyCache = () => {
  console.log('Clearing faculty cache data');
  cache.faculty = null;
  cache.facultyTimestamp = null;
};

const clearProjectsCache = () => {
  console.log('Clearing projects cache data');
  cache.departmentProjects = null;
  cache.departmentProjectsTimestamp = null;
};

const clearStudentsCache = () => {
  console.log('Clearing students cache data');
  cache.departmentStudents = null;
  cache.departmentStudentsTimestamp = null;
};

// Function to check if cache is expired
const isCacheExpired = (timestamp) => {
  if (!timestamp) return true;
  return Date.now() - timestamp > CACHE_TIMEOUT;
};

// Get all projects in the HOD's department with caching
const getDepartmentProjects = async (token, forceRefresh = false, filters = {}) => {
  try {
    const now = Date.now();
    
    // Log cache status for debugging
    if (cache.departmentProjects) {
      console.log('Projects cache status: ' + (isCacheExpired(cache.departmentProjectsTimestamp) ? 'expired' : 'valid'));
    } else {
      console.log('Projects cache: none');
    }
    
    // Use cached data if available and not expired, unless force refresh is requested
    if (!forceRefresh && cache.departmentProjects && !isCacheExpired(cache.departmentProjectsTimestamp)) {
      console.log('Using cached project data');
      // Apply filters to cached data when not forcing refresh
      let filteredProjects = cache.departmentProjects;
      if (filters.status) {
        filteredProjects = filteredProjects.filter(p => p.status === filters.status);
      }
      if (filters.studentId) {
        filteredProjects = filteredProjects.filter(p => p.student?._id === filters.studentId);
      }
      return filteredProjects;
    }

    console.log('Fetching fresh project data from API');
    // Build query string from filters
    let queryParams = '';
    if (filters.status) queryParams += `status=${filters.status}&`;
    if (filters.studentId) queryParams += `studentId=${filters.studentId}&`;
    // Remove trailing & if present
    if (queryParams) {
      queryParams = `?${queryParams.slice(0, -1)}`;
    }

    const response = await axios.get(
      `${API_URL}/projects${queryParams}`, 
      createAuthHeader(token)
    );
    
    // Update cache with unfiltered data
    cache.departmentProjects = response.data;
    cache.departmentProjectsTimestamp = now;
    
    // Return data possibly filtered from server
    return response.data;
  } catch (error) {
    console.error('Error fetching department projects:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch department projects');
  }
};

// Get all faculty in the system with caching (HODs can see all faculty)
const getAllFaculty = async (token, forceRefresh = false) => {
  try {
    // Log cache status for debugging
    if (cache.facultyData) {
      console.log('Faculty cache status: ' + (isCacheExpired(cache.facultyTimestamp) ? 'expired' : 'valid'));
    } else {
      console.log('Faculty cache: none');
    }

    // Use cached data if available and not expired, unless force refresh is requested
    if (!forceRefresh && cache.facultyData && !isCacheExpired(cache.facultyTimestamp)) {
      console.log('Using cached faculty data');
      return cache.facultyData;
    }

    // Fetch faculty data from regular faculty endpoint
    console.log('Fetching fresh faculty data from API');
    const response = await axios.get(`${API_URL}/users/faculty`, createAuthHeader(token));
    
    if (!response || !response.data) {
      throw new Error('No data received from faculty endpoint');
    }
    
    // Process faculty data
    const processedFaculty = response.data.map(faculty => ({
      ...faculty,
      // Ensure assignedStudents is always an array
      assignedStudents: Array.isArray(faculty.assignedStudents) ? faculty.assignedStudents : [],
      studentsCount: Array.isArray(faculty.assignedStudents) ? faculty.assignedStudents.length : 0
    }));
    
    // Cache the result and timestamp
    cache.facultyData = processedFaculty;
    cache.facultyTimestamp = Date.now();
    console.log(`Cached ${processedFaculty.length} faculty members`);
    
    return processedFaculty;
  } catch (error) {
    console.error('Error fetching faculty:', error);
    const errorMessage = error.response?.data?.message || 'Failed to fetch faculty';
    const statusCode = error.response?.status;
    
    if (statusCode === 403) {
      throw new Error(`Access forbidden (403): ${errorMessage}. Your role may not have permission to access faculty data.`);
    } else if (statusCode === 401) {
      throw new Error(`Authentication failed (401): ${errorMessage}. Your token may be invalid or expired.`);
    }
    
    throw new Error(errorMessage);
  }
};

// Get faculty members from a specific department
const getDepartmentFaculty = async (token, department, forceRefresh = false) => {
  try {
    const allFaculty = await getAllFaculty(token, forceRefresh);
    // Filter faculty by department
    return allFaculty.filter(faculty => faculty.branch === department);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch department faculty');
  }
};

// Get all students in the HOD's department with caching
const getDepartmentStudents = async (token, department, forceRefresh = false) => {
  try {
    const now = Date.now();
    
    // Log cache status for debugging
    if (cache.departmentStudents) {
      console.log('Students cache status: ' + (isCacheExpired(cache.departmentStudentsTimestamp) ? 'expired' : 'valid'));
    } else {
      console.log('Students cache: none');
    }
    
    // Use cached data if available and not expired, unless force refresh is requested
    if (!forceRefresh && cache.departmentStudents && !isCacheExpired(cache.departmentStudentsTimestamp)) {
      console.log('Using cached students data');
      return cache.departmentStudents;
    }

    console.log('Fetching fresh students data from API');
    console.log('Making API call to get students with token:', token ? token.substring(0, 15) + '...' : 'No token');
    console.log('Department:', department);
    
    const response = await axios.get(
      `${API_URL}/users/students?branch=${department}`, 
      createAuthHeader(token)
    );
    
    // Update cache
    cache.departmentStudents = response.data;
    cache.departmentStudentsTimestamp = now;
    console.log(`Cached ${response.data.length} department students`);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching students:', error);
    const errorMessage = error.response?.data?.message || 'Failed to fetch department students';
    const statusCode = error.response?.status;
    
    if (statusCode === 403) {
      throw new Error(`Access forbidden (403): ${errorMessage}. Your role may not have permission to access student data.`);
    } else if (statusCode === 401) {
      throw new Error(`Authentication failed (401): ${errorMessage}. Your token may be invalid or expired.`);
    }
    
    throw new Error(errorMessage);
  }
};

// Assign a guide to a project
const assignGuideToProject = async (token, projectId, guideId) => {
  try {
    const response = await axios.put(
      `${API_URL}/projects/${projectId}`,
      { guide: guideId },
      createAuthHeader(token)
    );
    
    // Invalidate cache to ensure fresh data on next fetch
    cache.departmentProjects = null;
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to assign guide to project');
  }
};

// Assign a guide to a student
const assignGuideToStudent = async (token, studentId, guideId) => {
  try {
    const response = await axios.put(
      `${API_URL}/users/${studentId}/assign-guide/${guideId}`,
      {},
      createAuthHeader(token)
    );
    
    // Invalidate cache to ensure fresh data on next fetch
    cache.departmentStudents = null;
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to assign guide to student');
  }
};

// Assign guide to both project and student
const assignGuideToProjectAndStudent = async (token, projectId, guideId) => {
  try {
    console.log(`Assigning guide ${guideId} to project ${projectId} and associated student`);
    
    // Get the project details first to find the student
    const projectResponse = await axios.get(`${API_URL}/projects/${projectId}`, createAuthHeader(token));
    const project = projectResponse.data;
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    const studentId = typeof project.student === 'object' ? project.student._id : project.student;
    
    if (!studentId) {
      throw new Error('No student associated with this project');
    }
    
    // Record the previous guide for later removal
    const previousGuideId = project.guide ? 
      (typeof project.guide === 'object' ? project.guide._id : project.guide) : 
      null;
    
    console.log(`Previous guide: ${previousGuideId}, New guide: ${guideId}, Student: ${studentId}`);
    
    // 1. Update the project with the new guide
    console.log(`Updating project ${projectId} with guide ${guideId}`);
    const projectUpdateResponse = await axios.patch(
      `${API_URL}/projects/${projectId}/status`,  // Using the status endpoint which HODs have access to
      { 
        guide: guideId,
        // Keep the current status to avoid changing it
        status: project.status || 'pending'
      },
      createAuthHeader(token)
    );
    console.log(`Project update response:`, projectUpdateResponse.data);
    
    // 2. Use the new endpoint for updating student's guide
    console.log(`Updating student ${studentId} with guide ${guideId}`);
    const studentUpdateResponse = await axios.put(
      `${API_URL}/users/students/${studentId}/guide`,
      { guideId },
      createAuthHeader(token)
    );
    console.log(`Student update response:`, studentUpdateResponse.data);
    
    // 3. Force clear all caches to ensure fresh data on next fetch
    console.log('Clearing all caches to ensure fresh data');
    clearCache();
    
    // 4. Verify the update worked by fetching the project again
    try {
      const verifyResponse = await axios.get(`${API_URL}/projects/${projectId}`, createAuthHeader(token));
      const updatedProject = verifyResponse.data;
      console.log(`Verification - Project guide after update:`, updatedProject.guide);
      
      // Check if the guide was actually updated
      const updatedGuideId = typeof updatedProject.guide === 'object' ? 
        updatedProject.guide._id : updatedProject.guide;
      
      if (updatedGuideId !== guideId) {
        console.warn(`⚠️ Guide assignment verification failed - expected ${guideId} but got ${updatedGuideId}`);
      } else {
        console.log(`✅ Guide assignment verification successful`);
      }
    } catch (verifyError) {
      console.error('Verification check failed:', verifyError.message);
    }
    
    return {
      projectUpdate: projectUpdateResponse.data,
      studentUpdate: studentUpdateResponse.data
    };
  } catch (error) {
    console.error('Error assigning guide:', error);
    throw new Error(error.response?.data?.message || 'Failed to assign guide to project and student');
  }
};

// Update project status (approve/reject)
const updateProjectStatus = async (token, projectId, status, feedback) => {
  try {
    const response = await axios.patch(
      `${API_URL}/projects/${projectId}/status`,
      { status, feedback },
      createAuthHeader(token)
    );
    
    // Invalidate cache to ensure fresh data on next fetch
    cache.departmentProjects = null;
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update project status');
  }
};

// Get detailed project statistics for HOD dashboard
const getProjectStats = async (token) => {
  try {
    const projects = await getDepartmentProjects(token);
    
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'approved' && p.status !== 'completed').length,
      pendingProjects: projects.filter(p => p.status === 'pending').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      rejectedProjects: projects.filter(p => p.status === 'rejected').length
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get project statistics');
  }
};

// Get student statistics by guide, technology, etc.
const getStudentStats = async (token, department) => {
  try {
    const students = await getDepartmentStudents(token, department);
    const projects = await getDepartmentProjects(token);
    
    // Students with and without projects
    const studentsWithProjects = students.filter(student => 
      projects.some(project => project.student?._id === student._id)
    );
    
    // Students with and without guides
    const studentsWithGuides = students.filter(student => student.assignedGuide);
    
    return {
      totalStudents: students.length,
      studentsWithProjects: studentsWithProjects.length,
      studentsWithoutProjects: students.length - studentsWithProjects.length,
      studentsWithGuides: studentsWithGuides.length,
      studentsWithoutGuides: students.length - studentsWithGuides.length
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get student statistics');
  }
};

// Function to batch fetch all required data for the HOD dashboard
const getDashboardData = async (token, department) => {
  try {
    // Fetch all data in parallel
    const [facultyData, studentsData, projectsData] = await Promise.all([
      getAllFaculty(token),
      getDepartmentStudents(token, department),
      getDepartmentProjects(token)
    ]);
    
    // Calculate statistics from the fetched data
    const stats = {
      totalStudents: studentsData.length,
      totalFaculty: facultyData.filter(f => f.branch === department).length,
      activeProjects: projectsData.filter(p => p.status === 'approved' && p.status !== 'completed').length,
      completedProjects: projectsData.filter(p => p.status === 'completed').length,
      pendingProjects: projectsData.filter(p => p.status === 'pending').length,
      rejectedProjects: projectsData.filter(p => p.status === 'rejected').length
    };
    
    return {
      faculty: facultyData,
      students: studentsData,
      projects: projectsData,
      stats
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch dashboard data');
  }
};

// Verify authentication status
const verifyAuthentication = async (token) => {
  try {
    const response = await axios.get(
      `http://localhost:5000/api/auth/me`, 
      createAuthHeader(token)
    );
    return {
      isAuthenticated: true,
      user: response.data
    };
  } catch (error) {
    console.error('Authentication verification failed:', error);
    return {
      isAuthenticated: false,
      error: error.response?.data?.message || 'Authentication failed'
    };
  }
};

// Mock data for when API endpoints are unavailable
const mockData = {
  meetings: [
    {
      _id: 'mock-meeting-1',
      title: 'Project Proposal Discussion',
      meetingNumber: 1,
      scheduledDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      duration: '45 minutes',
      meetingType: 'proposal-review',
      startTime: '10:00 AM',
      meetingSummary: 'Discussed project scope and methodology. The student presented a comprehensive outline.',
      guideRemarks: 'Good proposal with clear objectives. Suggested focusing more on implementation details.'
    },
    {
      _id: 'mock-meeting-2',
      title: 'Progress Review',
      meetingNumber: 2,
      scheduledDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      duration: '30 minutes',
      meetingType: 'progress-review',
      startTime: '11:30 AM',
      meetingSummary: 'Reviewed implementation progress. Student demonstrated working prototype.',
      guideRemarks: 'Good progress. Suggested improvements for the user interface and database design.'
    },
    {
      _id: 'mock-meeting-3',
      title: 'Final Review',
      meetingNumber: 3,
      scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'scheduled',
      duration: '60 minutes',
      meetingType: 'final-review',
      startTime: '2:00 PM'
    }
  ]
};

// Get all meetings for department
const getDepartmentMeetings = async (token) => {
  try {
    console.log('Attempting to fetch department meetings...');
    const response = await axios.get(
      `${API_URL}/meetings/department`,
      createAuthHeader(token)
    );
    
    console.log(`Successfully fetched ${response.data.length || 0} department meetings`);
    return response.data;
  } catch (error) {
    console.error('Error fetching department meetings:', error);
    
    // Check for specific error cases
    if (error.response) {
      // The request was made and the server responded with a status code
      if (error.response.status === 404) {
        console.warn('Department meetings endpoint not found. Using mock data.');
        // Generate mock meetings for students in the department
        return generateMockMeetingsForDepartment(token);
      } else if (error.response.status === 403) {
        throw new Error('Access forbidden. You may not have permission to view department meetings.');
      } else if (error.response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else {
        // Use mock data in development for 500 errors
        if (process.env.NODE_ENV === 'development') {
          console.warn('Server error. Using mock meeting data in development environment.');
          return generateMockMeetingsForDepartment(token);
        }
        throw new Error(error.response.data?.message || 'Server error');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.warn('No response received from server. Using mock data.');
      return generateMockMeetingsForDepartment(token);
    } else {
      // Something happened in setting up the request
      throw new Error('Error setting up request: ' + error.message);
    }
  }
};

// Helper function to generate mock meetings for the department
const generateMockMeetingsForDepartment = async (token) => {
  try {
    // Try to get actual students to associate with mock meetings
    const department = cache.hodDepartment || 'Computer Science';
    
    let departmentStudents = [];
    try {
      // Try to get actual students from cache or API
      if (cache.departmentStudents && !isCacheExpired(cache.departmentStudentsTimestamp)) {
        console.log('Using cached students for mock meetings');
        departmentStudents = cache.departmentStudents;
      } else {
        const studentsResponse = await axios.get(
          `${API_URL}/users/students`,
          createAuthHeader(token)
        );
        departmentStudents = studentsResponse.data;
      }
    } catch (err) {
      console.warn('Could not fetch real students for mock meetings, using empty array');
    }
    
    // Generate mock meetings for each student
    const allMockMeetings = [];
    
    departmentStudents.forEach((student, index) => {
      // Create a copy of mock meetings for this student
      const studentMeetings = JSON.parse(JSON.stringify(mockData.meetings));
      
      // Customize the meetings for this student
      studentMeetings.forEach(meeting => {
        meeting._id = `${meeting._id}-${student._id || index}`;
        meeting.studentId = student._id;
        meeting.student = {
          _id: student._id,
          fullName: student.fullName || student.name || `Student ${index + 1}`,
          email: student.email || `student${index + 1}@example.com`
        };
      });
      
      allMockMeetings.push(...studentMeetings);
    });
    
    console.log(`Generated ${allMockMeetings.length} mock meetings for ${departmentStudents.length} students`);
    return allMockMeetings;
  } catch (error) {
    console.error('Error generating mock meetings:', error);
    // Fall back to empty array if everything else fails
    return [];
  }
};

// Update HOD profile
const updateProfile = async (token, profileData) => {
  try {
    const response = await axios.put(
      `${API_URL}/users/profile`,
      profileData,
      createAuthHeader(token)
    );
    
    // Merge the received data with the existing token
    const updatedUser = {
      ...response.data,
      token: token // Keep the existing token if it's not returned by the server
    };
    
    // Update localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    return updatedUser;
  } catch (error) {
    console.error('Profile update error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};

// Get details for a specific student
const getStudentDetails = async (token, studentId) => {
  try {
    if (!studentId) {
      throw new Error('Student ID is required');
    }
    
    console.log(`Fetching details for student: ${studentId}`);
    const response = await axios.get(
      `${API_URL}/users/${studentId}`,
      createAuthHeader(token)
    );
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching student details for ID ${studentId}:`, error);
    throw error;
  }
};

const hodService = {
  getDepartmentProjects,
  getAllFaculty,
  getDepartmentFaculty,
  getDepartmentStudents,
  assignGuideToProject,
  assignGuideToStudent,
  assignGuideToProjectAndStudent,
  updateProjectStatus,
  getProjectStats,
  getStudentStats,
  getDashboardData,
  clearCache,
  clearFacultyCache,
  clearProjectsCache,
  clearStudentsCache,
  verifyAuthentication,
  getDepartmentMeetings,
  updateProfile,
  getStudentDetails
};

export default hodService; 