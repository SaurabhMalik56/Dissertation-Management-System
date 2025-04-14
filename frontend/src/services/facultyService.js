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
      description: 'Weekly check-in to discuss project progress',
      meetingType: 'progress-review'
    },
    { 
      _id: '2', 
      title: 'Project Proposal Discussion', 
      studentName: 'Jane Smith', 
      studentId: '2',
      scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), 
      status: 'completed',
      description: 'Initial discussion about project proposal',
      feedback: 'Good proposal, needs more detail on methodology',
      meetingType: 'initial'
    },
    { 
      _id: '3', 
      title: 'Methodology Review', 
      studentName: 'Robert Johnson', 
      studentId: '3',
      scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), 
      status: 'scheduled',
      description: 'Review of the proposed methodology',
      meetingType: 'progress-review'
    },
    { 
      _id: '4', 
      title: 'Final Presentation Prep', 
      studentName: 'John Doe', 
      studentId: '1',
      scheduledDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), 
      status: 'pending',
      description: 'Preparation for the final presentation',
      meetingType: 'final-discussion'
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
      console.log('Fetching assigned students from API');
      // Try faculty-specific endpoint
      const response = await axios.get(`${API_URL}/faculty/students`);
      console.log('API response for assigned students:', response.data);
      
      // Process and cache the result
      cache.assignedStudents = response.data;
      cache.assignedStudentsTimestamp = Date.now();
      
      return response.data;
    } catch (error) {
      console.error('Error fetching assigned students:', error);
      
      // If endpoint not found, use mock data
      if (error.response && error.response.status === 404) {
        console.log('Faculty API endpoint not found or no students assigned. Using mock student data.');
        
        // If the error is that no students were found for this faculty
        if (error.response.data && error.response.data.message) {
          console.log('Server message:', error.response.data.message);
        }
        
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
    
    // Use cache if available and not expired, unless force refresh is requested
    if (!forceRefresh && cache.meetings && !isCacheExpired(cache.meetingsTimestamp)) {
      console.log('Using cached meetings data from facultyService, count:', cache.meetings.length);
      return cache.meetings;
    }
    
    try {
      console.log('Fetching meetings from API');
      const response = await axios.get(`${API_URL}/meetings`);
      
      // Process and normalize the response data to ensure consistent format
      const normalizedMeetings = response.data.map(meeting => ({
        ...meeting,
        id: meeting._id, // Add id as alias for _id for compatibility
        // Map other fields to ensure compatibility with current frontend
        student: meeting.studentId, 
        guide: meeting.facultyId,
        project: meeting.projectId,
        // Include any other field mappings needed
      }));
      
      // Cache the result
      cache.meetings = normalizedMeetings;
      cache.meetingsTimestamp = Date.now();
      
      console.log('Successfully fetched meetings from API, count:', normalizedMeetings.length);
      return normalizedMeetings;
    } catch (error) {
      console.error('Error fetching meetings from API:', error.message);
      
      // If endpoint not found or server error, use mock data in development
      if (process.env.NODE_ENV === 'development' && 
          (error.response?.status === 404 || error.response?.status >= 500 || !error.response)) {
        console.log('Meetings API endpoint not found or server error. Using mock meeting data in development.');
        
        // Ensure we're using the latest mockData.meetings
        cache.meetings = [...mockData.meetings]; // Create a fresh copy
        cache.meetingsTimestamp = Date.now();
        
        console.log('Using mock data, meetings count:', mockData.meetings.length);
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
    // Extract data fields from statusData
    const { status, meetingSummary, scheduledDate, studentPoints, guideRemarks } = statusData;
    console.log('Received statusData in service:', statusData);
    
    // Create a clean update object with only needed fields
    const updateData = {
      status: status || 'scheduled',
      guideRemarks: guideRemarks || '',
      studentPoints: studentPoints || '', 
      meetingSummary: meetingSummary || ''
    };
    
    // Add scheduledDate only if it exists
    if (scheduledDate) {
      updateData.scheduledDate = scheduledDate;
    }
    
    console.log('Prepared updateData to send to API:', updateData);
    
    try {
      // Use native fetch API instead of axios to avoid any transformation issues
      const response = await fetch(`${API_URL}/meetings/${meetingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Invalidate meetings cache
      cache.meetings = null;
      cache.meetingsTimestamp = null;
      
      console.log('API response from meeting update:', data);
      return data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Meeting status update API endpoint not found. Using mock data operation.');
        
        // Update in mock data
        mockData.meetings = mockData.meetings.map(meeting => 
          meeting._id === meetingId 
            ? { ...meeting, ...updateData } 
            : meeting
        );
        
        // Update cache with mock data
        cache.meetings = mockData.meetings;
        cache.meetingsTimestamp = Date.now();
        
        // Create a copy of the relevant mock meeting with updated fields
        const updatedMeeting = mockData.meetings.find(m => m._id === meetingId);
        
        if (!updatedMeeting) {
          throw new Error('Meeting not found');
        }
        
        return updatedMeeting;
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

// Create a meeting
const createMeeting = async (meetingData, token) => {
  try {
    console.log('Creating meeting with data:', meetingData);
    
    // Ensure required fields are present
    if (!meetingData.title || !meetingData.studentId || !meetingData.scheduledDate) {
      return {
        success: false,
        message: 'Missing required meeting fields (title, studentId, scheduledDate)'
      };
    }

    // Set auth token for the request
    setAuthToken(token);
    
    // Format data to match database model requirements
    const formattedMeetingData = {
      ...meetingData,
      // Ensure proper date format for the API
      scheduledDate: new Date(meetingData.scheduledDate).toISOString(),
      // Ensure meeting has a status
      status: meetingData.status || 'scheduled',
      // Add any other required fields for your database model
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Make the API call to create the meeting
    try {
      console.log('Sending formatted meeting data to API:', formattedMeetingData);
      
      // Send data to the database through API
      const response = await axios.post(`${API_URL}/meetings`, formattedMeetingData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Meeting created successfully in database:', response.data);
      
      // Process the response to ensure it has the correct format
      const newMeeting = {
        ...response.data,
        id: response.data._id || response.data.id, // Ensure both id formats are present
        _id: response.data._id || response.data.id,
        student: response.data.studentId || response.data.student, // Ensure student ID is available in both formats
        studentId: response.data.studentId || response.data.student,
      };
      
      // Add to cache
      if (cache.meetings) {
        cache.meetings.push(newMeeting);
      }
      
      // Add to shared store for other components
      if (window.SHARED_MEETINGS_STORE) {
        console.log('Adding meeting to SHARED_MEETINGS_STORE:', newMeeting);
        window.SHARED_MEETINGS_STORE.addMeeting(newMeeting);
      }
      
      // Clear cache to ensure fresh data on next fetch
      cache.meetings = null;
      cache.meetingsTimestamp = null;
      
      // Return success response
      return {
        success: true,
        data: newMeeting,
        message: 'Meeting created successfully in database'
      };
    } catch (error) {
      console.error('Error creating meeting in database:', error.response?.data || error.message);
      
      // Handle specific error cases
      if (error.response) {
        const status = error.response.status;
        const errorMessage = error.response.data?.message || 'Unknown error occurred';
        
        if (status === 401) {
          return {
            success: false,
            message: 'Authentication failed. Please login again.'
          };
        } else if (status === 400) {
          return {
            success: false,
            message: `Bad request: ${errorMessage}`
          };
        } else if (status === 500) {
          return {
            success: false,
            message: 'Server error. Please try again later.'
          };
        }
      }
      
      // Generic error case
      return {
        success: false,
        message: error.message || 'Failed to create meeting'
      };
    }
  } catch (error) {
    console.error('Unexpected error in createMeeting:', error);
    return {
      success: false,
      message: 'An unexpected error occurred while creating the meeting'
    };
  }
};

// Helper function to get user ID
const getUserId = () => {
  try {
    // Try to get from redux store via localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && (user._id || user.id)) {
      return user._id || user.id;
    }
    return 'unknown_user_id';
  } catch (error) {
    console.error('Error getting user ID:', error);
    return 'unknown_user_id';
  }
};

// Direct update for meeting fields - bypasses the server's field limitations
const directUpdateMeeting = async (meetingId, updateData, token) => {
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    console.log('Sending meeting update with Axios:', updateData);
    
    // Format data to ensure all fields are included
    const formattedData = {
      status: updateData.status || 'scheduled',
      guideRemarks: updateData.guideRemarks || '',
      studentPoints: String(updateData.studentPoints || ''),
      meetingSummary: String(updateData.meetingSummary || '')
    };
    
    if (updateData.scheduledDate) {
      formattedData.scheduledDate = updateData.scheduledDate;
    }
    
    // Create auth header for request
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    // Make the API call
    const response = await axios.put(
      `${API_URL}/meetings/${meetingId}/status`, 
      formattedData,
      config
    );
    
    console.log('API response from meeting update:', response.data);
    
    // Invalidate cache
    cache.meetings = null;
    cache.meetingsTimestamp = null;
    
    return response.data;
  } catch (error) {
    console.error('Error updating meeting:', error);
    throw new Error(error.response?.data?.message || 'Failed to update meeting');
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
  clearCache,
  createMeeting,
  getUserId,
  directUpdateMeeting
};

export default facultyService; 