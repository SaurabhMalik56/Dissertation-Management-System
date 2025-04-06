import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/auth/` : 'http://localhost:5000/api/auth/';

// Register user
const register = async (userData) => {
  try {
    const response = await axios.post(API_URL + 'register', userData);

    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login user
const login = async (userData) => {
  try {
    const response = await axios.post(API_URL + 'login', userData);

    if (response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Logout user
const logout = () => {
  localStorage.removeItem('user');
};

const authService = {
  register,
  logout,
  login,
};

export default authService; 