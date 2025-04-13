import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaUserGraduate, FaSearch, FaCalendarAlt, FaSync } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AssignedStudents = ({ onScheduleMeeting, onUpdateProgress }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    if (!user || !user.token) {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[Faculty Dashboard] Fetching assigned students');
      
      // Set the authorization header
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };
      
      // Call the faculty API endpoint
      const response = await axios.get(`${API_URL}/faculty/students`, config);
      
      console.log('[Faculty Dashboard] Fetched students:', response.data);
      setStudents(response.data);
      
      setLoading(false);
    } catch (err) {
      console.error('[Faculty Dashboard] Error fetching students:', err);
      
      if (err.response && err.response.status === 404) {
        // No students found
        setStudents([]);
        setError('No students are currently assigned to you as a guide.');
      } else {
        setError('Failed to load assigned students. Please try again.');
        toast.error('Failed to load assigned students');
      }
      
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchStudents();
    toast.info('Refreshing student list...');
  };

  const filteredStudents = searchTerm 
    ? students.filter(student => 
        student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.project?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : students;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h2 className="text-lg leading-6 font-medium text-gray-900">Assigned Students</h2>
        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FaSync className="mr-2 h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>
      
      {error ? (
        <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
          <p>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Try Again
          </button>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="px-4 py-5 sm:p-6 text-center text-gray-500">
          <p>No students found matching your criteria.</p>
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
                  Project Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                        <FaUserGraduate className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                        <div className="text-xs text-gray-500">ID: {student._id}</div>
                        <div className="text-xs text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.project ? student.project.title : 'No project assigned'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.project ? (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${student.project.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          student.project.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {student.project.status.charAt(0).toUpperCase() + student.project.status.slice(1)}
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        N/A
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onScheduleMeeting && onScheduleMeeting(student._id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <FaCalendarAlt className="inline-block mr-1" />
                      Schedule Meeting
                    </button>
                    <button
                      onClick={() => onUpdateProgress && onUpdateProgress(student._id, student.project?._id)}
                      className="text-green-600 hover:text-green-900"
                      disabled={!student.project}
                    >
                      Update Progress
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssignedStudents; 