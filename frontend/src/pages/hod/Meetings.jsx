import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import useHodDashboard from '../../hooks/useHodDashboard';
import hodService from '../../services/hodService';

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800'
};

const Meetings = () => {
  const { isLoading, error } = useHodDashboard();
  const { user } = useSelector((state) => state.auth);
  
  // State for guides and meetings
  const [guides, setGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState('');
  const [meetings, setMeetings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [studentMeetings, setStudentMeetings] = useState({});
  
  // Fetch all guides in the department
  useEffect(() => {
    const fetchGuides = async () => {
      if (!user) return;
      
      try {
        const facultyData = await hodService.getDepartmentFaculty(user.token, user.department || user.branch);
        setGuides(facultyData);
      } catch (err) {
        console.error('Error fetching guides:', err);
        toast.error('Failed to load guides');
      }
    };
    
    fetchGuides();
  }, [user]);

  // Fetch meetings when a guide is selected
  useEffect(() => {
    const fetchGuideMeetings = async () => {
      if (!user || !selectedGuide) return;
      
      setLoadingMeetings(true);
      
      try {
        const data = await hodService.getDepartmentMeetings(user.token);
        
        // Filter meetings for the selected guide
        const guideMeetings = data.filter(meeting => 
          meeting.guide?._id === selectedGuide
        );
        
        // Group meetings by student
        const studentMeetingsMap = {};
        
        guideMeetings.forEach(meeting => {
          const studentId = meeting.student?._id;
          if (!studentId) return;
          
          if (!studentMeetingsMap[studentId]) {
            studentMeetingsMap[studentId] = {
              studentId,
              studentName: meeting.student?.fullName || 'Unknown Student',
              meetings: []
            };
          }
          
          studentMeetingsMap[studentId].meetings.push(meeting);
        });
        
        // Sort meetings by meeting number and limit to 4 per student
        Object.values(studentMeetingsMap).forEach(student => {
          student.meetings.sort((a, b) => a.meetingNumber - b.meetingNumber);
          student.meetings = student.meetings.slice(0, 4);
          
          // Calculate progress
          const completedCount = student.meetings.filter(m => m.status === 'completed').length;
          student.progress = Math.round((completedCount / student.meetings.length) * 100) || 0;
        });
        
        setStudentMeetings(studentMeetingsMap);
        setMeetings(guideMeetings);
      } catch (err) {
        console.error('Error fetching meetings:', err);
        toast.error('Failed to load meetings');
      } finally {
        setLoadingMeetings(false);
      }
    };
    
    fetchGuideMeetings();
  }, [user, selectedGuide]);

  // Filter meetings based on status
  const filteredMeetings = meetings.filter(meeting => {
    if (filterStatus === 'all') return true;
    return meeting.status === filterStatus;
  });

  return (
    <div className="min-h-full bg-gray-100">
      <main className="flex-1">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Meetings Overview
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View meeting progress between guides and their assigned students
            </p>
            <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-md">
              <p className="text-sm text-indigo-800 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Select a guide to view the progress of their meetings with assigned students.
              </p>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
            {/* Guide Selection */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Select a Guide</h3>
              <select
                value={selectedGuide}
                onChange={(e) => setSelectedGuide(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">-- Select a Guide --</option>
                {guides.map((guide) => (
                  <option key={guide._id} value={guide._id}>
                    {guide.fullName} ({guide.email})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Content when guide is selected */}
            {selectedGuide ? (
              loadingMeetings ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <>
                  {/* Student Progress Cards */}
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Student Meeting Progress</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.values(studentMeetings).length > 0 ? (
                        Object.values(studentMeetings).map((student) => (
                          <div key={student.studentId} className="bg-white shadow rounded-lg p-4">
                            <h4 className="font-medium text-gray-900">{student.studentName}</h4>
                            <div className="mt-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">Meeting Progress</span>
                                <span className="text-sm font-medium text-gray-700">{student.progress}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-indigo-600 h-2.5 rounded-full" 
                                  style={{ width: `${student.progress}%` }}
                                ></div>
                              </div>
                            </div>
                            <div className="mt-3 space-y-2">
                              {student.meetings.map((meeting) => (
                                <div key={meeting._id} className="flex items-center">
                                  <div className={`w-2 h-2 rounded-full mr-2 ${meeting.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                  <span className="text-sm">Meeting {meeting.meetingNumber}</span>
                                  <span className={`ml-auto px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[meeting.status] || 'bg-gray-100 text-gray-800'}`}>
                                    {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                                  </span>
                                </div>
                              ))}
                              {student.meetings.length === 0 && (
                                <p className="text-sm text-gray-500">No meetings scheduled yet</p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-6 text-gray-500">
                          No students with meetings found for this guide
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Meeting Details */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Detailed Meeting Information</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setFilterStatus('all')}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            filterStatus === 'all' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setFilterStatus('completed')}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            filterStatus === 'completed' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          Completed
                        </button>
                        <button
                          onClick={() => setFilterStatus('scheduled')}
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            filterStatus === 'scheduled' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          Scheduled
                        </button>
                      </div>
                    </div>
                    
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                      {filteredMeetings.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Student
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Meeting No.
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date & Time
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Notes
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {filteredMeetings.map((meeting) => (
                                <tr key={meeting._id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {meeting.student?.fullName}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{meeting.meetingNumber || '-'}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                      {new Date(meeting.scheduledDate).toLocaleDateString()}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {new Date(meeting.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[meeting.status] || 'bg-gray-100 text-gray-800'}`}>
                                      {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 max-w-xs line-clamp-2">
                                      {meeting.notes || 'No notes available'}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          No meetings match the current filter
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )
            ) : (
              <div className="bg-white shadow rounded-lg p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No guide selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select a guide from the dropdown above to view their meeting progress
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Meetings; 