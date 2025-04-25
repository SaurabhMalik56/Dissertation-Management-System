import { useState, useEffect, useRef, Component, createRef } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import adminService from '../../services/adminService';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCalendarCheck } from 'react-icons/fa';
import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';

// Create a class component for the SearchBar to have more direct control over input focus
class SearchBarComponent extends Component {
  constructor(props) {
    super(props);
    this.inputRef = createRef();
  }

  componentDidUpdate(prevProps) {
    // Force focus the input field regardless of state changes
    if (this.inputRef.current) {
      this.inputRef.current.focus();
    }
  }

  render() {
    const { placeholder, value, onChange } = this.props;
    
    return (
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
          </svg>
        </div>
        <input 
          ref={this.inputRef}
          type="text" 
          className="block w-full p-2.5 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all duration-200 hover:border-indigo-300"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
        {value && (
          <button
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-indigo-600"
            onClick={() => {
              onChange('');
              if (this.inputRef.current) {
                this.inputRef.current.focus();
              }
            }}
            type="button"
          >
            <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
}

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [students, setStudents] = useState([]);
  const [hods, setHods] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [hodSearch, setHodSearch] = useState('');
  const [facultySearch, setFacultySearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalFaculty: 0,
    totalHods: 0,
    totalDepartments: 0,
    totalProjects: 0
  });
  const [systemLoad, setSystemLoad] = useState({
    cpu: 32,
    memory: 45,
    storage: 68,
    network: 25
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingHods, setIsLoadingHods] = useState(false);
  const [isLoadingFaculty, setIsLoadingFaculty] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [error, setError] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false);
  const [meetingSearch, setMeetingSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [isLoadingMeetingDetails, setIsLoadingMeetingDetails] = useState(false);
  const [viewingMeetingDetails, setViewingMeetingDetails] = useState(false);

  useEffect(() => {
    if (user && user.token) {
      fetchData();
    }
  }, [user]);

  // Set active tab based on URL query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['users', 'departments', 'reports', 'settings', 'meetings'].includes(tabParam)) {
      setActiveTab(tabParam);
      
      // Load data based on the tab from URL parameters
      if (tabParam === 'users' && students.length === 0 && !isLoadingStudents) {
        fetchStudents();
      } else if (tabParam === 'departments' && hods.length === 0 && !isLoadingHods) {
        fetchHods();
      } else if (tabParam === 'reports' && faculty.length === 0 && !isLoadingFaculty) {
        fetchFaculty();
      } else if (tabParam === 'settings' && projects.length === 0 && !isLoadingProjects) {
        fetchProjects();
      } else if (tabParam === 'meetings' && meetings.length === 0 && !isLoadingMeetings) {
        fetchMeetings();
      }
    }
  }, [location, students.length, hods.length, faculty.length, projects.length, meetings.length, isLoadingStudents, isLoadingHods, isLoadingFaculty, isLoadingProjects, isLoadingMeetings]);

  // When tab changes, update the URL and make sure data is loaded
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/admin?tab=${tab}`, { replace: true });
    
    // Load data if needed - we'll rely on the useEffect above to load data
  };

    const fetchData = async () => {
      try {
        setIsLoading(true);
      setError(null);
      
      // Fetch initial data including projects for accurate stats display
      await Promise.all([
        fetchStudents(),
        fetchSystemStats(),
        fetchProjects() // Added to ensure project count is accurate from the start
      ]);
          
          setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        setIsLoading(false);
      toast.error('Failed to load dashboard data. Please try again later.');
    }
  };

  const fetchStudents = async () => {
    if (!user || !user.token) return;
    
    try {
      setIsLoadingStudents(true);
      setError(null);
      
      const studentsResponse = await adminService.getAllStudents(user.token);
      setStudents(studentsResponse.data);
      
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load student data. Please try again.');
      toast.error('Unable to fetch students from database');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchSystemStats = async () => {
    if (!user || !user.token) return;
    
    try {
      const statsResponse = await adminService.getSystemStats(user.token);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      toast.error('Failed to load system statistics');
    }
  };

  const fetchHods = async () => {
    if (!user || !user.token) return;
    
    try {
      setIsLoadingHods(true);
      setError(null);
      
      const response = await adminService.getAllHods(user.token);
      setHods(response.data);
      
    } catch (error) {
      console.error('Error fetching HODs:', error);
      setError('Failed to load HOD data. Please try again.');
      toast.error('Unable to fetch HODs from database');
    } finally {
      setIsLoadingHods(false);
    }
  };

  const fetchFaculty = async () => {
    if (!user || !user.token) return;
    
    try {
      setIsLoadingFaculty(true);
      setError(null);
      
      const response = await adminService.getAllFaculty(user.token);
      setFaculty(response.data);
      
    } catch (error) {
      console.error('Error fetching faculty:', error);
      setError('Failed to load faculty data. Please try again.');
      toast.error('Unable to fetch faculty from database');
    } finally {
      setIsLoadingFaculty(false);
    }
  };

  const fetchProjects = async () => {
    if (!user || !user.token) return;
    
    try {
      setIsLoadingProjects(true);
      setError(null);
      
      const response = await adminService.getAllProjects(user.token);
      setProjects(response.data);
      
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load project data. Please try again.');
      toast.error('Unable to fetch projects from database');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const fetchMeetings = async () => {
    if (!user || !user.token) return;
    try {
      setIsLoadingMeetings(true);
      setError(null);
      const response = await adminService.getAllMeetings(user.token);
      if (response.success) {
        setMeetings(response.data);
      } else {
        setError('Failed to fetch meetings data');
      }
    } catch (err) {
      console.error('Error fetching meetings:', err);
      setError('Failed to load meeting data. Please try again.');
      toast.error('Unable to fetch meetings');
    } finally {
      setIsLoadingMeetings(false);
    }
  };

  const fetchMeetingDetails = async (studentId) => {
    if (!user || !user.token || !studentId) return;
    
    try {
      setIsLoadingMeetingDetails(true);
      setError(null);
      const response = await adminService.getMeetingDetails(user.token, studentId);
      
      if (response.success) {
        setMeetingDetails(response.data);
        setViewingMeetingDetails(true);
      } else {
        setError('Failed to fetch meeting details');
        toast.error('Failed to load meeting details');
      }
    } catch (err) {
      console.error('Error fetching meeting details:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error occurred';
      setError(`Failed to load meeting details: ${errorMessage}`);
      toast.error(`Unable to fetch meeting details: ${errorMessage}`);
    } finally {
      setIsLoadingMeetingDetails(false);
    }
  };

  const handleViewMeetingDetails = (studentId) => {
    setSelectedStudentId(studentId);
    fetchMeetingDetails(studentId);
  };

  const handleCloseMeetingDetails = () => {
    setViewingMeetingDetails(false);
    setMeetingDetails(null);
    setSelectedStudentId(null);
  };

  const handleAddStudent = async () => {
    // This would typically open a modal with a form
    toast.info('Add student functionality requires a form implementation');
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await adminService.deleteStudent(user.token, studentId);
        toast.success('Student deleted successfully');
        // Update local state to remove deleted student
        setStudents(students.filter(student => student.id !== studentId));
      } catch (error) {
        console.error('Error deleting student:', error);
        toast.error('Failed to delete student');
      }
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'student':
        return 'badge-primary';
      case 'faculty':
        return 'badge-success';
      case 'hod':
        return 'badge-warning';
      case 'admin':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getStatusIndicatorClass = (status) => {
    return status === 'active' ? 'bg-green-500' : 'bg-red-500';
  };

  const getProgressColorClass = (progress) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Filter functions for search
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(studentSearch.toLowerCase()) || 
    student.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
    (student.guideName && student.guideName.toLowerCase().includes(studentSearch.toLowerCase()))
  );

  const filteredHods = hods.filter(hod => 
    hod.name.toLowerCase().includes(hodSearch.toLowerCase()) || 
    hod.email.toLowerCase().includes(hodSearch.toLowerCase()) ||
    hod.department.toLowerCase().includes(hodSearch.toLowerCase())
  );

  const filteredFaculty = faculty.filter(member => 
    member.name.toLowerCase().includes(facultySearch.toLowerCase()) || 
    member.email.toLowerCase().includes(facultySearch.toLowerCase())
  );

  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(projectSearch.toLowerCase()) || 
    project.studentName.toLowerCase().includes(projectSearch.toLowerCase()) ||
    project.hodAssigned.toLowerCase().includes(projectSearch.toLowerCase()) ||
    project.guide.toLowerCase().includes(projectSearch.toLowerCase()) ||
    project.status.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(meetingSearch.toLowerCase()) ||
    meeting.studentName.toLowerCase().includes(meetingSearch.toLowerCase()) ||
    meeting.guideName.toLowerCase().includes(meetingSearch.toLowerCase()) ||
    meeting.department.toLowerCase().includes(meetingSearch.toLowerCase()) ||
    meeting.status.toLowerCase().includes(meetingSearch.toLowerCase())
  );

  // Replace the functional SearchBar component with the class component
  const SearchBar = SearchBarComponent;

  return (
    <div className="space-y-6">
      {/* Welcome section with stats */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">System Administration</h1>
              <p className="text-gray-600 mt-1">Welcome, {user?.fullName} - Manage all aspects of Disserto platform.</p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="badge badge-danger">Administrator</span>
            </div>
          </div>
          
          {/* Enhanced Stats grid with improved animations and UI */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-6">
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">User Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Total Users Card with hover effect and animation */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-indigo-700 uppercase font-semibold tracking-wider">Total Users</p>
                      <p className="text-2xl font-bold text-indigo-700 mt-1">{stats.totalUsers}</p>
                </div>
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
            </div>
                  </div>
                  <div className="mt-2 text-xs text-indigo-600">All platform accounts</div>
            </div>
            
                {/* Students Card */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs text-blue-700 uppercase font-semibold tracking-wider">Students</p>
                      <p className="text-2xl font-bold text-blue-700 mt-1">{stats.totalStudents}</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                      </svg>
                  </div>
                  </div>
                  <div className="mt-2 text-xs text-blue-600">Enrolled students</div>
                </div>
                
                {/* Faculty Card */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs text-green-700 uppercase font-semibold tracking-wider">Faculty</p>
                      <p className="text-2xl font-bold text-green-700 mt-1">{stats.totalFaculty}</p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                  </div>
                  </div>
                  <div className="mt-2 text-xs text-green-600">Teaching staff</div>
                </div>
                
                {/* HODs Card */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs text-yellow-700 uppercase font-semibold tracking-wider">HODs</p>
                      <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.totalHods}</p>
                    </div>
                    <div className="bg-yellow-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                  </div>
                  </div>
                  <div className="mt-2 text-xs text-yellow-600">Department heads</div>
                </div>
                
                {/* Projects Card - Using actual project count from state */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                <div>
                      <p className="text-xs text-purple-700 uppercase font-semibold tracking-wider">Projects</p>
                      <p className="text-2xl font-bold text-purple-700 mt-1">{projects.length}</p>
                    </div>
                    <div className="bg-purple-100 p-2 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                  </div>
                  </div>
                  <div className="mt-2 text-xs text-purple-600">Active dissertations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content tabs */}
      <div className="card">
        <div className="card-header">
          <div className="tab-container">
            <ul className="tab-list">
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'users' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => handleTabChange('users')}
                >
                  Students
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'departments' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => handleTabChange('departments')}
                >
                  HODs
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'reports' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => handleTabChange('reports')}
                >
                  Faculty
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'settings' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => handleTabChange('settings')}
                >
                  Projects
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`tab ${activeTab === 'meetings' ? 'tab-active' : 'tab-inactive'}`}
                  onClick={() => handleTabChange('meetings')}
                >
                  Meetings
                </button>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <>
              {/* Users Tab (now Students) */}
              {activeTab === 'users' && (
                <div>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Student Management</h2>
                    <div className="flex space-x-2">
                      <button
                        className="btn btn-secondary"
                        onClick={fetchStudents}
                        disabled={isLoadingStudents}
                      >
                        {isLoadingStudents ? 'Refreshing...' : 'Refresh List'}
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={handleAddStudent}
                        disabled={isAddingStudent}
                      >
                        {isAddingStudent ? 'Adding...' : 'Add Student'}
                        </button>
                    </div>
                  </div>
                  
                  {/* Search bar for students */}
                  <SearchBar 
                    placeholder="Search students by name, email or guide..." 
                    value={studentSearch} 
                    onChange={setStudentSearch} 
                  />
                  
                  {isLoadingStudents ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      <p className="ml-3 text-indigo-500">Loading students from database...</p>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 p-6 rounded-md">
                      <p className="text-red-800">{error}</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" 
                        onClick={fetchStudents}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="bg-gray-50 p-6 text-center rounded-md">
                      {studentSearch ? (
                        <p className="text-gray-500">No students found matching "{studentSearch}".</p>
                      ) : (
                        <p className="text-gray-500">No students found in the database.</p>
                      )}
                    </div>
                  ) : (
                  <div className="table-container">
                      <table className="w-full border-collapse">
                      <thead>
                        <tr>
                            <th className="text-left py-3 px-6 border-b border-gray-200 w-1/3">Full Name</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 w-1/3">Email Address</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 w-1/3">Assigned Guide</th>
                        </tr>
                      </thead>
                      <tbody>
                          {filteredStudents.map(student => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="py-3 px-6 border-b border-gray-200">{student.name}</td>
                              <td className="py-3 px-6 border-b border-gray-200">{student.email}</td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                {student.guideName ? (
                              <div className="flex items-center">
                                    <span className="w-2 h-2 mr-2 bg-green-500 rounded-full"></span>
                                    <span>{student.guideName}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-gray-500">
                                    <span className="w-2 h-2 mr-2 bg-gray-300 rounded-full"></span>
                                    <span>Not Assigned</span>
                              </div>
                                )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        Showing {filteredStudents.length} of {students.length} students
                        {studentSearch && ` (filtered by "${studentSearch}")`}
                    </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Departments Tab (now HODs) */}
              {activeTab === 'departments' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">HOD Management</h2>
                    <button 
                      className="btn btn-secondary"
                      onClick={fetchHods}
                      disabled={isLoadingHods}
                    >
                      {isLoadingHods ? 'Refreshing...' : 'Refresh List'}
                    </button>
                  </div>
                  
                  {/* Search bar for HODs */}
                  <SearchBar 
                    placeholder="Search HODs by name, email or department..." 
                    value={hodSearch} 
                    onChange={setHodSearch} 
                  />
                  
                  {isLoadingHods ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      <p className="ml-3 text-indigo-500">Loading HODs from database...</p>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 p-6 rounded-md">
                      <p className="text-red-800">{error}</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" 
                        onClick={fetchHods}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : filteredHods.length === 0 ? (
                    <div className="bg-gray-50 p-6 text-center rounded-md">
                      {hodSearch ? (
                        <p className="text-gray-500">No HODs found matching "{hodSearch}".</p>
                      ) : (
                        <p className="text-gray-500">No HODs found in the database.</p>
                      )}
                    </div>
                  ) : (
                  <div className="table-container">
                      <table className="w-full border-collapse">
                      <thead>
                        <tr>
                            <th className="text-left py-3 px-6 border-b border-gray-200 w-1/3">Full Name</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 w-1/3">Email</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 w-1/3">Department</th>
                        </tr>
                      </thead>
                      <tbody>
                          {filteredHods.map(hod => (
                            <tr key={hod.id} className="hover:bg-gray-50">
                              <td className="py-3 px-6 border-b border-gray-200">{hod.name}</td>
                              <td className="py-3 px-6 border-b border-gray-200">{hod.email}</td>
                              <td className="py-3 px-6 border-b border-gray-200">{hod.department}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        Showing {filteredHods.length} of {hods.length} HODs
                        {hodSearch && ` (filtered by "${hodSearch}")`}
                      </div>
                  </div>
                  )}
                </div>
              )}
              
              {/* Reports Tab (now Faculty) */}
              {activeTab === 'reports' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Faculty Management</h2>
                    <button 
                      className="btn btn-secondary"
                      onClick={fetchFaculty}
                      disabled={isLoadingFaculty}
                    >
                      {isLoadingFaculty ? 'Refreshing...' : 'Refresh List'}
                    </button>
                  </div>
                  
                  {/* Search bar for faculty */}
                  <SearchBar 
                    placeholder="Search faculty by name or email..." 
                    value={facultySearch} 
                    onChange={setFacultySearch} 
                  />
                  
                  {isLoadingFaculty ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                      <p className="ml-3 text-indigo-500">Loading faculty from database...</p>
                      </div>
                  ) : error ? (
                    <div className="bg-red-50 p-6 rounded-md">
                      <p className="text-red-800">{error}</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" 
                        onClick={fetchFaculty}
                      >
                        Try Again
                      </button>
                              </div>
                  ) : filteredFaculty.length === 0 ? (
                    <div className="bg-gray-50 p-6 text-center rounded-md">
                      {facultySearch ? (
                        <p className="text-gray-500">No faculty members found matching "{facultySearch}".</p>
                      ) : (
                        <p className="text-gray-500">No faculty members found in the database.</p>
                      )}
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="text-left py-3 px-6 border-b border-gray-200">Full Name</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200">Email</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200">Assigned Students</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFaculty.map((member, index) => (
                            <tr 
                              key={member.id} 
                              className="hover:bg-gray-50 animate-fade-in" 
                              style={{animationDelay: `${index * 0.05}s`}}
                            >
                              <td className="py-3 px-6 border-b border-gray-200">{member.name}</td>
                              <td className="py-3 px-6 border-b border-gray-200">{member.email}</td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                <span className="inline-flex items-center">
                                  <span className={`w-2 h-2 mr-2 rounded-full ${member.assignedStudents > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                  {member.assignedStudents || 0} Students
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        Showing {filteredFaculty.length} of {faculty.length} faculty members
                        {facultySearch && ` (filtered by "${facultySearch}")`}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Settings Tab (now Projects) */}
              {activeTab === 'settings' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Project Management</h2>
                    <button 
                      className="btn btn-secondary"
                      onClick={fetchProjects}
                      disabled={isLoadingProjects}
                    >
                      {isLoadingProjects ? 'Refreshing...' : 'Refresh List'}
                    </button>
                  </div>
                  
                  {/* Search bar for projects */}
                  <SearchBar 
                    placeholder="Search projects by title, student, guide or status..." 
                    value={projectSearch} 
                    onChange={setProjectSearch} 
                  />
                  
                  {isLoadingProjects ? (
                    <div className="flex flex-col justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
                      <p className="mt-4 text-purple-600 font-medium">Loading project data...</p>
                      <p className="text-gray-500 text-sm mt-2">Fetching from database</p>
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 p-6 rounded-md">
                      <p className="text-red-800">{error}</p>
                      <button 
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" 
                        onClick={fetchProjects}
                      >
                        Try Again
                      </button>
                    </div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64 bg-gray-50 p-6 rounded-md m-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {projectSearch ? (
                        <p className="text-gray-500 mt-4 text-center">No projects found matching "{projectSearch}".</p>
                      ) : (
                        <p className="text-gray-500 mt-4 text-center">No projects found in the database.</p>
                      )}
                      <button onClick={fetchProjects} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                      </button>
                        </div>
                  ) : (
                    <div className="table-container overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Title</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Student</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">HOD Assigned</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Guide</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProjects.map((project, index) => (
                            <tr 
                              key={project.id} 
                              className="table-row-hover animate-fade-in" 
                              style={{animationDelay: `${index * 0.05}s`}}
                            >
                              <td className="py-3 px-6 border-b border-gray-200 font-medium">{project.title}</td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                <div className="flex items-center">
                                  <span className={`w-2 h-2 mr-2 rounded-full ${project.studentId ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                  {project.studentName}
                        </div>
                              </td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                                  {project.hodAssigned}
                                </span>
                              </td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                <div className="flex items-center">
                                  <span className={`w-2 h-2 mr-2 rounded-full ${project.guide !== 'Not Assigned' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                  {project.guide}
                        </div>
                              </td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                  ${project.status === 'Approved' ? 'bg-green-100 text-green-800 border border-green-200' : 
                                    project.status === 'Rejected' ? 'bg-red-100 text-red-800 border border-red-200' : 
                                    project.status === 'Completed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                    'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
                                  {project.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        Showing {filteredProjects.length} of {projects.length} projects
                        {projectSearch && ` (filtered by "${projectSearch}")`}
                      </div>
                    </div>
                  )}
                </div>
              )}
                    
              {/* Meetings Tab */}
              {activeTab === 'meetings' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                      <FaCalendarCheck className="inline mr-2" />
                      Student Meeting Management
                    </h2>
                    <button
                      className="btn btn-secondary"
                      onClick={fetchStudents}
                      disabled={isLoadingStudents}
                    >
                      {isLoadingStudents ? 'Refreshing...' : 'Refresh Students'}
                    </button>
                  </div>

                  {/* Search bar for students */}
                  <SearchBar
                    placeholder="Search students by name or email..."
                    value={studentSearch}
                    onChange={setStudentSearch}
                  />

                  {isLoadingStudents ? (
                    <Loader text="Loading student data..." />
                  ) : error ? (
                    <ErrorMessage variant="danger">{error}</ErrorMessage>
                  ) : filteredStudents.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64 bg-gray-50 p-6 rounded-md m-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="text-gray-500 mt-4 text-center">
                        {studentSearch
                          ? `No students found matching "${studentSearch}".`
                          : 'No students found in the database.'}
                      </p>
                    </div>
                  ) : (
                    <div className="table-container overflow-x-auto mb-8">
                      <h3 className="text-lg font-semibold text-gray-700 mb-4">Select a Student to View Meetings</h3>
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Student Name</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Email</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Assigned Guide</th>
                            <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((student) => (
                            <tr 
                              key={`student-${student.id}`} 
                              className="hover:bg-gray-50 cursor-pointer"
                            >
                              <td className="py-3 px-6 border-b border-gray-200">{student.name}</td>
                              <td className="py-3 px-6 border-b border-gray-200">{student.email}</td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                {student.guideName ? (
                                  <div className="flex items-center">
                                    <span className="w-2 h-2 mr-2 bg-green-500 rounded-full"></span>
                                    <span>{student.guideName}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center text-gray-500">
                                    <span className="w-2 h-2 mr-2 bg-gray-300 rounded-full"></span>
                                    <span>Not Assigned</span>
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-6 border-b border-gray-200">
                                <button 
                                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
                                  onClick={() => handleViewMeetingDetails(student.id)}
                                  title="View student meetings"
                                >
                                  <FaCalendarCheck className="inline mr-2" />
                                  View Meetings
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="mt-4 text-sm text-gray-500">
                        Showing {filteredStudents.length} of {students.length} students
                        {studentSearch && ` (filtered by "${studentSearch}")`}
                      </div>
                    </div>
                  )}

                  {/* Meeting details modal/panel when a student is selected */}
                  {viewingMeetingDetails && meetingDetails && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Meetings for {meetingDetails.studentInfo.name}</h3>
                            <button
                              onClick={handleCloseMeetingDetails}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Student and Guide Information */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg border">
                              <h4 className="font-semibold text-gray-700 mb-2">Student Information</h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">Name:</span> {meetingDetails.studentInfo.name}</p>
                                <p><span className="font-medium">Email:</span> {meetingDetails.studentInfo.email}</p>
                                <p><span className="font-medium">Department:</span> {meetingDetails.studentInfo.department}</p>
                                <p><span className="font-medium">Project:</span> {meetingDetails.studentInfo.projectTitle}</p>
                              </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border">
                              <h4 className="font-semibold text-gray-700 mb-2">Guide Information</h4>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">Name:</span> {meetingDetails.guideInfo.name}</p>
                                <p><span className="font-medium">Email:</span> {meetingDetails.guideInfo.email}</p>
                                <p><span className="font-medium">Department:</span> {meetingDetails.guideInfo.department}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Meetings Summary */}
                          <div className="mb-6">
                            <h4 className="font-semibold text-gray-700 mb-2">Meeting Statistics</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                                <p className="text-xs text-blue-700 uppercase font-semibold tracking-wider">Total Meetings</p>
                                <p className="text-2xl font-bold text-blue-700 mt-1">
                                  {meetingDetails.meetings.length}
                                </p>
                              </div>
                              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
                                <p className="text-xs text-green-700 uppercase font-semibold tracking-wider">Completed</p>
                                <p className="text-2xl font-bold text-green-700 mt-1">
                                  {meetingDetails.meetings.filter(m => m.status.toLowerCase() === 'completed').length}
                                </p>
                              </div>
                              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200 shadow-sm">
                                <p className="text-xs text-yellow-700 uppercase font-semibold tracking-wider">Upcoming</p>
                                <p className="text-2xl font-bold text-yellow-700 mt-1">
                                  {meetingDetails.meetings.filter(m => m.status.toLowerCase() === 'scheduled' || m.status.toLowerCase() === 'pending').length}
                                </p>
                              </div>
                              <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200 shadow-sm">
                                <p className="text-xs text-red-700 uppercase font-semibold tracking-wider">Cancelled</p>
                                <p className="text-2xl font-bold text-red-700 mt-1">
                                  {meetingDetails.meetings.filter(m => m.status.toLowerCase() === 'cancelled').length}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Meetings History */}
                          <h4 className="font-semibold text-gray-700 mb-2">Meeting History</h4>
                          {meetingDetails.meetings.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Meeting #</th>
                                    <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Date & Time</th>
                                    <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Title</th>
                                    <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Type</th>
                                    <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Duration</th>
                                    <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Status</th>
                                    <th className="text-left py-3 px-6 border-b border-gray-200 font-semibold text-gray-700">Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {meetingDetails.meetings.map((meeting, index) => (
                                    <tr key={`meeting-${meeting._id}`} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50`}>
                                      <td className="py-3 px-6 border-b border-gray-200">{meeting.meetingNumber}</td>
                                      <td className="py-3 px-6 border-b border-gray-200">
                                        {formatDate(meeting.scheduledDate)}<br/>
                                        <span className="text-xs text-gray-500">{meeting.startTime}</span>
                                      </td>
                                      <td className="py-3 px-6 border-b border-gray-200 font-medium">{meeting.title}</td>
                                      <td className="py-3 px-6 border-b border-gray-200">{meeting.meetingType}</td>
                                      <td className="py-3 px-6 border-b border-gray-200">{meeting.duration}</td>
                                      <td className="py-3 px-6 border-b border-gray-200">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                          ${meeting.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' : 
                                            meeting.status.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' : 
                                            meeting.status.toLowerCase() === 'rescheduled' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                            'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                                          {meeting.status}
                                        </span>
                                      </td>
                                      <td className="py-3 px-6 border-b border-gray-200">
                                        <button 
                                          className="text-indigo-600 hover:text-indigo-900"
                                          onClick={() => {
                                            // Scroll to meeting details section
                                            document.getElementById(`meeting-details-${meeting._id}`)?.scrollIntoView({ behavior: 'smooth' });
                                          }}
                                        >
                                          View Details
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="bg-gray-50 p-6 text-center rounded-md">
                              <p className="text-gray-500">No meetings found for this student.</p>
                            </div>
                          )}
                          
                          {/* Detailed view for each meeting */}
                          {meetingDetails.meetings.length > 0 && (
                            <div className="mt-8 space-y-8">
                              <h4 className="font-semibold text-gray-700 mb-4">Meeting Details</h4>
                              
                              {meetingDetails.meetings.map(meeting => (
                                <div 
                                  key={`meeting-details-${meeting._id}`}
                                  id={`meeting-details-${meeting._id}`}
                                  className="bg-white p-6 rounded-lg border shadow-sm"
                                >
                                  <div className="flex justify-between items-center mb-4">
                                    <h5 className="text-lg font-semibold text-gray-800">
                                      Meeting #{meeting.meetingNumber}: {meeting.title}
                                    </h5>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
                                      ${meeting.status.toLowerCase() === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' : 
                                        meeting.status.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' : 
                                        meeting.status.toLowerCase() === 'rescheduled' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                        'bg-blue-100 text-blue-800 border border-blue-200'}`}>
                                      {meeting.status}
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm text-gray-500">Meeting ID</p>
                                          <p className="font-medium">{meeting._id}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Meeting Type</p>
                                          <p className="font-medium">{meeting.meetingType}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Scheduled Date</p>
                                          <p className="font-medium">{formatDate(meeting.scheduledDate)}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Time</p>
                                          <p className="font-medium">{meeting.startTime}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Duration</p>
                                          <p className="font-medium">{meeting.duration}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Location</p>
                                          <p className="font-medium">{meeting.location}</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <p className="text-sm text-gray-500">Student ID</p>
                                          <p className="font-medium">{typeof meeting.studentId === 'object' ? meeting.studentId._id : meeting.studentId}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Faculty ID</p>
                                          <p className="font-medium">{typeof meeting.facultyId === 'object' ? meeting.facultyId._id : meeting.facultyId}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Project ID</p>
                                          <p className="font-medium">{typeof meeting.projectId === 'object' ? meeting.projectId._id : meeting.projectId}</p>
                                        </div>
                                        {meeting.studentPoints !== null && (
                                          <div>
                                            <p className="text-sm text-gray-500">Student Points</p>
                                            <p className="font-medium">{meeting.studentPoints} / 10</p>
                                          </div>
                                        )}
                                        <div>
                                          <p className="text-sm text-gray-500">Created At</p>
                                          <p className="font-medium">{formatDate(meeting.createdAt)}</p>
                                        </div>
                                        <div>
                                          <p className="text-sm text-gray-500">Updated At</p>
                                          <p className="font-medium">{formatDate(meeting.updatedAt)}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-4 space-y-4">
                                    <div>
                                      <h6 className="text-sm font-semibold text-gray-700 mb-2">Agenda</h6>
                                      <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{meeting.agenda}</p>
                                    </div>
                                    
                                    {meeting.meetingSummary && (
                                      <div>
                                        <h6 className="text-sm font-semibold text-gray-700 mb-2">Meeting Summary</h6>
                                        <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{meeting.meetingSummary}</p>
                                      </div>
                                    )}
                                    
                                    {meeting.guideRemarks && (
                                      <div>
                                        <h6 className="text-sm font-semibold text-gray-700 mb-2">Guide Remarks</h6>
                                        <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{meeting.guideRemarks}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end">
                          <button
                            onClick={handleCloseMeetingDetails}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Loading indicator for meeting details */}
                  {isLoadingMeetingDetails && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                      <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
                        <p className="mt-4 text-indigo-600 font-medium">Loading student meeting details...</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 