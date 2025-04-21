import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import adminService from '../../services/adminService';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('users');
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalHods: 0,
    totalDepartments: 0,
    totalProjects: 0
  });
  const [systemLoad, setSystemLoad] = useState({
    cpu: 32,
    memory: 45,
    storage: 68,
    network: 25
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && user.token) {
      fetchData();
    }
  }, [user]);

  // When tab changes, make sure data is loaded for that tab
  useEffect(() => {
    if (activeTab === 'users' && students.length === 0 && !isLoadingStudents) {
      fetchStudents();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch initial data
      await Promise.all([
        fetchStudents(),
        fetchSystemStats()
      ]);
      
      setIsLoading(false);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      setIsLoading(false);
      toast.error('Failed to load dashboard data. Please try again later.');
    }
  };

  const fetchStudents = async () => {
    if (!user || !user.token) return;
    
    try {
      setIsLoadingStudents(true);
      setError(null);
      
      const studentsResponse = await adminService.getAllStudents(user.token);
      setStudents(studentsResponse.data);
      
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load student data. Please try again.');
      toast.error('Unable to fetch students from database');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchSystemStats = async () => {
    if (!user || !user.token) return;
    
    try {
      const statsResponse = await adminService.getSystemStats(user.token);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      toast.error('Failed to load system statistics');
    }
  };

  const handleAddStudent = async () => {
    // This would typically open a modal with a form
    toast.info('Add student functionality requires a form implementation');
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await adminService.deleteStudent(user.token, studentId);
        toast.success('Student deleted successfully');
        // Update local state to remove deleted student
        setStudents(students.filter(student => student.id !== studentId));
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error('Failed to delete student');
      }
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'student':
        return 'badge-primary';
      case 'faculty':
        return 'badge-success';
      case 'hod':
        return 'badge-warning';
      case 'admin':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getStatusIndicatorClass = (status) => {
    return status === 'active' ? 'bg-green-500' : 'bg-red-500';
  };

  const getProgressColorClass = (progress) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Welcome section with stats */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">System Administration</h1>
              <p className="text-gray-600 mt-1">Welcome, {user?.fullName} - Manage all aspects of Disserto platform.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="badge badge-danger">Administrator</span>
            </div>
          </div>
          
          {/* Stats grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">User Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-3 rounded-lg">
                  <p className="text-xs text-indigo-700 uppercase font-semibold">Total Users</p>
                  <p className="text-2xl font-bold text-indigo-700">{stats.totalUsers}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-blue-700 uppercase font-semibold">Students</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalStudents}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-green-700 uppercase font-semibold">Faculty</p>
                  <p className="text-2xl font-bold text-green-700">{stats.totalFaculty}</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-xs text-yellow-700 uppercase font-semibold">HODs</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.totalHods}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Department Overview</h3>
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-600">Total Departments</p>
                    <p className="font-semibold">{stats.totalDepartments}</p>
                  </div>
                  <div className="flex justify-between mb-2">
                    <p className="text-gray-600">Total Projects</p>
                    <p className="font-semibold">{stats.totalProjects}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="w-full btn btn-primary">
                    Manage Departments
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">System Health</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">CPU Usage</span>
                    <span className="font-medium">{systemLoad.cpu}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${systemLoad.cpu > 80 ? 'bg-red-500' : systemLoad.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                      style={{ width: `${systemLoad.cpu}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Memory</span>
                    <span className="font-medium">{systemLoad.memory}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${systemLoad.memory > 80 ? 'bg-red-500' : systemLoad.memory > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                      style={{ width: `${systemLoad.memory}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Storage</span>
                    <span className="font-medium">{systemLoad.storage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${systemLoad.storage > 80 ? 'bg-red-500' : systemLoad.storage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                      style={{ width: `${systemLoad.storage}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Network</span>
                    <span className="font-medium">{systemLoad.network}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${systemLoad.network > 80 ? 'bg-red-500' : systemLoad.network > 60 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                      style={{ width: `${systemLoad.network}%` }}
                    ></div>
                  </div>
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
                  className={`tab ${activeTab === 'users' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => setActiveTab('users')}
                >
                  Students
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'departments' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => setActiveTab('departments')}
                >
                  Hods
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'reports' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => setActiveTab('reports')}
                >
                  Faculty
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'settings' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => setActiveTab('settings')}
                >
                  Projects
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
              {/* Users Tab (now Students) */}
              {activeTab === 'users' && (
                <div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Student Management</h2>
                    <div className="flex space-x-2">
                      <button
                        className="btn btn-secondary"
                        onClick={fetchStudents}
                        disabled={isLoadingStudents}
                      >
                        {isLoadingStudents ? 'Refreshing...' : 'Refresh List'}
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={handleAddStudent}
                        disabled={isAddingStudent}
                      >
                        {isAddingStudent ? 'Adding...' : 'Add Student'}
                      </button>
                    </div>
                  </div>
                  
                  {isLoadingStudents ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      <p className="ml-3 text-indigo-500">Loading students from database...</p>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 p-6 rounded-md">
                      <p className="text-red-800">{error}</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" 
                        onClick={fetchStudents}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : students.length === 0 ? (
                    <div className="bg-gray-50 p-6 text-center rounded-md">
                      <p className="text-gray-500">No students found in the database.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left py-3 px-6 border-b border-gray-200 w-1/3">Full Name</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 w-1/3">Email Address</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 w-1/3">Assigned Guide</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="py-3 px-6 border-b border-gray-200">{student.name}</td>
                              <td className="py-3 px-6 border-b border-gray-200">{student.email}</td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                {student.guideName ? (
                                  <div className="flex items-center">
                                    <span className="w-2 h-2 mr-2 bg-green-500 rounded-full"></span>
                                    <span>{student.guideName}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-gray-500">
                                    <span className="w-2 h-2 mr-2 bg-gray-300 rounded-full"></span>
                                    <span>Not Assigned</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        Showing {students.length} students from database
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Departments Tab */}
              {activeTab === 'departments' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">HOD Management</h2>
                    <button className="btn btn-primary">Add HOD</button>
                  </div>
                  
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th>HOD</th>
                          <th>Faculty</th>
                          <th>Students</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {departments.map(dept => (
                          <tr key={dept.id}>
                            <td className="font-medium text-gray-800">{dept.name}</td>
                            <td>{dept.hod}</td>
                            <td>{dept.faculty}</td>
                            <td>{dept.students}</td>
                            <td>
                              <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                                Edit
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Faculty Management</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card">
                      <div className="card-header bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-700">User Summary</h3>
                      </div>
                      <div className="card-body">
                        <div className="space-y-4 mt-4">
                          <div className="flex justify-between">
                            <span>Total Students:</span>
                            <span className="font-medium">{stats.totalStudents}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Faculty:</span>
                            <span className="font-medium">{stats.totalFaculty}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total HODs:</span>
                            <span className="font-medium">{stats.totalHods}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Users:</span>
                            <span className="font-medium">{stats.totalUsers}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="card">
                      <div className="card-header bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-700">Department Statistics</h3>
                      </div>
                      <div className="card-body">
                        <div className="space-y-4">
                          {departments.slice(0, 3).map(dept => (
                            <div key={dept.id}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-600">{dept.name}</span>
                                <span className="font-medium">{dept.students} students</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 pt-6 border-t">
                          <button className="btn btn-primary w-full">
                            Download Reports
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">Project Management</h2>
                  
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">General Settings</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            System Name
                          </label>
                          <input type="text" className="form-input" value="Disserto" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Admin Email
                          </label>
                          <input type="email" className="form-input" value="admin@disserto.edu" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-4">
                      <button className="btn btn-primary">
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 