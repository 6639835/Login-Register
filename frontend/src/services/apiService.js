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
      const error = new Error(result.message || 'Something went wrong');
      error.response = {
        status: response.status,
        data: result
      };
      throw error;
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

// Two-factor authentication services
export const verify2FA = (authData) => {
  return apiRequest('/auth/2fa/verify', 'POST', authData);
};

export const verifyBackupCode = (authData) => {
  return apiRequest('/auth/2fa/backup-code', 'POST', authData);
};

export const setup2FA = () => {
  return apiRequest('/auth/2fa/setup', 'POST');
};

export const verify2FASetup = (code) => {
  return apiRequest('/auth/2fa/verify-setup', 'POST', { code });
};

export const disable2FA = () => {
  return apiRequest('/auth/2fa/disable', 'POST');
};

// Verification services
export const resendVerificationEmail = (email) => {
  return apiRequest('/verify/resend', 'POST', { email });
};

export const checkVerificationStatus = () => {
  return apiRequest('/users/verification-status');
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
  verify2FA,
  verifyBackupCode,
  setup2FA,
  verify2FASetup,
  disable2FA,
  resendVerificationEmail,
  checkVerificationStatus,
  getCurrentUser,
  updateProfile,
  changePassword,
  deleteAccount
}; 