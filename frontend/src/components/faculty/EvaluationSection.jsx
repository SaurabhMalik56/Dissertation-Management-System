import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaClipboardCheck, FaEdit, FaPlus, FaSync } from 'react-icons/fa';
import facultyService from '../../services/facultyService';
import EvaluationForm from './EvaluationForm';
import { useNavigate } from 'react-router-dom';

const EvaluationSection = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, [user]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const studentsData = await facultyService.getAssignedStudents(user.token);
      console.log('Assigned students:', studentsData);
      
      // Sort students alphabetically
      const sortedStudents = studentsData.sort((a, b) => 
        (a.fullName || a.name || '').localeCompare(b.fullName || b.name || '')
      );
      
      setStudents(sortedStudents);
    } catch (err) {
      console.error('Error fetching assigned students:', err);
      setError('Failed to fetch student data. Please try again.');
      toast.error('Error loading assigned students');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluateStudent = (studentId) => {
    setSelectedStudentId(studentId);
    setShowEvaluationForm(true);
  };

  const handleCloseForm = () => {
    setShowEvaluationForm(false);
    setSelectedStudentId(null);
  };

  const getProjectStatus = (student) => {
    if (!student.project) return 'No project';
    
    const status = student.project.status || 'In Progress';
    
    switch (status.toLowerCase()) {
      case 'completed':
        return { status: 'Completed', className: 'bg-green-100 text-green-800' };
      case 'rejected':
        return { status: 'Rejected', className: 'bg-red-100 text-red-800' };
      case 'submitted':
        return { status: 'Submitted', className: 'bg-blue-100 text-blue-800' };
      case 'approved':
        return { status: 'Approved', className: 'bg-indigo-100 text-indigo-800' };
      default:
        return { status: 'In Progress', className: 'bg-yellow-100 text-yellow-800' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <p className="text-red-800">{error}</p>
        <button 
          onClick={fetchStudents}
          className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
        >
          <FaSync className="mr-1" /> Try again
        </button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-10">
        <FaClipboardCheck className="mx-auto text-gray-400 text-5xl mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Assigned</h3>
        <p className="text-gray-500 mb-4">You don't have any students assigned for evaluation.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Student Evaluations</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchStudents}
            title="Refresh student list"
            className="btn btn-outline-secondary"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {showEvaluationForm && selectedStudentId ? (
        <EvaluationForm 
          studentId={selectedStudentId}
          onClose={handleCloseForm}
          refreshData={fetchStudents}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => {
                const projectStatus = getProjectStatus(student);
                
                return (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {student.fullName || student.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.project?.title || 'No project assigned'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${projectStatus.className}`}>
                        {projectStatus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEvaluateStudent(student._id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        {student.hasEvaluation ? (
                          <>
                            <FaEdit className="inline mr-1" /> Edit Evaluation
                          </>
                        ) : (
                          <>
                            <FaPlus className="inline mr-1" /> Add Evaluation
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EvaluationSection; 