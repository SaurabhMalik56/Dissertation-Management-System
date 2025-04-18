import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaUser, FaEnvelope, FaPhone, FaUniversity, FaIdCard, FaEdit, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import studentService from '../../services/studentService';
import { updateUser } from '../../features/auth/authSlice';

const ProfileSection = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    branch: '',
    rollNumber: '',
    batch: '',
    bio: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user?.token) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await studentService.getStudentProfile(user.token);
        
        setProfileData({
          fullName: data.fullName || user.fullName || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          department: data.department || '',
          branch: data.branch || '',
          rollNumber: data.rollNumber || '',
          batch: data.batch || '',
          bio: data.bio || ''
        });
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Using data from your account.');
        
        // Fallback to user data from redux store
        setProfileData({
          fullName: user.fullName || '',
          email: user.email || '',
          phone: user.phone || '',
          department: user.department || '',
          branch: user.branch || '',
          rollNumber: user.rollNumber || '',
          batch: user.batch || '',
          bio: user.bio || ''
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const updatedProfile = await studentService.updateProfile(profileData, user.token);
      
      // Update the user in Redux store
      dispatch(updateUser({
        ...user,
        ...updatedProfile
      }));
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Student Profile</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 hover:bg-indigo-200 rounded-md"
          >
            <FaEdit className="mr-1" /> Edit Profile
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(false)}
            className="text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
        )}
      </div>
      
      <div className="px-6 py-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : isEditing ? (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={profileData.department}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <input
                  type="text"
                  name="branch"
                  value={profileData.branch}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Roll Number
                </label>
                <input
                  type="text"
                  name="rollNumber"
                  value={profileData.rollNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-100"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Batch
                </label>
                <input
                  type="text"
                  name="batch"
                  value={profileData.batch}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  rows="4"
                  placeholder="Tell us a bit about yourself..."
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-1" />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
                {error}
              </div>
            )}
            
            {profileData.fullName && (
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-1/3 font-medium text-gray-500">
                  <div className="flex items-center mb-2">
                    <FaUser className="mr-2 text-indigo-500" />
                    <span>Full Name</span>
                  </div>
                </div>
                <div className="w-full sm:w-2/3 text-gray-800">
                  {profileData.fullName}
                </div>
              </div>
            )}
            
            {profileData.email && (
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-1/3 font-medium text-gray-500">
                  <div className="flex items-center mb-2">
                    <FaEnvelope className="mr-2 text-indigo-500" />
                    <span>Email</span>
                  </div>
                </div>
                <div className="w-full sm:w-2/3 text-gray-800">
                  {profileData.email}
                </div>
              </div>
            )}
            
            {profileData.phone && (
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-1/3 font-medium text-gray-500">
                  <div className="flex items-center mb-2">
                    <FaPhone className="mr-2 text-indigo-500" />
                    <span>Phone</span>
                  </div>
                </div>
                <div className="w-full sm:w-2/3 text-gray-800">
                  {profileData.phone}
                </div>
              </div>
            )}
            
            {profileData.department && (
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-1/3 font-medium text-gray-500">
                  <div className="flex items-center mb-2">
                    <FaUniversity className="mr-2 text-indigo-500" />
                    <span>Department</span>
                  </div>
                </div>
                <div className="w-full sm:w-2/3 text-gray-800">
                  {profileData.department}
                </div>
              </div>
            )}
            
            {profileData.branch && (
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-1/3 font-medium text-gray-500">
                  <div className="flex items-center mb-2">
                    <FaUniversity className="mr-2 text-indigo-500" />
                    <span>Branch</span>
                  </div>
                </div>
                <div className="w-full sm:w-2/3 text-gray-800">
                  {profileData.branch}
                </div>
              </div>
            )}
            
            {profileData.rollNumber && (
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-1/3 font-medium text-gray-500">
                  <div className="flex items-center mb-2">
                    <FaIdCard className="mr-2 text-indigo-500" />
                    <span>Roll Number</span>
                  </div>
                </div>
                <div className="w-full sm:w-2/3 text-gray-800">
                  {profileData.rollNumber}
                </div>
              </div>
            )}
            
            {profileData.batch && (
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-1/3 font-medium text-gray-500">
                  <div className="flex items-center mb-2">
                    <FaIdCard className="mr-2 text-indigo-500" />
                    <span>Batch</span>
                  </div>
                </div>
                <div className="w-full sm:w-2/3 text-gray-800">
                  {profileData.batch}
                </div>
              </div>
            )}
            
            {profileData.bio && (
              <div className="flex flex-col">
                <div className="w-full font-medium text-gray-500 mb-2">
                  Bio
                </div>
                <div className="w-full text-gray-800 bg-gray-50 p-4 rounded-md">
                  {profileData.bio}
                </div>
              </div>
            )}
            
            {!profileData.fullName && !profileData.email && !profileData.phone && 
             !profileData.department && !profileData.branch && !profileData.rollNumber && 
             !profileData.batch && !profileData.bio && (
              <div className="text-center py-4">
                <p className="text-gray-500">No profile information available.</p>
                <button 
                  onClick={() => setIsEditing(true)}
                  className="mt-2 text-indigo-600 hover:text-indigo-800"
                >
                  Add your information
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSection; 