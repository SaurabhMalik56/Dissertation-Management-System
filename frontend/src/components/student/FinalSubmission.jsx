import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaFileUpload, FaFileAlt, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import studentService from '../../services/studentService';

const FinalSubmission = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    abstract: '',
    keywords: '',
    file: null
  });
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch student's projects
        const projectsData = await studentService.getStudentProjects(user.token);
        
        // Filter for approved projects only
        const approvedProjects = projectsData.filter(project => project.status === 'approved');
        setProjects(approvedProjects);
        
        // If we have projects, set the default project and check if there's a submission
        if (approvedProjects.length > 0) {
          const firstProject = approvedProjects[0];
          setSelectedProject(firstProject);
          setFormData(prev => ({
            ...prev,
            projectId: firstProject._id,
            title: firstProject.title || ''
          }));
          
          // Check if there's already a submission for this project
          try {
            const submissionData = await studentService.getFinalSubmission(firstProject._id, user.token);
            setSubmission(submissionData);
          } catch (error) {
            // No submission yet, that's okay
            console.log('No final submission found for this project');
          }
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type (PDF only)
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed');
        fileInputRef.current.value = '';
        return;
      }
      
      // Check file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error('File size exceeds 20MB limit');
        fileInputRef.current.value = '';
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        file
      }));
    }
  };

  const handleProjectChange = async (e) => {
    const projectId = e.target.value;
    const selectedProj = projects.find(p => p._id === projectId);
    
    setSelectedProject(selectedProj);
    setFormData(prev => ({
      ...prev,
      projectId,
      title: selectedProj?.title || ''
    }));
    
    // Check if there's already a submission for this project
    try {
      setLoading(true);
      const submissionData = await studentService.getFinalSubmission(projectId, user.token);
      setSubmission(submissionData);
    } catch (error) {
      // No submission yet, that's okay
      console.log('No final submission found for this project');
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.projectId || !formData.title || !formData.abstract || !formData.file) {
      toast.error('Please fill in all required fields and upload your dissertation PDF');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create FormData object for file upload
      const submissionData = new FormData();
      submissionData.append('projectId', formData.projectId);
      submissionData.append('title', formData.title);
      submissionData.append('abstract', formData.abstract);
      submissionData.append('keywords', formData.keywords);
      submissionData.append('file', formData.file);
      
      // Submit the dissertation
      const response = await studentService.submitFinalDissertation(submissionData, user.token);
      
      toast.success('Dissertation submitted successfully!');
      setSubmission(response);
      
      // Reset form
      setFormData({
        projectId: formData.projectId,
        title: formData.title,
        abstract: '',
        keywords: '',
        file: null
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error submitting dissertation:', error);
      toast.error(error.response?.data?.message || 'Failed to submit dissertation');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadDissertation = async () => {
    if (!submission || !submission.fileUrl) {
      toast.error('No dissertation file available for download');
      return;
    }
    
    try {
      // Create an anchor element and trigger download
      const link = document.createElement('a');
      link.href = submission.fileUrl;
      link.download = `${submission.title || 'dissertation'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading dissertation:', error);
      toast.error('Failed to download dissertation');
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
        <FaExclamationCircle className="mx-auto text-yellow-500 text-4xl mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Approved Projects</h3>
        <p className="text-gray-500 mb-4">
          You need an approved project before you can submit your final dissertation.
          Please submit a project proposal first and wait for approval.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Final Dissertation Submission</h3>
        <p className="text-sm text-gray-500 mt-1">Submit your completed dissertation for evaluation</p>
      </div>

      {submission ? (
        <div className="p-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start">
            <FaCheckCircle className="text-green-500 text-xl mt-1 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-800">Dissertation Already Submitted</h4>
              <p className="text-green-700 mt-1">
                You have already submitted your dissertation for this project. You can view the details below.
              </p>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Submission Details</h4>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Project</p>
                  <p className="font-medium">{selectedProject?.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submission Date</p>
                  <p className="font-medium">{new Date(submission.createdAt).toLocaleDateString()} at {new Date(submission.createdAt).toLocaleTimeString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dissertation Title</p>
                  <p className="font-medium">{submission.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    submission.status === 'approved' ? 'bg-green-100 text-green-800' : 
                    submission.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">Abstract</p>
                <p className="text-gray-700 mt-1">{submission.abstract}</p>
              </div>
              
              {submission.keywords && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Keywords</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {submission.keywords.split(',').map((keyword, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded-full">
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-indigo-50 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <FaFileAlt className="text-indigo-500 text-xl mr-3" />
                  <div>
                    <p className="font-medium text-indigo-900">Dissertation PDF</p>
                    <p className="text-xs text-indigo-700">{submission.fileName || 'dissertation.pdf'}</p>
                  </div>
                </div>
                <button 
                  onClick={downloadDissertation}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                >
                  Download
                </button>
              </div>
              
              {submission.facultyFeedback && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 font-medium">Faculty Feedback</p>
                  <div className="bg-yellow-50 p-3 rounded-md mt-1">
                    <p className="text-gray-700">{submission.facultyFeedback}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {submission.status === 'rejected' && (
            <div className="mt-6 text-center">
              <p className="text-gray-700 mb-4">Your submission was rejected. You can submit a revised version below.</p>
              <button 
                onClick={() => setSubmission(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Submit Revised Version
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
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
            
            <div className="mb-5">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Dissertation Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter the full title of your dissertation"
                required
              />
            </div>
            
            <div className="mb-5">
              <label htmlFor="abstract" className="block text-sm font-medium text-gray-700 mb-1">
                Abstract <span className="text-red-500">*</span>
              </label>
              <textarea
                id="abstract"
                name="abstract"
                value={formData.abstract}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Provide a brief summary of your dissertation (250-300 words)"
                required
              ></textarea>
            </div>
            
            <div className="mb-5">
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-1">
                Keywords
              </label>
              <input
                type="text"
                id="keywords"
                name="keywords"
                value={formData.keywords}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter keywords separated by commas (e.g., machine learning, artificial intelligence)"
              />
              <p className="mt-1 text-xs text-gray-500">Separate keywords with commas</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Dissertation (PDF) <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <FaFileUpload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".pdf"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        required
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF only, up to 20MB</p>
                  {formData.file && (
                    <p className="text-sm text-indigo-600 font-medium mt-2">
                      Selected: {formData.file.name} ({Math.round(formData.file.size / 1024 / 1024 * 10) / 10} MB)
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                <p>By submitting, you confirm this is your original work and follows all academic integrity guidelines.</p>
              </div>
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
                  'Submit Dissertation'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default FinalSubmission; 