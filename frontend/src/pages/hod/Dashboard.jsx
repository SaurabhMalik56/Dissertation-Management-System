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
  } = useHodDashboard();

  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [assigningGuide, setAssigningGuide] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navigation = [
    { name: 'Overview', href: '/hod/dashboard', icon: HomeIcon },
    { name: 'Project Proposals', href: '/hod/proposals', icon: DocumentTextIcon },
    { name: 'Assigned Guides', href: '/hod/guides', icon: UserGroupIcon },
    { name: 'Meetings Overview', href: '/hod/meetings', icon: CalendarIcon },
    { name: 'Profile', href: '/hod/profile', icon: UserIcon },
  ];

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm fixed w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <span className="sr-only">Open main menu</span>
                {isSidebarOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
              <div className="flex-shrink-0 flex items-center ml-4">
                <img
                  className="h-8 w-auto"
                  src="/logo.png"
                  alt="Disserto"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                <span className="font-medium">{user.name}</span>
                <span className="mx-2">|</span>
                <span>{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white shadow-lg transition-all duration-300 fixed h-full`}>
          <div className="h-full flex flex-col">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                          isActive
                            ? 'text-gray-500'
                            : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                        aria-hidden="true"
                      />
                      {isSidebarOpen && item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className={`flex-1 ${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
          <main className="flex-1">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                </h1>
              </div>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="py-4">
                  {/* Pending Proposals Section */}
                  <div className="bg-white shadow rounded-lg mb-6">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Pending Proposals
                      </h3>
                      <div className="mt-5">
                        {isLoading ? (
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                          </div>
                        ) : error ? (
                          <div className="bg-red-50 border-l-4 border-red-400 p-4">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {pendingProjects?.map((project) => (
                              <div key={project._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">{project.title}</h4>
                                  <p className="text-sm text-gray-500">{project.student?.name}</p>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleUpdateProjectStatus(project._id, 'approved')}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateProjectStatus(project._id, 'rejected')}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Approved Proposals Section */}
                  <div className="bg-white shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        Approved Proposals
                      </h3>
                      <div className="mt-5">
                        <div className="space-y-4">
                          {projects?.filter(p => p.status === 'approved')?.map((project) => (
                            <div key={project._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">{project.title}</h4>
                                <p className="text-sm text-gray-500">
                                  Student: {project.student?.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Guide: {project.guide?.name || 'Not assigned'}
                                </p>
                              </div>
                              {!project.guide && (
                                <button
                                  onClick={() => {
                                    setSelectedProject(project);
                                    setAssigningGuide(true);
                                  }}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  Assign Guide
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 