import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaTrophy, FaClipboardCheck, FaChartBar, FaSearch, FaExclamationCircle } from 'react-icons/fa';
import studentService from '../../services/studentService';

const EvaluationResults = ({ evaluation: propEvaluation }) => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [selectedCriterion, setSelectedCriterion] = useState(null);

  useEffect(() => {
    // If evaluation was passed as prop, use it
    if (propEvaluation) {
      setEvaluation(propEvaluation);
      setLoading(false);
      return;
    }

    // Otherwise fetch from the API
    const fetchEvaluationResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await studentService.getEvaluationResults(user.token);
        setEvaluation(data);
      } catch (err) {
        console.error('Error fetching evaluation results:', err);
        setError('Failed to fetch evaluation results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchEvaluationResults();
    }
  }, [user, propEvaluation]);

  const handleCriterionClick = (criterion) => {
    setSelectedCriterion(selectedCriterion === criterion ? null : criterion);
  };

  // Get grade based on percentage
  const getGrade = (percentage) => {
    if (percentage >= 90) return { letter: 'A', description: 'Excellent' };
    if (percentage >= 80) return { letter: 'B', description: 'Good' };
    if (percentage >= 70) return { letter: 'C', description: 'Satisfactory' };
    if (percentage >= 60) return { letter: 'D', description: 'Passing' };
    return { letter: 'F', description: 'Failing' };
  };

  // Get color based on score percentage within a criterion
  const getScoreColor = (score, maxScore) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 70) return 'text-blue-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <FaSearch className="mx-auto text-gray-400 text-4xl mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Evaluation Results</h3>
        <p className="text-gray-500">Your dissertation has not been evaluated yet.</p>
      </div>
    );
  }

  // Create criteria array from the evaluation schema fields
  const evaluationCriteria = [
    { 
      name: 'Presentation', 
      score: evaluation.presentationScore || 0, 
      maxScore: 100,
      description: 'Quality of presentation, clarity, and organization of the dissertation'
    },
    { 
      name: 'Content', 
      score: evaluation.contentScore || 0, 
      maxScore: 100,
      description: 'Quality and depth of the content in the dissertation'
    },
    { 
      name: 'Research', 
      score: evaluation.researchScore || 0, 
      maxScore: 100,
      description: 'Quality of research methodology and literature review'
    },
    { 
      name: 'Innovation', 
      score: evaluation.innovationScore || 0, 
      maxScore: 100,
      description: 'Level of innovation and original contribution'
    },
    { 
      name: 'Implementation', 
      score: evaluation.implementationScore || 0, 
      maxScore: 100,
      description: 'Quality of implementation and practical application'
    }
  ];

  // Calculate total score and percentage
  const calculateTotalScore = () => {
    const totalScore = evaluationCriteria.reduce((sum, criterion) => sum + criterion.score, 0);
    const maxPossibleScore = evaluationCriteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);
    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    
    return {
      score: totalScore,
      maxScore: maxPossibleScore,
      percentage: Math.round(percentage * 10) / 10
    };
  };

  const totalScoreData = calculateTotalScore();
  const grade = evaluation.overallGrade || getGrade(totalScoreData.percentage);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
        <h3 className="text-lg font-medium text-white">
          Dissertation Evaluation Results - {evaluation.evaluationType === 'mid-term' ? 'Mid-Term' : 'Final'}
        </h3>
      </div>

      <div className="p-6">
        {/* Project Info */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Project Information</h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Project Title</p>
                <p className="font-medium">{evaluation.projectTitle || 'Unknown Project'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Evaluation Type</p>
                <p className="font-medium">{evaluation.evaluationType === 'mid-term' ? 'Mid-Term Evaluation' : 'Final Evaluation'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Evaluation Date</p>
                <p className="font-medium">{new Date(evaluation.createdAt || evaluation.evaluationDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Evaluator</p>
                <p className="font-medium">{
                  evaluation.evaluator?.name || 
                  (evaluation.evaluator?.firstName && evaluation.evaluator?.lastName ? 
                    `${evaluation.evaluator.firstName} ${evaluation.evaluator.lastName}` : 
                    'Unknown')
                }</p>
              </div>
            </div>
          </div>
        </div>

        {/* Score Overview */}
        <div className="mb-8">
          <div className="bg-indigo-50 rounded-lg p-6 flex flex-col md:flex-row items-center justify-between">
            <div className="text-center mb-4 md:mb-0">
              <FaTrophy className="mx-auto text-indigo-600 text-3xl mb-2" />
              <h4 className="text-lg font-bold text-gray-900">Overall Score</h4>
              <div className="text-3xl font-bold text-indigo-600 mt-1">
                {totalScoreData.score}/{totalScoreData.maxScore}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {totalScoreData.percentage}%
              </p>
            </div>
            
            <div className="h-20 w-px bg-indigo-200 hidden md:block"></div>
            
            <div className="text-center mb-4 md:mb-0">
              <div className="flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-600">{
                    typeof grade === 'string' ? grade : grade.letter
                  }</span>
                </div>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mt-2">Grade</h4>
              <p className="text-sm text-gray-500 mt-1">{
                typeof grade === 'string' ? '' : grade.description
              }</p>
            </div>
            
            <div className="h-20 w-px bg-indigo-200 hidden md:block"></div>
            
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                evaluation.overallGrade === 'A' || evaluation.overallGrade === 'B' || totalScoreData.percentage >= 70 
                  ? 'bg-green-100 text-green-800' 
                  : totalScoreData.percentage >= 60
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {evaluation.overallGrade === 'A' || evaluation.overallGrade === 'B' || totalScoreData.percentage >= 70 
                  ? 'Passed' 
                  : totalScoreData.percentage >= 60
                  ? 'Review Required'
                  : 'Needs Improvement'}
              </div>
              <h4 className="text-lg font-bold text-gray-900 mt-2">Status</h4>
              <p className="text-sm text-gray-500 mt-1">
                {evaluation.overallGrade === 'A' || evaluation.overallGrade === 'B' || totalScoreData.percentage >= 70 
                  ? 'Congratulations!' 
                  : totalScoreData.percentage >= 60
                  ? 'Under final review'
                  : 'Revision recommended'}
              </p>
            </div>
          </div>
        </div>

        {/* Evaluation Criteria */}
        <div className="mb-8">
          <h4 className="font-medium text-gray-900 mb-4">Evaluation Criteria</h4>
          
          <div className="space-y-4">
            {evaluationCriteria.map((criterion) => (
              <div 
                key={criterion.name}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div 
                  className={`px-4 py-3 flex justify-between items-center cursor-pointer ${
                    selectedCriterion === criterion ? 'bg-gray-100' : 'bg-white'
                  }`}
                  onClick={() => handleCriterionClick(criterion)}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      criterion.score >= criterion.maxScore * 0.8 ? 'bg-green-100 text-green-600' :
                      criterion.score >= criterion.maxScore * 0.6 ? 'bg-blue-100 text-blue-600' :
                      criterion.score >= criterion.maxScore * 0.4 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      <FaClipboardCheck />
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{criterion.name}</h5>
                      <p className="text-xs text-gray-500">Score: {criterion.score}/100</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${getScoreColor(criterion.score, criterion.maxScore)}`}>
                      {criterion.score}/{criterion.maxScore}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Math.round((criterion.score / criterion.maxScore) * 100)}%
                    </div>
                  </div>
                </div>
                
                {selectedCriterion === criterion && (
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <p className="text-sm text-gray-700 mb-3">{criterion.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Comments */}
        {evaluation.comments && (
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Evaluator Comments</h4>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-700 whitespace-pre-wrap">{evaluation.comments}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationResults; 