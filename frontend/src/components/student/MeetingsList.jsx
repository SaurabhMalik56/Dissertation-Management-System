import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUser, FaClipboardList, FaComments, FaListOl, FaSync } from 'react-icons/fa';
import { toast } from 'react-toastify';
import studentService from '../../services/studentService';

const MeetingsList = () => {
  const { user } = useSelector((state) => state.auth);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [newMeetingsAvailable, setNewMeetingsAvailable] = useState(false);
  
  // Define the total number of required meetings (typically 4)
  const TOTAL_REQUIRED_MEETINGS = 4;

  const checkSharedMeetingsStore = () => {
    try {
      // Access the shared meetings store if it exists
      if (window.SHARED_MEETINGS_STORE) {
        const sharedMeetings = window.SHARED_MEETINGS_STORE.getMeetings();
        
        if (sharedMeetings && sharedMeetings.length > 0) {
          console.log('Found meetings in shared store:', sharedMeetings.length);
          
          // Filter meetings for this student
          if (user?._id || user?.id) {
            const userId = user._id || user.id;
            const studentMeetings = sharedMeetings.filter(meeting => {
              const meetingStudentId = meeting.student || meeting.studentId;
              return String(meetingStudentId) === String(userId) || 
                     (String(meetingStudentId) === '1' && String(userId) === '1'); // For testing
            });
            
            if (studentMeetings.length > 0) {
              console.log('Found meetings for this student in shared store:', studentMeetings.length);
              setNewMeetingsAvailable(true);
              return studentMeetings;
            }
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error checking shared meetings store:', error);
      return null;
    }
  };

  const fetchMeetings = async (forceRefresh = true) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching student meetings with forceRefresh:', forceRefresh);
      
      // First check the shared meetings store
      const sharedMeetings = checkSharedMeetingsStore();
      
      if (sharedMeetings && sharedMeetings.length > 0) {
        console.log('Using meetings from shared store:', sharedMeetings.length);
        setMeetings(sharedMeetings);
        setNewMeetingsAvailable(false);
      } else {
        // If no meetings in shared store, use the normal service
        const data = await studentService.getStudentMeetings(user.token, forceRefresh);
        
        console.log('Meetings data received from service:', data?.length || 0, 'meetings');
        if (data?.length > 0) {
          console.log('First meeting:', {
            id: data[0]._id,
            title: data[0].title || `Meeting ${data[0].meetingNumber}`,
            studentId: data[0].student || data[0].studentId
          });
        }
        
        setMeetings(data);
      }
      setNewMeetingsAvailable(false);
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Failed to fetch meetings. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchMeetings();
    }
    
    // Listen for new meeting events
    const handleNewMeeting = (event) => {
      const newMeeting = event.detail?.meeting;
      
      if (newMeeting) {
        console.log('New meeting notification received:', newMeeting);
        
        // Check if this meeting is for the current user
        if (user?._id || user?.id) {
          const userId = user._id || user.id;
          const meetingStudentId = newMeeting.student || newMeeting.studentId;
          
          console.log('Comparing meeting student ID:', meetingStudentId, 'with user ID:', userId);
          
          // Handle both string and object IDs, and various field names
          const isForThisStudent = 
            String(meetingStudentId) === String(userId) || 
            (typeof meetingStudentId === 'object' && String(meetingStudentId._id) === String(userId)) ||
            (String(meetingStudentId) === '1' && String(userId) === '1'); // For testing
          
          if (isForThisStudent) {
            console.log('New meeting is for this student!');
            
            // Automatically refresh meetings when a new one is scheduled
            fetchMeetings(true);
            
            // Show a notification
            toast.info(
              <div>
                <div>New meeting scheduled by your guide!</div>
                <div className="text-xs mt-1">Meeting details have been updated.</div>
              </div>
            );
          }
        }
      }
    };
    
    window.addEventListener('new-meeting-created', handleNewMeeting);
    
    // Also set up a periodic check for new meetings
    const checkInterval = setInterval(() => {
      checkSharedMeetingsStore();
    }, 30000); // Check every 30 seconds
    
    return () => {
      window.removeEventListener('new-meeting-created', handleNewMeeting);
      clearInterval(checkInterval);
    };
  }, [user]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchMeetings(true);
      toast.success('Meetings updated');
    } catch (error) {
      toast.error('Failed to refresh meetings');
      setRefreshing(false);
    }
  };

  const handleViewDetails = (meeting) => {
    setSelectedMeeting(meeting);
  };

  const closeModal = () => {
    setSelectedMeeting(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date error';
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return 'No time set';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid time';
      
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Time error';
    }
  };

  // Get status color based on meeting status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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

  // Generate an array of meetings, filling in empty slots for meetings not yet scheduled
  const generateMeetingSlots = () => {
    // Create an array to hold all meeting slots
    const meetingSlots = [];
    
    // Create a map of existing meetings by meeting number
    const meetingMap = {};
    meetings.forEach(meeting => {
      if (meeting.meetingNumber) {
        meetingMap[meeting.meetingNumber] = meeting;
      }
    });
    
    // Fill in the slots from 1 to TOTAL_REQUIRED_MEETINGS
    for (let i = 1; i <= TOTAL_REQUIRED_MEETINGS; i++) {
      if (meetingMap[i]) {
        // We have a meeting for this slot
        meetingSlots.push(meetingMap[i]);
      } else {
        // Add a placeholder for not yet scheduled meetings
        meetingSlots.push({
          _id: `placeholder-${i}`,
          title: `Meeting ${i}`,
          meetingNumber: i,
          status: 'not_scheduled',
          isPlaceholder: true
        });
      }
    }
    
    return meetingSlots;
  };

  if (loading && !refreshing) {
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
          className="mt-2 text-sm text-red-700 underline flex items-center"
          onClick={handleRefresh}
        >
          <FaSync className="mr-1" /> Try again
        </button>
      </div>
    );
  }

  const meetingSlots = generateMeetingSlots();

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Dissertation Meetings Schedule</h3>
          <p className="text-sm text-gray-500 mt-1">Your required meetings with faculty guide throughout your dissertation journey</p>
        </div>
        <button 
          className={`flex items-center text-indigo-600 hover:text-indigo-800 text-sm ${newMeetingsAvailable ? 'animate-pulse' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FaSync className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          {newMeetingsAvailable ? 'New Meetings Available!' : 'Refresh'}
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {meetingSlots.map((meeting) => (
          <div key={meeting._id} className={`p-6 ${meeting.isPlaceholder ? 'bg-gray-50' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center">
                  <FaListOl className="text-gray-400 mr-2" />
                  <h4 className="font-medium text-gray-900">
                    Meeting {meeting.meetingNumber}
                  </h4>
                </div>
                {!meeting.isPlaceholder && (
                  <p className="text-sm text-gray-500 mt-1">
                    with {meeting.faculty?.name || meeting.guideName || 'Faculty Guide'}
                  </p>
                )}
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                meeting.isPlaceholder 
                  ? 'bg-gray-200 text-gray-700' 
                  : getStatusColor(meeting.status)
              }`}>
                {meeting.isPlaceholder 
                  ? 'Pending/Not Scheduled'
                  : (meeting.status ? meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1) : 'Unknown')}
              </span>
            </div>

            {!meeting.isPlaceholder && (
              <>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(meeting.dateTime || meeting.scheduledDate) && (
                    <>
                      <div className="flex items-center text-sm text-gray-500">
                        <FaCalendarAlt className="mr-2 text-gray-400" />
                        <span>{formatDate(meeting.dateTime || meeting.scheduledDate)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FaClock className="mr-2 text-gray-400" />
                        <span>{formatTime(meeting.dateTime || meeting.scheduledDate)} {meeting.duration ? `(${meeting.duration} minutes)` : ''}</span>
                      </div>
                    </>
                  )}
                  {(meeting.location || meeting.meetingType) && (
                    <div className="flex items-center text-sm text-gray-500">
                      <FaMapMarkerAlt className="mr-2 text-gray-400" />
                      <span>{meeting.location || meeting.meetingType}</span>
                    </div>
                  )}
                  {(meeting.studentNotes || meeting.agenda) && (
                    <div className="flex items-center text-sm text-gray-500">
                      <FaComments className="mr-2 text-gray-400" />
                      <span className="truncate">Student's Points: {meeting.studentNotes || meeting.agenda}</span>
                    </div>
                  )}
                  {(meeting.notes || meeting.facultyComments || meeting.guideNotes) && (
                    <div className="flex items-center text-sm text-gray-500 md:col-span-2">
                      <FaClipboardList className="mr-2 text-gray-400" />
                      <span className="truncate">Guide's Summary: {meeting.notes || meeting.facultyComments || meeting.guideNotes}</span>
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
              </>
            )}
            
            {meeting.isPlaceholder && (
              <div className="mt-3 text-sm text-gray-500">
                <p>This meeting has not been scheduled yet. Your faculty guide will set this up when appropriate.</p>
              </div>
            )}
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedMeeting.title || `Meeting ${selectedMeeting.meetingNumber}`}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Meeting Number</p>
                  <p className="font-medium">{selectedMeeting.meetingNumber || 'N/A'}</p>
                </div>
                {(selectedMeeting.dateTime || selectedMeeting.scheduledDate) && (
                  <div>
                    <p className="text-sm text-gray-500">Date & Time</p>
                    <p className="font-medium">{formatDate(selectedMeeting.dateTime || selectedMeeting.scheduledDate)} at {formatTime(selectedMeeting.dateTime || selectedMeeting.scheduledDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedMeeting.status)}`}>
                      {selectedMeeting.status ? selectedMeeting.status.charAt(0).toUpperCase() + selectedMeeting.status.slice(1) : 'Unknown'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location/Type</p>
                  <p className="font-medium">{selectedMeeting.location || selectedMeeting.meetingType || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Faculty Guide</p>
                  <div className="flex items-center mt-1">
                    <div className="bg-indigo-100 p-2 rounded-full mr-3">
                      <FaUser className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedMeeting.faculty?.name || selectedMeeting.guideName || 'Faculty Guide'}</p>
                      <p className="text-sm text-gray-500">{selectedMeeting.faculty?.department || 'Department'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {(selectedMeeting.studentNotes || selectedMeeting.agenda) && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Student's Points to Discuss</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedMeeting.studentNotes || selectedMeeting.agenda}</p>
                </div>
              )}

              {(selectedMeeting.notes || selectedMeeting.facultyComments || selectedMeeting.guideNotes) && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Guide's Summary/Comments</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded">{selectedMeeting.notes || selectedMeeting.facultyComments || selectedMeeting.guideNotes}</p>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingsList; 