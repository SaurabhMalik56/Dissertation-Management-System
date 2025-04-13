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
    status: 'scheduled'
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
          ? allMeetings.filter(meeting => meeting.student._id === studentId)
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
        ? allMeetings.filter(meeting => meeting.student._id === studentId)
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
      status: 'scheduled'
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
      
      // Prepare meeting data
      const meetingData = {
        studentId: studentId,
        projectId: meetingToEdit?.project._id || meetings[0]?.project._id,
        meetingNumber: meetingNum,
        scheduledDate: formData.scheduledDate,
        summary: formData.summary,
        status: formData.status
      };
      
      let result;
      
      if (meetingToEdit) {
        // Update existing meeting
        result = await facultyService.updateMeeting(
          meetingToEdit._id, 
          meetingData, 
          user.token
        );
        toast.success('Meeting updated successfully');
      } else {
        // Schedule new meeting
        result = await facultyService.scheduleMeeting(
          meetingData, 
          user.token
        );
        toast.success('Meeting scheduled successfully');
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
    
    setMeetingToEdit(meeting);
    setFormData({
      meetingNumber: meeting.meetingNumber.toString(),
      scheduledDate: new Date(meeting.scheduledDate).toISOString().split('T')[0],
      summary: meeting.summary || '',
      status: meeting.status
    });
    
    // Disable editing of meeting number and date for past meetings
    if (isPastMeeting) {
      toast.info('This meeting has passed. You can only update the summary.');
    }
    
    setShowAddForm(true);
  };

  const handleStatusChange = async (meetingId, newStatus) => {
    try {
      setLoading(true);
      
      await facultyService.updateMeetingStatus(
        meetingId, 
        { status: newStatus }, 
        user.token
      );
      
      toast.success(`Meeting marked as ${newStatus}`);
      
      // Refresh meetings list
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
                  Summary
                </label>
                <textarea
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows="3"
                  placeholder="Enter meeting agenda or summary..."
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
                key={meeting._id}
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
                      <h4 className="text-sm font-medium">Meeting #{meeting.meetingNumber}</h4>
                      {!studentId && meeting.student && (
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <FaUserGraduate className="mr-1" />
                          <span>{meeting.student.fullName}</span>
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
                
                {meeting.summary && (
                  <div className="mt-3 border-t border-gray-200 pt-3">
                    <p className="text-sm text-gray-700">{meeting.summary}</p>
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