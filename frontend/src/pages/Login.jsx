import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { loginUser, resendVerificationEmail, verify2FA, verifyBackupCode } from '../services/apiService';
import ForgotPassword from '../components/ForgotPassword';
import SocialLogin from '../components/SocialLogin';

const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const location = useLocation();
  
  // Two-factor authentication state
  const [require2FA, setRequire2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showBackupCodeOption, setShowBackupCodeOption] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [userId, setUserId] = useState(null);
  const [tempToken, setTempToken] = useState(null);

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
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleResendVerification = async () => {
    if (!unverifiedEmail || isResendingVerification) return;
    
    setIsResendingVerification(true);
    setResendSuccess(false);
    
    try {
      await resendVerificationEmail(unverifiedEmail);
      setResendSuccess(true);
      
      // Reset after 5 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error resending verification:', err);
      setError(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await verify2FA({
        user_id: userId,
        code: twoFactorCode,
        temp_token: tempToken
      });
      onLogin(response.token);
    } catch (err) {
      console.error('2FA Verification error:', err);
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupCodeSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await verifyBackupCode({
        user_id: userId,
        backup_code: backupCode,
        temp_token: tempToken
      });
      onLogin(response.token);
    } catch (err) {
      console.error('Backup code verification error:', err);
      setError(err.message || 'Invalid backup code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setVerificationNeeded(false);
    
    try {
      const response = await loginUser(credentials);
      
      // Check if 2FA is required
      if (response.requires_2fa) {
        setRequire2FA(true);
        setUserId(response.user_id);
        setTempToken(response.temp_token);
        setIsLoading(false);
        return;
      }
      
      onLogin(response.token);
    } catch (err) {
      console.error('Login error:', err);
      
      // Check if this is a verification error
      if (err.response && err.response.status === 403 && err.response.data.verification_required) {
        setVerificationNeeded(true);
        setUnverifiedEmail(err.response.data.email || credentials.email);
        setError('Your email has not been verified yet. Please check your inbox for a verification link or request a new one.');
      } else {
        setError(err.message || 'Failed to login. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Decorative Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-secondary-500 to-primary-700 relative overflow-hidden animate-gradient-x">
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-white z-10">
          <div>
            <div className="text-2xl font-display font-bold tracking-tight">SecureAuth</div>
          </div>
          
          <div className="max-w-md">
            <h1 className="text-4xl font-display font-bold mb-6 animate-fade-in-up">Welcome back to your secure dashboard</h1>
            <p className="text-white/80 text-lg mb-8 animate-fade-in-up animation-delay-150">
              Access your account with enhanced security features, including two-factor authentication and encrypted data storage.
            </p>
            <div className="flex flex-col space-y-6 animate-fade-in-up animation-delay-300">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-sm text-white/90 font-medium">
                  Advanced security protocols
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-sm text-white/90 font-medium">
                  End-to-end encrypted data
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm border border-white/10">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-white/90 font-medium">
                  Real-time account monitoring
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-display font-bold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-500 text-lg">Access your secure account</p>
          </div>

          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-xl mb-6 animate-shake">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-danger-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <p>{error}</p>
              </div>
              
              {verificationNeeded && (
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    className="text-primary-600 hover:text-primary-700 font-medium focus:outline-none text-sm relative group"
                    onClick={handleResendVerification}
                    disabled={isResendingVerification}
                  >
                    {isResendingVerification ? 'Sending...' : 'Resend verification email'}
                    <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                  </button>
                  
                  {resendSuccess && (
                    <div className="mt-2 text-success-600 text-sm animate-fade-in">
                      Verification email sent successfully! Please check your inbox.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {require2FA ? (
            // Two-factor authentication form
            <>
              {!showBackupCodeOption ? (
                <form onSubmit={handle2FASubmit} className="space-y-6">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4 animate-pulse-slow">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-display font-semibold text-gray-900">Two-Factor Authentication</h2>
                    <p className="text-gray-500 mt-1">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>
                  
                  <div className="form-group">
                    <div className="relative mt-1 group">
                      <input
                        id="2fa-code"
                        name="2fa-code"
                        type="text"
                        maxLength="6"
                        required
                        className="input pr-10 transition-all text-center text-2xl tracking-widest group-hover:border-primary-300 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
                        placeholder="000000"
                        autoComplete="one-time-code"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
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
                            Verify Code
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </span>
                        )}
                      </span>
                    </button>
                  </div>
                  
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      className="text-gray-600 hover:text-primary-600 text-sm font-medium relative group"
                      onClick={() => setShowBackupCodeOption(true)}
                    >
                      Lost access to your authenticator app?
                      <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleBackupCodeSubmit} className="space-y-6">
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-display font-semibold text-gray-900">Backup Code Verification</h2>
                    <p className="text-gray-500 mt-1">
                      Enter one of your backup codes to access your account
                    </p>
                  </div>
                  
                  <div className="form-group">
                    <div className="relative mt-1 group">
                      <input
                        id="backup-code"
                        name="backup-code"
                        type="text"
                        required
                        className="input pr-10 transition-all text-center group-hover:border-primary-300 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value)}
                        placeholder="Enter your backup code"
                        autoComplete="off"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
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
                        ) : 'Verify Backup Code'}
                      </span>
                    </button>
                  </div>
                  
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      className="text-gray-600 hover:text-primary-600 text-sm font-medium relative group"
                      onClick={() => setShowBackupCodeOption(false)}
                    >
                      Return to authenticator verification
                      <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <>
              {showForgotPassword ? (
                <ForgotPassword onClose={() => setShowForgotPassword(false)} />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
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
                        value={credentials.email}
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
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="form-label flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Password
                      </label>
                      <button
                        type="button"
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors relative group"
                        onClick={() => setShowForgotPassword(true)}
                      >
                        Forgot password?
                        <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                      </button>
                    </div>
                    <div className="relative mt-1 group">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        className="input pr-10 transition-all group-hover:border-primary-300 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                        value={credentials.password}
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
                            Sign In
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
                      Don't have an account?{' '}
                      <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700 transition-colors relative group">
                        Sign up
                        <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login; 