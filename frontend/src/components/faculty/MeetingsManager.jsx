import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { 
  FaCalendarAlt, 
  FaClock, 
  FaCheck, 
  FaTimes, 
  FaEdit, 
  FaTrash, 
  FaUserGraduate, 
  FaPlus,
  FaSave
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import facultyService from '../../services/facultyService';

const MeetingsManager = ({ studentId }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [meetingToEdit, setMeetingToEdit] = useState(null);
  const [formData, setFormData] = useState({
    meetingNumber: '',
    scheduledDate: '',
    summary: '',
    status: 'scheduled',
    studentPoints: '',
    guideRemarks: ''
  });
  
  const { user } = useSelector((state) => state.auth);
  const today = new Date().toISOString().split('T')[0];

  // Fetch meetings
  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const allMeetings = await facultyService.getMeetings(user?.token);
        
        // Filter meetings for the specific student if studentId is provided
        const filteredMeetings = studentId 
          ? allMeetings.filter(meeting => {
              // Handle both old and new field names
              const meetingStudentId = meeting.studentId || meeting.student;
              const studentIdToCompare = typeof meetingStudentId === 'object' ? 
                meetingStudentId._id : meetingStudentId;
              
              return studentIdToCompare === studentId;
            })
          : allMeetings;
        
        // Sort meetings by meeting number
        filteredMeetings.sort((a, b) => a.meetingNumber - b.meetingNumber);
        
        setMeetings(filteredMeetings);
      } catch (err) {
        console.error('Error fetching meetings:', err);
        setError('Failed to load meetings. Please try again.');
        toast.error('Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchMeetings();
    }
  }, [user, studentId]);

  const refreshMeetings = async () => {
    try {
      setLoading(true);
      const allMeetings = await facultyService.getMeetings(user?.token, true);
      
      // Filter meetings for the specific student if studentId is provided
      const filteredMeetings = studentId 
        ? allMeetings.filter(meeting => {
            // Handle both old and new field names
            const meetingStudentId = meeting.studentId || meeting.student;
            const studentIdToCompare = typeof meetingStudentId === 'object' ? 
              meetingStudentId._id : meetingStudentId;
            
            return studentIdToCompare === studentId;
          })
        : allMeetings;
      
      // Sort meetings by meeting number
      filteredMeetings.sort((a, b) => a.meetingNumber - b.meetingNumber);
      
      setMeetings(filteredMeetings);
      toast.success('Meetings refreshed');
    } catch (err) {
      toast.error('Failed to refresh meetings');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      meetingNumber: '',
      scheduledDate: '',
      summary: '',
      status: 'scheduled',
      studentPoints: '',
      guideRemarks: ''
    });
    setMeetingToEdit(null);
    setShowAddForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate meeting number (1-4)
      const meetingNum = parseInt(formData.meetingNumber);
      if (isNaN(meetingNum) || meetingNum < 1 || meetingNum > 4) {
        toast.error('Meeting number must be between 1 and 4');
        return;
      }
      
      // Check if this meeting number already exists for this student and it's not the one being edited
      const existingMeeting = meetings.find(m => 
        m.meetingNumber === meetingNum && 
        (!meetingToEdit || m._id !== meetingToEdit._id)
      );
      
      if (existingMeeting) {
        toast.error(`Meeting #${meetingNum} already exists for this student`);
        return;
      }
      
      // Get student info for title
      const studentInfo = meetings.length > 0 ? 
        (meetings[0].studentId?.fullName || meetings[0].student?.fullName || "Student") : 
        "Student";
      
      // Get project ID
      let projectId = null;
      if (meetingToEdit) {
        projectId = meetingToEdit.projectId || meetingToEdit.project;
        if (typeof projectId === 'object') {
          projectId = projectId._id;
        }
      } else if (meetings[0]) {
        projectId = meetings[0].projectId || meetings[0].project;
        if (typeof projectId === 'object') {
          projectId = projectId._id;
        }
      }
      
      if (!projectId) {
        toast.error('Could not determine project ID');
        setLoading(false);
        return;
      }
      
      // Prepare meeting data according to new API structure
      const meetingData = {
        title: `Meeting ${meetingNum} with ${studentInfo}`,
        studentId: studentId,
        projectId: projectId,
        meetingNumber: meetingNum,
        scheduledDate: `${formData.scheduledDate}T10:00:00`, // Default to 10 AM if no time specified
        meetingSummary: formData.summary || '',
        meetingType: formData.meetingType || 'progress-review',
        duration: 45
      };
      
      if (meetingToEdit) {
        // Update existing meeting
        try {
          // Prepare values with fallbacks - ensure they're non-empty strings
          const summary = formData.summary || 'Meeting summary provided by guide';
          const studentPoints = formData.studentPoints || 'Student points entered by guide';
          const guideRemarks = formData.guideRemarks || 'Guide remarks provided';
          
          // Create a raw update data object with forced string values
          const updateData = {
            status: formData.status,
            guideRemarks: String(guideRemarks),
            studentPoints: String(studentPoints),
            meetingSummary: String(summary),
            scheduledDate: `${formData.scheduledDate}T10:00:00`
          };
          
          console.log('Sending direct meeting update:', updateData);
          
          // Make direct XMLHttpRequest without using service layer
          const API_URL = 'http://localhost:5000/api';
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', `${API_URL}/meetings/${meetingToEdit._id}/status`, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.setRequestHeader('Authorization', `Bearer ${user.token}`);
          
          // Handle response
          xhr.onload = async function() {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const result = JSON.parse(xhr.responseText);
                console.log('XHR success:', result);
                
                // Update local state immediately
                setMeetings(prevMeetings => prevMeetings.map(meeting => 
                  meeting._id === meetingToEdit._id
                    ? { 
                        ...meeting, 
                        ...updateData,
                        notes: summary,
                        summary: summary
                      }
                    : meeting
                ));
                
                toast.success('Meeting updated successfully');
                
                // Refresh meetings data
                await refreshMeetings();
                
                // Close the form
                resetForm();
              } catch (parseError) {
                console.error('Error parsing response:', parseError);
                toast.error('Error updating meeting');
              }
            } else {
              console.error('XHR error:', xhr.status, xhr.statusText);
              toast.error(`Failed to update meeting: ${xhr.statusText}`);
            }
            
            setLoading(false);
          };
          
          // Handle network errors
          xhr.onerror = function() {
            console.error('Network error during meeting update');
            toast.error('Network error during meeting update');
            setLoading(false);
          };
          
          // Send request
          xhr.send(JSON.stringify(updateData));
          
        } catch (updateError) {
          console.error('Error updating meeting:', updateError);
          toast.error('Failed to update meeting');
          setLoading(false);
        }
      } else {
        // Create new meeting
        try {
          const result = await facultyService.createMeeting(
            meetingData,
            user.token
          );
          
          if (result.success) {
            toast.success('Meeting scheduled successfully');
          } else {
            throw new Error(result.message || 'Failed to schedule meeting');
          }
        } catch (createError) {
          console.error('Error creating meeting:', createError);
          toast.error(createError.message || 'Failed to schedule meeting');
        }
      }
      
      // Refresh meetings list
      await refreshMeetings();
      
      // Reset form
      resetForm();
    } catch (err) {
      console.error('Error saving meeting:', err);
      toast.error(meetingToEdit ? 'Failed to update meeting' : 'Failed to schedule meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (meeting) => {
    // Check if meeting date is in the past, and it's not already completed
    const meetingDate = new Date(meeting.scheduledDate);
    const isPastMeeting = meetingDate < new Date() && meeting.status !== 'completed';
    
    console.log('Editing meeting with data:', meeting);
    
    // Log all possible field names to help debugging
    console.log('Meeting fields available:', {
      meetingSummary: meeting.meetingSummary,
      summary: meeting.summary,
      notes: meeting.notes,
      studentPoints: meeting.studentPoints,
      guideRemarks: meeting.guideRemarks
    });
    
    setMeetingToEdit(meeting);
    
    // Make sure to use a consistent approach to field naming
    setFormData({
      meetingNumber: meeting.meetingNumber?.toString() || '1',
      scheduledDate: new Date(meeting.scheduledDate || meeting.date).toISOString().split('T')[0],
      // For each field, check all possible names and use appropriate fallbacks
      summary: meeting.meetingSummary || meeting.summary || meeting.notes || '',
      status: meeting.status || 'scheduled',
      studentPoints: meeting.studentPoints || '',
      guideRemarks: meeting.guideRemarks || ''
    });
    
    // Force default values if fields are empty to ensure they're saved properly
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        summary: prev.summary || 'Meeting summary will be added after completion',
        studentPoints: prev.studentPoints || 'Student points will be discussed during the meeting',
        guideRemarks: prev.guideRemarks || 'Guide remarks will be added after the meeting'
      }));
    }, 100);
    
    // Disable editing of meeting number and date for past meetings
    if (isPastMeeting) {
      toast.info('This meeting has passed. You can only update the notes and status.');
    }
    
    setShowAddForm(true);
  };

  const handleStatusChange = async (meetingId, newStatus) => {
    try {
      setLoading(true);
      
      // Force a complete meeting update with explicit values for required fields
      const updateData = {
        status: newStatus,
        // Force non-empty default values for all fields to ensure they're included in the update
        studentPoints: "Points updated when status changed to " + newStatus,
        meetingSummary: "Summary updated when status changed to " + newStatus,
        guideRemarks: "Remarks updated when status changed to " + newStatus
      };
      
      console.log('Force update for status change with data:', updateData);
      
      // Use direct update method with explicit XMLHttpRequest
      await facultyService.directUpdateMeeting(
        meetingId,
        updateData,
        user.token
      );
      
      toast.success(`Meeting marked as ${newStatus}`);
      
      // Immediately update local state while waiting for refresh
      setMeetings(prevMeetings => prevMeetings.map(m => 
        m._id === meetingId ? { ...m, ...updateData } : m
      ));
      
      // Refresh meetings after the local update to ensure UI consistency
      await refreshMeetings();
    } catch (err) {
      console.error('Error updating meeting status:', err);
      toast.error('Failed to update meeting status');
    } finally {
      setLoading(false);
    }
  };

  const isPastMeeting = (date) => {
    return new Date(date) < new Date();
  };

  // Function to create missing meetings for a student
  const createMissingMeetings = async () => {
    if (!studentId) return;
    
    try {
      setLoading(true);
      
      // Get existing meeting numbers
      const existingMeetingNumbers = meetings.map(m => m.meetingNumber);
      
      // Determine which meetings are missing (should have meetings 1-4)
      const missingMeetingNumbers = [1, 2, 3, 4].filter(num => !existingMeetingNumbers.includes(num));
      
      if (missingMeetingNumbers.length === 0) {
        toast.info('All meetings are already scheduled.');
        setLoading(false);
        return;
      }
      
      // Get project ID
      let projectId = null;
      if (meetings.length > 0) {
        projectId = meetings[0].projectId || meetings[0].project;
        if (typeof projectId === 'object') {
          projectId = projectId._id;
        }
      }
      
      if (!projectId) {
        toast.error('Could not determine project ID. Please create at least one meeting manually.');
        setLoading(false);
        return;
      }
      
      // Get student info
      const studentInfo = meetings.length > 0 ? 
        (meetings[0].studentId?.fullName || meetings[0].student?.fullName || "Student") : 
        "Student";
      
      // Create each missing meeting
      const createPromises = missingMeetingNumbers.map(async (meetingNum) => {
        // Create a minimum viable meeting
        const meetingData = {
          title: `Meeting ${meetingNum} with ${studentInfo}`,
          studentId: studentId,
          projectId: projectId,
          meetingNumber: meetingNum,
          scheduledDate: new Date().toISOString(), // Default to today
          meetingSummary: '',
          meetingType: 'progress-review',
          duration: 45
        };
        
        try {
          return await facultyService.createMeeting(meetingData, user.token);
        } catch (error) {
          console.error(`Error creating meeting ${meetingNum}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(createPromises);
      const successCount = results.filter(r => r && r.success).length;
      
      toast.success(`Successfully created ${successCount} missing meetings`);
      
      // Refresh meetings
      await refreshMeetings();
    } catch (error) {
      console.error('Error creating missing meetings:', error);
      toast.error('Failed to create missing meetings');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !meetings.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
        <p>{error}</p>
        <button 
          onClick={refreshMeetings}
          className="mt-2 text-sm text-red-700 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  const scheduledMeetingsCount = meetings.filter(m => m.status === 'scheduled').length;
  const canScheduleMoreMeetings = meetings.length < 4 || meetings.some(m => m.status === 'cancelled');

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Project Meetings {studentId ? 'with Student' : ''}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={refreshMeetings}
            className="p-1 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none"
            title="Refresh Meetings"
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          {studentId && (
            <button
              onClick={createMissingMeetings}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md"
              disabled={loading}
            >
              <FaCalendarAlt className="mr-1" /> Create Missing Meetings
            </button>
          )}
          
          {canScheduleMoreMeetings && (
            <button
              onClick={() => {
                resetForm();
                setShowAddForm(!showAddForm);
              }}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
            >
              <FaPlus className="mr-1" /> 
              {showAddForm ? 'Cancel' : (meetings.length === 0 ? 'Schedule First Meeting' : 'Schedule Meeting')}
            </button>
          )}
        </div>
      </div>
      
      {/* Add/Edit Meeting Form */}
      {showAddForm && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            {meetingToEdit ? `Edit Meeting #${meetingToEdit.meetingNumber}` : 'Schedule New Meeting'}
          </h4>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Number (1-4) *
                </label>
                <select
                  name="meetingNumber"
                  value={formData.meetingNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  disabled={meetingToEdit && isPastMeeting(meetingToEdit.scheduledDate)}
                >
                  <option value="">Select Meeting Number</option>
                  <option value="1">Meeting #1</option>
                  <option value="2">Meeting #2</option>
                  <option value="3">Meeting #3</option>
                  <option value="4">Meeting #4</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleInputChange}
                  min={meetingToEdit && isPastMeeting(meetingToEdit.scheduledDate) ? '' : today}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  disabled={meetingToEdit && isPastMeeting(meetingToEdit.scheduledDate)}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Summary
                </label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  placeholder="Enter meeting summary..."
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setFormData({...formData, summary: 'No summary provided'});
                    }
                  }}
                ></textarea>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student's Points to Discuss
                </label>
                <textarea
                  name="studentPoints"
                  value={formData.studentPoints}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows="2"
                  placeholder="Enter points raised by student..."
                  onBlur={(e) => {
                    if (!e.target.value.trim()) {
                      setFormData({...formData, studentPoints: 'No points provided'});
                    }
                  }}
                ></textarea>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guide's Remarks & Suggestions
                </label>
                <textarea
                  name="guideRemarks"
                  value={formData.guideRemarks}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows="2"
                  placeholder="Enter guide's remarks and suggestions..."
                ></textarea>
              </div>
              
              {meetingToEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                disabled={loading}
              >
                <FaSave className="mr-1" />
                {meetingToEdit ? 'Update Meeting' : 'Schedule Meeting'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Meetings List */}
      <div className="px-6 py-4">
        {meetings.length === 0 ? (
          <div className="text-center py-12">
            <FaCalendarAlt className="mx-auto text-gray-400 text-5xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No meetings scheduled</h3>
            <p className="text-gray-500">
              {studentId ? "You haven't scheduled any meetings with this student yet." : "You haven't scheduled any meetings with your students yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div 
                key={meeting._id || meeting.id}
                className={`border rounded-lg p-4 ${
                  meeting.status === 'cancelled' ? 'border-gray-200 bg-gray-50' : 
                  meeting.status === 'completed' ? 'border-green-200 bg-green-50' : 
                  isPastMeeting(meeting.scheduledDate) ? 'border-yellow-200 bg-yellow-50' :
                  'border-indigo-200 bg-indigo-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <div className={`p-2 rounded-full mr-4 ${
                      meeting.status === 'cancelled' ? 'bg-gray-200 text-gray-700' :
                      meeting.status === 'completed' ? 'bg-green-200 text-green-700' :
                      isPastMeeting(meeting.scheduledDate) ? 'bg-yellow-200 text-yellow-700' :
                      'bg-indigo-200 text-indigo-700'
                    }`}>
                      <FaCalendarAlt className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">
                        {meeting.title || `Meeting #${meeting.meetingNumber}`}
                      </h4>
                      {!studentId && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <FaUserGraduate className="mr-1" />
                          <span>
                            {
                              // Show student name using various possible field structures
                              meeting.studentName || 
                              (meeting.studentId && typeof meeting.studentId === 'object' ? meeting.studentId.fullName : null) ||
                              (meeting.student && typeof meeting.student === 'object' ? meeting.student.fullName : null) ||
                              'Student'
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center mt-2 sm:mt-0">
                    <div className="flex items-center mr-4">
                      <FaClock className="text-gray-500 mr-1" />
                      <span className="text-sm text-gray-700">
                        {new Date(meeting.scheduledDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      meeting.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                {(meeting.meetingSummary || meeting.notes || meeting.summary) && (
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <h5 className="text-xs font-semibold text-gray-700 mb-1">Meeting Summary:</h5>
                    <p className="text-sm text-gray-700 mb-2">
                      {meeting.meetingSummary || meeting.notes || meeting.summary || "No summary available"}
                    </p>
                    
                    {meeting.studentPoints && (
                      <>
                        <h5 className="text-xs font-semibold text-gray-700 mt-2 mb-1">Student's Points:</h5>
                        <p className="text-sm text-gray-700 mb-2">{meeting.studentPoints}</p>
                      </>
                    )}
                    
                    {meeting.guideRemarks && (
                      <>
                        <h5 className="text-xs font-semibold text-gray-700 mt-2 mb-1">Guide's Remarks:</h5>
                        <p className="text-sm text-gray-700">{meeting.guideRemarks}</p>
                      </>
                    )}
                  </div>
                )}
                
                <div className="mt-3 border-t border-gray-200 pt-3 flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(meeting)}
                    className="px-3 py-1 text-xs text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded flex items-center"
                  >
                    <FaEdit className="mr-1" /> Edit
                  </button>
                  
                  {meeting.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(meeting._id, 'completed')}
                        className="px-3 py-1 text-xs text-green-700 bg-green-100 hover:bg-green-200 rounded flex items-center"
                      >
                        <FaCheck className="mr-1" /> Mark Completed
                      </button>
                      <button
                        onClick={() => handleStatusChange(meeting._id, 'cancelled')}
                        className="px-3 py-1 text-xs text-red-700 bg-red-100 hover:bg-red-200 rounded flex items-center"
                      >
                        <FaTimes className="mr-1" /> Cancel
                      </button>
                    </>
                  )}
                  
                  {meeting.status === 'cancelled' && (
                    <button
                      onClick={() => handleStatusChange(meeting._id, 'scheduled')}
                      className="px-3 py-1 text-xs text-blue-700 bg-blue-100 hover:bg-blue-200 rounded flex items-center"
                    >
                      <FaCalendarAlt className="mr-1" /> Reschedule
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingsManager; 