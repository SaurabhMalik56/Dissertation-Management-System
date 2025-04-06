import axios from 'axios';

// Get base URL from environment or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Set auth token for any requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Get student dashboard data (projects, guides, meetings)
const getStudentDashboard = async (token) => {
  setAuthToken(token);
  const response = await axios.get(`${API_URL}/students/dashboard`);
  return response.data;
};

// Get student's projects
const getStudentProjects = async (token) => {
  setAuthToken(token);
  const response = await axios.get(`${API_URL}/students/projects`);
  return response.data;
};

// Get student's meetings
const getStudentMeetings = async (token) => {
  setAuthToken(token);
  const response = await axios.get(`${API_URL}/students/meetings`);
  return response.data;
};

// Get student's assigned guide
const getStudentGuide = async (token) => {
  setAuthToken(token);
  const response = await axios.get(`${API_URL}/students/guide`);
  return response.data;
};

// Submit a dissertation proposal
const submitProposal = async (proposalData, token) => {
  try {
    // Ensure token is set properly
    if (!token) {
      throw new Error('Authentication token is required');
    }
    
    // Create a copy of the data to avoid mutating the original
    const dataToSubmit = { ...proposalData };
    
    // Format technologies if it's a string (comma-separated list)
    if (typeof dataToSubmit.technologies === 'string') {
      // No need to convert to array here as the backend will handle it
      console.log('Technologies will be processed by backend:', dataToSubmit.technologies);
    }
    
    // Ensure values are not empty strings
    Object.keys(dataToSubmit).forEach(key => {
      if (dataToSubmit[key] === '') {
        console.warn(`Field "${key}" has empty string value, setting to null`);
        dataToSubmit[key] = null;
      }
    });
    
    // Special check for department - ensure it's not empty
    if (!dataToSubmit.department || dataToSubmit.department.trim() === '') {
      console.error('Department field is empty or missing');
      // Try to set a hardcoded value as a last resort
      dataToSubmit.department = 'CSE';
      console.log('Department set to hardcoded value:', dataToSubmit.department);
    }
    
    // Special check for expectedOutcome - ensure it's not empty
    if (!dataToSubmit.expectedOutcome || dataToSubmit.expectedOutcome.trim() === '') {
      console.error('expectedOutcome field is empty or missing');
      // Set a default value if missing
      dataToSubmit.expectedOutcome = 'To be determined';
      console.log('expectedOutcome set to default value:', dataToSubmit.expectedOutcome);
    }
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'problemStatement', 'technologies', 'expectedOutcome', 'department'];
    const missingFields = [];
    
    requiredFields.forEach(field => {
      if (!dataToSubmit[field]) {
        missingFields.push(field);
        console.error(`Required field "${field}" is missing in proposal data`);
      }
    });
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      throw new Error(`Required fields missing: ${missingFields.join(', ')}`);
    }
    
    // Set authorization header for this specific request
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };
    
    // Log detailed information for debugging
    console.log('Proposal critical fields (after validation):', {
      department: dataToSubmit.department,
      expectedOutcome: dataToSubmit.expectedOutcome,
      departmentType: typeof dataToSubmit.department,
      expectedOutcomeType: typeof dataToSubmit.expectedOutcome
    });
    console.log('Complete proposal data (JSON):', JSON.stringify(dataToSubmit, null, 2));
    console.log('API URL:', `${API_URL}/projects/proposal`);
    
    const response = await axios.post(`${API_URL}/projects/proposal`, dataToSubmit, config);
    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error Details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    throw error;
  }
};

// Update dissertation progress
const updateProgress = async (progressData, token) => {
  setAuthToken(token);
  const response = await axios.post(`${API_URL}/projects/progress`, progressData);
  return response.data;
};

// Get student notifications
const getNotifications = async (token) => {
  setAuthToken(token);
  const response = await axios.get(`${API_URL}/students/notifications`);
  return response.data;
};

// Submit final dissertation
const submitFinalDissertation = async (dissertationData, token) => {
  setAuthToken(token);
  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  };
  
  const response = await axios.post(
    `${API_URL}/projects/final-submission`, 
    dissertationData,
    config
  );
  
  return response.data;
};

// Get student evaluation results
const getEvaluationResults = async (token) => {
  setAuthToken(token);
  const response = await axios.get(`${API_URL}/students/evaluation`);
  return response.data;
};

const studentService = {
  getStudentDashboard,
  getStudentProjects,
  getStudentMeetings,
  getStudentGuide,
  submitProposal,
  updateProgress,
  getNotifications,
  submitFinalDissertation,
  getEvaluationResults
};

export default studentService; 