import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUser, FaClipboardList } from 'react-icons/fa';
import studentService from '../../services/studentService';

const MeetingsList = () => {
  const { user } = useSelector((state) => state.auth);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await studentService.getStudentMeetings(user.token);
        setMeetings(data);
      } catch (err) {
        console.error('Error fetching meetings:', err);
        setError('Failed to fetch meetings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchMeetings();
    }
  }, [user]);

  const handleViewDetails = (meeting) => {
    setSelectedMeeting(meeting);
  };

  const closeModal = () => {
    setSelectedMeeting(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status color based on meeting status
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get progress color based on value
  const getProgressColor = (value) => {
    if (value < 30) return 'text-red-600';
    if (value < 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
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
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <FaCalendarAlt className="mx-auto text-gray-400 text-4xl mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No meetings scheduled</h3>
        <p className="text-gray-500">Your advisor hasn't scheduled any meetings yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Scheduled Meetings with Faculty</h3>
        <p className="text-sm text-gray-500 mt-1">View your scheduled meetings with your faculty guide</p>
      </div>

      <div className="divide-y divide-gray-200">
        {meetings.map((meeting) => (
          <div key={meeting._id} className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                <p className="text-sm text-gray-500 mt-1">with {meeting.faculty?.name || 'Faculty Guide'}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(meeting.status)}`}>
                {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center text-sm text-gray-500">
                <FaCalendarAlt className="mr-2 text-gray-400" />
                <span>{formatDate(meeting.dateTime)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <FaClock className="mr-2 text-gray-400" />
                <span>{formatTime(meeting.dateTime)} ({meeting.duration} minutes)</span>
              </div>
              {meeting.location && (
                <div className="flex items-center text-sm text-gray-500">
                  <FaMapMarkerAlt className="mr-2 text-gray-400" />
                  <span>{meeting.location}</span>
                </div>
              )}
              {meeting.agenda && (
                <div className="flex items-center text-sm text-gray-500">
                  <FaClipboardList className="mr-2 text-gray-400" />
                  <span className="truncate">{meeting.agenda}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleViewDetails(meeting)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Meeting Details</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedMeeting.title}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-medium">{formatDate(selectedMeeting.dateTime)} at {formatTime(selectedMeeting.dateTime)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{selectedMeeting.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedMeeting.status)}`}>
                      {selectedMeeting.status.charAt(0).toUpperCase() + selectedMeeting.status.slice(1)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{selectedMeeting.location}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Faculty Guide</p>
                  <div className="flex items-center mt-1">
                    <div className="bg-indigo-100 p-2 rounded-full mr-3">
                      <FaUser className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedMeeting.faculty?.name || 'Faculty Guide'}</p>
                      <p className="text-sm text-gray-500">{selectedMeeting.faculty?.department || 'Department'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedMeeting.agenda && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Agenda</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedMeeting.agenda}</p>
                </div>
              )}

              {selectedMeeting.facultyComments && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Faculty Comments</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedMeeting.facultyComments}</p>
                </div>
              )}

              {selectedMeeting.progressStatus && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Progress Status</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Completion</span>
                      <span className={`text-sm font-medium ${getProgressColor(selectedMeeting.progressValue)}`}>
                        {selectedMeeting.progressValue}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${selectedMeeting.progressValue < 30 ? 'bg-red-500' : 
                          selectedMeeting.progressValue < 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${selectedMeeting.progressValue}%` }}
                      ></div>
                    </div>
                    <p className="mt-2 text-gray-700">{selectedMeeting.progressStatus}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsList; 