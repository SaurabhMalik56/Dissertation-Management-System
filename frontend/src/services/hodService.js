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
  departmentStudentsTimestamp: null
};

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

// Get all projects in the HOD's department with caching
const getDepartmentProjects = async (token, forceRefresh = false, filters = {}) => {
  try {
    const now = Date.now();
    // Use cached data if available and not expired, unless force refresh is requested
    if (!forceRefresh && cache.departmentProjects && 
        (now - cache.departmentProjectsTimestamp < CACHE_EXPIRATION)) {
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
    throw new Error(error.response?.data?.message || 'Failed to fetch department projects');
  }
};

// Get all faculty in the system with caching (HODs can see all faculty)
const getAllFaculty = async (token, forceRefresh = false) => {
  try {
    const now = Date.now();
    // Use cached data if available and not expired, unless force refresh is requested
    if (!forceRefresh && cache.faculty && 
        (now - cache.facultyTimestamp < CACHE_EXPIRATION)) {
      return cache.faculty;
    }

    console.log('Making API call to get faculty with token:', token ? token.substring(0, 15) + '...' : 'No token');
    
    let response;
    let endpoint = `${API_URL}/users/faculty`;
    let errorMessage = '';
    
    try {
      // First try the regular faculty endpoint
      console.log('Trying primary faculty endpoint:', endpoint);
      response = await axios.get(endpoint, createAuthHeader(token));
    } catch (error) {
      console.warn('Primary faculty endpoint failed:', error.response?.status, error.response?.data?.message);
      errorMessage = error.response?.data?.message || 'Failed to access faculty data';
      
      // If that fails, try the HOD-specific endpoint
      try {
        endpoint = `${API_URL}/users/hod-faculty`;
        console.log('Trying fallback faculty endpoint:', endpoint);
        response = await axios.get(endpoint, createAuthHeader(token));
      } catch (fallbackError) {
        console.error('Fallback faculty endpoint also failed:', fallbackError.response?.status);
        
        // If both endpoints fail, try a direct query as a last resort
        try {
          console.log('Trying direct faculty query as last resort');
          const usersResponse = await axios.get(`${API_URL}/users?role=faculty`, createAuthHeader(token));
          if (usersResponse.data && Array.isArray(usersResponse.data)) {
            response = usersResponse;
          } else {
            throw new Error('Invalid response format from users endpoint');
          }
        } catch (lastError) {
          console.error('All faculty data access attempts failed');
          throw new Error(`${errorMessage}. Additional error: ${lastError.response?.data?.message || lastError.message}`);
        }
      }
    }
    
    if (!response || !response.data) {
      throw new Error('No data received from faculty endpoints');
    }
    
    // Update cache
    cache.faculty = response.data;
    cache.facultyTimestamp = now;
    
    return response.data;
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
    // Use cached data if available and not expired, unless force refresh is requested
    if (!forceRefresh && cache.departmentStudents && 
        (now - cache.departmentStudentsTimestamp < CACHE_EXPIRATION)) {
      return cache.departmentStudents;
    }

    console.log('Making API call to get students with token:', token ? token.substring(0, 15) + '...' : 'No token');
    console.log('Department:', department);
    
    const response = await axios.get(
      `${API_URL}/users/students?branch=${department}`, 
      createAuthHeader(token)
    );
    
    // Update cache
    cache.departmentStudents = response.data;
    cache.departmentStudentsTimestamp = now;
    
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

// Clear all cached data
const clearCache = () => {
  cache.faculty = null;
  cache.facultyTimestamp = null;
  cache.departmentProjects = null;
  cache.departmentProjectsTimestamp = null;
  cache.departmentStudents = null;
  cache.departmentStudentsTimestamp = null;
};

// Clear only faculty cache
const clearFacultyCache = () => {
  cache.faculty = null;
  cache.facultyTimestamp = null;
};

// Clear only projects cache
const clearProjectsCache = () => {
  cache.departmentProjects = null;
  cache.departmentProjectsTimestamp = null;
};

// Clear only students cache
const clearStudentsCache = () => {
  cache.departmentStudents = null;
  cache.departmentStudentsTimestamp = null;
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

// Get all meetings for department
const getDepartmentMeetings = async (token) => {
  try {
    const response = await axios.get(
      `${API_URL}/meetings/department`,
      createAuthHeader(token)
    );
    
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch department meetings');
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

const hodService = {
  getDepartmentProjects,
  getAllFaculty,
  getDepartmentFaculty,
  getDepartmentStudents,
  assignGuideToProject,
  assignGuideToStudent,
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
  updateProfile
};

export default hodService; 