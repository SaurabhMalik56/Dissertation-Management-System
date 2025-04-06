import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaUserTie, FaEnvelope, FaPhone, FaBuilding, FaClock, FaCalendarAlt } from 'react-icons/fa';
import studentService from '../../services/studentService';

const GuideInfo = () => {
  const { user } = useSelector((state) => state.auth);
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGuideInfo = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await studentService.getStudentGuide(user.token);
        setGuide(data);
      } catch (err) {
        console.error('Error fetching guide info:', err);
        setError('Failed to fetch guide information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchGuideInfo();
    }
  }, [user]);

  if (loading) {
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
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 px-6 py-4">
        <h3 className="text-lg font-medium text-white">Your Faculty Guide</h3>
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
              Request Meeting
            </button>
            
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View Publications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideInfo; 