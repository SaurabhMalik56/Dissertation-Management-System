import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import useHodDashboard from '../../hooks/useHodDashboard';

const Proposals = () => {
  const {
    projects,
    isLoading,
    error,
    handleUpdateProjectStatus,
    fetchDashboardData,
    studentDetails,
    handleViewProjectDetails,
    selectedProject,
    isModalOpen,
    setIsModalOpen,
    setSelectedProject,
    faculty,
    handleAssignGuideToProject,
    approveProjectWithGuide
  } = useHodDashboard();
  
  const { user } = useSelector((state) => state.auth);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [dataFetched, setDataFetched] = useState(false);
  // New state variables for guide selection modal
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedGuideId, setSelectedGuideId] = useState('');

  // Close modal function
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedProject(null);
  }, [setIsModalOpen, setSelectedProject]);

  // Only fetch data once when component mounts and user is available
  useEffect(() => {
    if (!user || dataFetched) return;
    
    const loadData = async () => {
      await fetchDashboardData('all');
      setDataFetched(true);
    };
    
    loadData();
    // We're explicitly excluding fetchDashboardData from dependencies
    // to prevent unnecessary re-fetches
  }, [user, dataFetched]);

  // Filter projects based on status and search term - memoized to prevent recalculation
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesSearch = searchTerm === '' || 
        project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.student?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });
  }, [projects, statusFilter, searchTerm]);
  
  // Sort projects by creation date (newest first) - memoized to prevent recalculation
  const sortedProjects = useMemo(() => {
    return [...filteredProjects].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [filteredProjects]);

  const handleRejectProject = useCallback((projectId) => {
    setSelectedProject(projects.find(p => p._id === projectId));
    setRejectModalOpen(true);
  }, [projects]);

  const submitRejection = useCallback(async () => {
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
  }, [rejectionReason, selectedProject, handleUpdateProjectStatus]);

  // Fetch fresh faculty data when approval modal is opened
  useEffect(() => {
    if (approveModalOpen && selectedProject) {
      // Refresh faculty data
      console.log('Refreshing faculty data for guide selection...');
      fetchDashboardData('faculty').then(() => {
        console.log('Faculty data refreshed. Available faculty:', faculty);
      });
    }
  }, [approveModalOpen, selectedProject]);

  // Log faculty when it changes
  useEffect(() => {
    console.log('Faculty data in Proposals component:', faculty);
  }, [faculty]);

  return (
    <div className="min-h-full bg-gray-100">
      <main className="flex-1">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Project Proposals
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Review and manage student project proposals for your department
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
            {/* Filters Section */}
            <div className="bg-white shadow sm:rounded-lg mb-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Status
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        statusFilter === 'all' 
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter('pending')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        statusFilter === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setStatusFilter('approved')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        statusFilter === 'approved' 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Approved
                    </button>
                    <button
                      onClick={() => setStatusFilter('rejected')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        statusFilter === 'rejected' 
                          ? 'bg-red-100 text-red-800 border border-red-300' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Rejected
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Proposals
                  </label>
                  <input
                    type="text"
                    id="search"
                    placeholder="Search by title, student name, email, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
            
            {/* Project Proposals Section */}
            <div className="bg-white shadow sm:rounded-lg mb-6">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {statusFilter === 'all' ? 'All Proposals' : 
                   statusFilter === 'pending' ? 'Pending Proposals' :
                   statusFilter === 'approved' ? 'Approved Proposals' : 'Rejected Proposals'}
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {statusFilter === 'pending' ? 'These proposals require your review' : 
                   `Showing ${sortedProjects.length} ${statusFilter === 'all' ? '' : statusFilter} proposals`}
                </p>
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
                ) : sortedProjects?.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No {statusFilter === 'all' ? '' : statusFilter} proposals to display
                    {searchTerm && ' matching your search criteria'}
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
                          Status
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
                      {sortedProjects?.map((project) => (
                        <tr key={project._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {project.student}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {project.studentEmail || 'No email available'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleViewProjectDetails(project._id)}
                              className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none"
                            >
                              {project.title}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{project.department}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                project.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                'bg-red-100 text-red-800'}`}>
                              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(project.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex space-x-2">
                              {project.status === 'pending' && (
                                <>
                                  <button
                                    key={`approve-${project._id}`}
                                    onClick={() => {
                                      setSelectedProject(project);
                                      setApproveModalOpen(true);
                                    }}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    key={`reject-${project._id}`}
                                    onClick={() => handleRejectProject(project._id)}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {project.status === 'approved' && (
                                <button
                                  key={`cancel-${project._id}`}
                                  onClick={() => handleRejectProject(project._id)}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                                >
                                  Cancel Approval
                                </button>
                              )}
                              {project.status === 'rejected' && (
                                <button
                                  key={`approve-rejected-${project._id}`}
                                  onClick={() => handleUpdateProjectStatus(project._id, 'approved')}
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                >
                                  Approve
                                </button>
                              )}
                            </div>
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

      {/* Rejection Reason Modal */}
      {rejectModalOpen && selectedProject && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Reject Proposal
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Student: {selectedProject.student?.fullName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Proposal Title: {selectedProject.title}
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
                    Reason for Rejection <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="rejectionReason"
                      name="rejectionReason"
                      rows={4}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Project idea is too broad; please refine your scope."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:col-start-2 sm:text-sm"
                  onClick={submitRejection}
                >
                  Submit Rejection
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => {
                    setRejectModalOpen(false);
                    setRejectionReason('');
                    setSelectedProject(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {isModalOpen && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">{selectedProject.title}</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Project Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Department</h3>
                  <p className="mt-1 text-sm text-gray-900">{selectedProject.department}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedProject.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedProject.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedProject.status}
                    </span>
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Submission Date</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedProject.createdAt).toLocaleDateString()} at{' '}
                    {new Date(selectedProject.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Student Information */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Student Information</h3>
                {isLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Name</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {studentDetails?.fullName || selectedProject?.student || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Roll Number</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {studentDetails?.rollNo || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Email</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {studentDetails?.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Department</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {studentDetails?.department || studentDetails?.branch || selectedProject?.department || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Year</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {studentDetails?.year || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Semester</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {studentDetails?.semester || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Contact Number</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {studentDetails?.contactNumber || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Address</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        {studentDetails?.address || 'N/A'}
                      </p>
                    </div>
                    {studentDetails?.assignedGuide && (
                      <div className="col-span-2">
                        <h4 className="text-sm font-medium text-gray-500">Assigned Guide</h4>
                        <p className="mt-1 text-sm text-gray-900">
                          {typeof studentDetails.assignedGuide === 'object' 
                            ? studentDetails.assignedGuide.fullName 
                            : studentDetails.assignedGuide}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Project Details */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Project Details</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Description</h4>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedProject?.description || 'No description provided'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Problem Statement</h4>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedProject?.problemStatement || 'No problem statement provided'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Technologies</h4>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(() => {
                        if (!selectedProject?.technologies) {
                          return <span className="text-sm text-gray-500">No technologies specified</span>;
                        }
                        
                        try {
                          if (typeof selectedProject.technologies === 'string') {
                            return selectedProject.technologies.split(',').map((tech, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {tech.trim()}
                              </span>
                            ));
                          } else if (Array.isArray(selectedProject.technologies)) {
                            return selectedProject.technologies.map((tech, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {tech}
                              </span>
                            ));
                          } else {
                            return (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {String(selectedProject.technologies)}
                              </span>
                            );
                          }
                        } catch (error) {
                          console.error('Error displaying technologies:', error);
                          return <span className="text-sm text-red-500">Error displaying technologies</span>;
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Faculty Comments */}
              {selectedProject.facultyComment && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Faculty Comments</h3>
                  <p className="text-sm text-gray-900">{selectedProject.facultyComment}</p>
                </div>
              )}
            </div>
            
            {/* Add a close button at the bottom for better UX */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Selection Modal */}
      {approveModalOpen && selectedProject && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Approve Project and Assign Guide
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Project: {selectedProject.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Student: {selectedProject.student}
                    </p>
                  </div>
                </div>
                <div className="mt-5">
                  <label htmlFor="guideSelect" className="block text-sm font-medium text-gray-700">
                    Select Guide <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      id="guideSelect"
                      name="guideSelect"
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={selectedGuideId}
                      onChange={(e) => setSelectedGuideId(e.target.value)}
                    >
                      <option value="">Select a guide</option>
                      {faculty && faculty.length > 0 ? (
                        faculty
                          .filter(f => f.role === 'faculty')
                          .map(guide => (
                            <option key={guide.id} value={guide.id}>
                              {guide.name} ({guide.branch || guide.specialization || 'No department'}) - {guide.studentsCount || 0} students
                            </option>
                          ))
                      ) : (
                        <option value="" disabled>No faculty members available</option>
                      )}
                    </select>
                  </div>
                  {faculty && faculty.length === 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      No faculty members found. Please make sure faculty are added to the system.
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm"
                  onClick={async () => {
                    if (!selectedGuideId) {
                      toast.error('Please select a guide');
                      return;
                    }
                    try {
                      // Use the new combined function
                      await approveProjectWithGuide(selectedProject._id, selectedGuideId);
                      
                      setApproveModalOpen(false);
                      setSelectedGuideId('');
                    } catch (error) {
                      toast.error('Failed to approve project and assign guide');
                    }
                  }}
                >
                  Approve & Assign
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  onClick={() => {
                    setApproveModalOpen(false);
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

export default Proposals; 