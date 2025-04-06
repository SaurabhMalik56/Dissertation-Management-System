import { Link } from 'react-router-dom';

const LandingPage = () => {
  console.log("LandingPage rendering...");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-2">Disserto</h1>
        <p className="text-gray-600 mb-6">Dissertation Management System</p>
        
        <div className="flex flex-col gap-4">
          <Link 
            to="/login" 
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
          >
            Sign in
          </Link>
          
          <Link 
            to="/register" 
            className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 