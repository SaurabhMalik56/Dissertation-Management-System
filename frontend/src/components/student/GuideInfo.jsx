import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FaUserTie, FaEnvelope, FaSync } from 'react-icons/fa';
import studentService from '../../services/studentService';
import { toast } from 'react-toastify';

const GuideInfo = () => {
  const { user } = useSelector((state) => state.auth);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchGuideInfo = useCallback(async (showToast = false) => {
    try {
      if (!user?.token) return;
      
      if (showToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      const data = await studentService.getStudentGuide(user.token);
      
      // Update state
      setGuide(data);
      
      // Show toast notification on manual refresh
      if (showToast) {
        if (data) {
          toast.success('Guide information refreshed');
        } else {
          toast.info('No guide has been assigned to you yet');
        }
      }
    } catch (err) {
      console.error('Error fetching guide info:', err);
      // Check if it's a 404 error (no guide assigned)
      if (err.response && err.response.status === 404) {
        setGuide(null);
        setError(null);
        if (showToast) {
          toast.info('No guide has been assigned to you yet');
        }
      } else {
        setError('Failed to fetch guide information. Please try again later.');
        if (showToast) {
          toast.error('Failed to refresh guide information');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Initial fetch when component mounts
  useEffect(() => {
    if (user?.token) {
      fetchGuideInfo();
    }
  }, [user, fetchGuideInfo]);

  const handleManualRefresh = () => {
    fetchGuideInfo(true);
  };

  if (loading && !guide) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-md">
          <p>{error}</p>
          <button
            onClick={handleManualRefresh}
            className="mt-2 text-red-700 hover:text-red-900 font-medium text-sm flex items-center"
          >
            <FaSync className="mr-1" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-center">
        <FaUserTie className="mx-auto text-gray-400 text-3xl mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Guide Assigned Yet</h3>
        <p className="text-gray-500">
          Your guide will be assigned after your proposal is approved.
        </p>
        <button
          onClick={handleManualRefresh}
          className="mt-3 text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center mx-auto"
          disabled={refreshing}
        >
          <FaSync className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} /> 
          {refreshing ? 'Refreshing...' : 'Check for Updates'}
        </button>
      </div>
    );
  }

  // Get faculty name, falling back to email username if needed
  const getFacultyName = () => {
    // First, check if guide exists
    if (!guide) return "Faculty";
    
    // Check for name fields first
    if (guide.fullName) return guide.fullName;
    if (guide.name) return guide.name;
    
    // If email exists, extract the username part
    if (guide.email) {
      const emailParts = guide.email.split('@');
      if (emailParts.length > 0) {
        // Capitalize the first letter and replace dots with spaces
        const username = emailParts[0]
          .split('.')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        return username;
      }
    }
    
    // Last resort, return just "Faculty"
    return "Faculty";
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Your Guide</h3>
        <button
          onClick={handleManualRefresh}
          className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center"
          disabled={refreshing}
        >
          <FaSync className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="flex items-center mb-4">
        <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
          <FaUserTie className="text-indigo-600 text-xl" />
        </div>
        <div>
          <h4 className="text-lg font-medium text-gray-900">
            {getFacultyName()}
          </h4>
        </div>
      </div>
      
      <div className="flex items-center text-gray-700">
        <FaEnvelope className="text-gray-500 mr-3" />
        <span>{guide && guide.email ? guide.email : 'Email not available'}</span>
      </div>
    </div>
  );
};

export default GuideInfo; 