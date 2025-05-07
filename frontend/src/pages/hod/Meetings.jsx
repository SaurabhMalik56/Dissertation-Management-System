import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import hodService from '../../services/hodService';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      
      // Process students initially without meeting information
      const studentsWithoutMeetings = departmentStudents.map(student => ({
        id: student._id,
        name: student.fullName || student.name,
        email: student.email,
        department: student.department || user.department,
        meetingsCount: 0 // Default to 0 meetings
      }));
      
      // Set students right away so the UI shows something even if meetings API fails
      setStudents(studentsWithoutMeetings);
      
      // Try to get meeting information, but don't block showing students
      try {
        console.log("Attempting to fetch department meetings for student list...");
        // Show loading in the UI for meetings data
        const meetingsLoading = toast.info('Loading meetings data...', { autoClose: false });
        
        const response = await axios.get(
          `${API_URL}/meetings/department`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        
        // Close the loading toast
        toast.dismiss(meetingsLoading);
        
        if (response.data && Array.isArray(response.data)) {
          const allMeetings = response.data;
          console.log(`Successfully fetched ${allMeetings.length} real meetings for student list`);
          
          // Update students with meeting counts
          const studentsWithMeetings = studentsWithoutMeetings.map(student => {
            const studentMeetings = allMeetings.filter(meeting => {
              const meetingStudentId = meeting.studentId?._id || meeting.studentId;
              return meetingStudentId === student.id;
            });
            
            return {
              ...student,
              meetingsCount: studentMeetings.length
            };
          });
          
          setStudents(studentsWithMeetings);
        }
      } catch (meetingsError) {
        console.error('Error fetching meetings data:', meetingsError);
        
        // Show notification with retry option
        if (meetingsError.response && meetingsError.response.status === 500) {
          toast.error(
            <div>
              Server error while fetching meetings. 
              <button 
                className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => {
                  toast.dismiss();
                  fetchStudents();
                }}
              >
                Retry
              </button>
            </div>,
            { autoClose: false }
          );
        } else {
          toast.warning('Unable to fetch meetings data. Students will be shown without meeting information.');
        }
        
        // Continue with students list that has 0 meetings for everyone
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load student data. Please try again.');
      toast.error('Unable to fetch students');
      setIsLoading(false);
    }
  };

  const fetchMeetingDetails = async (studentId) => {
    if (!user || !user.token || !studentId) return;
    
    try {
      setIsLoadingMeetingDetails(true);
      setError(null);
      setMeetingDetails(null); // Clear previous meeting data
      
      // Show the meeting details modal right away with loading state
      setViewingMeetingDetails(true);
      
      // Set initial loading state
      const initialLoadingDetails = {
        studentInfo: {
          id: studentId,
          name: 'Loading...',
          department: 'Loading...',
          email: 'Loading...',
          projectTitle: 'Loading...'
        },
        guideInfo: {
          id: 'loading',
          name: 'Loading...',
          department: 'Loading...',
          email: 'Loading...'
        },
        meetings: []
      };
      
      setMeetingDetails(initialLoadingDetails);
      
      // STEP 1: First fetch the meetings for this student
      // This helps us extract both student and guide information
      console.log('Fetching meetings for student ID:', studentId);
      let studentMeetings = [];
      
      try {
        // Fetch department meetings and filter by student (don't use student-specific endpoint)
        const meetingsResponse = await axios.get(
          `${API_URL}/meetings/department`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        
        if (meetingsResponse.data && Array.isArray(meetingsResponse.data)) {
          // Filter meetings for this specific student
          studentMeetings = meetingsResponse.data.filter(meeting => {
            const meetingStudentId = meeting.studentId?._id || meeting.studentId;
            return meetingStudentId === studentId;
          });
          
          console.log(`Found ${studentMeetings.length} meetings for student ${studentId}`);
        } else {
          console.warn('Invalid response format from meetings API');
        }
      } catch (meetingErr) {
        console.error('Error fetching meetings:', meetingErr);
        // Continue with empty meetings array
        studentMeetings = [];
      }
      
      // STEP 2: Extract basic student info from our existing list or from meetings
      let studentInfo = null;
      
      // Try to get student info from the student list first
      const studentFromList = students.find(s => s.id === studentId);
      if (studentFromList) {
        console.log('Using student info from student list:', studentFromList);
        studentInfo = {
          id: studentFromList.id,
          name: studentFromList.name,
          email: studentFromList.email,
          department: studentFromList.department || user.department,
          projectTitle: 'No Project Assigned',
          enrollment: 'N/A',
          semester: 'N/A',
          branch: studentFromList.department || user.department
        };
      }
      
      // Enhance student info from meetings if available
      if (studentMeetings.length > 0 && studentMeetings[0].studentId && typeof studentMeetings[0].studentId === 'object') {
        const studentFromMeeting = studentMeetings[0].studentId;
        console.log('Enhancing student info from meeting data:', studentFromMeeting);
        
        studentInfo = {
          ...studentInfo,
          id: studentFromMeeting._id || studentInfo.id,
          name: studentFromMeeting.fullName || studentFromMeeting.name || studentInfo.name,
          email: studentFromMeeting.email || studentInfo.email,
          department: studentFromMeeting.department || studentFromMeeting.branch || studentInfo.department
        };
      }
      
      // If we still don't have student info, try one more database fetch (without populate)
      if (!studentInfo) {
        try {
          console.log('Fetching basic student data from API');
          const studentResponse = await axios.get(
            `${API_URL}/users/students/${studentId}`,
            { headers: { Authorization: `Bearer ${user.token}` } }
          );
          
          if (studentResponse.data) {
            const basicStudentData = studentResponse.data;
            studentInfo = {
              id: basicStudentData._id,
              name: basicStudentData.fullName || basicStudentData.name,
              email: basicStudentData.email,
              department: basicStudentData.department || basicStudentData.branch || user.department,
              projectTitle: 'No Project Assigned',
              enrollment: basicStudentData.enrollmentNumber || basicStudentData.regNumber || 'N/A',
              semester: basicStudentData.semester || 'N/A',
              branch: basicStudentData.branch || basicStudentData.department || user.department
            };
          }
        } catch (studentErr) {
          console.error('Error fetching student data:', studentErr);
          // If we have absolutely no student info, use placeholder
          if (!studentInfo) {
            studentInfo = {
              id: studentId,
              name: 'Unknown Student',
              email: 'N/A',
              department: user.department,
              projectTitle: 'No Project Assigned',
              enrollment: 'N/A',
              semester: 'N/A',
              branch: user.department
            };
            toast.error('Unable to fetch student information');
          }
        }
      }
      
      // STEP 3: Extract guide information from meetings if available
      let guideInfo = {
        id: 'unassigned',
        name: 'Not Assigned',
        department: 'N/A',
        email: 'N/A',
        phone: 'N/A',
        specialization: 'N/A',
        designation: 'Faculty'
      };
      
      // Try to find guide information in meetings
      if (studentMeetings.length > 0) {
        // Find first meeting with populated faculty info
        const meetingWithGuide = studentMeetings.find(m => 
          m.facultyId && typeof m.facultyId === 'object' && m.facultyId !== null
        );
        
        if (meetingWithGuide && meetingWithGuide.facultyId) {
          const extractedGuide = meetingWithGuide.facultyId;
          console.log('Extracted guide information from meetings:', extractedGuide);
          
          guideInfo = {
            id: extractedGuide._id,
            name: extractedGuide.fullName || extractedGuide.name || 'Unknown',
            department: extractedGuide.department || extractedGuide.branch || 'Not Specified',
            email: extractedGuide.email || 'N/A',
            phone: extractedGuide.phone || extractedGuide.contactNumber || 'N/A',
            specialization: extractedGuide.specialization || extractedGuide.expertise || 'Not Specified',
            designation: extractedGuide.designation || extractedGuide.role || 'Faculty',
            note: 'Information extracted from meeting data'
          };
        } else if (studentMeetings[0].facultyId) {
          // If we have a guide ID but not the details, try to find them in department faculty
          const guideId = studentMeetings[0].facultyId;
          try {
            console.log('Looking for guide in department faculty list');
            const departmentFaculty = await hodService.getDepartmentFaculty(user.token, user.department);
            const foundGuide = departmentFaculty.find(f => f._id === guideId);
            
            if (foundGuide) {
              console.log('Found guide in department faculty list:', foundGuide);
              guideInfo = {
                id: foundGuide._id,
                name: foundGuide.fullName || foundGuide.name || 'Unknown',
                department: foundGuide.department || foundGuide.branch || 'Not Specified',
                email: foundGuide.email || 'N/A',
                phone: foundGuide.phone || foundGuide.contactNumber || 'N/A',
                specialization: foundGuide.specialization || foundGuide.expertise || 'Not Specified',
                designation: foundGuide.designation || foundGuide.role || 'Faculty',
                note: 'Information from department faculty list'
              };
            }
          } catch (facultyErr) {
            console.error('Error finding guide in faculty list:', facultyErr);
          }
        }
      }
      
      // STEP 4: Update the UI with the collected information
      const finalMeetingDetails = {
        studentInfo: studentInfo,
        guideInfo: guideInfo,
        meetings: studentMeetings
      };
      
      console.log('Setting final meeting details:', finalMeetingDetails);
      setMeetingDetails(finalMeetingDetails);
      
    } catch (err) {
      console.error('Error in fetchMeetingDetails process:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      setError(`Failed to load meeting details: ${errorMessage}`);
      toast.error(`Unable to fetch details: ${errorMessage}`);
      
      // Close the modal if there's an error
      setViewingMeetingDetails(false);
    } finally {
      setIsLoadingMeetingDetails(false);
    }
  };

  const handleViewMeetingDetails = (studentId) => {
    // Get student details from the students array
    const student = students.find(s => s.id === studentId);
    
    // Inform the user if there are no meetings, but still proceed to show details
    if (student && student.meetingsCount === 0) {
      toast.info('This student has no scheduled meetings. Showing student details.');
    }
    
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
                              Meeting Count
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Meetings
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
                                  onClick={() => handleViewMeetingDetails(student.id)}
                                  title={student.meetingsCount > 0 ? "View student meetings" : "No meetings found, but you can view student details"}
                                  className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                  </svg>
                                  {student.meetingsCount > 0 
                                    ? `View Meetings (${student.meetingsCount})` 
                                    : "View Details"}
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
                              {meetingDetails.studentInfo.enrollment && (
                                <p><span className="font-medium">Enrollment:</span> {meetingDetails.studentInfo.enrollment}</p>
                              )}
                              {meetingDetails.studentInfo.semester && meetingDetails.studentInfo.semester !== 'N/A' && (
                                <p><span className="font-medium">Semester:</span> {meetingDetails.studentInfo.semester}</p>
                              )}
                              <p><span className="font-medium">Project:</span> {meetingDetails.studentInfo.projectTitle}</p>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg border">
                            <h4 className="font-semibold text-gray-700 mb-2">Guide Information</h4>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p><span className="font-medium">Name:</span> {meetingDetails.guideInfo.name}</p>
                              <p><span className="font-medium">Email:</span> {meetingDetails.guideInfo.email}</p>
                              <p><span className="font-medium">Department:</span> {meetingDetails.guideInfo.department}</p>
                              {meetingDetails.guideInfo.designation && meetingDetails.guideInfo.designation !== 'Faculty' && (
                                <p><span className="font-medium">Designation:</span> {meetingDetails.guideInfo.designation}</p>
                              )}
                              {meetingDetails.guideInfo.phone && meetingDetails.guideInfo.phone !== 'N/A' && (
                                <p><span className="font-medium">Contact:</span> {meetingDetails.guideInfo.phone}</p>
                              )}
                              {meetingDetails.guideInfo.specialization && meetingDetails.guideInfo.specialization !== 'N/A' && (
                                <p><span className="font-medium">Specialization:</span> {meetingDetails.guideInfo.specialization}</p>
                              )}
                              {meetingDetails.guideInfo.id === 'unassigned' && (
                                <p className="mt-2 text-amber-600">No guide has been assigned to this student yet.</p>
                              )}
                              {meetingDetails.guideInfo.note && (
                                <p className="mt-2 text-blue-600 italic text-xs">{meetingDetails.guideInfo.note}</p>
                              )}
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
                          <div className="bg-white border rounded-md overflow-hidden">
                            <div className="py-10 px-6 text-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <h3 className="text-lg font-medium text-gray-700 mb-2">No Meetings Found</h3>
                              <p className="text-gray-600 mb-4">This student doesn't have any scheduled or past meetings in the system.</p>
                              <div className="flex flex-col items-center gap-2">
                                <div className="rounded-md bg-yellow-50 p-4 max-w-md">
                                  <div className="flex">
                                    <div className="flex-shrink-0">
                                      <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div className="ml-3">
                                      <h3 className="text-sm font-medium text-yellow-800">Information</h3>
                                      <div className="mt-2 text-sm text-yellow-700 text-left">
                                        <p>
                                          Meetings are scheduled by faculty members for their assigned students. 
                                          This student either hasn't been assigned a guide yet or their guide hasn't scheduled any meetings.
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
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
                    <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center max-w-md">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
                      <p className="mt-4 text-lg font-medium text-indigo-600">Loading student meeting details...</p>
                      <p className="mt-2 text-gray-600 text-center">
                        Retrieving information from the database. This may take a moment.
                      </p>
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