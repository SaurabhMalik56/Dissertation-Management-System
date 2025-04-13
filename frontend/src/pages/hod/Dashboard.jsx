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
                    {students?.length || 0}
                  </dd>
                </div>
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
    </div>
  );
};

export default Dashboard;