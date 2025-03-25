import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OAuthCallback = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleOAuthCallback = () => {
      try {
        // Parse query parameters
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const userJson = params.get('user');
        const error = params.get('error');
        
        if (error) {
          console.error('OAuth error:', error);
          navigate('/login?error=' + encodeURIComponent(error));
          return;
        }
        
        if (!token || !userJson) {
          navigate('/login?error=Authentication%20failed');
          return;
        }
        
        // Store token and redirect
        onLogin(token);
        
        // Notify user about successful login
        navigate('/dashboard', { 
          state: { message: 'Social login successful' } 
        });
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        navigate('/login?error=Authentication%20failed');
      }
    };

    handleOAuthCallback();
  }, [location, navigate, onLogin]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-100 via-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Completing login...</h2>
        <p className="text-gray-500 mt-2">Please wait while we authenticate your account.</p>
      </div>
    </div>
  );
};

export default OAuthCallback; 