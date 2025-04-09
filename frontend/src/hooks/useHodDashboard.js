import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import hodService from '../services/hodService';
import { toast } from 'react-toastify';

const useHodDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [faculty, setFaculty] = useState([]);
  const [students, setStudents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalFaculty: 0,
    activeProjects: 0,
    completedProjects: 0,
    pendingProjects: 0,
    rejectedProjects: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    projects: { page: 1, limit: 10, total: 0 },
    students: { page: 1, limit: 10, total: 0 },
    faculty: { page: 1, limit: 10, total: 0 }
  });
  const [studentDetails, setStudentDetails] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Get paged data for tables
  const getPagedData = useCallback((data, pageInfo) => {
    const { page, limit } = pageInfo;
    const startIndex = (page - 1) * limit;
    return data.slice(startIndex, startIndex + limit);
  }, []);
  
  // Memoized derived data
  const pendingProjects = useMemo(() => 
    projects.filter(p => p.status === 'pending'), 
    [projects]
  );
  
  const departmentFaculty = useMemo(() => 
    faculty.filter(f => f.specialization === user?.department),
    [faculty, user?.department]
  );
  
  const pagedData = useMemo(() => ({
    projects: getPagedData(projects, pagination.projects),
    students: getPagedData(students, pagination.students),
    faculty: getPagedData(faculty, pagination.faculty),
    pendingProjects: getPagedData(pendingProjects, pagination.projects)
  }), [projects, students, faculty, pendingProjects, pagination, getPagedData]);
  
  // Handle pagination changes
  const handlePageChange = useCallback((dataType, newPage) => {
    setPagination(prev => ({
      ...prev,
      [dataType]: { ...prev[dataType], page: newPage }
    }));
  }, []);

  // Stable references for user token and department
  const userToken = useMemo(() => user?.token, [user?.token]);
  const userDepartment = useMemo(() => user?.department, [user?.department]);
  
  // Fetch dashboard data with optional type selection - optimized with stable references
  const fetchDashboardData = useCallback(async (refreshType = 'all') => {
    if (!userToken) {
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Don't show toasts for background refreshes
      const shouldShowToasts = true;
      if (shouldShowToasts) {
        if (refreshType === 'all') {
          toast.info('Refreshing all dashboard data...');
        } else {
          toast.info(`Refreshing ${refreshType} data...`);
        }
      }
      
      // Clear appropriate cache based on refresh type
      if (refreshType === 'all') {
        hodService.clearCache();
      } else {
        if (refreshType.includes('faculty')) hodService.clearFacultyCache();
        if (refreshType.includes('projects')) hodService.clearProjectsCache();
        if (refreshType.includes('students')) hodService.clearStudentsCache();
      }
      
      let facultyData, studentsData, projectsData, statsData;
      
      if (refreshType === 'all') {
        // Fetch all data in one call for efficiency
        const dashboardData = await hodService.getDashboardData(userToken, userDepartment);
        facultyData = dashboardData.faculty;
        studentsData = dashboardData.students;
        projectsData = dashboardData.projects;
        statsData = dashboardData.stats;
      } else {
        // Fetch only the data that needs refreshing
        const fetchPromises = [];
        
        if (refreshType.includes('faculty')) {
          fetchPromises.push(hodService.getAllFaculty(userToken, true));
        } else {
          fetchPromises.push(Promise.resolve(faculty));
        }
        
        if (refreshType.includes('students')) {
          fetchPromises.push(hodService.getDepartmentStudents(userToken, userDepartment, true));
        } else {
          fetchPromises.push(Promise.resolve(students));
        }
        
        if (refreshType.includes('projects')) {
          fetchPromises.push(hodService.getDepartmentProjects(userToken, true));
        } else {
          fetchPromises.push(Promise.resolve(projects));
        }
        
        [facultyData, studentsData, projectsData] = await Promise.all(fetchPromises);
        
        // Recalculate stats if needed
        if (refreshType.includes('projects') || refreshType.includes('students') || refreshType.includes('faculty')) {
          statsData = {
            totalStudents: studentsData.length,
            totalFaculty: facultyData.filter(f => f.branch === userDepartment).length,
            activeProjects: projectsData.filter(p => p.status === 'approved' && p.status !== 'completed').length,
            completedProjects: projectsData.filter(p => p.status === 'completed').length,
            pendingProjects: projectsData.filter(p => p.status === 'pending').length,
            rejectedProjects: projectsData.filter(p => p.status === 'rejected').length
          };
        } else {
          statsData = stats;
        }
      }
      
      // Map faculty data
      const mappedFaculty = facultyData.map(f => ({
        id: f._id,
        name: f.fullName,
        specialization: f.branch || 'Not specified',
        branch: f.branch || 'Not specified',
        studentsCount: f.assignedStudents?.length || 0,
        projectsCount: f.assignedStudents?.length || 0,
        email: f.email,
        role: f.role
      }));
      
      // Map student data
      const mappedStudents = studentsData.map(s => ({
        id: s._id,
        name: s.fullName,
        rollNo: s.email.split('@')[0],
        faculty: s.assignedGuide ? 'Assigned' : 'Not Assigned',
        project: 'Pending',
        progress: 0,
        email: s.email,
        assignedGuide: s.assignedGuide
      }));
      
      // Map project data
      const mappedProjects = projectsData.map(p => ({
        id: p._id,
        _id: p._id,
        title: p.title,
        student: p.student?.fullName || 'Unassigned',
        studentId: p.student?._id,
        studentEmail: p.student?.email,
        faculty: p.guide?.fullName || 'Not Assigned',
        facultyId: p.guide?._id,
        progress: p.progress || 0,
        status: p.status,
        description: p.description,
        problemStatement: p.problemStatement,
        technologies: p.technologies,
        comments: p.comments,
        createdAt: p.createdAt,
        department: p.department
      }));
      
      // Update student projects and progress
      const updatedStudents = mappedStudents.map(student => {
        const studentProject = mappedProjects.find(p => p.studentId === student.id);
        if (studentProject) {
          return {
            ...student,
            project: studentProject.title,
            progress: studentProject.progress,
            projectId: studentProject.id,
            projectStatus: studentProject.status
          };
        }
        return student;
      });
      
      // Update state with new data - only if data has changed
      if (JSON.stringify(mappedFaculty) !== JSON.stringify(faculty)) {
        setFaculty(mappedFaculty);
      }
      
      if (JSON.stringify(mappedProjects) !== JSON.stringify(projects)) {
        setProjects(mappedProjects);
      }
      
      if (JSON.stringify(updatedStudents) !== JSON.stringify(students)) {
        setStudents(updatedStudents);
      }
      
      if (JSON.stringify(statsData) !== JSON.stringify(stats)) {
        setStats(statsData);
      }
      
      // Update pagination totals
      setPagination(prev => ({
        projects: { ...prev.projects, total: mappedProjects.length },
        students: { ...prev.students, total: updatedStudents.length },
        faculty: { ...prev.faculty, total: mappedFaculty.length }
      }));
      
      setIsLoading(false);
      
      if (shouldShowToasts) {
        if (refreshType === 'all') {
          toast.success('All dashboard data refreshed successfully');
        } else {
          toast.success(`${refreshType.charAt(0).toUpperCase() + refreshType.slice(1)} data refreshed`);
        }
      }
      
      return {
        faculty: mappedFaculty,
        students: updatedStudents,
        projects: mappedProjects,
        stats: statsData
      };
    } catch (err) {
      setError('Failed to fetch dashboard data: ' + err.message);
      setIsLoading(false);
      toast.error('Failed to refresh dashboard data');
      return null;
    }
  }, [userToken, userDepartment, faculty, students, projects, stats]);
  
  // Handle assigning a guide to a student
  const handleAssignGuide = useCallback(async (studentId, guideId) => {
    try {
      setIsLoading(true);
      await hodService.assignGuideToStudent(userToken, studentId, guideId);
      toast.success('Guide assigned successfully');
      
      // Refresh only the data we need
      await fetchDashboardData('students,faculty');
      
      return true;
    } catch (error) {
      toast.error('Failed to assign guide: ' + error.message);
      setIsLoading(false);
      return false;
    }
  }, [userToken, fetchDashboardData]);
  
  // Handle assigning a guide to a project
  const handleAssignGuideToProject = useCallback(async (projectId, guideId) => {
    try {
      setIsLoading(true);
      await hodService.assignGuideToProject(userToken, projectId, guideId);
      toast.success('Guide assigned to project successfully');
      
      // Refresh only the projects data
      await fetchDashboardData('projects');
      
      return true;
    } catch (error) {
      toast.error('Failed to assign guide to project: ' + error.message);
      setIsLoading(false);
      return false;
    }
  }, [userToken, fetchDashboardData]);
  
  // Handle updating project status
  const handleUpdateProjectStatus = useCallback(async (projectId, status, feedback) => {
    try {
      setIsLoading(true);
      await hodService.updateProjectStatus(userToken, projectId, status, feedback);
      
      const statusMessage = status === 'approved' ? 'approved' : 'rejected';
      toast.success(`Project ${statusMessage} successfully`);
      
      // Refresh only the projects data
      await fetchDashboardData('projects');
      
      return true;
    } catch (error) {
      toast.error(`Failed to ${status} project: ` + error.message);
      setIsLoading(false);
      return false;
    }
  }, [userToken, fetchDashboardData]);
  
  // Handle assigning a guide to a project and approving it
  const approveProjectWithGuide = useCallback(async (projectId, guideId) => {
    try {
      setIsLoading(true);
      
      // First, assign the guide to both project and student
      await hodService.assignGuideToProjectAndStudent(userToken, projectId, guideId);
      
      // Then, approve the project
      await hodService.updateProjectStatus(userToken, projectId, 'approved');
      
      toast.success('Project approved and guide assigned successfully');
      
      // Refresh the data
      await fetchDashboardData('all');
      
      return true;
    } catch (error) {
      toast.error('Failed to approve project and assign guide: ' + error.message);
      setIsLoading(false);
      return false;
    }
  }, [userToken, fetchDashboardData]);
  
  // Verify authentication and connection
  const verifyAuthentication = useCallback(async () => {
    try {
      if (!userToken) {
        return { isAuthenticated: false, error: 'No user token found' };
      }
      
      const authStatus = await hodService.verifyAuthentication(userToken);
      return authStatus;
    } catch (error) {
      return { isAuthenticated: false, error: error.message };
    }
  }, [userToken]);
  
  // Update the fetchStudentDetails function
  const fetchStudentDetails = async (studentId) => {
    try {
      console.log('Fetching student details for ID:', studentId);
      const response = await hodService.getStudentDetails(studentId);
      console.log('Received student details:', response);
      
      if (!response) {
        throw new Error('No student details received');
      }
      
      // Format the student details to match the expected structure
      const formattedStudentDetails = {
        fullName: response.fullName,
        rollNo: response.rollNo || 'N/A',
        email: response.email,
        department: response.branch || response.department,
        year: response.year || 'N/A',
        semester: response.semester || 'N/A',
        contactNumber: response.contactNumber || 'N/A',
        address: response.address || 'N/A',
        assignedGuide: response.assignedGuide
      };
      
      setStudentDetails(formattedStudentDetails);
    } catch (error) {
      console.error('Error fetching student details:', error);
      toast.error('Failed to fetch student details');
    }
  };
  
  // Update the handleViewProjectDetails function
  const handleViewProjectDetails = async (projectId) => {
    try {
      console.log('Viewing project details for ID:', projectId);
      const project = projects.find(p => p._id === projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      
      console.log('Found project:', project);
      setSelectedProject(project);
      setIsModalOpen(true);
      
      // Clear previous student details
      setStudentDetails(null);
      
      // Fetch student details using the studentId from the project
      if (project.studentId) {
        console.log('Fetching student details for student ID:', project.studentId);
        await fetchStudentDetails(project.studentId);
      } else {
        console.error('No student ID found in project:', project);
      }
    } catch (error) {
      console.error('Error viewing project details:', error);
      toast.error('Failed to view project details');
    }
  };
  
  // Return all the data and functions needed by the dashboard
  return {
    // State
    faculty,
    students,
    projects,
    stats,
    isLoading,
    error,
    pendingProjects,
    departmentFaculty,
    pagination,
    pagedData,
    studentDetails,
    selectedProject,
    isModalOpen,
    
    // Functions
    fetchDashboardData,
    handleAssignGuide,
    handleAssignGuideToProject,
    handleUpdateProjectStatus,
    approveProjectWithGuide,
    handlePageChange,
    verifyAuthentication,
    getPagedData,
    fetchStudentDetails,
    handleViewProjectDetails,
    setIsModalOpen: (value) => setIsModalOpen(value),
    setSelectedProject: (value) => setSelectedProject(value)
  };
};

export default useHodDashboard; 