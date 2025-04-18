import { useState } from 'react';
import { FaFileAlt, FaInfoCircle, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaGraduationCap } from 'react-icons/fa';
import { toast } from 'react-toastify';

const CurrentProject = ({ project, onViewDetails }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  if (!project) {
    return (
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <FaFileAlt className="mx-auto text-gray-400 text-3xl mb-3" />
        <p className="text-gray-700">No active projects found.</p>
        <button 
          onClick={() => onViewDetails('proposal')}
          className="mt-4 text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5 focus:outline-none"
        >
          Submit a Proposal
        </button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      default: 'bg-gray-100 text-gray-800'
    };
    
    return statusClasses[status] || statusClasses.default;
  };

  const getStatusBanner = (status) => {
    const statusConfig = {
      pending: { 
        bg: 'bg-yellow-50 border-yellow-200', 
        icon: <FaHourglassHalf className="text-yellow-500 mr-2" />,
        title: 'Pending Approval',
        text: 'Your project proposal is currently under review by faculty. You will be notified once a decision has been made.'
      },
      approved: { 
        bg: 'bg-green-50 border-green-200', 
        icon: <FaCheckCircle className="text-green-500 mr-2" />,
        title: 'Project Approved',
        text: 'Your project has been approved. You can now start updating your progress and attend scheduled meetings.'
      },
      rejected: { 
        bg: 'bg-red-50 border-red-200', 
        icon: <FaTimesCircle className="text-red-500 mr-2" />,
        title: 'Project Rejected',
        text: project.feedback 
          ? `Faculty feedback: "${project.feedback}"`
          : 'Your project proposal was not approved. Please review faculty feedback and submit a revised proposal.'
      },
      completed: { 
        bg: 'bg-blue-50 border-blue-200', 
        icon: <FaGraduationCap className="text-blue-500 mr-2" />,
        title: 'Project Completed',
        text: 'Congratulations! Your project has been completed and submitted.'
      },
      default: { 
        bg: 'bg-gray-50 border-gray-200', 
        icon: <FaInfoCircle className="text-gray-500 mr-2" />,
        title: 'Project Status',
        text: 'Current project status information.'
      }
    };
    
    return statusConfig[status] || statusConfig.default;
  };

  // Get status banner configuration
  const statusBanner = getStatusBanner(project.status);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
      {/* Status Banner */}
      <div className={`p-4 border-b ${statusBanner.bg} border-b-2`}>
        <div className="flex items-center">
          {statusBanner.icon}
          <h3 className="font-semibold text-lg">{statusBanner.title}</h3>
        </div>
        <p className="text-sm text-gray-600 mt-1 ml-6">
          {statusBanner.text}
        </p>
      </div>
      
      {/* Header with title and status */}
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg text-gray-800">{project.title}</h3>
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadge(project.status)}`}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
        </div>
        
        {/* Project Description - with show more/less toggle for long descriptions */}
        <div className="mt-3">
          <h4 className="text-sm font-medium mb-1 text-gray-700">Project Summary</h4>
          <div className={`relative ${!showFullDescription && 'max-h-24 overflow-hidden'}`}>
            <p className="text-sm text-gray-600">
              {project.description}
            </p>
            {project.description && project.description.length > 150 && !showFullDescription && (
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
            )}
          </div>
          {project.description && project.description.length > 150 && (
            <button 
              onClick={() => setShowFullDescription(!showFullDescription)}
              className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 focus:outline-none"
            >
              {showFullDescription ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CurrentProject; 