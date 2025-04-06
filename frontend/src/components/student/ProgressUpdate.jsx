import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaChartLine, FaClipboard, FaPlus } from 'react-icons/fa';
import studentService from '../../services/studentService';

const ProgressUpdate = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [projects, setProjects] = useState([]);
  const [progressUpdates, setProgressUpdates] = useState([]);
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    completionPercentage: 0,
    challenges: '',
    nextSteps: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch student's projects
        const projectsData = await studentService.getStudentProjects(user.token);
        setProjects(projectsData);
        
        // If we have projects, set the default project
        if (projectsData.length > 0) {
          setFormData(prev => ({
            ...prev,
            projectId: projectsData[0]._id
          }));
          
          // Fetch progress updates for this project
          const updatesData = await studentService.getProgressUpdates(projectsData[0]._id, user.token);
          setProgressUpdates(updatesData);
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
        toast.error('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchData();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
    setFormData(prev => ({
      ...prev,
      projectId
    }));
    
    // Fetch progress updates for the selected project
    try {
      const updatesData = await studentService.getProgressUpdates(projectId, user.token);
      setProgressUpdates(updatesData);
    } catch (error) {
      console.error('Error fetching progress updates:', error);
      toast.error('Failed to load progress updates');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || formData.completionPercentage < 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      setSubmitting(true);
      const response = await studentService.updateProgress(formData, user.token);
      
      toast.success('Progress update submitted successfully!');
      
      // Add the new update to the list
      setProgressUpdates(prev => [response, ...prev]);
      
      // Reset form and hide it
      setFormData({
        projectId: formData.projectId,
        title: '',
        description: '',
        completionPercentage: 0,
        challenges: '',
        nextSteps: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting progress update:', error);
      toast.error(error.response?.data?.message || 'Failed to submit progress update');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <FaChartLine className="mx-auto text-gray-400 text-4xl mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Active Projects</h3>
        <p className="text-gray-500 mb-4">You need an approved project before you can submit progress updates.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Project Progress</h3>
          <p className="text-sm text-gray-500 mt-1">Track and update your dissertation progress</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm"
        >
          {showForm ? (
            'Cancel'
          ) : (
            <>
              <FaPlus className="mr-1" />
              Add Update
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-4">New Progress Update</h4>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-1">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  id="projectId"
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleProjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {projects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Update Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="E.g., Completed Literature Review"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe what you've accomplished since your last update"
                required
              ></textarea>
            </div>

            <div className="mb-4">
              <label htmlFor="completionPercentage" className="block text-sm font-medium text-gray-700 mb-1">
                Completion Percentage: {formData.completionPercentage}%
              </label>
              <input
                type="range"
                id="completionPercentage"
                name="completionPercentage"
                value={formData.completionPercentage}
                onChange={handleChange}
                min="0"
                max="100"
                step="5"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="challenges" className="block text-sm font-medium text-gray-700 mb-1">
                  Challenges Faced
                </label>
                <textarea
                  id="challenges"
                  name="challenges"
                  value={formData.challenges}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Any obstacles or difficulties you encountered"
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="nextSteps" className="block text-sm font-medium text-gray-700 mb-1">
                  Next Steps
                </label>
                <textarea
                  id="nextSteps"
                  name="nextSteps"
                  value={formData.nextSteps}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="What you plan to work on next"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Update'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">Progress History</h4>
        
        {progressUpdates.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg">
            <FaClipboard className="mx-auto text-gray-400 text-3xl mb-3" />
            <p className="text-gray-500">No progress updates yet</p>
            <p className="text-sm text-gray-500 mt-1">Add your first progress update to track your dissertation journey</p>
          </div>
        ) : (
          <div className="space-y-6">
            {progressUpdates.map(update => (
              <div key={update._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium text-gray-900">{update.title}</h5>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(update.createdAt).toLocaleDateString()} • Project: {update.project?.title || 'Unknown Project'}
                    </p>
                  </div>
                  <div className="bg-indigo-100 text-indigo-800 px-2 py-1 text-xs font-medium rounded-full">
                    {update.completionPercentage}% Complete
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-gray-700">{update.description}</p>
                </div>
                
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      update.completionPercentage < 30 ? 'bg-red-500' : 
                      update.completionPercentage < 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${update.completionPercentage}%` }}
                  ></div>
                </div>
                
                {(update.challenges || update.nextSteps) && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {update.challenges && (
                      <div>
                        <p className="text-gray-500 font-medium">Challenges:</p>
                        <p className="text-gray-700">{update.challenges}</p>
                      </div>
                    )}
                    
                    {update.nextSteps && (
                      <div>
                        <p className="text-gray-500 font-medium">Next Steps:</p>
                        <p className="text-gray-700">{update.nextSteps}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {update.facultyFeedback && (
                  <div className="mt-4 bg-yellow-50 p-3 rounded-md">
                    <p className="text-gray-500 font-medium text-sm">Faculty Feedback:</p>
                    <p className="text-gray-700">{update.facultyFeedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressUpdate; 