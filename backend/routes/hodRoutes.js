// Add this route for getting student details
router.get('/students/:studentId', auth, checkRole(['hod']), hodController.getStudentDetails); 