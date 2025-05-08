import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaClipboardCheck, FaSave, FaTimes, FaSync } from 'react-icons/fa';
import facultyService from '../../services/facultyService';

const EvaluationForm = ({ studentId, onClose, refreshData }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [existingEvaluation, setExistingEvaluation] = useState(null);
  
  const [formData, setFormData] = useState({
    evaluationType: 'mid-term',
    presentationScore: 0,
    contentScore: 0,
    researchScore: 0,
    innovationScore: 0,
    implementationScore: 0,
    comments: ''
  });

  useEffect(() => {
    const fetchStudentEvaluations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await facultyService.getStudentEvaluations(studentId, user.token);
        
        setStudentData({
          student: data.student,
          project: data.project
        });
        
        // Check if there are existing evaluations
        if (data.evaluations && data.evaluations.length > 0) {
          const latestEvaluation = data.evaluations[0]; // Most recent evaluation
          setExistingEvaluation(latestEvaluation);
          
          // Populate form with existing data
          setFormData({
            evaluationType: latestEvaluation.evaluationType || 'mid-term',
            presentationScore: latestEvaluation.presentationScore || 0,
            contentScore: latestEvaluation.contentScore || 0,
            researchScore: latestEvaluation.researchScore || 0,
            innovationScore: latestEvaluation.innovationScore || 0,
            implementationScore: latestEvaluation.implementationScore || 0,
            comments: latestEvaluation.comments || ''
          });
        }
      } catch (err) {
        console.error('Error fetching student evaluations:', err);
        setError('Failed to fetch student data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token && studentId) {
      fetchStudentEvaluations();
    }
  }, [user, studentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // For score fields, ensure they're numbers and within range
    if (name.includes('Score')) {
      const numberValue = Number(value);
      if (isNaN(numberValue)) return; // Don't update if not a number
      
      // Clamp between 0-100
      processedValue = Math.min(Math.max(numberValue, 0), 100);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Validate all required fields
      const requiredFields = ['evaluationType', 'presentationScore', 'contentScore', 'researchScore', 'innovationScore', 'implementationScore'];
      
      for (const field of requiredFields) {
        if (!formData[field] && formData[field] !== 0) {
          toast.error(`Please fill in the ${field.replace('Score', ' score')} field`);
          setSubmitting(false);
          return;
        }
      }
      
      // Submit the evaluation
      const result = await facultyService.submitEvaluation(studentId, formData, user.token);
      
      if (result.success) {
        toast.success('Evaluation submitted successfully');
        
        // If there's a refresh function, call it
        if (refreshData) {
          refreshData();
        }
        
        // Close the form if onClose is provided
        if (onClose) {
          onClose();
        }
      } else {
        toast.error(result.message || 'Failed to submit evaluation');
      }
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      setError('Failed to submit evaluation. Please try again later.');
      toast.error(err.message || 'Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate total score and grade
  const calculateTotalScore = () => {
    const { presentationScore, contentScore, researchScore, innovationScore, implementationScore } = formData;
    
    const totalScore = (
      Number(presentationScore || 0) +
      Number(contentScore || 0) +
      Number(researchScore || 0) +
      Number(innovationScore || 0) +
      Number(implementationScore || 0)
    );
    
    const percentage = totalScore / 5;
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A';
    else if (percentage >= 80) grade = 'B';
    else if (percentage >= 70) grade = 'C';
    else if (percentage >= 60) grade = 'D';
    
    return {
      total: totalScore,
      average: percentage.toFixed(1),
      grade
    };
  };

  const scoreResult = calculateTotalScore();

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
          <p>{error}</p>
        </div>
        <div className="mt-4 flex justify-end">
          <button 
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">
          Student Evaluation - {formData.evaluationType === 'mid-term' ? 'Mid-Term' : 'Final'}
        </h3>
        <button 
          onClick={onClose}
          className="text-white hover:text-gray-200"
          aria-label="Close"
        >
          <FaTimes />
        </button>
      </div>

      <div className="p-6">
        {/* Student and Project Info */}
        {studentData && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Project Information</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Student Name</p>
                  <p className="font-medium">{studentData.student?.name || 'Unknown Student'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Project Title</p>
                  <p className="font-medium">{studentData.project?.title || 'Unknown Project'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Evaluation Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evaluation Type
            </label>
            <select
              name="evaluationType"
              value={formData.evaluationType}
              onChange={handleInputChange}
              className="form-select w-full"
              required
            >
              <option value="mid-term">Mid-Term Evaluation</option>
              <option value="final">Final Evaluation</option>
            </select>
          </div>

          {/* Scoring Section */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-4">Evaluation Criteria</h4>
            
            <div className="space-y-4">
              {/* Presentation Score */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-indigo-100 text-indigo-600">
                      <FaClipboardCheck />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">Presentation</h5>
                      <p className="text-xs text-gray-500">Quality of presentation, clarity, and organization</p>
                    </div>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      name="presentationScore"
                      value={formData.presentationScore}
                      onChange={handleInputChange}
                      className="form-input w-full text-center"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Content Score */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-indigo-100 text-indigo-600">
                      <FaClipboardCheck />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">Content</h5>
                      <p className="text-xs text-gray-500">Quality and depth of the content</p>
                    </div>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      name="contentScore"
                      value={formData.contentScore}
                      onChange={handleInputChange}
                      className="form-input w-full text-center"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Research Score */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-indigo-100 text-indigo-600">
                      <FaClipboardCheck />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">Research</h5>
                      <p className="text-xs text-gray-500">Quality of research methodology and literature review</p>
                    </div>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      name="researchScore"
                      value={formData.researchScore}
                      onChange={handleInputChange}
                      className="form-input w-full text-center"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Innovation Score */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-indigo-100 text-indigo-600">
                      <FaClipboardCheck />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">Innovation</h5>
                      <p className="text-xs text-gray-500">Level of innovation and original contribution</p>
                    </div>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      name="innovationScore"
                      value={formData.innovationScore}
                      onChange={handleInputChange}
                      className="form-input w-full text-center"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Implementation Score */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-indigo-100 text-indigo-600">
                      <FaClipboardCheck />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">Implementation</h5>
                      <p className="text-xs text-gray-500">Quality of implementation and practical application</p>
                    </div>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      name="implementationScore"
                      value={formData.implementationScore}
                      onChange={handleInputChange}
                      className="form-input w-full text-center"
                      min="0"
                      max="100"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Results Summary */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Evaluation Summary</h4>
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Average Score</p>
                  <p className="text-xl font-bold text-indigo-600">{scoreResult.average}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Grade</p>
                  <p className="text-xl font-bold text-indigo-600">{scoreResult.grade}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`text-sm font-medium px-2 py-1 rounded-full inline-flex ${
                    scoreResult.grade === 'A' || scoreResult.grade === 'B' 
                      ? 'bg-green-100 text-green-800' 
                      : scoreResult.grade === 'C'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {scoreResult.grade === 'A' || scoreResult.grade === 'B' 
                      ? 'Passed' 
                      : scoreResult.grade === 'C'
                      ? 'Review Required'
                      : 'Needs Improvement'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Comments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Evaluator Comments
            </label>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              rows="4"
              className="form-textarea w-full"
              placeholder="Provide detailed feedback on the student's work..."
            ></textarea>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
            >
              <FaTimes className="mr-1" /> Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <FaSync className="animate-spin mr-1" /> Submitting...
                </>
              ) : existingEvaluation ? (
                <>
                  <FaSave className="mr-1" /> Update Evaluation
                </>
              ) : (
                <>
                  <FaSave className="mr-1" /> Submit Evaluation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EvaluationForm; 