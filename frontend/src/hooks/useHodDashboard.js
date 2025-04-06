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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    projects: { page: 1, limit: 10, total: 0 },
    students: { page: 1, limit: 10, total: 0 },
    faculty: { page: 1, limit: 10, total: 0 }
  });
  
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
  
  // Fetch dashboard data with optional type selection
  const fetchDashboardData = useCallback(async (refreshType = 'all') => {
    try {
      setIsLoading(true);
      if (refreshType === 'all') {
        toast.info('Refreshing all dashboard data...');
      } else {
        toast.info(`Refreshing ${refreshType} data...`);
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
        const dashboardData = await hodService.getDashboardData(user.token, user.department);
        facultyData = dashboardData.faculty;
        studentsData = dashboardData.students;
        projectsData = dashboardData.projects;
        statsData = dashboardData.stats;
      } else {
        // Fetch only the data that needs refreshing
        const fetchPromises = [];
        
        if (refreshType.includes('faculty')) {
          fetchPromises.push(hodService.getAllFaculty(user.token, true));
        } else {
          fetchPromises.push(Promise.resolve(faculty));
        }
        
        if (refreshType.includes('students')) {
          fetchPromises.push(hodService.getDepartmentStudents(user.token, user.department, true));
        } else {
          fetchPromises.push(Promise.resolve(students));
        }
        
        if (refreshType.includes('projects')) {
          fetchPromises.push(hodService.getDepartmentProjects(user.token, true));
        } else {
          fetchPromises.push(Promise.resolve(projects));
        }
        
        [facultyData, studentsData, projectsData] = await Promise.all(fetchPromises);
        
        // Recalculate stats if needed
        if (refreshType.includes('projects') || refreshType.includes('students') || refreshType.includes('faculty')) {
          statsData = {
            totalStudents: studentsData.length,
            totalFaculty: facultyData.filter(f => f.branch === user.department).length,
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
        studentsCount: f.assignedStudents?.length || 0,
        projectsCount: f.assignedStudents?.length || 0,
        email: f.email
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
        title: p.title,
        student: p.student?.fullName || 'Unassigned',
        studentId: p.student?._id,
        faculty: p.guide?.fullName || 'Not Assigned',
        facultyId: p.guide?._id,
        progress: p.progress || 0,
        status: p.status,
        description: p.description,
        problemStatement: p.problemStatement,
        technologies: p.technologies,
        comments: p.comments,
        createdAt: p.createdAt
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
      
      // Update state with new data
      setFaculty(mappedFaculty);
      setProjects(mappedProjects);
      setStudents(updatedStudents);
      setStats(statsData);
      
      // Update pagination totals
      setPagination(prev => ({
        projects: { ...prev.projects, total: mappedProjects.length },
        students: { ...prev.students, total: updatedStudents.length },
        faculty: { ...prev.faculty, total: mappedFaculty.length }
      }));
      
      setIsLoading(false);
      
      if (refreshType === 'all') {
        toast.success('All dashboard data refreshed successfully');
      } else {
        toast.success(`${refreshType.charAt(0).toUpperCase() + refreshType.slice(1)} data refreshed`);
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
  }, [user, faculty, students, projects, stats]);
  
  // Handle assigning a guide to a student
  const handleAssignGuide = useCallback(async (studentId, guideId) => {
    try {
      setIsLoading(true);
      await hodService.assignGuideToStudent(user.token, studentId, guideId);
      toast.success('Guide assigned successfully');
      
      // Refresh only the data we need
      await fetchDashboardData('students,faculty');
      
      return true;
    } catch (error) {
      toast.error('Failed to assign guide: ' + error.message);
      setIsLoading(false);
      return false;
    }
  }, [user, fetchDashboardData]);
  
  // Handle assigning a guide to a project
  const handleAssignGuideToProject = useCallback(async (projectId, guideId) => {
    try {
      setIsLoading(true);
      await hodService.assignGuideToProject(user.token, projectId, guideId);
      toast.success('Guide assigned to project successfully');
      
      // Refresh only the projects data
      await fetchDashboardData('projects');
      
      return true;
    } catch (error) {
      toast.error('Failed to assign guide to project: ' + error.message);
      setIsLoading(false);
      return false;
    }
  }, [user, fetchDashboardData]);
  
  // Handle updating project status
  const handleUpdateProjectStatus = useCallback(async (projectId, status, feedback) => {
    try {
      setIsLoading(true);
      await hodService.updateProjectStatus(user.token, projectId, status, feedback);
      
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
  }, [user, fetchDashboardData]);
  
  // Verify authentication and connection
  const verifyAuthentication = useCallback(async () => {
    try {
      if (!user || !user.token) {
        return { isAuthenticated: false, error: 'No user token found' };
      }
      
      const authStatus = await hodService.verifyAuthentication(user.token);
      return authStatus;
    } catch (error) {
      return { isAuthenticated: false, error: error.message };
    }
  }, [user]);
  
  // Load initial data
  useEffect(() => {
    if (user?.token) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);
  
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
    
    // Functions
    fetchDashboardData,
    handleAssignGuide,
    handleAssignGuideToProject,
    handleUpdateProjectStatus,
    handlePageChange,
    verifyAuthentication,
    getPagedData
  };
};

export default useHodDashboard; 