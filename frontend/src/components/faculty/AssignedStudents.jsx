import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaUserGraduate, FaBook, FaCalendarAlt, FaChartLine, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';
import facultyService from '../../services/facultyService';

const AssignedStudents = ({ onScheduleMeeting, onViewStudent }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchAssignedStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const studentsData = await facultyService.getAssignedStudents(user?.token);
        setStudents(studentsData);
      } catch (err) {
        console.error('Error fetching assigned students:', err);
        setError('Failed to load assigned students. Please try again.');
        toast.error('Failed to load assigned students');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchAssignedStudents();
    }
  }, [user]);

  useEffect(() => {
    console.log('[Faculty Dashboard] Students received in AssignedStudents component:', students);
  }, [students]);

  const refreshStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await facultyService.getAssignedStudents(user?.token, true);
      setStudents(studentsData);
      toast.success('Student list refreshed');
    } catch (err) {
      toast.error('Failed to refresh student list');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = searchTerm 
    ? students.filter(student => 
        student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.project?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : students;

  if (loading && !students.length) {
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
          onClick={refreshStudents}
          className="mt-2 text-sm text-red-700 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-medium text-gray-900">Assigned Students</h3>
        <div className="mt-3 sm:mt-0 flex space-x-2">
          <div className="relative flex-grow max-w-xs">
            <input
              type="text"
              placeholder="Search students..."
              className="block w-full p-2 pr-9 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <button
            onClick={refreshStudents}
            className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Refresh
          </button>
        </div>
      </div>
      
      <div className="px-6 py-4">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <FaUserGraduate className="mx-auto text-gray-400 text-5xl mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No students assigned yet</h3>
            <p className="text-gray-500">
              You don't have any students assigned to you as a guide currently.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <FaUserGraduate className="text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.project ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">{student.project.title}</div>
                          <div className="text-sm text-gray-500">
                            Status: <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                              student.project.status === 'approved' ? 'bg-green-100 text-green-800' :
                              student.project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {student.project.status}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">No project assigned</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.project ? (
                        <div className="flex items-center">
                          <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                (student.project.progress || 0) < 30 ? 'bg-red-500' : 
                                (student.project.progress || 0) < 70 ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`}
                              style={{ width: `${student.project.progress || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{student.project.progress || 0}%</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => onViewStudent(student)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                          title="View Student Details"
                        >
                          <FaEye className="w-4 h-4 mr-1" />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => onScheduleMeeting(student)}
                          className="text-green-600 hover:text-green-900 flex items-center"
                          title="Schedule Meeting"
                        >
                          <FaCalendarAlt className="w-4 h-4 mr-1" />
                          <span>Meeting</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignedStudents; 