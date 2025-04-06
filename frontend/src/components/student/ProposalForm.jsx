import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import studentService from '../../services/studentService';

const ProposalForm = ({ onSubmitSuccess }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problemStatement: '',
    technologies: '',
    expectedOutcome: '',
    department: ''
  });

  // Use useEffect to ensure department is always updated when user data changes
  useEffect(() => {
    if (user?.branch) {
      setFormData(prevData => ({
        ...prevData,
        department: user.branch // Map branch to department for form submission
      }));
      console.log('Department set from user branch data:', user.branch);
    } else {
      console.log('User branch data not available');
    }
  }, [user]);

  // Add a separate effect to log the current form data for debugging
  useEffect(() => {
    console.log('Current form data department:', formData.department);
  }, [formData.department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.description || !formData.problemStatement || 
        !formData.technologies || !formData.expectedOutcome) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!user || !user.token) {
      toast.error('Authentication required. Please log in again.');
      return;
    }
    
    // Log all values for debugging
    console.log('User branch:', user?.branch);
    console.log('Form department:', formData.department);
    
    // Ensure department is not empty
    let departmentValue = formData.department;
    if (!departmentValue || departmentValue.trim() === '') {
      departmentValue = user?.branch || 'CSE'; // Default to CSE if all else fails
      console.log('Using fallback department value:', departmentValue);
    }
    
    // Create submission data with all required fields
    const submissionData = {
      ...formData,
      department: departmentValue
    };
    
    // Final validation of critical fields
    if (!submissionData.department || submissionData.department.trim() === '') {
      toast.error('Department information is missing. Please ensure your branch is specified in your profile.');
      console.error('Branch/Department is still missing after fallback');
      return;
    }
    
    if (!submissionData.expectedOutcome || submissionData.expectedOutcome.trim() === '') {
      toast.error('Expected outcome is required. Please fill in this field.');
      return;
    }
    
    console.log('Final submission data (before API call):', submissionData);
    console.log('Department value type:', typeof submissionData.department);
    console.log('ExpectedOutcome value type:', typeof submissionData.expectedOutcome);
    
    setLoading(true);
    
    try {
      console.log('Submitting proposal with data:', JSON.stringify(submissionData, null, 2));
      
      const response = await studentService.submitProposal(submissionData, user.token);
      
      console.log('Proposal submission response:', response);
      toast.success('Proposal submitted successfully!');
      
      // Clear form
      setFormData({
        title: '',
        description: '',
        problemStatement: '',
        technologies: '',
        expectedOutcome: '',
        department: user?.branch || '' // Reset with branch data
      });
      
      // Call the success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error('Error submitting proposal:', error);
      
      // More detailed error handling
      let errorMessage = 'Failed to submit proposal. Please try again.';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Submit Dissertation Proposal</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Project Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter a descriptive title for your dissertation"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Project Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Describe your project in detail"
            required
          ></textarea>
        </div>
        
        <div className="mb-4">
          <label htmlFor="problemStatement" className="block text-sm font-medium text-gray-700 mb-1">
            Problem Statement <span className="text-red-500">*</span>
          </label>
          <textarea
            id="problemStatement"
            name="problemStatement"
            value={formData.problemStatement}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="What problem does your project solve?"
            required
          ></textarea>
        </div>
        
        <div className="mb-4">
          <label htmlFor="technologies" className="block text-sm font-medium text-gray-700 mb-1">
            Technologies Used <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="technologies"
            name="technologies"
            value={formData.technologies}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="List the technologies you'll use (e.g., React, Node.js, MongoDB)"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="expectedOutcome" className="block text-sm font-medium text-gray-700 mb-1">
            Expected Outcome <span className="text-red-500">*</span>
          </label>
          <textarea
            id="expectedOutcome"
            name="expectedOutcome"
            value={formData.expectedOutcome}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="What is the expected outcome of your project?"
            required
          ></textarea>
        </div>
        
        <div className="mb-6">
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
            Branch/Department <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="department"
              name="department"
              value={formData.department}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              aria-required="true"
            />
            {formData.department && (
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">Your branch is auto-fetched from your profile</p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Proposal'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProposalForm; 