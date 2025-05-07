import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import hodService from '../../services/hodService';

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800 border border-blue-200',
  completed: 'bg-green-100 text-green-800 border border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  cancelled: 'bg-red-100 text-red-800 border border-red-200',
  rescheduled: 'bg-yellow-100 text-yellow-800 border border-yellow-200'
};

const Meetings = () => {
  const { user } = useSelector((state) => state.auth);
  
  // State for students and meetings
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMeetingDetails, setIsLoadingMeetingDetails] = useState(false);
  const [error, setError] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [viewingMeetingDetails, setViewingMeetingDetails] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState(null);
  
  useEffect(() => {
    fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    if (!user || !user.token) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch department students
      const studentsData = await hodService.getDepartmentStudents(user.token, user.department);
      
      // Filter students to ensure they're from the HOD's department
      const departmentStudents = studentsData.filter(student => 
        student.department === user.department || 
        student.branch === user.department
      );
      
      // Get all meetings to identify students with meetings
      let allMeetings = [];
      try {
        console.log("Attempting to fetch department meetings for student list...");
        allMeetings = await hodService.getDepartmentMeetings(user.token);
        console.log(`Successfully fetched ${allMeetings.length} meetings for student list`);
      } catch (meetingsError) {
        console.error('Error fetching meetings data:', meetingsError);
        toast.warning('Unable to fetch meetings data. Students will be shown without meeting information.');
        // Continue with empty meetings array
      }
      
      // Process students to include meeting count
      const studentsWithMeetings = departmentStudents.map(student => {
        const studentId = student._id;
        const studentMeetings = allMeetings.filter(meeting => {
          const meetingStudentId = meeting.student?._id || meeting.studentId;
          return meetingStudentId === studentId;
        });
        
        return {
          id: student._id,
          name: student.fullName || student.name,
          email: student.email,
          department: student.department || user.department,
          meetingsCount: studentMeetings.length
        };
      });
      
      setStudents(studentsWithMeetings);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load student data. Please try again.');
      toast.error('Unable to fetch students');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMeetingDetails = async (studentId) => {
    if (!user || !user.token || !studentId) return;
    
    try {
      setIsLoadingMeetingDetails(true);
      setError(null);
      
      // Fetch student details
      const studentDetails = await hodService.getStudentDetails(user.token, studentId);
      
      // Fetch department meetings
      let studentMeetings = [];
      try {
        // Attempt to fetch meetings
        const allMeetings = await hodService.getDepartmentMeetings(user.token);
        
        // Filter meetings for this student
        studentMeetings = allMeetings.filter(meeting => {
          const meetingStudentId = meeting.student?._id || meeting.studentId;
          return meetingStudentId === studentId;
        });
      } catch (meetingError) {
        console.error('Error fetching meetings:', meetingError);
        toast.warning('Unable to fetch meeting data. Basic student information will still be displayed.');
        // Continue with empty meetings array
      }
      
      // Get guide details if available
      let guideInfo = {
        id: 'unassigned',
        name: 'Not Assigned',
        department: 'N/A',
        email: 'N/A'
      };
      
      if (studentDetails.assignedGuide) {
        try {
          const guideId = typeof studentDetails.assignedGuide === 'object' ? 
            studentDetails.assignedGuide._id : 
            studentDetails.assignedGuide;
          
          // Try to fetch faculty details directly
          const guideDetails = await hodService.getFacultyDetails(user.token, guideId);
          
          if (guideDetails) {
            guideInfo = {
              id: guideDetails._id,
              name: guideDetails.fullName || guideDetails.name || 'Unknown Guide',
              department: guideDetails.department || guideDetails.branch || 'Not Specified',
              email: guideDetails.email || 'N/A'
            };
          }
        } catch (guideErr) {
          console.error(`Error fetching guide details for student ${studentDetails._id}:`, guideErr);
        }
      }
      
      // Format the response similar to admin dashboard
      const formattedMeetingDetails = {
        studentInfo: {
          id: studentDetails._id,
          name: studentDetails.fullName || studentDetails.name,
          department: studentDetails.department || 'Not Specified',
          email: studentDetails.email,
          projectTitle: studentDetails.projectTitle || 'No Project Assigned'
        },
        guideInfo: guideInfo,
        meetings: studentMeetings
      };
      
      setMeetingDetails(formattedMeetingDetails);
      setViewingMeetingDetails(true);
      } catch (err) {
      console.error('Error fetching meeting details:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      setError(`Failed to load meeting details: ${errorMessage}`);
      toast.error(`Unable to fetch meeting details: ${errorMessage}`);
      } finally {
      setIsLoadingMeetingDetails(false);
    }
  };

  const handleViewMeetingDetails = (studentId) => {
    setSelectedStudentId(studentId);
    fetchMeetingDetails(studentId);
  };

  const handleCloseMeetingDetails = () => {
    setViewingMeetingDetails(false);
    setMeetingDetails(null);
    setSelectedStudentId(null);
  };
  
  // Filter students based on search
  const filteredStudents = students.filter(student => {
    if (!studentSearch) return true;
    const searchTerm = studentSearch.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchTerm) ||
      student.email.toLowerCase().includes(searchTerm)
    );
  });
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-full bg-gray-100">
      <main className="flex-1">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Meetings Overview
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View meeting progress between students and their guides in your department
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                <button 
                  className="px-4 py-2 mt-3 bg-red-600 hover:bg-red-700 text-white rounded-md"
                  onClick={fetchStudents}
                >
                  Try Again
                </button>
                </div>
              ) : (
                <>
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <h2 className="text-lg font-medium text-gray-900">Students in Department</h2>
                      <div className="mt-3 md:mt-0 w-full md:w-64">
                        <input
                          type="text"
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Search students..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                        />
                        </div>
                    </div>
                  </div>
                  
                  {students.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-gray-500">No students found in your department</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Meetings
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{student.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {student.meetingsCount > 0 
                                    ? `${student.meetingsCount} ${student.meetingsCount === 1 ? 'meeting' : 'meetings'}`
                                    : 'No meetings'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button 
                                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
                                  onClick={() => handleViewMeetingDetails(student.id)}
                                  title="View student meetings"
                                  disabled={student.meetingsCount === 0}
                                  className={`inline-flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                                    student.meetingsCount > 0 
                                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                  View Meetings
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="px-6 py-3 text-sm text-gray-500">
                        Showing {filteredStudents.length} of {students.length} students
                        {studentSearch && ` (filtered by "${studentSearch}")`}
                      </div>
                    </div>
                  )}
                </div>

                {/* Meeting details modal/panel when a student is selected */}
                {viewingMeetingDetails && meetingDetails && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold text-gray-800">Meetings for {meetingDetails.studentInfo.name}</h3>
                          <button
                            onClick={handleCloseMeetingDetails}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Student and Guide Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-semibold text-gray-700 mb-2">Student Information</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><span className="font-medium">Name:</span> {meetingDetails.studentInfo.name}</p>
                              <p><span className="font-medium">Email:</span> {meetingDetails.studentInfo.email}</p>
                              <p><span className="font-medium">Department:</span> {meetingDetails.studentInfo.department}</p>
                              <p><span className="font-medium">Project:</span> {meetingDetails.studentInfo.projectTitle}</p>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-semibold text-gray-700 mb-2">Guide Information</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><span className="font-medium">Name:</span> {meetingDetails.guideInfo.name}</p>
                              <p><span className="font-medium">Email:</span> {meetingDetails.guideInfo.email}</p>
                              <p><span className="font-medium">Department:</span> {meetingDetails.guideInfo.department}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Meetings Summary */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-700 mb-2">Meeting Statistics</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                              <p className="text-xs text-blue-700 uppercase font-semibold tracking-wider">Total Meetings</p>
                              <p className="text-2xl font-bold text-blue-700 mt-1">
                                {meetingDetails.meetings.length}
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
                              <p className="text-xs text-green-700 uppercase font-semibold tracking-wider">Completed</p>
                              <p className="text-2xl font-bold text-green-700 mt-1">
                                {meetingDetails.meetings.filter(m => m.status.toLowerCase() === 'completed').length}
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200 shadow-sm">
                              <p className="text-xs text-yellow-700 uppercase font-semibold tracking-wider">Upcoming</p>
                              <p className="text-2xl font-bold text-yellow-700 mt-1">
                                {meetingDetails.meetings.filter(m => m.status.toLowerCase() === 'scheduled' || m.status.toLowerCase() === 'pending').length}
                              </p>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200 shadow-sm">
                              <p className="text-xs text-red-700 uppercase font-semibold tracking-wider">Cancelled</p>
                              <p className="text-2xl font-bold text-red-700 mt-1">
                                {meetingDetails.meetings.filter(m => m.status.toLowerCase() === 'cancelled').length}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Meetings History */}
                        <h4 className="font-semibold text-gray-700 mb-2">Meeting History</h4>
                        {meetingDetails.meetings.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Meeting #</th>
                                  <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Date & Time</th>
                                  <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Title</th>
                                  <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Type</th>
                                  <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Duration</th>
                                  <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Status</th>
                                  <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {meetingDetails.meetings.map((meeting, index) => (
                                  <tr key={`meeting-${meeting._id}`} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50`}>
                                    <td className="py-3 px-6 border-b border-gray-200">{meeting.meetingNumber}</td>
                                    <td className="py-3 px-6 border-b border-gray-200">
                                      {formatDate(meeting.scheduledDate)}<br/>
                                      <span className="text-xs text-gray-500">{meeting.startTime}</span>
                                    </td>
                                    <td className="py-3 px-6 border-b border-gray-200 font-medium">{meeting.title}</td>
                                    <td className="py-3 px-6 border-b border-gray-200">{meeting.meetingType}</td>
                                    <td className="py-3 px-6 border-b border-gray-200">{meeting.duration}</td>
                                    <td className="py-3 px-6 border-b border-gray-200">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${statusColors[meeting.status.toLowerCase()] || 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                                        {meeting.status}
                                      </span>
                                    </td>
                                    <td className="py-3 px-6 border-b border-gray-200">
                                      <button 
                                        className="text-indigo-600 hover:text-indigo-900"
                                        onClick={() => {
                                          // Scroll to meeting details section
                                          document.getElementById(`meeting-details-${meeting._id}`)?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                      >
                                        View Details
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-6 text-center rounded-md">
                            <p className="text-gray-500">No meetings found for this student.</p>
                          </div>
                        )}
                        
                        {/* Detailed view for each meeting */}
                        {meetingDetails.meetings.length > 0 && (
                          <div className="mt-8 space-y-8">
                            <h4 className="font-semibold text-gray-700 mb-4">Meeting Details</h4>
                            
                            {meetingDetails.meetings.map(meeting => (
                              <div 
                                key={`meeting-details-${meeting._id}`}
                                id={`meeting-details-${meeting._id}`}
                                className="bg-white p-6 rounded-lg border shadow-sm"
                              >
                                <div className="flex justify-between items-center mb-4">
                                  <h5 className="text-lg font-semibold text-gray-800">
                                    Meeting #{meeting.meetingNumber}: {meeting.title}
                                  </h5>
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                                    ${statusColors[meeting.status.toLowerCase()] || 'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                                    {meeting.status}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                  <div>
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <p className="text-sm text-gray-500">Meeting Type</p>
                                        <p className="font-medium">{meeting.meetingType}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Scheduled Date</p>
                                        <p className="font-medium">{formatDate(meeting.scheduledDate)}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Duration</p>
                                        <p className="font-medium">{meeting.duration}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="mt-4 space-y-4">
                                  {meeting.studentPoints !== null && meeting.studentPoints !== undefined && (
                                    <div>
                                      <h6 className="text-sm font-semibold text-gray-700 mb-2">Student Points</h6>
                                      <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{meeting.studentPoints} / 10</p>
                                    </div>
                                  )}
                                  
                                  {meeting.meetingSummary && (
                                    <div>
                                      <h6 className="text-sm font-semibold text-gray-700 mb-2">Meeting Summary</h6>
                                      <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{meeting.meetingSummary}</p>
                                    </div>
                                  )}
                                  
                                  {meeting.guideRemarks && (
                                    <div>
                                      <h6 className="text-sm font-semibold text-gray-700 mb-2">Guide Remarks</h6>
                                      <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{meeting.guideRemarks}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 border-t flex justify-end">
                        <button
                          onClick={handleCloseMeetingDetails}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Loading indicator for meeting details */}
                {isLoadingMeetingDetails && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
                      <p className="mt-4 text-indigo-600 font-medium">Loading student meeting details...</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Meetings; 