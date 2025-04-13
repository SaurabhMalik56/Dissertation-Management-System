import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Set auth token for requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Create auth header
const createAuthHeader = (token) => {
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Cache mechanism for API responses
const cache = {
  assignedStudents: null,
  assignedStudentsTimestamp: null,
  meetings: null,
  meetingsTimestamp: null
};

// Cache timeout (30 minutes)
const CACHE_TIMEOUT = 30 * 60 * 1000;

// Clear all cache
const clearCache = () => {
  cache.assignedStudents = null;
  cache.assignedStudentsTimestamp = null;
  cache.meetings = null;
  cache.meetingsTimestamp = null;
};

// Check if cache is expired
const isCacheExpired = (timestamp) => {
  if (!timestamp) return true;
  return Date.now() - timestamp > CACHE_TIMEOUT;
};

// Mock data for fallback when API is not available
const mockData = {
  students: [
    { 
      _id: '1', 
      fullName: 'John Doe', 
      rollNumber: 'CS001', 
      email: 'john.doe@example.com',
      department: 'Computer Science',
      project: { 
        _id: '101', 
        title: 'Machine Learning in Healthcare', 
        progress: 65,
        status: 'approved',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    { 
      _id: '2', 
      fullName: 'Jane Smith', 
      rollNumber: 'CS002', 
      email: 'jane.smith@example.com',
      department: 'Computer Science',
      project: { 
        _id: '102', 
        title: 'Blockchain Applications', 
        progress: 20,
        status: 'approved',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
      }
    },
    { 
      _id: '3', 
      fullName: 'Robert Johnson', 
      rollNumber: 'CS003', 
      email: 'robert.johnson@example.com',
      department: 'Computer Science',
      project: { 
        _id: '103', 
        title: 'Cloud Computing Solutions', 
        progress: 45,
        status: 'approved',
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  ],
  meetings: [
    { 
      _id: '1', 
      title: 'Weekly Progress Review', 
      studentName: 'John Doe', 
      studentId: '1',
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), 
      status: 'scheduled',
      description: 'Weekly check-in to discuss project progress'
    },
    { 
      _id: '2', 
      title: 'Project Proposal Discussion', 
      studentName: 'Jane Smith', 
      studentId: '2',
      scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
      status: 'completed',
      description: 'Initial discussion about project proposal',
      feedback: 'Good proposal, needs more detail on methodology'
    },
    { 
      _id: '3', 
      title: 'Methodology Review', 
      studentName: 'Robert Johnson', 
      studentId: '3',
      scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), 
      status: 'scheduled',
      description: 'Review of the proposed methodology'
    },
    { 
      _id: '4', 
      title: 'Final Presentation Prep', 
      studentName: 'John Doe', 
      studentId: '1',
      scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), 
      status: 'pending',
      description: 'Preparation for the final presentation'
    }
  ]
};

// Get all students assigned to the faculty
const getAssignedStudents = async (token, forceRefresh = false) => {
  try {
    setAuthToken(token);
    
    // Use cache if available and not expired
    if (!forceRefresh && cache.assignedStudents && !isCacheExpired(cache.assignedStudentsTimestamp)) {
      console.log('Using cached assigned students data');
      return cache.assignedStudents;
    }
    
    try {
      // Try faculty-specific endpoint first
      const response = await axios.get(`${API_URL}/faculty/students`);
      
      // Process and cache the result
      cache.assignedStudents = response.data;
      cache.assignedStudentsTimestamp = Date.now();
      
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned students:', error);
      
      // If endpoint not found, use mock data
      if (error.response && error.response.status === 404) {
        console.log('Faculty API endpoint not found. Using mock student data.');
        cache.assignedStudents = mockData.students;
        cache.assignedStudentsTimestamp = Date.now();
        return mockData.students;
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error in getAssignedStudents:', error);
    throw error;
  }
};

// Get meetings for assigned students
const getMeetings = async (token, forceRefresh = false) => {
  try {
    setAuthToken(token);
    
    // Use cache if available and not expired
    if (!forceRefresh && cache.meetings && !isCacheExpired(cache.meetingsTimestamp)) {
      console.log('Using cached meetings data');
      return cache.meetings;
    }
    
    try {
      const response = await axios.get(`${API_URL}/meetings`);
      
      // Process and cache the result
      cache.meetings = response.data;
      cache.meetingsTimestamp = Date.now();
      
      return response.data;
    } catch (error) {
      console.error('Error fetching meetings:', error);
      
      // If endpoint not found, use mock data
      if (error.response && error.response.status === 404) {
        console.log('Meetings API endpoint not found. Using mock meeting data.');
        cache.meetings = mockData.meetings;
        cache.meetingsTimestamp = Date.now();
        return mockData.meetings;
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error in getMeetings:', error);
    throw error;
  }
};

// Schedule a new meeting
const scheduleMeeting = async (meetingData, token) => {
  try {
    setAuthToken(token);
    
    try {
      const response = await axios.post(`${API_URL}/meetings`, meetingData);
      
      // Invalidate meetings cache
      cache.meetings = null;
      cache.meetingsTimestamp = null;
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Meetings API endpoint not found. Using mock data operation.');
        // Simulate a successful operation
        const newMeeting = {
          _id: 'temp_' + Date.now(),
          ...meetingData,
          status: 'scheduled',
          createdAt: new Date().toISOString()
        };
        
        // Add to mock data
        mockData.meetings.push(newMeeting);
        
        // Update cache with mock data
        cache.meetings = mockData.meetings;
        cache.meetingsTimestamp = Date.now();
        
        return newMeeting;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error scheduling meeting:', error);
    throw error;
  }
};

// Update meeting status and add feedback
const updateMeetingStatus = async (meetingId, statusData, token) => {
  try {
    setAuthToken(token);
    
    try {
      const response = await axios.put(`${API_URL}/meetings/${meetingId}/status`, statusData);
      
      // Invalidate meetings cache
      cache.meetings = null;
      cache.meetingsTimestamp = null;
      
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Meeting status update API endpoint not found. Using mock data operation.');
        
        // Update in mock data
        mockData.meetings = mockData.meetings.map(meeting => 
          meeting._id === meetingId 
            ? { ...meeting, ...statusData } 
            : meeting
        );
        
        // Update cache with mock data
        cache.meetings = mockData.meetings;
        cache.meetingsTimestamp = Date.now();
        
        return { _id: meetingId, ...statusData };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating meeting status:', error);
    throw error;
  }
};

// Get faculty profile data
const getFacultyProfile = async (token) => {
  try {
    setAuthToken(token);
    
    try {
      const response = await axios.get(`${API_URL}/faculty/profile`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Faculty profile API endpoint not found. Using current user data.');
        // Just return what we already have from the token
        return {};
      }
      throw error;
    }
  } catch (error) {
    console.error('Error fetching faculty profile:', error);
    throw error;
  }
};

// Update faculty profile
const updateProfile = async (profileData, token) => {
  try {
    setAuthToken(token);
    
    try {
      const response = await axios.put(`${API_URL}/users/profile`, profileData);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Profile update API endpoint not found. Simulating successful update.');
        // Return a simulated successful response
        return {
          ...profileData,
          updatedAt: new Date().toISOString()
        };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

// Get faculty dashboard data (combines multiple API calls)
const getDashboardData = async (token) => {
  try {
    const [students, meetings] = await Promise.all([
      getAssignedStudents(token),
      getMeetings(token)
    ]);
    
    // Calculate statistics
    const stats = {
      totalStudents: students.length,
      activeProjects: students.filter(student => student.project && student.project.status === 'approved').length,
      upcomingMeetings: meetings.filter(meeting => 
        new Date(meeting.scheduledDate) > new Date() && 
        meeting.status === 'scheduled'
      ).length,
      completedMeetings: meetings.filter(meeting => meeting.status === 'completed').length
    };
    
    return {
      students,
      meetings,
      stats
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

const facultyService = {
  getAssignedStudents,
  getMeetings,
  scheduleMeeting,
  updateMeetingStatus,
  getFacultyProfile,
  updateProfile,
  getDashboardData,
  clearCache
};

export default facultyService; 