import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import React, { useState, useEffect } from 'react';

// Layout components
import Layout from './components/layout/Layout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import LandingPage from './pages/LandingPage';

// Role-specific dashboards
import StudentDashboard from './pages/student/Dashboard';
import FacultyDashboard from './pages/faculty/Dashboard';
import HodDashboard from './pages/hod/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-700 mb-4">{this.state.error?.message || 'An unknown error occurred'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Protected Route component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the appropriate dashboard based on role
    switch (user.role) {
      case 'student':
        return <Navigate to="/student" replace />;
      case 'faculty':
        return <Navigate to="/faculty" replace />;
      case 'hod':
        return <Navigate to="/hod" replace />;
      case 'admin':
        return <Navigate to="/admin" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

function App() {
  // REMOVED LOADING STATE
  // Always render immediately

  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes with layout */}
        <Route path="/" element={<Layout />}>
          {/* Student routes */}
          <Route 
            path="student" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Faculty routes */}
          <Route 
            path="faculty" 
            element={
              <ProtectedRoute allowedRoles={['faculty']}>
                <FacultyDashboard />
              </ProtectedRoute>
            } 
          />

          {/* HOD routes */}
          <Route 
            path="hod" 
            element={
              <ProtectedRoute allowedRoles={['hod']}>
                <HodDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Admin routes */}
          <Route 
            path="admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
