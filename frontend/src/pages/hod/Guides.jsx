import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import useHodDashboard from '../../hooks/useHodDashboard';

const Guides = () => {
  const {
    projects,
    departmentFaculty,
    isLoading,
    error,
    handleAssignGuideToProject,
    fetchDashboardData
  } = useHodDashboard();
  
  const { user } = useSelector((state) => state.auth);
  const [selectedProject, setSelectedProject] = useState(null);
  const [assigningGuide, setAssigningGuide] = useState(false);
  
  // Filter for approved projects
  const approvedProjects = projects?.filter(p => p.status === 'approved') || [];

  useEffect(() => {
    if (!user) return;
    fetchDashboardData();
  }, [user, fetchDashboardData]);

  return (
    <div className="min-h-full bg-gray-100">
      <main className="flex-1">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Assigned Guides
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage guide assignments for approved project proposals
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
            {/* Approved Projects Section */}
            <div className="bg-white shadow sm:rounded-lg mb-6">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Approved Projects
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Assign or reassign guides to these approved projects
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
                ) : approvedProjects.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No approved projects to display
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
                      {approvedProjects.map((project) => (
                        <tr key={project._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {project.student?.fullName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {project.student?.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{project.title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {project.guide ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {project.guide.fullName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {project.guide.email}
                                </div>
                              </div>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Not Assigned
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {!project.guide ? (
                              <button
                                onClick={() => {
                                  setSelectedProject(project);
                                  setAssigningGuide(true);
                                }}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                              >
                                Assign Guide
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedProject(project);
                                  setAssigningGuide(true);
                                }}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                Reassign Guide
                              </button>
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
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {selectedProject.guide ? 'Reassign Guide' : 'Assign Guide'} to Project
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Project: {selectedProject.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      Student: {selectedProject.student?.fullName}
                    </p>
                    {selectedProject.guide && (
                      <p className="text-sm text-gray-500 mt-2">
                        Current Guide: {selectedProject.guide.fullName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-5">
                  <div className="grid grid-cols-1 gap-4 max-h-60 overflow-y-auto">
                    {departmentFaculty?.map((faculty) => (
                      <button
                        key={faculty._id}
                        onClick={() => {
                          handleAssignGuideToProject(selectedProject._id, faculty._id);
                          setAssigningGuide(false);
                          setSelectedProject(null);
                          toast.success(`Guide ${faculty.fullName} assigned successfully`);
                        }}
                        className="flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center text-indigo-500 mr-3">
                            {faculty.fullName?.charAt(0) || 'F'}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium text-gray-900">{faculty.fullName}</p>
                            <p className="text-xs text-gray-500">{faculty.email}</p>
                          </div>
                        </div>
                        <div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {faculty.assignedStudents?.length || 0} students
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6">
                <button
                  type="button"
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-600 text-base font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm"
                  onClick={() => {
                    setAssigningGuide(false);
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
    </div>
  );
};

export default Guides; 