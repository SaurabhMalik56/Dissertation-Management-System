// Add this function to get student details
exports.getStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Find the student in the users collection
    const student = await User.findById(studentId)
      .select('-password -__v -createdAt -updatedAt')
      .lean();
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Verify that the student belongs to the HOD's department
    const hod = await User.findById(req.user.id);
    if (student.department !== hod.department) {
      return res.status(403).json({ message: 'Access denied. Student is not in your department.' });
    }
    
    // Format the response with all required fields
    const studentDetails = {
      fullName: student.fullName,
      rollNo: student.rollNo,
      email: student.email,
      department: student.department,
      year: student.year,
      semester: student.semester,
      contactNumber: student.contactNumber,
      address: student.address,
      // Add any other relevant fields from the users collection
      branch: student.branch,
      role: student.role,
      isActive: student.isActive,
      assignedGuide: student.assignedGuide
    };
    
    res.json(studentDetails);
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ message: 'Error fetching student details', error: error.message });
  }
}; 