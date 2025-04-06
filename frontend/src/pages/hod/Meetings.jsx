import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import useHodDashboard from '../../hooks/useHodDashboard';
import hodService from '../../services/hodService';

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800'
};

const Meetings = () => {
  const {
    isLoading,
    error,
    fetchDashboardData
  } = useHodDashboard();
  
  const { user } = useSelector((state) => state.auth);
  const [meetings, setMeetings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchMeetings = async () => {
      if (!user) return;
      
      try {
        const data = await hodService.getDepartmentMeetings(user.token);
        setMeetings(data);
      } catch (err) {
        toast.error('Failed to load meetings');
      }
    };
    
    fetchMeetings();
  }, [user]);

  // Filter meetings based on status
  const filteredMeetings = filterStatus === 'all' 
    ? meetings 
    : meetings.filter(meeting => meeting.status === filterStatus);

  return (
    <div className="min-h-full bg-gray-100">
      <main className="flex-1">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Meetings Overview
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Track meetings between students and guides
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filterStatus === 'all' 
                    ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('scheduled')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filterStatus === 'scheduled' 
                    ? 'bg-blue-100 text-blue-800 border-2 border-blue-300' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                Scheduled
              </button>
              <button
                onClick={() => setFilterStatus('completed')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filterStatus === 'completed' 
                    ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  filterStatus === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                Pending
              </button>
            </div>
            
            {/* Meetings Table */}
            <div className="bg-white shadow sm:rounded-lg mb-6">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Meetings
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-50 text-red-700 border-l-4 border-red-500">
                    {error}
                  </div>
                ) : filteredMeetings.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No meetings to display
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guide
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Meeting No.
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Summary
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredMeetings.map((meeting) => (
                        <tr key={meeting._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {meeting.student?.fullName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{meeting.guide?.fullName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{meeting.meetingNumber || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(meeting.dateTime).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(meeting.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[meeting.status] || 'bg-gray-100 text-gray-800'}`}>
                              {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs line-clamp-2">
                              {meeting.summary || 'No summary available'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Meetings; 