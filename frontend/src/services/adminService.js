import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Get all students directly from database
const getAllStudents = async (token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    
    console.log('Fetching students from database...');
    
    // First, get all students
    const studentsResponse = await axios.get(`${API_URL}/users/students`, config);
    const students = studentsResponse.data;
    
    // Then, get all faculty members to get guide names
    const facultyResponse = await axios.get(`${API_URL}/users?role=faculty`, config);
    const facultyMembers = facultyResponse.data || [];
    
    // Create a map of faculty IDs to names for quick lookup
    const facultyMap = {};
    facultyMembers.forEach(faculty => {
      facultyMap[faculty._id] = faculty.fullName;
    });
    
    // Map student data with correctly populated guide information
    const studentsWithGuides = students.map(student => {
      // Get the guide's name from our map if the student has an assigned guide
      const guideName = student.assignedGuide && facultyMap[student.assignedGuide] 
        ? facultyMap[student.assignedGuide]
        : student.assignedGuideName || null;
        
      return {
        id: student._id,
        name: student.fullName,
        email: student.email,
        department: student.department,
        rollNumber: student.rollNumber,
        guideId: student.assignedGuide || null,
        guideName: guideName,
        projectTitle: student.projectTitle || null
      };
    });
    
    console.log(`Successfully fetched ${studentsWithGuides.length} students with guide information`);
    
    return { 
      success: true, 
      data: studentsWithGuides
    };
  } catch (error) {
    console.error('Error fetching students:', error.message);
    throw error;
  }
};

// Get a single student by ID
const getStudentById = async (token, studentId) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    
    const response = await axios.get(`${API_URL}/users/${studentId}`, config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Error fetching student with ID ${studentId}:`, error.message);
    throw error;
  }
};

// Add a new student
const addStudent = async (token, studentData) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    };
    
    const response = await axios.post(`${API_URL}/users`, studentData, config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error adding student:', error.message);
    throw error;
  }
};

// Update student information
const updateStudent = async (token, studentId, updateData) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    };
    
    const response = await axios.put(`${API_URL}/users/${studentId}`, updateData, config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Error updating student with ID ${studentId}:`, error.message);
    throw error;
  }
};

// Delete a student
const deleteStudent = async (token, studentId) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    
    const response = await axios.delete(`${API_URL}/users/${studentId}`, config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error(`Error deleting student with ID ${studentId}:`, error.message);
    throw error;
  }
};

// Get all HODs directly from database
const getAllHods = async (token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    
    console.log('Fetching HODs from database...');
    
    // Get all users with role 'hod'
    const response = await axios.get(`${API_URL}/users?role=hod`, config);
    const hods = response.data || [];
    
    console.log(`Successfully fetched ${hods.length} HODs`);
    
    return { 
      success: true, 
      data: hods.map(hod => ({
        id: hod._id,
        name: hod.fullName,
        email: hod.email,
        department: hod.department || 'Not Assigned'
      }))
    };
  } catch (error) {
    console.error('Error fetching HODs:', error.message);
    throw error;
  }
};

// Get all faculty members directly from database
const getAllFaculty = async (token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    
    console.log('Fetching faculty members from database...');
    
    // Get all users with role 'faculty'
    const response = await axios.get(`${API_URL}/users?role=faculty`, config);
    const facultyMembers = response.data || [];
    
    // Get all students to count assigned ones for each faculty
    const studentsResponse = await axios.get(`${API_URL}/users/students`, config);
    const students = studentsResponse.data || [];
    
    // Count assigned students for each faculty
    const facultyWithStudents = facultyMembers.map(faculty => {
      // Count students that have this faculty as their assigned guide
      const assignedStudents = students.filter(student => 
        student.assignedGuide && student.assignedGuide === faculty._id
      ).length;
      
      return {
        id: faculty._id,
        name: faculty.fullName,
        email: faculty.email,
        department: faculty.department || 'Not Assigned',
        assignedStudents: assignedStudents
      };
    });
    
    console.log(`Successfully fetched ${facultyWithStudents.length} faculty members`);
    
    return { 
      success: true, 
      data: facultyWithStudents
    };
  } catch (error) {
    console.error('Error fetching faculty members:', error.message);
    throw error;
  }
};

// Get all projects directly from database
const getAllProjects = async (token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    
    console.log('Fetching projects from database...');
    
    // Get all projects
    const projectsResponse = await axios.get(`${API_URL}/projects`, config);
    const projects = projectsResponse.data || [];
    
    // Get all users to map IDs to names
    const usersResponse = await axios.get(`${API_URL}/users`, config);
    const users = usersResponse.data || [];
    
    // Create maps for quick lookups
    const userMap = {};
    users.forEach(user => {
      userMap[user._id] = {
        name: user.fullName,
        role: user.role,
        department: user.department
      };
    });
    
    // Map project data with related user information
    const projectsWithDetails = projects.map(project => {
      // Get student information - using the student field directly if it exists
      const studentName = project.student && typeof project.student !== 'string' && project.student._id 
        ? project.student.name || (userMap[project.student._id]?.name || 'Unknown Student')
        : project.studentId && userMap[project.studentId]
          ? userMap[project.studentId].name
          : 'Unknown Student';
      
      const studentId = project.student && typeof project.student !== 'string' && project.student._id 
        ? project.student._id 
        : project.studentId || null;
        
      // Get guide information - using the guide field directly if it exists
      const guideName = project.guide && typeof project.guide !== 'string' && project.guide._id
        ? project.guide.name || (userMap[project.guide._id]?.name || 'Not Assigned')
        : project.guideId && userMap[project.guideId]
          ? userMap[project.guideId].name
          : 'Not Assigned';
        
      // Get HOD information based on department
      const departmentHod = users.find(user => 
        user.role === 'hod' && user.department === project.department
      );
      const hodName = departmentHod ? departmentHod.fullName : 'Not Assigned';
      
      return {
        id: project._id,
        title: project.title,
        studentId: studentId,
        studentName: studentName,
        hodAssigned: hodName,
        guide: guideName,
        status: project.status || 'Pending',
        department: project.department
      };
    });
    
    console.log(`Successfully fetched ${projectsWithDetails.length} projects with details`);
    
    return { 
      success: true, 
      data: projectsWithDetails
    };
  } catch (error) {
    console.error('Error fetching projects:', error.message);
    throw error;
  }
};

// Get system stats
const getSystemStats = async (token) => {
  try {
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    
    console.log('Fetching system stats...');
    
    // Make parallel requests to get stats data
    const [usersResponse, projectsResponse] = await Promise.all([
      axios.get(`${API_URL}/users`, config),
      axios.get(`${API_URL}/projects`, config)
    ]);
    
    // Calculate stats from actual data
    const users = usersResponse.data;
    const students = users.filter(user => user.role === 'student');
    const faculty = users.filter(user => user.role === 'faculty');
    const hods = users.filter(user => user.role === 'hod');
    const projects = projectsResponse.data;
    
    // Get unique departments
    const departments = [...new Set(users.map(user => user.department).filter(Boolean))];
    
    return {
      success: true,
      data: {
        totalUsers: users.length,
        totalStudents: students.length,
        totalFaculty: faculty.length,
        totalHods: hods.length,
        totalDepartments: departments.length,
        totalProjects: projects.length
      }
    };
  } catch (error) {
    console.error('Error fetching system stats:', error.message);
    // If error, calculate from fetched users
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const usersResponse = await axios.get(`${API_URL}/users`, config);
      const users = usersResponse.data;
      const students = users.filter(user => user.role === 'student');
      const faculty = users.filter(user => user.role === 'faculty');
      const hods = users.filter(user => user.role === 'hod');
      const departments = [...new Set(users.map(user => user.department).filter(Boolean))];
      
      return {
        success: true,
        data: {
          totalUsers: users.length,
          totalStudents: students.length,
          totalFaculty: faculty.length,
          totalHods: hods.length,
          totalDepartments: departments.length,
          totalProjects: 0 // Can't determine without projects endpoint
        }
      };
    } catch (innerError) {
      console.error('Error in fallback stats calculation:', innerError.message);
      throw error;
    }
  }
};

// Export service functions
const adminService = {
  getAllStudents,
  getStudentById,
  addStudent,
  updateStudent,
  deleteStudent,
  getAllHods,
  getAllFaculty,
  getAllProjects,
  getSystemStats
};

export default adminService; 