import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaBook, FaCalendarAlt, FaChartLine, FaCheckCircle, FaClock, FaFileAlt, FaUserTie, FaClipboardList, FaBell, FaGraduationCap } from 'react-icons/fa';
import studentService from '../../services/studentService';

// Import components
import ProposalForm from '../../components/student/ProposalForm';
import MeetingsList from '../../components/student/MeetingsList';
import GuideInfo from '../../components/student/GuideInfo';
import ProgressUpdate from '../../components/student/ProgressUpdate';
import FinalSubmission from '../../components/student/FinalSubmission';
import EvaluationResults from '../../components/student/EvaluationResults';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
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
    }
  });

  const { user } = useSelector((state) => state.auth);

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
        
        // Update dashboard data
        setDashboardData({
          projects: data.projects || [],
          meetings: data.meetings || [],
          guide: data.guide || null,
          notifications: data.notifications || [],
          stats: {
            totalProjects: data.projects?.length || 0,
            completedProjects: data.projects?.filter(p => p.status === 'completed').length || 0,
            upcomingMeetings: data.meetings?.filter(m => new Date(m.dateTime) > new Date()).length || 0,
            submissionsThisMonth: data.submissionsThisMonth || 0
          }
        });
        
        console.log('Dashboard data loaded successfully');
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  const refreshDashboard = async () => {
    try {
      setLoading(true);
      const data = await studentService.getStudentDashboard(user.token);
      
      // Update dashboard data
      setDashboardData({
        projects: data.projects || [],
        meetings: data.meetings || [],
        guide: data.guide || null,
        notifications: data.notifications || [],
        stats: {
          totalProjects: data.projects?.length || 0,
          completedProjects: data.projects?.filter(p => p.status === 'completed').length || 0,
          upcomingMeetings: data.meetings?.filter(m => new Date(m.dateTime) > new Date()).length || 0,
          submissionsThisMonth: data.submissionsThisMonth || 0
        }
      });
      
      toast.success('Dashboard updated');
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
      toast.error('Failed to refresh dashboard');
    } finally {
      setLoading(false);
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome, {user?.name || 'Student'}!</h1>
            <p className="mt-2">
              {user?.department} | {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <FaBook className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Projects</p>
              <p className="text-2xl font-bold">{dashboardData.stats.totalProjects}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
              <FaCheckCircle className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Completed</p>
              <p className="text-2xl font-bold">{dashboardData.stats.completedProjects}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-500 mr-4">
              <FaCalendarAlt className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Upcoming Meetings</p>
              <p className="text-2xl font-bold">{dashboardData.stats.upcomingMeetings}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-500 mr-4">
              <FaFileAlt className="text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Submissions</p>
              <p className="text-2xl font-bold">{dashboardData.stats.submissionsThisMonth} <span className="text-sm text-gray-500">this month</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaChartLine className="mr-2" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('proposal')}
            className={`${
              activeTab === 'proposal'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaFileAlt className="mr-2" /> Submit Proposal
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`${
              activeTab === 'guide'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaUserTie className="mr-2" /> View Guide
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`${
              activeTab === 'meetings'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaCalendarAlt className="mr-2" /> Meetings
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`${
              activeTab === 'progress'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaChartLine className="mr-2" /> Progress Updates
          </button>
          <button
            onClick={() => setActiveTab('submission')}
            className={`${
              activeTab === 'submission'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaGraduationCap className="mr-2" /> Final Submission
          </button>
          <button
            onClick={() => setActiveTab('evaluation')}
            className={`${
              activeTab === 'evaluation'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaClipboardList className="mr-2" /> Evaluation
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`${
              activeTab === 'notifications'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
          >
            <FaBell className="mr-2" /> Notifications
            {dashboardData.notifications.filter(n => !n.read).length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {dashboardData.notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Overview Dashboard</h2>
            
            {/* Advisor Information */}
            <div className="mb-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Your Advisor</h3>
              {dashboardData.guide ? (
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-3 rounded-full mr-4">
                    <FaUserTie className="text-indigo-600 text-xl" />
                  </div>
                  <div>
                    <p className="font-medium">{dashboardData.guide.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{dashboardData.guide.department}</p>
                    <p className="text-sm text-gray-500">Office: {dashboardData.guide.officeLocation}</p>
                  </div>
                  <div className="ml-auto">
                    <button 
                      onClick={() => setActiveTab('guide')}
                      className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No guide assigned yet. Submit a proposal first.</p>
              )}
            </div>

            {/* Current Project */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Current Project</h3>
              {dashboardData.projects.length > 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{dashboardData.projects[0].title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{dashboardData.projects[0].description}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      dashboardData.projects[0].status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      dashboardData.projects[0].status === 'approved' ? 'bg-green-100 text-green-800' :
                      dashboardData.projects[0].status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {dashboardData.projects[0].status.charAt(0).toUpperCase() + dashboardData.projects[0].status.slice(1)}
                    </span>
                  </div>
                  {dashboardData.projects[0].progress && (
                    <div className="mt-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm font-medium">{dashboardData.projects[0].progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${dashboardData.projects[0].progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {dashboardData.projects[0].deadline && (
                    <div className="mt-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaClock className="mr-1" /> 
                        <span>Deadline: {new Date(dashboardData.projects[0].deadline).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <FaFileAlt className="mx-auto text-gray-400 text-3xl mb-3" />
                  <p className="text-gray-700">No active projects found.</p>
                  <button 
                    onClick={() => setActiveTab('proposal')}
                    className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                  >
                    Submit a Proposal
                  </button>
                </div>
              )}
            </div>

            {/* Upcoming Meetings */}
            <div>
              <h3 className="text-lg font-medium mb-2">Upcoming Meetings</h3>
              {dashboardData.meetings.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.meetings.slice(0, 2).map(meeting => (
                    <div key={meeting._id} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between">
                        <div>
                          <h4 className="font-medium">{meeting.title}</h4>
                          <p className="text-sm text-gray-500 mt-1">With: {meeting.faculty?.name}</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {meeting.status === 'scheduled' ? 'Scheduled' : meeting.status}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-1" /> 
                          <span>{new Date(meeting.dateTime).toLocaleDateString()} at {new Date(meeting.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <FaClock className="mr-1" /> 
                          <span>Duration: {meeting.duration} minutes</span>
                        </div>
                        <div className="flex items-center mt-1">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          </svg>
                          <span>{meeting.location}</span>
                        </div>
                      </div>
                      <div className="mt-3 text-right">
                        <button
                          onClick={() => setActiveTab('meetings')}
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                  {dashboardData.meetings.length > 2 && (
                    <div className="text-center mt-3">
                      <button
                        onClick={() => setActiveTab('meetings')}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                      >
                        View All Meetings
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                  <FaCalendarAlt className="mx-auto text-gray-400 text-3xl mb-3" />
                  <p className="text-gray-700">No upcoming meetings scheduled.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'proposal' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Submit Dissertation Proposal</h2>
            <ProposalForm onSubmitSuccess={refreshDashboard} />
          </div>
        )}

        {activeTab === 'guide' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Your Faculty Guide</h2>
            <GuideInfo />
          </div>
        )}

        {activeTab === 'meetings' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Faculty-Student Meetings</h2>
            <MeetingsList />
          </div>
        )}

        {activeTab === 'progress' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Progress Updates</h2>
            <ProgressUpdate />
          </div>
        )}

        {activeTab === 'submission' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Final Dissertation Submission</h2>
            <FinalSubmission />
          </div>
        )}

        {activeTab === 'evaluation' && (
          <div>
            <h2 className="text-xl font-semibold mb-6">Evaluation Results</h2>
            <EvaluationResults />
          </div>
        )}

        {activeTab === 'notifications' && (
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
                                  
                                  if (actionType === 'proposal') setActiveTab('proposal');
                                  else if (actionType === 'meetings') setActiveTab('meetings');
                                  else if (actionType === 'progress') setActiveTab('progress');
                                  else if (actionType === 'submission') setActiveTab('submission');
                                  else if (actionType === 'evaluation') setActiveTab('evaluation');
                                  else if (actionType === 'guide') setActiveTab('guide');
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
        )}
      </div>
    </div>
  );
};

export default Dashboard; 