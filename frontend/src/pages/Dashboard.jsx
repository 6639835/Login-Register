import { useState, useEffect } from 'react';
import { getCurrentUser, resendVerificationEmail, checkVerificationStatus } from '../services/apiService';
import ProfileSettings from '../components/ProfileSettings';

const Dashboard = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);
        
        // Fetch verification status
        if (userData.auth_type === 'email') {
          const status = await checkVerificationStatus();
          setVerificationStatus(status);
        }
      } catch (err) {
        setError('Failed to fetch user data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleResendVerification = async () => {
    if (isResendingVerification) return;
    
    setIsResendingVerification(true);
    setResendSuccess(false);
    
    try {
      await resendVerificationEmail(user.email);
      setResendSuccess(true);
      
      // Reset after 5 seconds
      setTimeout(() => {
        setResendSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error resending verification:', err);
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setIsResendingVerification(false);
    }
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-soft">
        <div className="page-container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-xl font-display font-bold text-gray-900">SecureAuth</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center">
                {user?.two_factor_enabled && (
                  <span className="badge badge-success mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    2FA Enabled
                  </span>
                )}
                <p className="text-sm text-gray-600 mr-2">Welcome,</p>
                <p className="font-medium text-gray-900">{user?.name}</p>
              </div>
              <div className="relative group">
                <button className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">
                  {user?.profile_image ? (
                    <img src={user.profile_image} alt={user.name} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-medium">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-soft-lg py-2 z-10 hidden group-hover:block">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setActiveTab('settings')}
                  >
                    Profile Settings
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={onLogout}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="page-container py-8">
        {/* Verification banner for email users */}
        {user?.auth_type === 'email' && verificationStatus && !verificationStatus.is_verified && (
          <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 mb-6 shadow-soft-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-warning-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-warning-700">
                  Your email address is not verified. Please check your inbox for a verification link or 
                  <button 
                    onClick={handleResendVerification}
                    disabled={isResendingVerification}
                    className="font-medium underline ml-1 focus:outline-none"
                  >
                    {isResendingVerification ? 'sending...' : 'click here to resend'}
                  </button>.
                </p>
                {resendSuccess && (
                  <p className="text-sm text-success-600 mt-2">
                    Verification email sent successfully! Please check your inbox.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary-50 text-primary-700 border border-primary-100'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-primary-50 text-primary-700 border border-primary-100'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Settings
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' ? (
          <div className="fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* User Profile Card */}
              <div className="md:col-span-1">
                <div className="card card-hover">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-24 h-24 mb-4">
                      {user?.profile_image ? (
                        <img src={user.profile_image} alt={user.name} className="w-24 h-24 rounded-full" />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white text-3xl font-medium">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                    <p className="text-gray-500 mb-4">{user?.email}</p>
                    
                    <div className="flex flex-wrap justify-center gap-2">
                      <span className="badge badge-gray">
                        {user?.auth_type === 'email' ? 'Email Login' : `${user?.auth_type.charAt(0).toUpperCase() + user?.auth_type.slice(1)} Login`}
                      </span>
                      {user?.is_verified && (
                        <span className="badge badge-success">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Verified
                        </span>
                      )}
                      {user?.two_factor_enabled && (
                        <span className="badge badge-info">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          2FA
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="divider"></div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Member since</span>
                      <span className="text-sm font-medium">{new Date(user?.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Last updated</span>
                      <span className="text-sm font-medium">{new Date(user?.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Security Status Card */}
              <div className="md:col-span-2">
                <div className="card card-hover">
                  <h3 className="text-lg font-bold mb-4">Security Status</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${user?.is_verified ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                        {user?.is_verified ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-base font-medium">Email Verification</h4>
                        <p className="text-sm text-gray-600">
                          {user?.is_verified 
                            ? 'Your email is verified. You can receive important notifications.'
                            : 'Please verify your email to fully secure your account.'}
                        </p>
                      </div>
                      {!user?.is_verified && (
                        <button
                          onClick={handleResendVerification}
                          disabled={isResendingVerification}
                          className="btn btn-sm btn-outline"
                        >
                          {isResendingVerification ? 'Sending...' : 'Verify Now'}
                        </button>
                      )}
                    </div>
                    
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${user?.two_factor_enabled ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                        {user?.two_factor_enabled ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-base font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-gray-600">
                          {user?.two_factor_enabled 
                            ? 'Your account is protected with two-factor authentication.'
                            : 'Add an extra layer of security to your account with 2FA.'}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="btn btn-sm btn-outline"
                      >
                        {user?.two_factor_enabled ? 'Manage' : 'Enable'}
                      </button>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-base font-medium">Account Preferences</h4>
                        <p className="text-sm text-gray-600">
                          Manage your profile information and account settings.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="btn btn-sm btn-outline"
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="card card-hover mt-6">
                  <h3 className="text-lg font-bold mb-4">Login Information</h3>
                  
                  <div className="overflow-hidden bg-gray-50 rounded-xl">
                    <div className="grid grid-cols-2 divide-x divide-gray-200">
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-500 mb-1">Authentication Type</p>
                        <div className="text-base font-medium capitalize">
                          {user?.auth_type === 'email' ? (
                            <div className="flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Email Login
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {user?.auth_type.charAt(0).toUpperCase() + user?.auth_type.slice(1)} Login
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-500 mb-1">Login Security Level</p>
                        <div className="text-base font-medium">
                          {user?.two_factor_enabled ? (
                            <div className="flex items-center justify-center text-success-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Advanced (2FA)
                            </div>
                          ) : (
                            <div className="flex items-center justify-center text-warning-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Basic
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="fade-in">
            <ProfileSettings user={user} onProfileUpdate={handleProfileUpdate} onLogout={onLogout} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard; 