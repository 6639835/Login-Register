import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { registerUser, resendVerificationEmail } from '../services/apiService';
import SocialLogin from '../components/SocialLogin';

const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check for error in URL params (from OAuth redirect)
    const params = new URLSearchParams(location.search);
    const errorMessage = params.get('error');
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      // Store the registered email to show in success message
      setRegisteredEmail(formData.email);
      setRegistrationSuccess(true);
      
      // We don't automatically log in anymore since email verification is required
      // onLogin(response.token);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail || isResending) return;
    
    setIsResending(true);
    setResendSuccess(false);
    
    try {
      await resendVerificationEmail(registeredEmail);
      setResendSuccess(true);
      
      // Reset after 5 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error resending verification:', err);
      setError(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  // If registration was successful, show the verification message
  if (registrationSuccess) {
    return (
      <div className="flex min-h-screen">
        {/* Left side - Decorative Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-secondary-500 to-primary-700 relative overflow-hidden animate-gradient-x">
          <div className="absolute inset-0 p-12 flex flex-col justify-between text-white z-10">
            <div>
              <div className="text-2xl font-display font-bold tracking-tight">SecureAuth</div>
            </div>
            
            <div className="max-w-md">
              <h1 className="text-4xl font-display font-bold mb-6 animate-fade-in-up">Verification Required</h1>
              <p className="text-white/80 text-lg mb-8 animate-fade-in-up animation-delay-150">
                We've sent a verification email to your inbox. Please check and click the link to activate your account.
              </p>
              <div className="flex items-center space-x-4 animate-fade-in-up animation-delay-300">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm border border-white/10 pulse-slow">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-white/70">
                  Check your inbox and spam folder
                </p>
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
        
        {/* Right side - Success Message */}
        <div className="w-full lg:w-1/2 py-12 px-6 flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
          <div className="w-full max-w-md p-6 animate-fade-in">
            <div className="mb-10 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center shadow-success transform rotate-12 animate-success">
                  <div className="w-full h-full rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center transform -rotate-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </div>
              <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Registration Successful!</h1>
              <p className="text-gray-500 text-lg">Please verify your email address to continue</p>
            </div>
            
            <div className="bg-primary-50 border border-primary-100 text-primary-800 p-6 rounded-2xl mb-6 shadow-sm transform transition-all hover:shadow-md">
              <p>We've sent a verification email to:</p>
              <p className="font-semibold mt-2 text-lg">{registeredEmail}</p>
              <p className="mt-4 text-sm">Please check your inbox and click the verification link to activate your account.</p>
            </div>
            
            {resendSuccess && (
              <div className="bg-success-50 border border-success-100 text-success-800 p-4 rounded-xl mb-6 animate-slide-up">
                <div className="flex items-center">
                  <div className="mr-3 text-success-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p>Verification email has been resent successfully!</p>
                </div>
              </div>
            )}
            
            <p className="text-gray-500 text-sm mt-4 text-center">
              Didn't receive the email? Check your spam folder or{' '}
              <button 
                className="text-primary-600 hover:text-primary-700 font-medium relative group"
                onClick={handleResendVerification}
                disabled={isResending}
              >
                {isResending ? 'Sending...' : 'click here to resend'}
                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
              </button>
            </p>
            
            <div className="mt-8">
              <Link
                to="/login"
                className="btn btn-primary w-full group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Go to Login
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
                <span className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side - Decorative Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-secondary-500 to-primary-700 relative overflow-hidden animate-gradient-x">
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-white z-10">
          <div>
            <div className="text-2xl font-display font-bold tracking-tight">SecureAuth</div>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-4xl font-display font-bold mb-6 animate-fade-in-up">Create a secure account</h1>
            <p className="text-white/80 text-lg mb-8 animate-fade-in-up animation-delay-150">
              Join our community with enhanced security features, including email verification and data encryption.
            </p>
            <div className="flex flex-col space-y-6 animate-fade-in-up animation-delay-300">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm text-white/90 font-medium">
                  Advanced password encryption
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-sm text-white/90 font-medium">
                  Two-factor authentication support
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-white/90 font-medium">
                  Email verification for extra security
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
      
      {/* Right side - Form Section */}
      <div className="w-full lg:w-1/2 py-12 px-6 flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="w-full max-w-md p-6 animate-fade-in">
          <div className="mb-10 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-primary transform rotate-12 animate-bob">
                <div className="w-full h-full rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center transform -rotate-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-500 text-lg">Join our secure community</p>
          </div>
          
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl mb-6 animate-shake">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-danger-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p>{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label htmlFor="name" className="form-label flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Full name
              </label>
              <div className="relative mt-1 group">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="input pr-10 transition-all group-hover:border-primary-300 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="email" className="form-label flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email address
              </label>
              <div className="relative mt-1 group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="input pr-10 transition-all group-hover:border-primary-300 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password
              </label>
              <div className="relative mt-1 group">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="input pr-10 transition-all group-hover:border-primary-300 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Must be at least 6 characters
              </p>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Confirm password
              </label>
              <div className="relative mt-1 group">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="input pr-10 transition-all group-hover:border-primary-300 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <button
                type="submit"
                className="btn btn-primary w-full group relative overflow-hidden"
                disabled={isLoading}
              >
                <span className="absolute top-0 left-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></span>
                <span className="relative z-10">
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <span className="flex items-center justify-center">
                      Create account
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  )}
                </span>
              </button>
            </div>
            
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-gradient-to-b from-white to-gray-50 text-gray-500 font-medium">Or continue with</span>
              </div>
            </div>
            
            <SocialLogin />
            
            <div className="text-center mt-8">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700 transition-colors relative group">
                  Sign in
                  <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;