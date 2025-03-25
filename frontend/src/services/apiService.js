const API_URL = 'http://localhost:5000/api';

// Helper function to handle API requests
const apiRequest = async (url, method = 'GET', data = null) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
  };
  
  if (data) {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${API_URL}${url}`, config);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Something went wrong');
    }
    
    return result;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Auth services
export const registerUser = (userData) => {
  return apiRequest('/auth/register', 'POST', userData);
};

export const loginUser = (credentials) => {
  return apiRequest('/auth/login', 'POST', credentials);
};

export const forgotPassword = (email) => {
  return apiRequest('/auth/forgot-password', 'POST', { email });
};

// User services
export const getCurrentUser = () => {
  return apiRequest('/users/me');
};

export const updateProfile = (userData) => {
  return apiRequest('/users/update-profile', 'PUT', userData);
};

export const changePassword = (passwordData) => {
  return apiRequest('/users/change-password', 'PUT', passwordData);
};

export const deleteAccount = () => {
  return apiRequest('/users/delete-account', 'DELETE');
};

export default {
  registerUser,
  loginUser,
  forgotPassword,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount
}; 