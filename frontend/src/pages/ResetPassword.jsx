import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword, checkVerificationToken } from '../services/apiService';
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, ArrowPathIcon, ArrowLeftIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

const ResetPassword = ({ onLogin }) => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [tokenStatus, setTokenStatus] = useState({
    isChecking: true,
    isValid: false,
    message: 'Checking token validity...'
  });
  
  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: 'Password is too weak',
    color: 'text-red-500'
  });
  
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const result = await checkVerificationToken(token);
        
        if (result.valid) {
          setTokenStatus({
            isChecking: false,
            isValid: true,
            message: ''
          });
        } else {
          setTokenStatus({
            isChecking: false,
            isValid: false,
            message: result.reason || 'This reset link is invalid or has expired'
          });
        }
      } catch (error) {
        setTokenStatus({
          isChecking: false,
          isValid: false,
          message: 'Failed to verify the reset link. It may be invalid or expired.'
        });
      }
    };
    
    verifyToken();
  }, [token]);
  
  // Check password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength({
        score: 0,
        message: 'Password is required',
        color: 'text-gray-400'
      });
      return;
    }
    
    let score = 0;
    let message = '';
    let color = '';
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    // Set message based on score
    if (score < 3) {
      message = 'Password is too weak';
      color = 'text-red-500';
    } else if (score < 5) {
      message = 'Password is moderate';
      color = 'text-yellow-500';
    } else {
      message = 'Password is strong';
      color = 'text-green-500';
    }
    
    setPasswordStrength({ score, message, color });
  }, [password]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength.score < 3) {
      setError('Please use a stronger password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await resetPassword(token, password);
      setIsSubmitted(true);
      toast.success('Password has been reset successfully');
      
      // Automatically redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError(error.message || 'An error occurred while resetting your password');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (tokenStatus.isChecking) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <ArrowPathIcon className="animate-spin h-10 w-10 mx-auto text-primary-600" />
            <p className="mt-4 text-gray-600">Checking password reset link...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!tokenStatus.isValid) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Invalid Reset Link
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {tokenStatus.message}
          </p>
        </div>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
            <div className="space-y-6">
              <p className="text-center text-sm text-gray-600">
                Please request a new password reset link.
              </p>
              
              <div>
                <Link
                  to="/forgot-password"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Request new reset link
                </Link>
              </div>
              
              <div className="text-center">
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 flex items-center justify-center">
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {isSubmitted ? 'Password Reset Complete' : 'Create New Password'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSubmitted 
            ? 'Your password has been reset successfully'
            : 'Please create a strong password for your account'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          {isSubmitted ? (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">
                      Your password has been reset. You will be redirected to the login page shortly.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Go to login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className={`mt-1 text-sm ${passwordStrength.color}`}>
                  {passwordStrength.message}
                </p>
                
                <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      passwordStrength.score < 3 
                        ? 'bg-red-500' 
                        : passwordStrength.score < 5 
                          ? 'bg-yellow-500' 
                          : 'bg-green-500'
                    }`} 
                    style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                      confirmPassword && password !== confirmPassword 
                        ? 'border-red-300 text-red-900' 
                        : 'border-gray-300'
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-2 text-sm text-red-600">
                    Passwords do not match
                  </p>
                )}
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  disabled={isLoading || password !== confirmPassword || passwordStrength.score < 3}
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
              
              <div className="text-center">
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 flex items-center justify-center">
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 