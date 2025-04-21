import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import adminService from '../../services/adminService';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('users');
  const [students, setStudents] = useState([]);
  const [hods, setHods] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [projects, setProjects] = useState([]);
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
  const [isLoadingHods, setIsLoadingHods] = useState(false);
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
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
    } else if (activeTab === 'departments' && hods.length === 0 && !isLoadingHods) {
      fetchHods();
    } else if (activeTab === 'reports' && faculty.length === 0 && !isLoadingFaculty) {
      fetchFaculty();
    } else if (activeTab === 'settings' && projects.length === 0 && !isLoadingProjects) {
      fetchProjects();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch initial data including projects for accurate stats display
      await Promise.all([
        fetchStudents(),
        fetchSystemStats(),
        fetchProjects() // Added to ensure project count is accurate from the start
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

  const fetchHods = async () => {
    if (!user || !user.token) return;
    
    try {
      setIsLoadingHods(true);
      setError(null);
      
      const response = await adminService.getAllHods(user.token);
      setHods(response.data);
      
    } catch (error) {
      console.error('Error fetching HODs:', error);
      setError('Failed to load HOD data. Please try again.');
      toast.error('Unable to fetch HODs from database');
    } finally {
      setIsLoadingHods(false);
    }
  };

  const fetchFaculty = async () => {
    if (!user || !user.token) return;
    
    try {
      setIsLoadingFaculty(true);
      setError(null);
      
      const response = await adminService.getAllFaculty(user.token);
      setFaculty(response.data);
      
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setError('Failed to load faculty data. Please try again.');
      toast.error('Unable to fetch faculty from database');
    } finally {
      setIsLoadingFaculty(false);
    }
  };

  const fetchProjects = async () => {
    if (!user || !user.token) return;
    
    try {
      setIsLoadingProjects(true);
      setError(null);
      
      const response = await adminService.getAllProjects(user.token);
      setProjects(response.data);
      
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load project data. Please try again.');
      toast.error('Unable to fetch projects from database');
    } finally {
      setIsLoadingProjects(false);
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
          
          {/* Enhanced Stats grid with improved animations and UI */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">User Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Total Users Card with hover effect and animation */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-indigo-700 uppercase font-semibold tracking-wider">Total Users</p>
                      <p className="text-2xl font-bold text-indigo-700 mt-1">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-indigo-600">All platform accounts</div>
                </div>
                
                {/* Students Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-700 uppercase font-semibold tracking-wider">Students</p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalStudents}</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-600">Enrolled students</div>
                </div>
                
                {/* Faculty Card */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-700 uppercase font-semibold tracking-wider">Faculty</p>
                      <p className="text-2xl font-bold text-green-700 mt-1">{stats.totalFaculty}</p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-green-600">Teaching staff</div>
                </div>
                
                {/* HODs Card */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-yellow-700 uppercase font-semibold tracking-wider">HODs</p>
                      <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.totalHods}</p>
                    </div>
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-yellow-600">Department heads</div>
                </div>
                
                {/* Projects Card - Using actual project count from state */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-700 uppercase font-semibold tracking-wider">Projects</p>
                      <p className="text-2xl font-bold text-purple-700 mt-1">{projects.length}</p>
                    </div>
                    <div className="bg-purple-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-purple-600">Active dissertations</div>
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
              
              {/* Departments Tab (now HODs) */}
              {activeTab === 'departments' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">HOD Management</h2>
                    <button 
                      className="btn btn-secondary"
                      onClick={fetchHods}
                      disabled={isLoadingHods}
                    >
                      {isLoadingHods ? 'Refreshing...' : 'Refresh List'}
                    </button>
                  </div>
                  
                  {isLoadingHods ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      <p className="ml-3 text-indigo-500">Loading HODs from database...</p>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 p-6 rounded-md">
                      <p className="text-red-800">{error}</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" 
                        onClick={fetchHods}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : hods.length === 0 ? (
                    <div className="bg-gray-50 p-6 text-center rounded-md">
                      <p className="text-gray-500">No HODs found in the database.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left py-3 px-6 border-b border-gray-200 w-1/3">Full Name</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 w-1/3">Email</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 w-1/3">Department</th>
                          </tr>
                        </thead>
                        <tbody>
                          {hods.map(hod => (
                            <tr key={hod.id} className="hover:bg-gray-50">
                              <td className="py-3 px-6 border-b border-gray-200">{hod.name}</td>
                              <td className="py-3 px-6 border-b border-gray-200">{hod.email}</td>
                              <td className="py-3 px-6 border-b border-gray-200">{hod.department}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        Showing {hods.length} HODs from database
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Reports Tab (now Faculty) */}
              {activeTab === 'reports' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Faculty Management</h2>
                    <button 
                      className="btn btn-secondary"
                      onClick={fetchFaculty}
                      disabled={isLoadingFaculty}
                    >
                      {isLoadingFaculty ? 'Refreshing...' : 'Refresh List'}
                    </button>
                  </div>
                  
                  {isLoadingFaculty ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      <p className="ml-3 text-indigo-500">Loading faculty from database...</p>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 p-6 rounded-md">
                      <p className="text-red-800">{error}</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" 
                        onClick={fetchFaculty}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : faculty.length === 0 ? (
                    <div className="bg-gray-50 p-6 text-center rounded-md">
                      <p className="text-gray-500">No faculty members found in the database.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left py-3 px-6 border-b border-gray-200">Full Name</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200">Email</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200">Assigned Students</th>
                          </tr>
                        </thead>
                        <tbody>
                          {faculty.map((member, index) => (
                            <tr 
                              key={member.id} 
                              className="hover:bg-gray-50 animate-fade-in" 
                              style={{animationDelay: `${index * 0.05}s`}}
                            >
                              <td className="py-3 px-6 border-b border-gray-200">{member.name}</td>
                              <td className="py-3 px-6 border-b border-gray-200">{member.email}</td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                <span className="inline-flex items-center">
                                  <span className={`w-2 h-2 mr-2 rounded-full ${member.assignedStudents > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                  {member.assignedStudents || 0} Students
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        Showing {faculty.length} faculty members from database
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Settings Tab (now Projects) */}
              {activeTab === 'settings' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Project Management</h2>
                    <button 
                      className="btn btn-secondary"
                      onClick={fetchProjects}
                      disabled={isLoadingProjects}
                    >
                      {isLoadingProjects ? 'Refreshing...' : 'Refresh List'}
                    </button>
                  </div>
                  
                  {isLoadingProjects ? (
                    <div className="flex flex-col justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
                      <p className="mt-4 text-purple-600 font-medium">Loading project data...</p>
                      <p className="text-gray-500 text-sm mt-2">Fetching from database</p>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 p-6 rounded-md">
                      <p className="text-red-800">{error}</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" 
                        onClick={fetchProjects}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64 bg-gray-50 p-6 rounded-md m-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 mt-4 text-center">No projects found in the database.</p>
                      <button onClick={fetchProjects} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </button>
                    </div>
                  ) : (
                    <div className="table-container overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Title</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Student</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">HOD Assigned</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Guide</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projects.map((project, index) => (
                            <tr 
                              key={project.id} 
                              className="table-row-hover animate-fade-in" 
                              style={{animationDelay: `${index * 0.05}s`}}
                            >
                              <td className="py-3 px-6 border-b border-gray-200 font-medium">{project.title}</td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                <div className="flex items-center">
                                  <span className={`w-2 h-2 mr-2 rounded-full ${project.studentId ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                  {project.studentName}
                                </div>
                              </td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                                  {project.hodAssigned}
                                </span>
                              </td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                <div className="flex items-center">
                                  <span className={`w-2 h-2 mr-2 rounded-full ${project.guide !== 'Not Assigned' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                  {project.guide}
                                </div>
                              </td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                  ${project.status === 'Approved' ? 'bg-green-100 text-green-800 border border-green-200' : 
                                    project.status === 'Rejected' ? 'bg-red-100 text-red-800 border border-red-200' : 
                                    project.status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                    'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
                                  {project.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        Showing {projects.length} projects from database
                      </div>
                    </div>
                  )}
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