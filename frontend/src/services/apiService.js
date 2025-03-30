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

// Helper function to handle API requests
const apiRequest = async (url, method = 'GET', data = null) => {
  const token = getToken();
  
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
    
    // Handle 401 Unauthorized globally - token expired or invalid
    if (response.status === 401) {
      clearToken();
      window.location.href = '/login?session_expired=true';
      throw new Error('Session expired. Please login again.');
    }
    
    const result = await response.json();
    
    if (!response.ok) {
      const error = new Error(result.message || 'Something went wrong');
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
    
    return result;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Auth services
export const registerUser = (userData) => {
  return apiRequest('/auth/register', 'POST', userData)
    .then(response => {
      if (response.token) {
        saveToken(response.token);
      }
      return response;
    });
};

export const loginUser = (credentials) => {
  return apiRequest('/auth/login', 'POST', credentials)
    .then(response => {
      if (response.token) {
        saveToken(response.token);
      }
      return response;
    });
};

export const logoutUser = () => {
  clearToken();
  return Promise.resolve();
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
  logoutUser,
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