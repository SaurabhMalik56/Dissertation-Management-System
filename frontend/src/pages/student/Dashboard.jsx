import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import { 
  FaBook, 
  FaCalendarAlt, 
  FaFileAlt, 
  FaUserTie, 
  FaClipboardList, 
  FaBell, 
  FaHome,
  FaTachometerAlt,
  FaBars,
  FaTimes,
  FaSync,
  FaClock,
  FaChartLine,
  FaGraduationCap,
  FaUser
} from 'react-icons/fa';
import studentService from '../../services/studentService';

// Import components
import ProposalForm from '../../components/student/ProposalForm';
import MeetingsList from '../../components/student/MeetingsList';
import GuideInfo from '../../components/student/GuideInfo';
import EvaluationResults from '../../components/student/EvaluationResults';
import CurrentProject from '../../components/student/CurrentProject';
import ProfileSection from '../../components/student/ProfileSection';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    projects: [],
    meetings: [],
    guide: null,
    notifications: [],
    stats: {
      totalProjects: 0,
      completedProjects: 0,
      upcomingMeetings: 0,
      submissionsThisMonth: 0
    },
    evaluation: null
  });
  const [currentProject, setCurrentProject] = useState(null);
  const [evaluationLoading, setEvaluationLoading] = useState(false);

  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  // Set active view based on route
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('proposal')) setActiveView('proposal');
    else if (path.includes('guide')) setActiveView('guide');
    else if (path.includes('meetings')) setActiveView('meetings');
    else if (path.includes('evaluation')) setActiveView('evaluation');
    else if (path.includes('notifications')) setActiveView('notifications');
    else if (path.includes('profile')) setActiveView('profile');
    else if (path === '/student') setActiveView('overview');
  }, [location.pathname]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!user || !user.token) {
          throw new Error('Authentication required');
        }
        
        console.log('Fetching dashboard data for student:', user.name);
        
        // Fetch all dashboard data in one call
        const data = await studentService.getStudentDashboard(user.token);
        
        // Log guide data to help debug
        console.log('Guide data received:', data.guide);
        
        // Fetch meetings directly from the guide's database
        let meetings = [];
        try {
          // Only fetch meetings if guide is assigned
          if (data.guide && data.guide._id) {
            console.log('Fetching meetings from guide database');
            meetings = await studentService.getMeetingsFromGuide(user.token);
            console.log('Meetings fetched from guide database:', meetings.length);
          } else {
            console.log('No guide assigned, skipping meetings fetch');
            meetings = [];
          }
        } catch (meetingsError) {
          console.error('Error fetching meetings from guide:', meetingsError);
          // Fall back to regular meetings from dashboard if available
          meetings = data.meetings || [];
          console.log('Using fallback meetings from dashboard:', meetings.length);
        }
        
        // Check if guide has been reassigned
        const guideChanged = 
          dashboardData.guide && 
          data.guide && 
          dashboardData.guide._id !== data.guide._id;
          
        if (guideChanged) {
          toast.info('Your advisor has been updated! Refreshing information...');
        }
        
        // Fetch evaluation data if activeView is evaluation
        let evaluationData = null;
        if (activeView === 'evaluation') {
          try {
            console.log('Fetching evaluation data');
            evaluationData = await studentService.getEvaluationResults(user.token);
            console.log('Evaluation data fetched:', evaluationData);
          } catch (evalError) {
            console.error('Error fetching evaluation data:', evalError);
            // Don't throw an error - we'll handle it gracefully by setting a placeholder
            evaluationData = {
              evaluationType: 'pending',
              presentationScore: 0,
              contentScore: 0,
              researchScore: 0,
              innovationScore: 0,
              implementationScore: 0,
              comments: 'No evaluation available yet.',
              overallGrade: 'Pending',
              projectTitle: 'Your Project',
              createdAt: new Date()
            };
          }
        }
        
        // Update dashboard data
        setDashboardData({
          projects: data.projects || [],
          meetings: meetings, // Use directly fetched meetings
          guide: data.guide || null,
          notifications: data.notifications || [],
          stats: {
            totalProjects: data.projects?.length || 0,
            completedProjects: data.projects?.filter(p => p.status === 'completed').length || 0,
            upcomingMeetings: meetings.filter(m => new Date(m.scheduledDate || m.dateTime) > new Date()).length || 0,
            submissionsThisMonth: data.submissionsThisMonth || 0
          },
          evaluation: evaluationData || data.evaluation // Include evaluation data
        });
        
        console.log('Dashboard data loaded successfully');
        
        // Show info message about meetings
        if (activeView === 'meetings') {
          setTimeout(() => {
            toast.info('If your faculty scheduled a meeting recently, click the refresh button in the meetings section to see it.', {
              autoClose: 8000,
              icon: <FaSync />
            });
          }, 1000);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Set up auto-refresh interval (every 2 minutes) to check for guide changes
    const intervalId = setInterval(() => {
      fetchDashboardData();
    }, 2 * 60 * 1000); // 2 minutes
    
    return () => clearInterval(intervalId);
  }, [user, activeView]);

  // Add an effect to mark notifications as read when viewing the notifications tab
  useEffect(() => {
    const markNotificationsRead = async () => {
      if (activeView === 'notifications' && user && user.token) {
        try {
          // Get unread notification IDs
          const unreadIds = dashboardData.notifications
            .filter(notification => !notification.read)
            .map(notification => notification._id);
          
          if (unreadIds.length > 0) {
            await studentService.markNotificationsAsRead(unreadIds, user.token);
            console.log('Marked notifications as read:', unreadIds.length);
            
            // Update local state to show notifications as read
            setDashboardData(prev => ({
              ...prev,
              notifications: prev.notifications.map(notification => ({
                ...notification,
                read: true
              }))
            }));
          }
        } catch (error) {
          console.error('Error marking notifications as read:', error);
        }
      }
    };
    
    markNotificationsRead();
  }, [activeView, dashboardData.notifications, user]);

  const refreshDashboard = async () => {
    try {
      setLoading(true);
      const data = await studentService.getStudentDashboard(user.token);
      
      // Fetch meetings directly from the guide's database with force refresh
      let meetings = [];
      try {
        // Only fetch meetings if guide is assigned
        if (data.guide && data.guide._id) {
          console.log('Refreshing meetings from guide database');
          meetings = await studentService.getMeetingsFromGuide(user.token, true);
          console.log('Refreshed meetings from guide database:', meetings.length);
        } else {
          console.log('No guide assigned, skipping meetings refresh');
          meetings = [];
        }
      } catch (meetingsError) {
        console.error('Error refreshing meetings from guide:', meetingsError);
        // Fall back to regular meetings from dashboard if available
        meetings = data.meetings || [];
        console.log('Using fallback meetings from dashboard:', meetings.length);
      }
      
      // Update dashboard data
      setDashboardData({
        projects: data.projects || [],
        meetings: meetings,
        guide: data.guide || null,
        notifications: data.notifications || [],
        stats: {
          totalProjects: data.projects?.length || 0,
          completedProjects: data.projects?.filter(p => p.status === 'completed').length || 0,
          upcomingMeetings: meetings.filter(m => new Date(m.scheduledDate || m.dateTime) > new Date()).length || 0,
          submissionsThisMonth: data.submissionsThisMonth || 0
        },
        evaluation: data.evaluation || null
      });
      
      toast.success('Dashboard updated');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast.error('Failed to refresh dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting a project to view details
  const handleViewProject = async (projectId, view = 'submission') => {
    try {
      if (!projectId && dashboardData.projects.length > 0) {
        projectId = dashboardData.projects[0]._id;
      }
      
      if (projectId) {
        setLoading(true);
        const projectDetails = await studentService.getProjectDetails(projectId, user.token);
        setCurrentProject(projectDetails);
        setActiveView(view);
      } else {
        toast.warning('No project selected');
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error('Could not load project details');
    } finally {
      setLoading(false);
    }
  };

  // Add a function to fetch evaluation data
  const fetchEvaluationData = async () => {
    if (!user || !user.token) return;
    
    try {
      setEvaluationLoading(true);
      console.log('Fetching evaluation data');
      const evaluationData = await studentService.getEvaluationResults(user.token);
      console.log('Evaluation data fetched:', evaluationData);
      
      // Update dashboard data with evaluation
      setDashboardData(prev => ({
        ...prev,
        evaluation: evaluationData
      }));
      
      toast.success('Evaluation data refreshed');
    } catch (error) {
      console.error('Error fetching evaluation data:', error);
      
      // Show user-friendly error message
      if (error.response && error.response.status === 404) {
        toast.info('No evaluations available yet. Your faculty will evaluate your work soon.');
      } else {
        toast.error('Failed to fetch evaluation data. Try again later.');
      }
      
      // Set a placeholder evaluation so the UI can still render
      setDashboardData(prev => ({
        ...prev,
        evaluation: {
          evaluationType: 'pending',
          presentationScore: 0,
          contentScore: 0,
          researchScore: 0,
          innovationScore: 0,
          implementationScore: 0,
          comments: 'No evaluation available yet.',
          overallGrade: 'Pending',
          projectTitle: 'Your Project',
          createdAt: new Date()
        }
      }));
    } finally {
      setEvaluationLoading(false);
    }
  };

  if (loading && !dashboardData.projects.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
              <button 
                onClick={refreshDashboard}
                className="mt-2 text-sm text-red-700 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Navigation items for sidebar
  const navItems = [
    { id: 'overview', label: 'Overview', icon: <FaHome className="w-5 h-5" /> },
    { id: 'proposal', label: 'Submit Proposal', icon: <FaFileAlt className="w-5 h-5" /> },
    { id: 'guide', label: 'View Guide', icon: <FaUserTie className="w-5 h-5" /> },
    { id: 'meetings', label: 'Meetings', icon: <FaCalendarAlt className="w-5 h-5" /> },
    { id: 'evaluation', label: 'Evaluation', icon: <FaClipboardList className="w-5 h-5" /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell className="w-5 h-5" />, 
      badge: dashboardData.notifications.filter(n => !n.read).length || null },
    { id: 'profile', label: 'Profile', icon: <FaUser className="w-5 h-5" /> }
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Dashboard</h2>
            
            {/* Current Project - Full Width */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium">Current Project</h3>
              </div>
              <CurrentProject 
                project={dashboardData.projects.length > 0 ? dashboardData.projects[0] : null}
                onViewDetails={(view) => setActiveView(view)}
              />
            </div>
            
            {/* Other Dashboard Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Recent Activity</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    {dashboardData.notifications.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {dashboardData.notifications.slice(0, 3).map(notification => (
                          <div key={notification._id} className="py-3 first:pt-0 last:pb-0">
                            <div className="flex items-start">
                              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                                !notification.read ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {notification.type === 'proposal' && <FaFileAlt className="text-sm" />}
                                {notification.type === 'meeting' && <FaCalendarAlt className="text-sm" />}
                                {notification.type === 'progress' && <FaChartLine className="text-sm" />}
                                {notification.type === 'feedback' && <FaClipboardList className="text-sm" />}
                                {notification.type === 'evaluation' && <FaGraduationCap className="text-sm" />}
                                {notification.type === 'general' && <FaBell className="text-sm" />}
                              </div>
                              <div className="ml-3 flex-1">
                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {new Date(notification.createdAt).toLocaleDateString()} at {' '}
                                  {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">No recent activity</p>
                    )}
                    {dashboardData.notifications.length > 3 && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setActiveView('notifications')}
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View All Activity
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-1">
                {/* Advisor Information */}
                <div className="mb-6 bg-white border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-lg font-medium mb-3 flex justify-between items-center">
                    <span>Your Advisor</span>
                    <button
                      onClick={refreshDashboard}
                      className="p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none"
                      title="Refresh Advisor Info"
                    >
                      <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </h3>
                  {dashboardData.guide ? (
                    (() => {
                      // Helper function to get the guide's name from various possible property names
                      const getGuideName = () => {
                        if (!dashboardData.guide) return "Faculty Guide";
                        
                        // Check for various possible property names for the guide's name
                        const nameProps = ['fullName', 'name', 'facultyName', 'userName', 'displayName'];
                        for (const prop of nameProps) {
                          if (dashboardData.guide[prop] && typeof dashboardData.guide[prop] === 'string') {
                            return dashboardData.guide[prop];
                          }
                        }
                        
                        // If we have a name property but it might be an object with firstName/lastName
                        if (dashboardData.guide.firstName && dashboardData.guide.lastName) {
                          return `${dashboardData.guide.firstName} ${dashboardData.guide.lastName}`;
                        }
                        
                        // Last resort fallback
                        return "Faculty Guide";
                      };
                      
                      return (
                        <div className="bg-indigo-50 rounded-lg p-4">
                          <div className="flex items-center">
                            <div className="bg-indigo-100 p-3 rounded-full mr-4">
                              <FaUserTie className="text-indigo-600 text-xl" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg text-indigo-900">
                                {getGuideName()}
                              </h4>
                            </div>
                          </div>
                          
                          <div className="flex items-start mx-1 mt-3">
                            <svg className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-indigo-700 font-medium break-all">{dashboardData.guide && dashboardData.guide.email ? dashboardData.guide.email : 'Email not available'}</span>
                          </div>
                          
                          <div className="mt-4 text-center">
                      <button
                              onClick={() => setActiveView('guide')}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                              View Full Profile
                      </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-4">
                      <FaUserTie className="mx-auto text-gray-400 text-3xl mb-3" />
                      <p className="text-gray-700">No guide assigned yet.</p>
                      <p className="text-sm text-gray-500 mt-1">Submit a proposal to get assigned a guide.</p>
                    </div>
                  )}
                </div>

                {/* Upcoming Meetings */}
                <div className="bg-white border border-gray-200 p-4 rounded-lg hover:shadow-md transition-shadow duration-300">
                  <h3 className="text-lg font-medium mb-3">Upcoming Meetings</h3>
                  {dashboardData.meetings.length > 0 ? (
                    <div className="space-y-3">
                      {dashboardData.meetings.slice(0, 2).map(meeting => (
                        <div key={meeting._id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-sm">
                                {meeting.title || `Meeting ${meeting.meetingNumber}`}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1">
                                With: {meeting.faculty?.name || meeting.guideName || 'Faculty Guide'}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {meeting.status === 'scheduled' ? 'Scheduled' : meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1 text-xs text-gray-500">
                            <div className="flex items-center">
                              <FaCalendarAlt className="text-xs mr-1" /> 
                              <span>{new Date(meeting.dateTime || meeting.scheduledDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center">
                              <FaClock className="text-xs mr-1" /> 
                              <span>{new Date(meeting.dateTime || meeting.scheduledDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <div className="flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{meeting.location || meeting.meetingType || 'Not specified'}</span>
                            </div>
                            {(meeting.notes || meeting.guideNotes) && (
                              <div className="flex items-start mt-1">
                                <FaClipboardList className="text-xs mr-1 mt-0.5" /> 
                                <span className="line-clamp-2">Summary: {meeting.notes || meeting.guideNotes}</span>
                              </div>
                            )}
                            {(meeting.studentNotes || meeting.agenda) && (
                              <div className="flex items-start mt-1">
                                <FaClipboardList className="text-xs mr-1 mt-0.5" /> 
                                <span className="line-clamp-2">Points to discuss: {meeting.studentNotes || meeting.agenda}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FaCalendarAlt className="mx-auto text-gray-400 text-2xl mb-3" />
                      <p className="text-gray-700">No upcoming meetings</p>
                      <p className="mt-2 text-sm text-gray-500">
                        Your advisor will schedule meetings when needed
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'proposal':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-6">Submit Dissertation Proposal</h2>
            <ProposalForm onSubmitSuccess={refreshDashboard} />
          </div>
        );
      case 'guide':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-6">Your Faculty Guide</h2>
            <GuideInfo />
          </div>
        );
      case 'meetings':
        return (
          <div>
              <h2 className="text-xl font-semibold mb-2">Faculty-Student Meetings</h2>
              <p className="text-gray-500 mb-6">Meetings are scheduled by your faculty guide. You can view meeting details here but cannot create or edit meetings.</p>
            <MeetingsList />
          </div>
        );
      case 'evaluation':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Dissertation Evaluation</h2>
              <button 
                onClick={fetchEvaluationData}
                disabled={evaluationLoading}
                className="flex items-center space-x-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded transition-colors"
              >
                {evaluationLoading ? (
                  <div className="animate-spin h-4 w-4 border-2 border-indigo-500 rounded-full border-t-transparent"></div>
                ) : (
                  <FaSync className="h-4 w-4" />
                )}
                <span>Refresh</span>
              </button>
            </div>
            <EvaluationResults evaluation={dashboardData.evaluation} />
          </div>
        );
      case 'notifications':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-6">Notifications</h2>
            
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Your Notifications</h3>
                </div>
                {dashboardData.notifications.filter(n => !n.read).length > 0 && (
                  <button
                    onClick={async () => {
                      try {
                        await studentService.markAllNotificationsAsRead(user.token);
                        await refreshDashboard();
                        toast.success('All notifications marked as read');
                      } catch (error) {
                        console.error('Error marking notifications as read:', error);
                        toast.error('Failed to mark notifications as read');
                      }
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className="divide-y divide-gray-200">
                {dashboardData.notifications.length > 0 ? (
                  dashboardData.notifications.map(notification => (
                    <div 
                      key={notification._id} 
                      className={`p-6 ${!notification.read ? 'bg-indigo-50' : ''}`}
                    >
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          !notification.read ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {notification.type === 'proposal' && <FaFileAlt />}
                          {notification.type === 'meeting' && <FaCalendarAlt />}
                          {notification.type === 'progress' && <FaChartLine />}
                          {notification.type === 'feedback' && <FaClipboardList />}
                          {notification.type === 'evaluation' && <FaGraduationCap />}
                          {notification.type === 'general' && <FaBell />}
                        </div>
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between">
                            <p className={`text-sm font-medium ${!notification.read ? 'text-indigo-900' : 'text-gray-900'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(notification.createdAt).toLocaleDateString()} at {' '}
                              {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </p>
                          </div>
                          <p className={`text-sm mt-1 ${!notification.read ? 'text-indigo-800' : 'text-gray-700'}`}>
                            {notification.message}
                          </p>
                          
                          {notification.actionLink && (
                            <div className="mt-2">
                              <button 
                                onClick={() => {
                                  // Handle action based on notification type
                                  const actionType = notification.actionLink.split('/')[0];
                                  
                                    if (actionType === 'proposal') setActiveView('proposal');
                                    else if (actionType === 'meetings') setActiveView('meetings');
                                    else if (actionType === 'progress') setActiveView('progress');
                                    else if (actionType === 'submission') setActiveView('submission');
                                    else if (actionType === 'evaluation') setActiveView('evaluation');
                                    else if (actionType === 'guide') setActiveView('guide');
                                }}
                                className="text-sm text-indigo-600 hover:text-indigo-800"
                              >
                                {notification.actionText || 'View Details'}
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {!notification.read && (
                          <button
                            onClick={async () => {
                              try {
                                await studentService.markNotificationAsRead(notification._id, user.token);
                                await refreshDashboard();
                              } catch (error) {
                                console.error('Error marking notification as read:', error);
                                toast.error('Failed to mark notification as read');
                              }
                            }}
                            className="ml-4 text-sm text-gray-500 hover:text-gray-700"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <FaBell className="mx-auto text-gray-400 text-3xl mb-3" />
                    <p className="text-gray-500">No notifications to display.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div>
            <h2 className="text-xl font-semibold mb-6">Your Profile</h2>
            <ProfileSection />
          </div>
        );
      default:
        return (
          <div>
            <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
            <p>Select an option from the sidebar to view content.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Top header */}
      <header className="bg-white shadow-sm z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-semibold text-gray-900">
              {navItems.find(item => item.id === activeView)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={refreshDashboard}
              className="p-1 rounded-full text-gray-600 hover:text-gray-900 focus:outline-none"
              title="Refresh Data"
            >
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="px-4 sm:px-6 lg:px-8 py-2 bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto space-x-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap ${
                activeView === item.id 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              } transition-colors duration-150`}
            >
              <span className="inline-flex items-center justify-center w-5 h-5 mr-2">
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard; 