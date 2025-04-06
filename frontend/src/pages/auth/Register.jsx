import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { register, reset } from '../../features/auth/authSlice';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    password2: '',
    role: 'student',
    branch: '',
    course: '',
  });

  const { fullName, email, password, password2, role, branch, course } = formData;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (isError) {
      if (typeof message === 'string') {
        toast.error(message);
      } else if (message && message.message) {
        toast.error(message.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    }

    // Redirect if registered
    if (isSuccess || user) {
      switch (user.role) {
        case 'student':
          navigate('/student');
          break;
        case 'faculty':
          navigate('/faculty');
          break;
        case 'hod':
          navigate('/hod');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
    }

    dispatch(reset());
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();

    if (password !== password2) {
      toast.error('Passwords do not match');
    } else {
      const userData = {
        fullName,
        email,
        password,
        role,
      };

      // Add branch and course for students
      if (role === 'student') {
        userData.branch = branch;
        userData.course = course;
      }

      // Add branch as department for HOD
      if (role === 'hod') {
        if (!branch) {
          toast.error('Department/Branch is required for HOD registration');
          return;
        }
        userData.branch = branch;
        userData.department = branch; // Store the same value in both fields for compatibility
      }

      dispatch(register(userData));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-indigo-600 tracking-tight mb-2">Disserto</h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create a new account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 underline">
              Sign in instead
            </Link>
          </p>
        </div>
        
        <div className="mt-8 bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={onChange}
                  className="form-input"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Must be a valid email format (e.g., name@example.com)
              </p>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <div className="mt-1">
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={onChange}
                  className="form-select"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="hod">Head of Department</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {role === 'student' && (
              <>
                <div>
                  <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                    Branch
                  </label>
                  <div className="mt-1">
                    <select
                      id="branch"
                      name="branch"
                      value={branch}
                      onChange={onChange}
                      required={role === 'student'}
                      className="form-select"
                    >
                      <option value="">Select Branch</option>
                      <option value="CSE">Computer Science Engineering</option>
                      <option value="ECE">Electronics & Communication Engineering</option>
                      <option value="EEE">Electrical & Electronics Engineering</option>
                      <option value="ME">Mechanical Engineering</option>
                      <option value="CE">Civil Engineering</option>
                      <option value="IT">Information Technology</option>
                      <option value="AIML">AI & Machine Learning</option>
                      <option value="DS">Data Science</option>
                      <option value="CH">Chemical Engineering</option>
                      <option value="BT">Biotechnology</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="course" className="block text-sm font-medium text-gray-700">
                    Course
                  </label>
                  <div className="mt-1">
                    <select
                      id="course"
                      name="course"
                      value={course}
                      onChange={onChange}
                      required={role === 'student'}
                      className="form-select"
                    >
                      <option value="">Select Course</option>
                      <option value="B.Tech">B.Tech</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="M.Tech (Int)">M.Tech (Integrated)</option>
                      <option value="PhD">PhD</option>
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                      <option value="BSc">B.Sc</option>
                      <option value="MSc">M.Sc</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {role === 'hod' && (
              <div>
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <div className="mt-1">
                  <select
                    id="branch"
                    name="branch"
                    value={branch}
                    onChange={onChange}
                    required={role === 'hod'}
                    className="form-select"
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">Computer Science Engineering</option>
                    <option value="ECE">Electronics & Communication Engineering</option>
                    <option value="EEE">Electrical & Electronics Engineering</option>
                    <option value="ME">Mechanical Engineering</option>
                    <option value="CE">Civil Engineering</option>
                    <option value="IT">Information Technology</option>
                    <option value="AIML">AI & Machine Learning</option>
                    <option value="DS">Data Science</option>
                    <option value="CH">Chemical Engineering</option>
                    <option value="BT">Biotechnology</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={onChange}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="password2"
                  name="password2"
                  type="password"
                  required
                  value={password2}
                  onChange={onChange}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                Register
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in with existing account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register; 