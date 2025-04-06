import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
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
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate API call to fetch admin data
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // In a real app, these would be actual API calls with the user's token
        // const response = await axios.get('/api/admin/dashboard', {
        //   headers: { Authorization: `Bearer ${user.token}` }
        // });
        
        // For now, use mock data
        setTimeout(() => {
          setUsers([
            { id: 1, name: 'John Doe', email: 'john.doe@example.com', role: 'student', department: 'Computer Science', status: 'active' },
            { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', role: 'student', department: 'Information Technology', status: 'active' },
            { id: 3, name: 'Dr. Smith', email: 'dr.smith@example.com', role: 'faculty', department: 'Computer Science', status: 'active' },
            { id: 4, name: 'Dr. Johnson', email: 'dr.johnson@example.com', role: 'faculty', department: 'Information Technology', status: 'active' },
            { id: 5, name: 'Prof. Williams', email: 'prof.williams@example.com', role: 'hod', department: 'Computer Science', status: 'active' },
            { id: 6, name: 'Robert Brown', email: 'robert.brown@example.com', role: 'student', department: 'Electronics', status: 'inactive' }
          ]);
          
          setDepartments([
            { id: 1, name: 'Computer Science', hod: 'Prof. Williams', faculty: 12, students: 120, projects: 85 },
            { id: 2, name: 'Information Technology', hod: 'Prof. Davis', faculty: 10, students: 105, projects: 78 },
            { id: 3, name: 'Electronics', hod: 'Prof. Johnson', faculty: 8, students: 90, projects: 65 },
            { id: 4, name: 'Mechanical', hod: 'Prof. Thompson', faculty: 15, students: 150, projects: 110 },
            { id: 5, name: 'Civil', hod: 'Prof. Wilson', faculty: 14, students: 135, projects: 95 }
          ]);
          
          setStats({
            totalUsers: 505,
            totalStudents: 450,
            totalFaculty: 50,
            totalHods: 5,
            totalDepartments: 5,
            totalProjects: 433
          });
          
          setIsLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

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
                  Users
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'departments' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => setActiveTab('departments')}
                >
                  Departments
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'reports' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => setActiveTab('reports')}
                >
                  Reports
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'settings' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => setActiveTab('settings')}
                >
                  Settings
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
              {/* Users Tab */}
              {activeTab === 'users' && (
                <div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="flex">
                        <input 
                          type="text" 
                          placeholder="Search users..." 
                          className="form-input rounded-r-none"
                        />
                        <button className="bg-gray-100 border border-l-0 border-gray-300 px-3 rounded-r-md">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                          </svg>
                        </button>
                      </div>
                      <select className="form-input">
                        <option value="">All Roles</option>
                        <option value="student">Students</option>
                        <option value="faculty">Faculty</option>
                        <option value="hod">HODs</option>
                        <option value="admin">Admins</option>
                      </select>
                      <button className="btn btn-primary">Add User</button>
                    </div>
                  </div>
                  
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Department</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(user => (
                          <tr key={user.id}>
                            <td className="font-medium text-gray-800">{user.name}</td>
                            <td>{user.email}</td>
                            <td>
                              <span className={`badge ${getRoleBadgeClass(user.role)}`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                            </td>
                            <td>{user.department}</td>
                            <td>
                              <div className="flex items-center">
                                <div className={`w-2.5 h-2.5 rounded-full mr-2 ${getStatusIndicatorClass(user.status)}`}></div>
                                <span>{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                              </div>
                            </td>
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
                  
                  {/* Pagination */}
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">6</span> of <span className="font-medium">{stats.totalUsers}</span> users
                    </div>
                    <div className="flex space-x-2">
                      <button className="btn btn-secondary">Previous</button>
                      <button className="btn btn-primary">Next</button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Departments Tab */}
              {activeTab === 'departments' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Department Management</h2>
                    <button className="btn btn-primary">Add Department</button>
                  </div>
                  
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Department</th>
                          <th>HOD</th>
                          <th>Faculty</th>
                          <th>Students</th>
                          <th>Projects</th>
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
                            <td>{dept.projects}</td>
                            <td>
                              <button className="text-indigo-600 hover:text-indigo-900 mr-2">
                                View
                              </button>
                              <button className="text-green-600 hover:text-green-900 mr-2">
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
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">System Reports</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="card">
                      <div className="card-header bg-gray-50">
                        <h3 className="text-lg font-medium text-gray-700">User Distribution</h3>
                      </div>
                      <div className="card-body">
                        <div className="flex items-center justify-center h-64">
                          <div className="relative w-48 h-48 rounded-full">
                            {/* This is a placeholder for a pie chart - in a real app you'd use a chart library */}
                            <div className="absolute inset-0 border-8 border-blue-500 rounded-full" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%)' }}></div>
                            <div className="absolute inset-0 border-8 border-green-500 rounded-full" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 0% 0%, 0% 50%)' }}></div>
                            <div className="absolute inset-0 border-8 border-yellow-500 rounded-full" style={{ clipPath: 'polygon(50% 50%, 0% 50%, 0% 100%, 50% 100%)' }}></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
                                <p className="text-lg font-semibold text-gray-700">User Roles</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-sm">Students ({Math.round(stats.totalStudents / stats.totalUsers * 100)}%)</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-sm">Faculty ({Math.round(stats.totalFaculty / stats.totalUsers * 100)}%)</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                            <span className="text-sm">HODs ({Math.round(stats.totalHods / stats.totalUsers * 100)}%)</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                            <span className="text-sm">Admins (1%)</span>
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
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(dept.students / 150) * 100}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 pt-6 border-t">
                          <div className="grid grid-cols-2 gap-4">
                            <button className="btn btn-primary">
                              User Report
                            </button>
                            <button className="btn btn-secondary">
                              Project Report
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-6">System Settings</h2>
                  
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Timezone
                          </label>
                          <select className="form-input">
                            <option>UTC (Coordinated Universal Time)</option>
                            <option>EST (Eastern Standard Time)</option>
                            <option>CST (Central Standard Time)</option>
                            <option>PST (Pacific Standard Time)</option>
                            <option>IST (Indian Standard Time)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-lg border shadow-sm">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Email Configuration</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SMTP Server
                          </label>
                          <input type="text" className="form-input" value="smtp.disserto.edu" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SMTP Port
                          </label>
                          <input type="text" className="form-input" value="587" />
                        </div>
                        <div className="flex items-center">
                          <input id="enable-ssl" type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded" checked />
                          <label htmlFor="enable-ssl" className="ml-2 block text-sm text-gray-700">
                            Enable SSL
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-4">
                      <button className="btn btn-secondary">
                        Reset to Default
                      </button>
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