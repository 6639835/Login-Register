import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { loginUser, verify2FA } from '../services/apiService';
import { Toaster, toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, ShieldCheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import SocialLogin from '../components/SocialLogin';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState('');

  // Check for redirects and query params
  useEffect(() => {
    // Check for query params
    const queryParams = new URLSearchParams(location.search);
    
    // Check for session expired param
    if (queryParams.get('session_expired') === 'true') {
      toast.error('Your session has expired. Please log in again.');
    }
    
    // Check for successful registration
    if (queryParams.get('registered') === 'true') {
      toast.success('Registration successful! Please verify your email.');
    }
    
    // Check for verified email
    if (queryParams.get('verified') === 'true') {
      toast.success('Email verified successfully! You can now log in.');
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await loginUser({ email, password });
      
      if (response.requires_2fa) {
        // Handle 2FA flow
        setRequires2FA(true);
        setUserId(response.user_id);
        setIsLoading(false);
      } else {
        // Normal login
        handleLoginSuccess(response);
      }
    } catch (error) {
      setIsLoading(false);
      // Error handling is done in apiService
    }
  };
  
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTwoFactorError('');
    
    try {
      const response = await verify2FA(userId, twoFactorCode);
      handleLoginSuccess(response);
    } catch (error) {
      setIsLoading(false);
      setTwoFactorError(error.message || 'Invalid code. Please try again.');
    }
  };
  
  const handleLoginSuccess = (response) => {
    if (onLogin) {
      onLogin(response.token);
    }
    
    // Redirect to dashboard
    navigate('/dashboard');
    toast.success('Login successful!');
  };
  
  // Render 2FA verification form if required
  if (requires2FA) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <ShieldCheckIcon className="mx-auto h-16 w-16 text-primary-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter the verification code from your authenticator app
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleVerify2FA}>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <div className="mt-1">
                  <input
                    id="code"
                    name="code"
                    type="text"
                    autoComplete="one-time-code"
                    required
                    placeholder="Enter 6-digit code"
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    autoFocus
                  />
                </div>
                {twoFactorError && (
                  <p className="mt-2 text-sm text-red-600">
                    {twoFactorError}
                  </p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </button>
              </div>
              
              <div className="text-sm text-center">
                <button
                  type="button"
                  className="font-medium text-primary-600 hover:text-primary-500"
                  onClick={() => setRequires2FA(false)}
                >
                  Back to login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Toaster position="top-right" />
      
      {/* Left side - Decorative Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-secondary-500 to-primary-700 relative overflow-hidden animate-gradient-x">
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-white z-10">
          <div>
            <div className="text-2xl font-display font-bold tracking-tight">SecureAuth</div>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-4xl font-display font-bold mb-6 animate-fade-in-up">Welcome back</h1>
            <p className="text-white/80 text-lg mb-8 animate-fade-in-up animation-delay-150">
              Sign in to your account to access your secure dashboard and manage your profile.
            </p>
            <div className="flex flex-col space-y-6 animate-fade-in-up animation-delay-300">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm text-white/90 font-medium">
                  Secure authentication
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-sm text-white/90 font-medium">
                  Two-factor authentication
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-white/50 text-sm">
            © {new Date().getFullYear()} SecureAuth App. All rights reserved.
          </div>
        </div>
        
        {/* Modern geometric background */}
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        
        {/* 3D gradient spheres */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-xl transform rotate-12 animate-float"></div>
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-gradient-to-tr from-white/5 to-transparent blur-xl transform -rotate-12 animate-float-delay"></div>
        
        {/* Background Decorative Shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 backdrop-blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 backdrop-blur-3xl"></div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 py-12 px-6 flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="w-full max-w-md p-6 animate-fade-in">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Sign in to your account</h2>
            <p className="text-gray-600">
              Or{' '}
              <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
                create a new account
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
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
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <SocialLogin />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 