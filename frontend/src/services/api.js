// Check verification token validity 
export const checkVerificationToken = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/auth/verify/check/${token}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

// Verify email with token
export const verifyEmail = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/auth/verify/email/${token}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
}; 