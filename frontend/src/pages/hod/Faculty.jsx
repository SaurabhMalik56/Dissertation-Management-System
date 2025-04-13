import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import hodService from '../../services/hodService';
import axios from 'axios';

const Faculty = () => {
  const { user } = useSelector((state) => state.auth);
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [loadingFaculty, setLoadingFaculty] = useState(false);
  const [facultySearch, setFacultySearch] = useState('');
  const [guideFilter, setGuideFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [error, setError] = useState(null);

  // Fetch faculty members for HOD
  useEffect(() => {
    const fetchFaculty = async () => {
      if (!user) return;
      
      setLoadingFaculty(true);
      setError(null);
      
      try {
        // First try with the direct API call - this ensures fresh data
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const headers = {
          Authorization: `Bearer ${user.token}`
        };
        
        try {
          // First try the regular faculty endpoint with fresh data (no cache)
          const response = await axios.get(`${API_URL}/users/faculty`, { 
            headers,
            params: { 
              timestamp: Date.now(), // This forces a fresh request
              department: user.department // Filter by department if needed
            }
          });
          
          // Process faculty data to ensure guide status is accurate
          const processedFaculty = response.data.map(faculty => {
            // Make sure assignedStudents is always an array
            const assignedStudents = Array.isArray(faculty.assignedStudents) 
              ? faculty.assignedStudents 
              : [];
              
            return {
              ...faculty,
              assignedStudents,
              studentsCount: assignedStudents.length
            };
          });
          
          setFacultyMembers(processedFaculty);
        } catch (firstError) {
          console.log('Regular API call failed, trying HOD-specific endpoint');
          // If that fails, try the HOD-specific endpoint
          const fallbackResponse = await axios.get(`${API_URL}/users/hod-faculty`, { 
            headers,
            params: { 
              timestamp: Date.now(), // This forces a fresh request
              department: user.department
            }
          });
          
          // Process faculty data
          const processedFaculty = fallbackResponse.data.map(faculty => {
            const assignedStudents = Array.isArray(faculty.assignedStudents) 
              ? faculty.assignedStudents 
              : [];
              
            return {
              ...faculty,
              assignedStudents,
              studentsCount: assignedStudents.length
            };
          });
          
          setFacultyMembers(processedFaculty);
        }
      } catch (error) {
        console.error('Error fetching faculty:', error);
        setError('Failed to load faculty members. You may not have the necessary permissions.');
        toast.error('Failed to load faculty members');
        
        // Try the service method as a last resort
        try {
          const faculty = await hodService.getAllFaculty(user.token, true); // Force refresh
          
          const processedFaculty = faculty.map(f => ({
            ...f,
            assignedStudents: Array.isArray(f.assignedStudents) ? f.assignedStudents : [],
            studentsCount: Array.isArray(f.assignedStudents) ? f.assignedStudents.length : 0
          }));
          
          setFacultyMembers(processedFaculty);
        } catch (serviceError) {
          console.warn('Fallback to service also failed:', serviceError);
        }
      } finally {
        setLoadingFaculty(false);
      }
    };

    // Initial fetch when component mounts
    fetchFaculty();
    
    // Set up auto-refresh mechanisms
    
    // 1. Refresh when page becomes visible again (user returns from another tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, refreshing faculty data');
        fetchFaculty();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 2. Set up a polling interval when the component is visible
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('Auto-refresh: fetching latest faculty data');
        fetchFaculty();
      }
    }, 30000); // Refresh every 30 seconds when page is visible
    
    // Clean up event listeners and intervals
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, [user]);

  // Filter faculty members based on search and guide status
  const filteredFaculty = facultyMembers.filter(faculty => {
    // Filter by search term
    const matchesSearch = 
      faculty.fullName?.toLowerCase().includes(facultySearch.toLowerCase()) ||
      faculty.email?.toLowerCase().includes(facultySearch.toLowerCase()) ||
      (faculty.branch || faculty.department || '')?.toLowerCase().includes(facultySearch.toLowerCase());
    
    // Filter by guide status
    const isGuide = Array.isArray(faculty.assignedStudents) && faculty.assignedStudents.length > 0;
    const matchesGuideFilter = 
      guideFilter === 'all' || 
      (guideFilter === 'guides' && isGuide) || 
      (guideFilter === 'not-assigned' && !isGuide);
    
    return matchesSearch && matchesGuideFilter;
  });

  // Sort filtered faculty
  const sortedFaculty = [...filteredFaculty].sort((a, b) => {
    let compareA, compareB;
    
    // Determine which property to sort by
    switch (sortBy) {
      case 'name':
        compareA = a.fullName?.toLowerCase() || '';
        compareB = b.fullName?.toLowerCase() || '';
        break;
      case 'email':
        compareA = a.email?.toLowerCase() || '';
        compareB = b.email?.toLowerCase() || '';
        break;
      case 'department':
        compareA = (a.branch || a.department || '')?.toLowerCase() || '';
        compareB = (b.branch || b.department || '')?.toLowerCase() || '';
        break;
      case 'students':
        compareA = Array.isArray(a.assignedStudents) ? a.assignedStudents.length : 0;
        compareB = Array.isArray(b.assignedStudents) ? b.assignedStudents.length : 0;
        break;
      default:
        compareA = a.fullName?.toLowerCase() || '';
        compareB = b.fullName?.toLowerCase() || '';
    }
    
    // Apply sort order
    if (sortOrder === 'asc') {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });

  // Handle sort toggle
  const handleSort = (field) => {
    if (sortBy === field) {
      // Toggle the sort order if the same field is clicked
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-full bg-gray-100">
      <main className="flex-1">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <h1 className="text-2xl font-semibold text-gray-900">
              Faculty Members
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage all faculty members in the system regardless of department
            </p>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
            {/* Search and filters */}
            <div className="bg-white shadow rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search Faculty
                  </label>
                  <input
                    type="text"
                    id="search"
                    placeholder="Search by name, email, or department..."
                    value={facultySearch}
                    onChange={(e) => setFacultySearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter by Status
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setGuideFilter('all')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        guideFilter === 'all' 
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setGuideFilter('guides')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        guideFilter === 'guides' 
                          ? 'bg-green-100 text-green-800 border border-green-300' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Guides
                    </button>
                    <button
                      onClick={() => setGuideFilter('not-assigned')}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${
                        guideFilter === 'not-assigned' 
                          ? 'bg-gray-200 text-gray-800 border border-gray-400' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      Not Assigned
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Faculty members table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              {loadingFaculty ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
                  <p className="mt-1 text-sm text-red-500">{error}</p>
                </div>
              ) : sortedFaculty.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center">
                            <span>Name</span>
                            {sortBy === 'name' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-4 w-4 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center">
                            <span>Email</span>
                            {sortBy === 'email' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-4 w-4 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('department')}
                        >
                          <div className="flex items-center">
                            <span>Department</span>
                            {sortBy === 'department' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-4 w-4 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                        <th 
                          scope="col" 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                          onClick={() => handleSort('students')}
                        >
                          <div className="flex items-center">
                            <span>Status</span>
                            {sortBy === 'students' && (
                              <svg xmlns="http://www.w3.org/2000/svg" className={`ml-1 h-4 w-4 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedFaculty.map((faculty) => (
                        <tr key={faculty._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{faculty.fullName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{faculty.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{faculty.branch || faculty.department || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {Array.isArray(faculty.assignedStudents) && faculty.assignedStudents.length > 0 ? (
                              <div className="flex items-center">
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2">
                                  Guide
                                </span>
                                <span className="text-sm text-gray-500">
                                  {faculty.assignedStudents.length} Student{faculty.assignedStudents.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            ) : (
                              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                                Not Assigned
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No faculty members found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {facultySearch || guideFilter !== 'all' 
                      ? 'Try adjusting your search or filter' 
                      : 'Faculty members will appear here when added'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Summary card at the bottom */}
            {facultyMembers.length > 0 && (
              <div className="mt-6 bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Faculty Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-indigo-800 mb-1">Total Faculty Members</div>
                    <div className="text-2xl font-semibold text-indigo-900">{facultyMembers.length}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-800 mb-1">Assigned as Guides</div>
                    <div className="text-2xl font-semibold text-green-900">
                      {facultyMembers.filter(f => Array.isArray(f.assignedStudents) && f.assignedStudents.length > 0).length}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-800 mb-1">Not Assigned</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {facultyMembers.filter(f => !Array.isArray(f.assignedStudents) || f.assignedStudents.length === 0).length}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Faculty; 