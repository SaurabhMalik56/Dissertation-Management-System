import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  FaUser, 
  FaFileAlt, 
  FaCalendarAlt, 
  FaBell,
  FaSync,
  FaTimes
} from 'react-icons/fa';
import axios from 'axios';
import facultyService from '../../services/facultyService';
import ProfileSection from '../../components/faculty/ProfileSection';
import AssignedStudents from '../../components/faculty/AssignedStudents';
import MeetingsManager from '../../components/faculty/MeetingsManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Shared meeting store - this helps ensure meetings are accessible across services
// In a production app, this would be replaced with a centralized state management system or backend API
window.SHARED_MEETINGS_STORE = window.SHARED_MEETINGS_STORE || {
  meetings: [],
  addMeeting: function(meeting) {
    this.meetings.push(meeting);
    console.log('Added meeting to shared store:', meeting);
    console.log('Total meetings in shared store:', this.meetings.length);
    
    // Dispatch a custom event that other components can listen for
    const meetingEvent = new CustomEvent('new-meeting-created', { 
      detail: { meeting }
    });
    window.dispatchEvent(meetingEvent);
    
    // Store in localStorage as a fallback
    try {
      const existingMeetings = JSON.parse(localStorage.getItem('shared_meetings') || '[]');
      existingMeetings.push(meeting);
      localStorage.setItem('shared_meetings', JSON.stringify(existingMeetings));
    } catch (error) {
      console.error('Failed to store meeting in localStorage:', error);
    }
  },
  getMeetings: function() {
    // Try to load from localStorage if the store is empty
    if (this.meetings.length === 0) {
      try {
        const storedMeetings = JSON.parse(localStorage.getItem('shared_meetings') || '[]');
        this.meetings = storedMeetings;
      } catch (error) {
        console.error('Failed to load meetings from localStorage:', error);
      }
    }
    return this.meetings;
  },
  clear: function() {
    this.meetings = [];
    localStorage.removeItem('shared_meetings');
  }
};

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeProjects: 0,
    upcomingMeetings: 0,
    pendingRequests: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Meeting Modal State
  const [meetingModal, setMeetingModal] = useState({
    isOpen: false,
    studentId: null,
    studentName: '',
    projectId: null,
    formData: {
      meetingNumber: '1',
      date: '',
      time: '',
      meetingType: 'online'
    }
  });

  useEffect(() => {
    // Simulate API call to fetch faculty data
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // In a real app, these would be actual API calls with the user's token
        // const response = await axios.get('/api/faculty/dashboard', {
        //   headers: { Authorization: `Bearer ${user.token}` }
        // });
        
        // For now, use mock data
        setTimeout(() => {
          setStudents([
            { id: 1, name: 'John Doe', rollNo: 'CS001', project: 'Machine Learning in Healthcare', progress: 65 },
            { id: 2, name: 'Jane Smith', rollNo: 'CS002', project: 'Blockchain Applications', progress: 20 },
            { id: 3, name: 'Robert Johnson', rollNo: 'CS003', project: 'Cloud Computing Solutions', progress: 45 }
          ]);
          
          setProjects([
            { id: 1, title: 'Machine Learning in Healthcare', student: 'John Doe', progress: 65, deadline: '2023-12-15' },
            { id: 2, title: 'Blockchain Applications', student: 'Jane Smith', progress: 20, deadline: '2024-02-28' },
            { id: 3, title: 'Cloud Computing Solutions', student: 'Robert Johnson', progress: 45, deadline: '2024-01-20' }
          ]);
          
          setMeetings([
            { id: 1, title: 'Weekly Progress Review', student: 'John Doe', date: '2023-05-10T14:00:00', status: 'scheduled' },
            { id: 2, title: 'Project Proposal Discussion', student: 'Jane Smith', date: '2023-05-05T11:30:00', status: 'completed' },
            { id: 3, title: 'Methodology Review', student: 'Robert Johnson', date: '2023-05-15T10:00:00', status: 'scheduled' },
            { id: 4, title: 'Final Presentation Prep', student: 'John Doe', date: '2023-05-20T15:30:00', status: 'pending' }
          ]);
          
          setStats({
            totalStudents: 3,
            activeProjects: 3,
            upcomingMeetings: 2,
            pendingRequests: 1
          });
          
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (user) {
      console.log('User info in Dashboard:', user);
      // Check if user ID is available
      if (!user._id && !user.id) {
        console.warn('User ID is missing in the Redux store');
      }
    }
  }, [user]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'scheduled':
        return 'badge-primary';
      case 'completed':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      default:
        return 'badge-secondary';
    }
  };

  const handleScheduleMeeting = async (studentId) => {
    try {
      console.log('Scheduling meeting for student ID:', studentId);
      
      // Instead of trying to find the student in the local state,
      // fetch the student details directly from the API
      let studentInfo = null;
      
      // Check if we already have the student data in our API response
      // First check the AssignedStudents component data (from API)
      const apiStudents = document.querySelectorAll('tr[data-student-id]');
      for (const element of apiStudents) {
        if (element.getAttribute('data-student-id') === studentId) {
          const nameElement = element.querySelector('.student-name');
          if (nameElement) {
            studentInfo = {
              _id: studentId,
              fullName: nameElement.textContent
            };
            break;
          }
        }
      }
      
      // If not found in API response, check our mock data
      if (!studentInfo) {
        const mockStudent = students.find(s => s.id === studentId || s._id === studentId);
        if (mockStudent) {
          studentInfo = {
            _id: studentId,
            fullName: mockStudent.fullName || mockStudent.name
          };
        }
      }
      
      // If still not found, just use the ID
      if (!studentInfo) {
        studentInfo = {
          _id: studentId,
          fullName: 'Student'
        };
      }
      
      // Open the meeting modal with the available student information
      setMeetingModal({
        isOpen: true,
        studentId: studentId,
        studentName: studentInfo.fullName,
        projectId: null,
        formData: {
          meetingNumber: '1',
          date: new Date().toISOString().split('T')[0], // Today's date as default
          time: '10:00',
          meetingType: 'online'
        }
      });
      
    } catch (error) {
      console.error('Error setting up meeting:', error);
      toast.error('Could not set up meeting. Please try again.');
    }
  };
  
  const handleMeetingInputChange = (e) => {
    const { name, value } = e.target;
    setMeetingModal(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [name]: value
      }
    }));
  };
  
  const getUserId = () => {
    // First try _id which is commonly used in MongoDB
    if (user && user._id) {
      return user._id;
    }
    // Then try id as fallback
    if (user && user.id) {
      return user.id;
    }
    // If still no id, generate a temporary one (not ideal but prevents crashes)
    console.error('No user ID found in Redux store');
    return 'temp_' + Date.now();
  };
  
  const handleSubmitMeeting = async (e) => {
    e.preventDefault();
    
    try {
      const { meetingNumber, date, time, meetingType } = meetingModal.formData;
      
      // Format date and time for API
      const meetingDateTime = `${date}T${time}:00`;
      
      // Get faculty ID
      const facultyId = getUserId();
      
      // Find student's project ID if available
      let projectId = meetingModal.projectId;
      
      if (!projectId) {
        // Try to find the student's project ID from our local data
        const student = students.find(s => 
          s.id === meetingModal.studentId || 
          s._id === meetingModal.studentId
        );
        
        if (student && (student.project?._id || student.project?.id)) {
          projectId = student.project._id || student.project.id;
        } else {
          // If no project ID found, create a temporary one - ideally this would be handled server-side
          projectId = 'temp_project_' + Date.now();
        }
      }
      
      // Create meeting title
      const meetingTitle = `Meeting ${meetingNumber} with ${meetingModal.studentName}`;
      
      // Prepare meeting data for API
      const meetingData = {
        title: meetingTitle,
        projectId: projectId,
        studentId: meetingModal.studentId,
        scheduledDate: meetingDateTime,
        meetingNumber: parseInt(meetingNumber),
        guideNotes: '', // Empty string since the faculty will fill this later
        meetingType: meetingType,
        duration: 45 // Default duration in minutes
      };
      
      console.log('Scheduling meeting with data:', meetingData);
      
      // Call the API via service
      setIsLoading(true);
      const result = await facultyService.createMeeting(meetingData, user.token);
      setIsLoading(false);
      
      // Handle the result
      if (result.success) {
        // Explicitly add the meeting to the shared store to ensure it's accessible to students
        if (window.SHARED_MEETINGS_STORE) {
          window.SHARED_MEETINGS_STORE.addMeeting(result.data);
          console.log('Added meeting to shared store:', result.data);
        }
        
        // Close the modal
        setMeetingModal(prev => ({ ...prev, isOpen: false }));
        
        // Show success message
        toast.success(
          <div>
            <div>Meeting scheduled successfully</div>
            <div className="text-xs mt-1">Student has been notified about the new meeting.</div>
          </div>
        );
        
        // Add the new meeting to the meetings state and update UI
        const newMeeting = {
          id: result.data._id,
          _id: result.data._id, // Ensure both id formats are present
          title: result.data.title,
          studentName: meetingModal.studentName,
          student: meetingModal.studentId, // Preserve student ID for filtering
          studentId: meetingModal.studentId, // Add explicit studentId field
          date: result.data.scheduledDate,
          scheduledDate: result.data.scheduledDate,
          status: 'scheduled',
          meetingNumber: parseInt(meetingNumber)
        };
        
        setMeetings(prevMeetings => [...prevMeetings, newMeeting]);
        
        // Update stats
        setStats(prevStats => ({
          ...prevStats,
          upcomingMeetings: prevStats.upcomingMeetings + 1
        }));
        
        // Refresh meetings data to ensure we have the latest state from the server
        facultyService.clearCache();
        
        // If we're on the meetings tab, initiate a refresh
        if (activeTab === 'meetings') {
          toast.info('Refreshing meetings list...');
          fetchDashboardData();
        }
      } else {
        // Show error message
        toast.error(result.message || 'Failed to schedule meeting');
      }
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      toast.error(error.message || 'Failed to schedule meeting');
      setIsLoading(false);
    }
  };
  
  const closeMeetingModal = () => {
    setMeetingModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleUpdateProgress = (projectId) => {
    // Handle updating project progress - in a real app this would open a modal
    console.log(`Update progress for project ID: ${projectId}`);
  };

  const handleMeetingAction = (meetingId, action) => {
    try {
      console.log(`${action} meeting ID: ${meetingId}`);
      
      // Find the meeting in our state
      const meetingIndex = meetings.findIndex(m => m.id === meetingId);
      if (meetingIndex === -1) {
        console.error(`Meeting with ID ${meetingId} not found`);
        toast.error('Meeting not found');
        return;
      }
      
      // Create a copy of our meetings array
      const updatedMeetings = [...meetings];
      const meeting = { ...updatedMeetings[meetingIndex] };
      
      // Handle different actions
      switch (action) {
        case 'start':
          // In a real app this would start a meeting (e.g., open video call)
          toast.info(`Starting meeting with ${meeting.student}`);
          break;
          
        case 'cancel':
          // Update meeting status to cancelled
          meeting.status = 'cancelled';
          updatedMeetings[meetingIndex] = meeting;
          setMeetings(updatedMeetings);
          
          // Update stats
          setStats(prevStats => ({
            ...prevStats,
            upcomingMeetings: prevStats.upcomingMeetings - 1
          }));
          
          toast.success('Meeting cancelled successfully');
          break;
          
        case 'confirm':
          // Update meeting status to scheduled (confirmed)
          meeting.status = 'scheduled';
          updatedMeetings[meetingIndex] = meeting;
          setMeetings(updatedMeetings);
          
          // Update stats
          setStats(prevStats => ({
            ...prevStats,
            pendingRequests: prevStats.pendingRequests - 1,
            upcomingMeetings: prevStats.upcomingMeetings + 1
          }));
          
          toast.success('Meeting confirmed successfully');
          break;
          
        case 'reject':
          // Update meeting status to rejected
          meeting.status = 'rejected';
          updatedMeetings[meetingIndex] = meeting;
          setMeetings(updatedMeetings);
          
          // Update stats
          setStats(prevStats => ({
            ...prevStats,
            pendingRequests: prevStats.pendingRequests - 1
          }));
          
          toast.success('Meeting request rejected');
          break;
          
        case 'complete':
          // Update meeting status to completed
          meeting.status = 'completed';
          updatedMeetings[meetingIndex] = meeting;
          setMeetings(updatedMeetings);
          
          // Update stats
          setStats(prevStats => ({
            ...prevStats,
            upcomingMeetings: prevStats.upcomingMeetings - 1
          }));
          
          toast.success('Meeting marked as completed');
          break;
          
        case 'view-notes':
          // In a real app this would show meeting notes
          toast.info('Viewing meeting notes - Feature coming soon');
          break;
          
        default:
          console.error(`Unknown action: ${action}`);
          toast.error('Unknown action');
      }
      
      // In a real app, this would call the API to update the meeting status
      console.log(`Updated meeting status for ID ${meetingId} to ${action === 'confirm' ? 'scheduled' : action}`);
      
    } catch (error) {
      console.error('Error handling meeting action:', error);
      toast.error('Failed to process meeting action');
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome section with stats */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.fullName}</h1>
              <p className="text-gray-600 mt-1">Monitor your students' dissertation progress and manage meetings.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="badge badge-primary">Faculty</span>
              <span className="ml-2 text-sm text-gray-500">{user?.department}</span>
            </div>
          </div>
          
          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-50 text-indigo-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="font-semibold text-gray-600">Students</h2>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="font-semibold text-gray-600">Projects</h2>
                  <p className="text-2xl font-bold">{stats.activeProjects}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-50 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="font-semibold text-gray-600">Meetings</h2>
                  <p className="text-2xl font-bold">{stats.upcomingMeetings}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-yellow-100 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-50 text-yellow-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="font-semibold text-gray-600">Pending</h2>
                  <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content tabs */}
      <div className="card">
        <div className="card-header">
          <div className="tab-container">
            <ul className="tab-list">
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'overview' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'students' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => setActiveTab('students')}
                >
                  Students
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'projects' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => setActiveTab('projects')}
                >
                  Projects
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'meetings' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => setActiveTab('meetings')}
                >
                  Meetings
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-800">Faculty Dashboard</h2>
                  
                  {/* Recent activity */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Today's Schedule</h3>
                    <div className="space-y-4">
                      {meetings.filter(m => m.status === 'scheduled').slice(0, 2).map(meeting => (
                        <div key={meeting.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                              <h4 className="font-medium text-gray-800">{meeting.title}</h4>
                              <p className="text-sm text-gray-500">With {meeting.student}</p>
                            </div>
                            <div className="mt-2 md:mt-0 flex flex-col md:flex-row md:items-center">
                              <span className="badge badge-primary mb-2 md:mb-0 md:mr-2">{formatDate(meeting.date)}</span>
                              <div className="space-x-2">
                                <button 
                                  onClick={() => handleMeetingAction(meeting.id, 'start')}
                                  className="btn btn-primary btn-sm"
                                >
                                  Start Meeting
                                </button>
                                <button 
                                  onClick={() => handleMeetingAction(meeting.id, 'complete')}
                                  className="btn btn-success btn-sm"
                                >
                                  Complete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {meetings.filter(m => m.status === 'scheduled').length === 0 && (
                        <p className="text-gray-500 italic">No meetings scheduled for today.</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Student progress */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Student Progress</h3>
                    <div className="space-y-4">
                      {students.map(student => (
                        <div key={student.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                              <h4 className="font-medium text-gray-800">{student.name}</h4>
                              <p className="text-sm text-gray-500">{student.project}</p>
                              <p className="text-xs text-gray-400">Roll No: {student.rollNo}</p>
                            </div>
                            <div className="mt-3 md:mt-0">
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-700 mr-2">{student.progress}%</span>
                                <div className="w-32 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      student.progress < 30 ? 'bg-red-500' : 
                                      student.progress < 70 ? 'bg-yellow-500' : 
                                      'bg-green-500'
                                    }`}
                                    style={{ width: `${student.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                              
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button 
                                  onClick={() => handleUpdateProgress(student.id)}
                                  className="btn btn-secondary btn-sm"
                                >
                                  Update
                                </button>
                                <button 
                                  onClick={() => handleScheduleMeeting(student.id)}
                                  className="btn btn-primary btn-sm"
                                >
                                  Schedule
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Students Tab */}
              {activeTab === 'students' && (
                <AssignedStudents
                  onScheduleMeeting={(student, projectId) => {
                    // Now receives the entire student object and project ID
                    console.log('Schedule meeting with student:', student, 'Project ID:', projectId);
                    
                    // Check if we got a student object or just an ID
                    if (student && typeof student === 'object') {
                      setMeetingModal({
                        isOpen: true,
                        studentId: student._id,
                        studentName: student.fullName || 'Student',
                        projectId: projectId, // Store the project ID
                        formData: {
                          meetingNumber: '1',
                          date: new Date().toISOString().split('T')[0], // Today's date as default
                          time: '10:00',
                          meetingType: 'online'
                        }
                      });
                    } else {
                      // Fallback to the previous implementation if we just got an ID
                      handleScheduleMeeting(student);
                    }
                  }}
                  onUpdateProgress={(studentId, projectId) => {
                    console.log('Update progress for student:', studentId, 'project:', projectId);
                    // You can add logic here to open a progress update form
                  }}
                />
              )}
              
              {/* Projects Tab */}
              {activeTab === 'projects' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Supervised Projects</h2>
                    <div>
                      <select className="form-input mr-2">
                        <option>All Projects</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                      <button className="btn btn-primary">Add Project</button>
                    </div>
                  </div>
                  
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Project Title</th>
                          <th>Student</th>
                          <th>Progress</th>
                          <th>Deadline</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projects.map(project => (
                          <tr key={project.id}>
                            <td className="font-medium text-gray-800">{project.title}</td>
                            <td>{project.student}</td>
                            <td>
                              <div className="flex items-center">
                                <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      project.progress < 30 ? 'bg-red-500' : 
                                      project.progress < 70 ? 'bg-yellow-500' : 
                                      'bg-green-500'
                                    }`}
                                    style={{ width: `${project.progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm">{project.progress}%</span>
                              </div>
                            </td>
                            <td>{new Date(project.deadline).toLocaleDateString()}</td>
                            <td>
                              <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                                View
                              </button>
                              <button className="text-green-600 hover:text-green-900 mr-2">
                                Evaluate
                              </button>
                              <button className="text-yellow-600 hover:text-yellow-900">
                                Documents
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Meetings Tab */}
              {activeTab === 'meetings' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Meeting Schedule</h2>
                    <div>
                      <select className="form-input mr-2">
                        <option>All Meetings</option>
                        <option>Scheduled</option>
                        <option>Completed</option>
                        <option>Pending</option>
                      </select>
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          // If we have students, open modal with first student
                          if (students.length > 0) {
                            const firstStudent = students[0];
                            const studentId = firstStudent._id || firstStudent.id;
                            const studentName = firstStudent.fullName || firstStudent.name;
                            
                            setMeetingModal({
                              isOpen: true,
                              studentId: studentId,
                              studentName: studentName,
                              projectId: null,
                              formData: {
                                meetingNumber: '1',
                                date: new Date().toISOString().split('T')[0], // Today's date as default
                                time: '10:00',
                                meetingType: 'online'
                              }
                            });
                          } else {
                            toast.warning('No students available to schedule meetings with');
                          }
                        }}
                      >
                        Schedule New
                      </button>
                    </div>
                  </div>
                  
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Meeting Title</th>
                          <th>Student</th>
                          <th>Date & Time</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {meetings.map(meeting => (
                          <tr key={meeting.id}>
                            <td className="font-medium text-gray-800">{meeting.title}</td>
                            <td>{meeting.student}</td>
                            <td>{formatDate(meeting.date)}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(meeting.status)}`}>
                                {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              {meeting.status === 'scheduled' && (
                                <>
                                  <button 
                                    onClick={() => handleMeetingAction(meeting.id, 'start')}
                                    className="text-indigo-600 hover:text-indigo-900 mr-2"
                                  >
                                    Start
                                  </button>
                                  <button 
                                    onClick={() => handleMeetingAction(meeting.id, 'cancel')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {meeting.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleMeetingAction(meeting.id, 'confirm')}
                                    className="text-green-600 hover:text-green-900 mr-2"
                                  >
                                    Confirm
                                  </button>
                                  <button 
                                    onClick={() => handleMeetingAction(meeting.id, 'reject')}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {meeting.status === 'completed' && (
                                <button 
                                  onClick={() => handleMeetingAction(meeting.id, 'view-notes')}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  View Notes
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Meeting Scheduling Modal */}
      {meetingModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Schedule Meeting</h3>
              <button 
                onClick={closeMeetingModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmitMeeting} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <input
                  type="text"
                  className="form-input w-full bg-gray-100"
                  value={meetingModal.studentName}
                  disabled
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Number
                  </label>
                  <select
                    name="meetingNumber"
                    className="form-select w-full"
                    value={meetingModal.formData.meetingNumber}
                    onChange={handleMeetingInputChange}
                    required
                  >
                    <option value="1">Meeting 1</option>
                    <option value="2">Meeting 2</option>
                    <option value="3">Meeting 3</option>
                    <option value="4">Meeting 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meeting Type
                  </label>
                  <select
                    name="meetingType"
                    className="form-select w-full"
                    value={meetingModal.formData.meetingType}
                    onChange={handleMeetingInputChange}
                    required
                  >
                    <option value="online">Online</option>
                    <option value="in-person">In-Person</option>
                    <option value="initial">Initial Discussion</option>
                    <option value="progress-review">Progress Review</option>
                    <option value="final-discussion">Final Discussion</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    className="form-input w-full"
                    value={meetingModal.formData.date}
                    onChange={handleMeetingInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    className="form-input w-full"
                    value={meetingModal.formData.time}
                    onChange={handleMeetingInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  onClick={closeMeetingModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 