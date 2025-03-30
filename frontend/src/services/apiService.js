import { toast } from 'react-hot-toast';

// Get API URL from environment variables with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const TOKEN_EXPIRY_DAYS = parseInt(import.meta.env.VITE_TOKEN_EXPIRY_DAYS || '7', 10);

// Token management
const saveToken = (token) => {
  if (!token) return;
  
  // Store token with expiry
  const expiryMs = TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const tokenData = {
    value: token,
    expiry: Date.now() + expiryMs
  };
  
  localStorage.setItem('token', JSON.stringify(tokenData));
};

const getToken = () => {
  const tokenData = localStorage.getItem('token');
  if (!tokenData) return null;
  
  try {
    const { value, expiry } = JSON.parse(tokenData);
    
    // Check if token is expired
    if (Date.now() > expiry) {
      localStorage.removeItem('token');
      return null;
    }
    
    return value;
  } catch (error) {
    localStorage.removeItem('token');
    return null;
  }
};

const clearToken = () => {
  localStorage.removeItem('token');
};

// Store user data in memory and localStorage
let currentUser = null;

const saveUser = (user) => {
  if (!user) return;
  
  currentUser = user;
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
};

const getUser = () => {
  if (currentUser) return currentUser;
  
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      currentUser = JSON.parse(userData);
    }
    return currentUser;
  } catch (error) {
    localStorage.removeItem('user');
    return null;
  }
};

const clearUser = () => {
  currentUser = null;
  localStorage.removeItem('user');
};

// Helper function to handle API requests
const apiRequest = async (url, method = 'GET', data = null, options = {}) => {
  const { showErrorToast = true, contentType = 'application/json', formData = false } = options;
  const token = getToken();
  
  const headers = {};
  
  if (!formData) {
    headers['Content-Type'] = contentType;
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
  };
  
  if (data) {
    config.body = formData ? data : JSON.stringify(data);
  }
  
  try {
    const response = await fetch(`${API_URL}${url}`, config);
    
    // Try to parse JSON, but some responses might be empty
    let result;
    const contentTypeHeader = response.headers.get('content-type');
    if (contentTypeHeader && contentTypeHeader.includes('application/json')) {
      result = await response.json();
    } else if (response.status === 204) {
      result = { success: true };
    } else {
      const text = await response.text();
      try {
        result = text ? JSON.parse(text) : { success: response.ok };
      } catch (e) {
        result = { message: text || 'Unknown response' };
      }
    }
    
    // Handle 401 Unauthorized globally - token expired or invalid
    if (response.status === 401) {
      clearToken();
      clearUser();
      window.dispatchEvent(new CustomEvent('auth:sessionExpired'));
      if (showErrorToast) {
        toast.error('Session expired. Please login again.');
      }
      throw new Error('Session expired. Please login again.');
    }
    
    if (!response.ok) {
      const errorMessage = result.error || result.message || 'Something went wrong';
      if (showErrorToast) {
        toast.error(errorMessage);
      }
      
      const error = new Error(errorMessage);
      error.response = {
        status: response.status,
        data: result
      };
      throw error;
    }
    
    // If response contains a new token, save it
    if (result.token) {
      saveToken(result.token);
    }
    
    // If response contains user data, update stored user
    if (result.user) {
      saveUser(result.user);
    }
    
    return result;
  } catch (error) {
    if (error.message !== 'Session expired. Please login again.' && showErrorToast) {
      toast.error(error.message || 'Network error');
    }
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

export const logoutUser = () => {
  clearToken();
  clearUser();
  return Promise.resolve();
};

export const forgotPassword = (email) => {
  return apiRequest('/auth/forgot-password', 'POST', { email });
};

export const resetPassword = (token, password) => {
  return apiRequest('/auth/reset-password', 'POST', { token, password });
};

// Two-factor authentication services
export const verify2FA = (userId, token) => {
  return apiRequest('/auth/verify-2fa', 'POST', { user_id: userId, token });
};

export const setup2FA = () => {
  return apiRequest('/auth/setup-2fa', 'POST');
};

export const verify2FASetup = (token) => {
  return apiRequest('/auth/confirm-2fa', 'POST', { token });
};

export const disable2FA = (password) => {
  return apiRequest('/auth/disable-2fa', 'POST', { password });
};

// User services
export const getProfile = () => {
  return apiRequest('/user/profile');
};

export const updateProfile = (profileData) => {
  return apiRequest('/user/profile', 'PUT', profileData);
};

export const changePassword = (currentPassword, newPassword) => {
  return apiRequest('/user/change-password', 'POST', {
    current_password: currentPassword,
    new_password: newPassword
  });
};

export const getLoginHistory = (limit = 10) => {
  return apiRequest(`/user/login-history?limit=${limit}`);
};

// Email verification services
export const checkVerificationToken = (token) => {
  return apiRequest(`/verify-token-status/${token}`);
};

export const checkVerificationStatus = () => {
  return apiRequest('/user/verification-status');
};

export const resendVerificationEmail = (email) => {
  return apiRequest('/auth/resend-verification', 'POST', { email });
};

// Auth check
export const isAuthenticated = () => {
  return !!getToken();
};

export const getCurrentUser = () => {
  return getUser();
};

// User account management
export const deleteAccount = (password) => {
  return apiRequest('/user/delete-account', 'POST', { password });
};

export default {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  verify2FA,
  setup2FA,
  verify2FASetup,
  disable2FA,
  getProfile,
  updateProfile,
  changePassword,
  getLoginHistory,
  checkVerificationToken,
  checkVerificationStatus,
  resendVerificationEmail,
  isAuthenticated,
  getCurrentUser,
  deleteAccount,
}; 