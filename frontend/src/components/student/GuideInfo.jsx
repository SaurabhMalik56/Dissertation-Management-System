import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { FaUserTie, FaEnvelope, FaPhone, FaBuilding, FaClock, FaCalendarAlt, FaSync } from 'react-icons/fa';
import studentService from '../../services/studentService';
import { toast } from 'react-toastify';

const GuideInfo = () => {
  const { user } = useSelector((state) => state.auth);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

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
      
      // Check if guide data has changed
      const guideChanged = !guide || guide._id !== data._id;
      
      // Update state
      setGuide(data);
      setLastRefreshed(new Date());
      
      // Show toast notification if guide changed and it's not the initial load
      if (showToast && guideChanged && guide !== null) {
        toast.info('Your advisor information has been updated!');
      } else if (showToast) {
        toast.success('Advisor information refreshed');
      }
    } catch (err) {
      console.error('Error fetching guide info:', err);
      setError('Failed to fetch guide information. Please try again later.');
      if (showToast) {
        toast.error('Failed to refresh advisor information');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, guide]);

  // Initial fetch when component mounts
  useEffect(() => {
    if (user?.token) {
      fetchGuideInfo();
    }
  }, [user, fetchGuideInfo]);

  // Set up periodic refresh every 2 minutes to check for guide reassignments
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchGuideInfo();
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(intervalId);
  }, [fetchGuideInfo]);

  const handleManualRefresh = () => {
    fetchGuideInfo(true);
  };

  if (loading && !guide) {
    return (
      <div className="bg-white rounded-lg shadow p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
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
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <FaUserTie className="mx-auto text-gray-400 text-4xl mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Guide Assigned Yet</h3>
        <p className="text-gray-500">
          Your guide will be assigned after your proposal is approved by the HOD.
        </p>
        <button
          onClick={handleManualRefresh}
          className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center mx-auto"
          disabled={refreshing}
        >
          <FaSync className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} /> 
          {refreshing ? 'Refreshing...' : 'Check for Updates'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Your Faculty Guide</h3>
        <div className="flex items-center">
          <button
            onClick={handleManualRefresh}
            className="text-white hover:text-indigo-100 text-sm flex items-center"
            disabled={refreshing}
          >
            <FaSync className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <div className="text-xs text-indigo-100 ml-3">
            Updated: {lastRefreshed.toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start">
          {guide.profileImage ? (
            <img
              src={guide.profileImage}
              alt={guide.name}
              className="h-20 w-20 rounded-full object-cover mr-4"
            />
          ) : (
            <div className="h-20 w-20 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
              <FaUserTie className="text-indigo-600 text-3xl" />
            </div>
          )}

          <div>
            <h4 className="text-xl font-bold text-gray-900">{guide.name}</h4>
            <p className="text-gray-600">{guide.position}</p>
            <p className="text-sm text-gray-500 mt-1">{guide.department}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <FaEnvelope className="text-gray-400 mr-2" />
            <span className="text-gray-700">{guide.email}</span>
          </div>
          
          {guide.phone && (
            <div className="flex items-center">
              <FaPhone className="text-gray-400 mr-2" />
              <span className="text-gray-700">{guide.phone}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <FaBuilding className="text-gray-400 mr-2" />
            <span className="text-gray-700">{guide.officeLocation}</span>
          </div>
          
          {guide.officeHours && (
            <div className="flex items-center">
              <FaClock className="text-gray-400 mr-2" />
              <span className="text-gray-700">{guide.officeHours}</span>
            </div>
          )}
        </div>

        {guide.expertise && (
          <div className="mt-6">
            <h5 className="font-medium text-gray-900 mb-2">Expertise</h5>
            <div className="flex flex-wrap gap-2">
              {guide.expertise.split(',').map((item, index) => (
                <span 
                  key={index}
                  className="bg-indigo-50 text-indigo-700 px-3 py-1 text-sm rounded-full"
                >
                  {item.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {guide.bio && (
          <div className="mt-6">
            <h5 className="font-medium text-gray-900 mb-2">About</h5>
            <p className="text-gray-700">{guide.bio}</p>
          </div>
        )}

        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex justify-between">
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center">
              <FaCalendarAlt className="mr-1" />
              View Schedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideInfo; 