import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { logout, reset } from '../../features/auth/authSlice';
import adminService from '../../services/adminService';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  // States for profile data
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    joiningDate: '',
    employeeId: ''
  });
  
  // States for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Active section state
  const [activeSection, setActiveSection] = useState('personal');
  
  // Error states
  const [profileError, setProfileError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  
  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user || !user.token) return;
      
      setIsLoading(true);
      setProfileError(null);
      
      try {
        const response = await adminService.getAdminProfile(user.token);
        
        if (response.success) {
          setProfileData({
            fullName: response.data.fullName || '',
            email: response.data.email || '',
            phone: response.data.phone || '',
            department: response.data.department || '',
            joiningDate: response.data.joiningDate ? new Date(response.data.joiningDate).toISOString().split('T')[0] : '',
            employeeId: response.data.employeeId || ''
          });
        }
      } catch (error) {
        setProfileError('Failed to load profile data. Please try again.');
        toast.error('Unable to fetch profile information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);
  
  // Handle profile form input change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Handle password form input change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Handle profile update submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!user || !user.token) {
      toast.error('Authentication error. Please log in again.');
      dispatch(logout());
      dispatch(reset());
      return;
    }
    
    setIsSavingProfile(true);
    setProfileError(null);
    
    try {
      const response = await adminService.updateProfile(user.token, profileData);
      
      if (response.success) {
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      setProfileError('Failed to update profile. Please try again.');
      toast.error(error.message || 'Error updating profile');
    } finally {
      setIsSavingProfile(false);
    }
  };
  
  // Handle password change submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      toast.error('Passwords do not match');
      return;
    }
    
    if (!user || !user.token) {
      toast.error('Authentication error. Please log in again.');
      dispatch(logout());
      dispatch(reset());
      return;
    }
    
    setIsChangingPassword(true);
    setPasswordError(null);
    
    try {
      const response = await adminService.changePassword(user.token, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.success) {
        toast.success('Password changed successfully');
        // Reset password fields
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      setPasswordError('Failed to change password. Please check your current password and try again.');
      toast.error(error.message || 'Error changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="ml-3 text-indigo-500">Loading profile data...</p>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h1>
      
      {/* Profile sections navigation */}
      <div className="flex flex-wrap mb-6 space-x-2">
        <button
          className={`px-4 py-2 rounded-md transition-colors ${
            activeSection === 'personal'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveSection('personal')}
        >
          Personal Information
        </button>
        <button
          className={`px-4 py-2 rounded-md transition-colors ${
            activeSection === 'security'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          onClick={() => setActiveSection('security')}
        >
          Security Settings
        </button>
      </div>
      
      {/* Personal Information Section */}
      {activeSection === 'personal' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
          
          {profileError && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
              {profileError}
            </div>
          )}
          
          <form onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Email address cannot be changed</p>
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={profileData.department}
                  onChange={handleProfileChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Employee ID
                </label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={profileData.employeeId}
                  onChange={handleProfileChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="joiningDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Joining Date
                </label>
                <input
                  type="date"
                  id="joiningDate"
                  name="joiningDate"
                  value={profileData.joiningDate}
                  onChange={handleProfileChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Security Settings Section */}
      {activeSection === 'security' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Change Password</h2>
          
          {passwordError && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md">
              {passwordError}
            </div>
          )}
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                  minLength={8}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 p-4 bg-yellow-50 rounded-md">
            <h3 className="text-lg font-medium text-yellow-800">Account Security</h3>
            <p className="text-sm text-yellow-700 mt-2">
              Protect your account by using a strong, unique password and changing it periodically.
              Never share your password with anyone, including other staff members.
            </p>
          </div>
        </div>
      )}
      
      {/* Account Activity Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">Account Type</p>
            <p className="font-medium text-gray-900">Administrator</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">Last Login</p>
            <p className="font-medium text-gray-900">{new Date().toLocaleString()}</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">Account Status</p>
            <p className="font-medium text-green-600">Active</p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-500">Account ID</p>
            <p className="font-medium text-gray-900">{user?._id || 'Not available'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 