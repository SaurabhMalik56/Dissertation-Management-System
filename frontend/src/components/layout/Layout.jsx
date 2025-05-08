import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../../features/auth/authSlice';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check if a navigation item is active
  const isActive = (path) => {
    // Special case for admin dashboard (should be active only when no tab parameter)
    if (path === '/admin' && location.pathname === '/admin') {
      const currentTabParam = new URLSearchParams(location.search).get('tab');
      return !currentTabParam; // Active only when no tab parameter
    }
    
    // For tabs with query parameters
    if (path.includes('?tab=')) {
      const [basePath, query] = path.split('?');
      const tabParam = new URLSearchParams(query).get('tab');
      const currentTabParam = new URLSearchParams(location.search).get('tab');
      
      // Check if we're on the admin path AND the tab matches exactly
      return location.pathname === basePath && currentTabParam === tabParam;
    }
    
    // Exact match for paths
    if (path === location.pathname) {
      return true;
    }
    
    // For nested routes, only consider them active if they're not the parent route
    // and current path starts with them (excluding other similar paths)
    if (path !== '/' && path !== '/admin' && path !== '/student' && 
        path !== '/faculty' && path !== '/hod' && location.pathname.startsWith(path)) {
      return true;
    }
    
    return false;
  };

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/login');
  };

  // Determine navigation items based on user role
  const getNavItems = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'student':
        return [
          { name: 'Dashboard', path: '/student', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { name: 'Submit Proposal', path: '/student/proposal', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { name: 'View Guide', path: '/student/guide', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
          { name: 'Meetings', path: '/student/meetings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { name: 'Evaluation', path: '/student/evaluation', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
          { name: 'Notifications', path: '/student/notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
          { name: 'Profile', path: '/student/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
        ];
      case 'faculty':
        return [
          { name: 'Dashboard', path: '/faculty', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { name: 'Students', path: '/faculty/students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          { name: 'Projects', path: '/faculty/projects', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
          { name: 'Meetings', path: '/faculty/meetings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { name: 'Profile', path: '/faculty/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
        ];
      case 'hod':
        return [
          { name: 'Dashboard', path: '/hod', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { name: 'Project Proposals', path: '/hod/proposals', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { name: 'Faculty Members', path: '/hod/faculty', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { name: 'Meetings Overview', path: '/hod/meetings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
          { name: 'Profile', path: '/hod/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
        ];
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { name: 'Students', path: '/admin?tab=users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
          { name: 'HODs', path: '/admin?tab=departments', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
          { name: 'Faculty', path: '/admin?tab=reports', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { name: 'Projects', path: '/admin?tab=settings', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 flex flex-col flex-shrink-0 w-64 max-h-screen overflow-hidden transition-all transform bg-white border-r shadow-lg md:static md:h-full
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between flex-shrink-0 p-4 border-b">
          <Link to="/" className="text-xl font-semibold text-indigo-600">
            Disserto
          </Link>
          <button
            className="p-1 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-auto">
          <nav className="p-4 space-y-2">
            {getNavItems().map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center p-2 rounded-lg transition-colors duration-200 
                    ${active ? 
                      'bg-indigo-100 text-indigo-800 font-medium' : 
                      'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'}`}
                >
                  <svg 
                    className={`w-5 h-5 mr-3 ${active ? 'text-indigo-600' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
                  </svg>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="text-sm font-medium">{user?.fullName || 'User'}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.role || 'Role'}</div>
            </div>
          </div>
          <div className="cursor-pointer">
            <button
              type="button"
              className="w-full flex items-center justify-center p-3 text-white bg-red-500 font-medium rounded-lg hover:bg-red-600 active:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
              onClick={() => {
                // Ensure event is handled and not propagated
                try {
                  onLogout();
                } catch (error) {
                  console.error('Logout error:', error);
                  // Fallback direct navigation if dispatch fails
                  navigate('/login');
                }
              }}
              aria-label="Sign out"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top navigation bar */}
        <header className="flex items-center justify-between p-4 bg-white border-b md:py-2">
          <div className="flex items-center">
            <button 
              className="p-1 mr-4 md:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              Dissertation Management System
            </h1>
          </div>

          {/* HOD Info in navbar */}
          {user && user.role === 'hod' && (
            <div className="flex items-center space-x-4">
              {/* Desktop version */}
              <div className="hidden md:flex items-center bg-indigo-50 p-2 rounded-lg">
                <div className="text-sm font-medium text-indigo-800">
                  <span className="font-semibold">Name:</span> {user.fullName}
                </div>
                <span className="mx-2 text-gray-300">|</span>
                <div className="text-sm font-medium text-indigo-800">
                  <span className="font-semibold">Role:</span> {user.role.toUpperCase()}
                </div>
                <span className="mx-2 text-gray-300">|</span>
                <div className="text-sm font-medium text-indigo-800">
                  <span className="font-semibold">Email:</span> {user.email}
                </div>
              </div>
              
              {/* Mobile version */}
              <div className="md:hidden flex items-center bg-indigo-50 p-2 rounded-lg">
                <div className="flex flex-col">
                  <div className="text-xs font-medium text-indigo-800">
                    {user.fullName}
                  </div>
                  <div className="text-xs text-indigo-600">
                    {user.role.toUpperCase()} | {user.email}
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout; 