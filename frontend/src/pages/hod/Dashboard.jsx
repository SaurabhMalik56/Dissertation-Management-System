import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import { toast } from 'react-toastify';
import useHodDashboard from '../../hooks/useHodDashboard';
import { 
  HomeIcon, 
  DocumentTextIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  UserIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

const Dashboard = () => {
  const {
    faculty,
    students,
    projects,
    stats,
    isLoading,
    error,
    pendingProjects,
    departmentFaculty,
    fetchDashboardData,
    handleAssignGuide,
    handleAssignGuideToProject,
    handleUpdateProjectStatus,
    approveProjectWithGuide,
  } = useHodDashboard();

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedProject, setSelectedProject] = useState(null);
  const [assigningGuide, setAssigningGuide] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedGuideId, setSelectedGuideId] = useState('');
  const [guidesSearch, setGuidesSearch] = useState('');
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [viewStudentsModalOpen, setViewStudentsModalOpen] = useState(false);
  const [guidesFilter, setGuidesFilter] = useState('all'); // 'all', 'active', 'available'
  const [studentSearch, setStudentSearch] = useState('');
  const [filteredGuides, setFilteredGuides] = useState([]);
  const [viewProjectModalOpen, setViewProjectModalOpen] = useState(false);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    const loadData = async () => {
      try {
        console.log('Loading fresh dashboard data...');
        if (projects.length === 0 || pendingProjects.length === 0) {
        await fetchDashboardData('all');
        console.log('Dashboard data loaded successfully');
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Failed to load dashboard data');
      }
    };
    
    loadData();
  }, [user, projects.length, pendingProjects.length]);

  // Fetch total student count when component mounts
  useEffect(() => {
    if (!user || !user.token || !user.department) {
      console.log('Missing user data for student count:', { 
        hasUser: !!user, 
        hasToken: !!(user?.token), 
        department: user?.department 
      });
      return;
    }
    
    const fetchStudentCount = async () => {
      try {
        console.log('Fetching student count for department:', user.department);
        // Use import.meta.env for Vite projects or fallback to hardcoded value
        const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:5000/api';
        console.log('API Base URL:', API_BASE);
        
        const apiUrl = `${API_BASE}/users/students?branch=${encodeURIComponent(user.department)}`;
        console.log('API URL:', apiUrl);
        
        // Using axios instead of fetch
        const response = await axios.get(apiUrl, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        console.log('API Response:', response);
        
        if (response.data && Array.isArray(response.data)) {
          console.log(`Found ${response.data.length} students in department ${user.department}:`, response.data);
          setStudentCount(response.data.length);
        } else {
          console.error('Unexpected API response format:', response.data);
          toast.error('Unable to get student count: Unexpected response format');
        }
      } catch (error) {
        console.error('Error fetching student count:', error);
        toast.error(`Unable to get student count: ${error.response?.status || ''} ${error.message}`);
      }
    };
    
    fetchStudentCount();
  }, [user]);

  // Filter guides based on search and active/available filter
  useEffect(() => {
    // Only process if faculty data is available
    if (!faculty || faculty.length === 0) {
      setFilteredGuides([]);
      return;
    }

    // Get only faculty with assigned students (guides)
    let guidesArray = faculty.map(f => ({
      id: f._id || f.id,
      name: f.fullName || f.name,
      email: f.email,
      branch: f.branch || f.specialization || f.department,
      specialization: f.specialization,
      studentsCount: f.assignedStudents?.length || f.studentsCount || 0,
      assignedStudents: f.assignedStudents || []
    }));

    // Apply filters
    if (guidesFilter === 'active') {
      guidesArray = guidesArray.filter(g => g.studentsCount > 0);
    } else if (guidesFilter === 'available') {
      guidesArray = guidesArray.filter(g => g.studentsCount < 5);
    }

    // Apply search
    if (guidesSearch && guidesSearch.trim() !== '') {
      const searchTerm = guidesSearch.toLowerCase().trim();
      guidesArray = guidesArray.filter(g => 
        g.name?.toLowerCase().includes(searchTerm) || 
        g.email?.toLowerCase().includes(searchTerm) || 
        g.branch?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort by number of assigned students (ascending)
    guidesArray.sort((a, b) => a.studentsCount - b.studentsCount);

    setFilteredGuides(guidesArray);
  }, [faculty, guidesSearch, guidesFilter]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleRejectProject = (projectId) => {
    setSelectedProject(projects.find(p => p._id === projectId));
    setRejectModalOpen(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      await handleUpdateProjectStatus(selectedProject._id, 'rejected', rejectionReason);
      toast.success('Project rejected successfully');
      setRejectModalOpen(false);
      setRejectionReason('');
      setSelectedProject(null);
    } catch (error) {
      toast.error('Failed to reject project');
    }
  };

  const handleGuideAssignment = async (projectId, guideId) => {
    try {
      const project = projects.find(p => p._id === projectId);
      const isReassignment = project && project.facultyId;
      
      // Get the guide info for the toast message
      const newGuide = departmentFaculty.find(f => f.id === guideId);
      const previousGuide = isReassignment ? departmentFaculty.find(f => f.id === project.facultyId) : null;
      
      // Call the hook function to update the assignment
      const success = await handleAssignGuideToProject(projectId, guideId);
      
      if (success) {
        // Show appropriate success message
        if (isReassignment) {
          toast.success(`Guide reassigned from ${previousGuide?.name || 'previous guide'} to ${newGuide?.name || 'new guide'}`);
        } else {
          toast.success(`Guide ${newGuide?.name || 'new guide'} assigned successfully!`);
        }
      }
      
      // Close the modal and reset state
      setAssigningGuide(false);
      setSelectedProject(null);
      setSelectedGuideId('');
    } catch (error) {
      toast.error('Failed to assign guide: ' + (error.message || 'Unknown error'));
    }
  };

  // Get assigned students for a guide with their project information
  const getAssignedStudentsWithProjects = (guide) => {
    if (!guide || !guide.assignedStudents || guide.assignedStudents.length === 0) {
      return [];
    }
    
    // Get student IDs from guide's assignedStudents
    const studentIds = guide.assignedStudents.map(student => 
      typeof student === 'object' ? student._id : student
    );
    
    // Find students with matching IDs
    const assignedStudents = students.filter(student => 
      studentIds.includes(student._id || student.id)
    );
    
    // Find projects for these students
    return assignedStudents.map(student => {
      const studentId = student._id || student.id;
      const studentProjects = projects.filter(p => {
        const projectStudentId = p.student?._id || p.student || p.studentId;
        return projectStudentId === studentId;
      });
      
      return {
        id: studentId,
        name: student.fullName || student.name,
        rollNo: student.rollNo || student.email?.split('@')[0] || 'N/A',
        email: student.email,
        projects: studentProjects.map(p => ({
          id: p._id,
          title: p.title,
          status: p.status
        }))
      };
    });
  };
  
  const handleViewAssignedStudents = (guide) => {
    setSelectedGuide(guide);
    setViewStudentsModalOpen(true);
  };
  
  const closeViewStudentsModal = () => {
    setSelectedGuide(null);
    setViewStudentsModalOpen(false);
    setStudentSearch('');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-full bg-gray-100">
      <main className="flex-1">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Dashboard
            </h1>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Pending Proposals
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {pendingProjects?.length || 0}
                  </dd>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Approved Projects
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {projects?.filter(p => p.status === 'approved').length || 0}
                  </dd>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Faculty
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {faculty?.length || 0}
                  </dd>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Students
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {studentCount}
                  </dd>
                </div>
              </div>
            </div>
            
            {/* Assigned Guides Section */}
            <div className="bg-white shadow sm:rounded-lg mb-6">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Assigned Guides
                </h3>
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Search guides..."
                    className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    value={guidesSearch || ''}
                    onChange={(e) => setGuidesSearch(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Filter Buttons */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center space-x-2">
                <span className="text-sm text-gray-500">Filter by:</span>
                <button
                  onClick={() => setGuidesFilter('all')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    guidesFilter === 'all' 
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  All Guides
                </button>
                <button
                  onClick={() => setGuidesFilter('active')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    guidesFilter === 'active' 
                      ? 'bg-green-100 text-green-800 border border-green-300' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Active Guides
                </button>
                <button
                  onClick={() => setGuidesFilter('available')}
                  className={`px-3 py-1 rounded-md text-sm ${
                    guidesFilter === 'available' 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Available Guides
                </button>
                <div className="ml-auto text-xs text-gray-500">
                  Showing {filteredGuides?.length || 0} of {faculty?.length || 0} guides
                </div>
              </div>
              
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-50 text-red-700 border-l-4 border-red-500">
                    {error}
                  </div>
                ) : filteredGuides?.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guide Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Students
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredGuides?.map((guide) => (
                        <tr key={guide.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-700 font-medium text-sm">
                                  {guide.name?.charAt(0) || 'F'}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {guide.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{guide.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{guide.branch || guide.specialization || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              guide.studentsCount > 5 
                                ? 'bg-orange-100 text-orange-800' 
                                : guide.studentsCount > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                            }`}>
                              {guide.studentsCount || 0} Students
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleViewAssignedStudents(guide)}
                              className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-150 rounded-md px-3 py-1"
                            >
                              View Students
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No guides found. Assign guides to projects to see them here.
                  </div>
                )}
              </div>
            </div>
            
            {/* Pending Proposals Section */}
            <div className="bg-white shadow sm:rounded-lg mb-6">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Pending Proposals
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-50 text-red-700 border-l-4 border-red-500">
                    {error}
                  </div>
                ) : pendingProjects?.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No pending proposals to display
                  </div>
                ) : (
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
                          Department
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submission Date
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pendingProjects?.map((project) => (
                        <tr key={project._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {project.student || "Unknown Student"}
                                </div>
                                {project.studentEmail && (
                                <div className="text-sm text-gray-500">
                                    {project.studentEmail}
                                </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{project.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{project.department}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(project.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleUpdateProjectStatus(project._id, 'approved')}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectProject(project._id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Approved Proposals Section */}
            <div className="bg-white shadow sm:rounded-lg mb-6">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Approved Proposals
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                  </div>
                ) : projects?.filter(p => p.status === 'approved').length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No approved proposals to display
                  </div>
                ) : (
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
                          Assigned Guide
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {projects?.filter(p => p.status === 'approved')?.map((project) => (
                        <tr key={project._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {project.student || "Unknown Student"}
                                </div>
                                {project.studentEmail && (
                                  <div className="text-sm text-gray-500">
                                    {project.studentEmail}
                                </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{project.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {project.facultyId ? (
                              <div className="flex flex-col items-start">
                                <div className="text-sm font-medium text-gray-900">
                                  {project.faculty}
                                </div>
                                {project.facultyEmail && (
                                <div className="text-sm text-gray-500">
                                  {project.facultyEmail}
                                </div>
                                )}
                              </div>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Not Assigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {!project.facultyId ? (
                              <button
                                onClick={() => {
                                  setSelectedProject(project);
                                  setAssigningGuide(true);
                                  setSelectedGuideId('');
                                }}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-150"
                              >
                                Assign Guide
                              </button>
                            ) : (
                              <div className="flex justify-center">
                              <button
                                onClick={() => {
                                  setSelectedProject(project);
                                  setAssigningGuide(true);
                                    setSelectedGuideId(project.facultyId);
                                }}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-150"
                              >
                                Reassign Guide
                              </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Guide Assignment Modal */}
      {assigningGuide && selectedProject && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex justify-between items-center">
                    <span>{selectedProject.facultyId ? 'Reassign Guide' : 'Assign Guide'} to Project</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAssigningGuide(false);
                        setSelectedProject(null);
                        setSelectedGuideId('');
                      }}
                      className="inline-flex items-center justify-center p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors duration-150"
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Project: <span className="font-medium">{selectedProject.title}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Student: <span className="font-medium">{selectedProject.student || "Unknown Student"}</span>
                    </p>
                    {selectedProject.facultyId && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded-md">
                        <p className="text-sm font-medium text-yellow-800">
                          Current Guide: {selectedProject.faculty}
                        </p>
                        <p className="text-xs text-yellow-600">
                          This action will reassign the guide for both the project and the student
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-5">
                  {departmentFaculty && departmentFaculty.length > 0 ? (
                    <div>
                      <div className="mb-3 text-sm text-gray-500 flex justify-between items-center">
                        <span>Select a faculty member to assign as guide:</span>
                        <span className="text-xs text-indigo-600">Sorted by current workload</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 max-h-60 overflow-y-auto pr-1">
                        {departmentFaculty.map((faculty) => {
                          const isCurrentGuide = faculty.id === selectedProject.facultyId;
                          return (
                      <button
                        key={faculty.id}
                              onClick={() => handleGuideAssignment(selectedProject._id, faculty.id)}
                              disabled={isCurrentGuide}
                              className={`flex items-center justify-between p-3 border rounded-lg transition-colors duration-150
                                ${isCurrentGuide 
                                  ? 'border-indigo-300 bg-indigo-50 cursor-not-allowed' 
                                  : 'border-gray-300 hover:bg-indigo-50'}`}
                      >
                        <div className="flex items-center">
                                <div className={`rounded-full w-10 h-10 flex items-center justify-center mr-3 
                                  ${isCurrentGuide 
                                    ? 'bg-indigo-200 text-indigo-700' 
                                    : 'bg-indigo-100 text-indigo-500'}`}>
                            {faculty.name?.charAt(0) || 'F'}
                          </div>
                          <div className="text-left">
                                  <p className={`text-sm font-medium ${isCurrentGuide ? 'text-indigo-700' : 'text-gray-900'}`}>
                                    {faculty.name}
                                  </p>
                            <p className="text-xs text-gray-500">{faculty.email}</p>
                                  {faculty.branch && (
                                    <p className="text-xs text-gray-400">Branch: {faculty.branch}</p>
                                  )}
                          </div>
                        </div>
                      </button>
                          );
                        })}
                  </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No faculty members available for assignment
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-5 sm:mt-6 flex space-x-3">
                {selectedProject.facultyId && (
                  <button
                    type="button"
                    className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm transition-colors duration-150"
                    onClick={() => {
                      // Simple mock of removing guide assignment
                      toast.success(`Guide assignment removed from ${selectedProject.faculty}`);
                      // Would normally call an API to remove the assignment
                      setAssigningGuide(false);
                      setSelectedProject(null);
                      setSelectedGuideId('');
                    }}
                  >
                    Remove Guide
                  </button>
                )}
                <button
                  type="button"
                  className={`inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm transition-colors duration-150 ${selectedProject.facultyId ? '' : 'w-full'}`}
                  onClick={() => {
                    setAssigningGuide(false);
                    setSelectedProject(null);
                    setSelectedGuideId('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Assigned Students Modal */}
      {viewStudentsModalOpen && selectedGuide && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex justify-between items-center">
                    <span>Students Assigned to {selectedGuide.name}</span>
                    <button
                      type="button"
                      onClick={closeViewStudentsModal}
                      className="inline-flex items-center justify-center p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors duration-150"
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </h3>
                  
                  <div className="mt-2 p-2 bg-indigo-50 rounded-md">
                    <p className="text-sm font-medium text-indigo-800">
                      Total Students: {selectedGuide.studentsCount || 0}
                    </p>
                    <p className="text-xs text-indigo-600">
                      Department: {selectedGuide.branch || selectedGuide.specialization || 'Not specified'}
                    </p>
                  </div>
                  
                  {/* Search Input */}
                  <div className="mt-4 relative">
                    <input
                      type="text"
                      placeholder="Search students..."
                      className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  {(() => {
                    const studentsWithProjects = getAssignedStudentsWithProjects(selectedGuide);
                    
                    // Apply search filter
                    const filteredStudents = studentSearch.trim() !== '' 
                      ? studentsWithProjects.filter(s => 
                          s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.rollNo?.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.email?.toLowerCase().includes(studentSearch.toLowerCase())
                        )
                      : studentsWithProjects;
                    
                    if (filteredStudents.length === 0) {
                      return (
                        <div className="text-center py-6">
                          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {studentSearch ? 'Try adjusting your search' : 'This guide has not been assigned any students yet'}
                          </p>
                        </div>
                      );
                    }
                    
                    return (
                      <div className="overflow-y-auto max-h-60">
                        <div className="space-y-3">
                          {filteredStudents.map(student => (
                            <div key={student.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-green-700 font-medium text-sm">
                                      {student.name?.charAt(0) || 'S'}
                                    </span>
                                  </div>
                                  <div className="ml-3">
                                    <h4 className="text-sm font-medium text-gray-900">{student.name}</h4>
                                    <p className="text-xs text-gray-500">{student.rollNo}</p>
                                  </div>
                                </div>
                                <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                                  {student.projects?.length || 0} Projects
                                </span>
                              </div>
                              
                              {student.projects && student.projects.length > 0 && (
                  <div className="mt-2">
                                  <h5 className="text-xs font-medium text-gray-500 mb-1">Project Details:</h5>
                                  <ul className="space-y-1">
                                    {student.projects.map(project => (
                                      <li key={project.id} className="text-xs flex justify-between">
                                        <span className="truncate flex-grow text-gray-700">{project.title}</span>
                                        <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                                          project.status === 'approved' ? 'bg-green-100 text-green-800' :
                                          project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          project.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {project.status}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-colors duration-150"
                  onClick={closeViewStudentsModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {viewProjectModalOpen && selectedProject && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex justify-between items-center">
                    <span>Project Details</span>
                    <button
                      type="button"
                      onClick={() => {
                        setViewProjectModalOpen(false);
                        setSelectedProject(null);
                      }}
                      className="inline-flex items-center justify-center p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors duration-150"
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </h3>
                </div>
                
                <div className="mt-4">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-md font-medium text-gray-900 mb-2">{selectedProject.title}</h4>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedProject.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : selectedProject.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : selectedProject.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : selectedProject.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedProject.status?.charAt(0).toUpperCase() + selectedProject.status?.slice(1) || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Submitted: {new Date(selectedProject.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">Student</h5>
                      <p className="text-sm text-gray-900">
                        {selectedProject.student?.fullName || selectedProject.student?.name || selectedProject.student || "Unknown Student"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedProject.studentEmail}
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">Department</h5>
                      <p className="text-sm text-gray-900">
                        {selectedProject.department || 'Not specified'}
                    </p>
                  </div>
                </div>
                  
                  <div className="mb-4">
                    <h5 className="text-sm font-medium text-gray-500 mb-1">Description</h5>
                    <p className="text-sm text-gray-900 border rounded-md p-3 bg-gray-50">
                      {selectedProject.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">Technologies</h5>
                      <div className="flex flex-wrap">
                        {selectedProject.technologies ? (
                          (typeof selectedProject.technologies === 'string' ? 
                            selectedProject.technologies.split(',') : 
                            selectedProject.technologies
                          ).map((tech, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs m-1">
                              {tech.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-500">No technologies specified.</span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-500 mb-1">Assigned Guide</h5>
                      {selectedProject.facultyId ? (
                        <div>
                          <p className="text-sm text-gray-900">{selectedProject.faculty}</p>
                          <p className="text-xs text-gray-500">{selectedProject.facultyEmail}</p>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">No guide assigned</span>
                          <button
                            onClick={() => {
                              setViewProjectModalOpen(false);
                              setAssigningGuide(true);
                              setSelectedGuideId('');
                            }}
                            className="text-xs bg-indigo-50 text-indigo-600 py-1 px-2 rounded hover:bg-indigo-100"
                          >
                            Assign Guide
                          </button>
                        </div>
                      )}
                  </div>
                  </div>
                  
                  {selectedProject.status === 'approved' && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Progress Updates</h5>
                      {selectedProject.progressUpdates && selectedProject.progressUpdates.length > 0 ? (
                        <div className="space-y-2">
                          {selectedProject.progressUpdates.map((update, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded-md">
                              <div className="flex justify-between">
                                <h6 className="text-sm font-medium">{update.title}</h6>
                                <span className="text-xs text-gray-500">
                                  {new Date(update.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 mt-1">{update.description}</p>
                              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div 
                                  className={`h-2.5 rounded-full ${
                                    update.progress < 30 ? 'bg-red-500' : 
                                    update.progress < 70 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`} 
                                  style={{ width: `${update.progress}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium text-gray-700 flex justify-end mt-1">
                                {update.progress}% complete
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No progress updates yet.</p>
                      )}
                    </div>
                  )}
                  
                  {selectedProject.status === 'rejected' && selectedProject.rejectionReason && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h5 className="text-sm font-medium text-red-500 mb-2">Rejection Reason</h5>
                      <p className="text-sm text-gray-700 bg-red-50 p-3 rounded-md border border-red-100">
                        {selectedProject.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6 flex space-x-3">
                {selectedProject.status === 'pending' && (
                  <>
                <button
                  type="button"
                      className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:text-sm transition-colors duration-150"
                      onClick={() => {
                        handleUpdateProjectStatus(selectedProject._id, 'approved');
                        setViewProjectModalOpen(false);
                      }}
                    >
                      Approve Project
                </button>
                <button
                  type="button"
                      className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm transition-colors duration-150"
                      onClick={() => {
                        setRejectModalOpen(true);
                        setViewProjectModalOpen(false);
                      }}
                    >
                      Reject Project
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm transition-colors duration-150"
                  onClick={() => {
                    setViewProjectModalOpen(false);
                    setSelectedProject(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 