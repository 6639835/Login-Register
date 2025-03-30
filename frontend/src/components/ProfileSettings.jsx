import { useState, useEffect } from 'react';
import { updateProfile, changePassword, deleteAccount, setup2FA, verify2FASetup, disable2FA } from '../services/apiService';

const ProfileSettings = ({ user, onProfileUpdate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile update state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Delete account state
  const [confirmDelete, setConfirmDelete] = useState('');
  const [deleteError, setDeleteError] = useState('');
  
  // 2FA state
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFASuccess, setTwoFASuccess] = useState('');
  const [twoFASetupData, setTwoFASetupData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  
  // Handle profile form input changes
  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
    setProfileError('');
    setProfileSuccess('');
  };
  
  // Handle password form input changes
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
    setPasswordError('');
    setPasswordSuccess('');
  };
  
  // Handle profile update submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await updateProfile(profileData);
      setProfileSuccess('Profile updated successfully');
      onProfileUpdate(result.user);
    } catch (error) {
      setProfileError(error.message || 'Failed to update profile');
    }
  };
  
  // Handle password change submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    // Validate password length
    if (passwordData.new_password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    try {
      await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setPasswordSuccess('Password changed successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      setPasswordError(error.message || 'Failed to change password');
    }
  };
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (confirmDelete !== user.email) {
      setDeleteError('Please enter your email to confirm account deletion');
      return;
    }
    
    try {
      await deleteAccount();
      onLogout();
    } catch (error) {
      setDeleteError(error.message || 'Failed to delete account');
    }
  };
  
  // Handle 2FA setup
  const handleSetup2FA = async () => {
    try {
      setTwoFAError('');
      const result = await setup2FA();
      setTwoFASetupData(result);
    } catch (error) {
      setTwoFAError(error.message || 'Failed to set up 2FA');
    }
  };
  
  // Handle 2FA verification
  const handleVerify2FA = async (e) => {
    e.preventDefault();
    
    if (!verificationCode) {
      setTwoFAError('Please enter the verification code');
      return;
    }
    
    try {
      await verify2FASetup({ code: verificationCode });
      setTwoFASuccess('Two-factor authentication has been enabled');
      setTwoFASetupData(null);
      onProfileUpdate({ ...user, two_factor_enabled: true });
    } catch (error) {
      setTwoFAError(error.message || 'Failed to verify 2FA code');
    }
  };
  
  // Handle 2FA disable
  const handleDisable2FA = async (e) => {
    e.preventDefault();
    
    if (!disablePassword) {
      setTwoFAError('Please enter your password to disable 2FA');
      return;
    }
    
    try {
      await disable2FA({ password: disablePassword });
      setTwoFASuccess('Two-factor authentication has been disabled');
      setDisablePassword('');
      onProfileUpdate({ ...user, two_factor_enabled: false });
    } catch (error) {
      setTwoFAError(error.message || 'Failed to disable 2FA');
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="border-b pb-4 mb-4">
        <div className="flex space-x-3 flex-wrap gap-2">
          <button 
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
              activeTab === 'profile' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
              activeTab === 'password' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
          <button 
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
              activeTab === '2fa' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => { 
              setActiveTab('2fa');
              setTwoFAError('');
              setTwoFASuccess('');
              setTwoFASetupData(null);
            }}
          >
            Two-Factor Auth
          </button>
          <button 
            className={`px-4 py-2 font-medium rounded-lg transition-colors ${
              activeTab === 'delete' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('delete')}
          >
            Delete Account
          </button>
        </div>
      </div>
      
      {/* Profile Update Form */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold">Update Profile</h2>
          
          {profileError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {profileError}
            </div>
          )}
          
          {profileSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {profileSuccess}
            </div>
          )}
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={profileData.name}
              onChange={handleProfileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={profileData.email}
              onChange={handleProfileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Update Profile
          </button>
        </form>
      )}
      
      {/* Password Change Form */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold">Change Password</h2>
          
          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {passwordError}
            </div>
          )}
          
          {passwordSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {passwordSuccess}
            </div>
          )}
          
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="current_password"
              name="current_password"
              value={passwordData.current_password}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="new_password"
              name="new_password"
              value={passwordData.new_password}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm_password"
              name="confirm_password"
              value={passwordData.confirm_password}
              onChange={handlePasswordChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Change Password
          </button>
        </form>
      )}
      
      {/* Two-Factor Authentication */}
      {activeTab === '2fa' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
          
          {twoFAError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {twoFAError}
            </div>
          )}
          
          {twoFASuccess && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded">
              {twoFASuccess}
            </div>
          )}
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {user?.two_factor_enabled 
                    ? 'Your account is protected with two-factor authentication' 
                    : 'Add an extra layer of security to your account'}
                </p>
              </div>
              <div className="flex items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user?.two_factor_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {user?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
          
          {/* 2FA Setup Process */}
          {!user?.two_factor_enabled && !twoFASetupData && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-4">
                Two-factor authentication adds an additional layer of security to your account by requiring more than just a password to sign in.
              </p>
              <button
                type="button"
                onClick={handleSetup2FA}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Set Up Two-Factor Authentication
              </button>
            </div>
          )}
          
          {/* QR Code and Verification */}
          {!user?.two_factor_enabled && twoFASetupData && (
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">1. Scan QR Code</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Scan this QR code with your authenticator app (like Google Authenticator, Authy, or Microsoft Authenticator).
                </p>
                <div className="flex justify-center mb-4">
                  <img 
                    src={`data:image/png;base64,${twoFASetupData.qr_code}`} 
                    alt="2FA QR Code"
                    className="border border-gray-300 p-2 rounded"
                    style={{ width: '200px', height: '200px' }}
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded text-center">
                  <p className="text-sm text-gray-600 mb-1">Or enter this code manually:</p>
                  <p className="font-mono bg-white p-2 rounded border">{twoFASetupData.secret}</p>
                </div>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">2. Verify Setup</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the 6-digit code from your authenticator app to verify setup.
                </p>
                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                      maxLength={6}
                      pattern="\d{6}"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Verify and Activate
                  </button>
                </form>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium mb-2">3. Save Backup Codes</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Keep these backup codes in a safe place. If you lose your phone, you can use these codes to sign in.
                </p>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Backup Codes</span>
                  <button
                    type="button"
                    onClick={() => setShowBackupCodes(!showBackupCodes)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showBackupCodes ? 'Hide' : 'Show'}
                  </button>
                </div>
                
                {showBackupCodes && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {twoFASetupData.backup_codes.map((code, index) => (
                      <div key={index} className="bg-gray-50 p-2 rounded font-mono text-center border">
                        {code}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  <p>• Each backup code can only be used once.</p>
                  <p>• You'll need to generate new codes if you use them all.</p>
                  <p>• Store these somewhere safe but accessible.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Disable 2FA */}
          {user?.two_factor_enabled && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Disable Two-Factor Authentication</h3>
              <p className="text-sm text-gray-600 mb-4">
                If you disable two-factor authentication, your account will be less secure.
              </p>
              <form onSubmit={handleDisable2FA} className="space-y-4">
                <div>
                  <label htmlFor="disable_password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm your password to disable 2FA
                  </label>
                  <input
                    type="password"
                    id="disable_password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Disable Two-Factor Authentication
                </button>
              </form>
            </div>
          )}
        </div>
      )}
      
      {/* Delete Account */}
      {activeTab === 'delete' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-red-600">Delete Account</h2>
          
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            <p className="font-medium">Warning: This action cannot be undone</p>
            <p className="mt-1 text-sm">
              When you delete your account, all your data will be permanently removed. This action cannot be reversed.
            </p>
          </div>
          
          {deleteError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {deleteError}
            </div>
          )}
          
          <div>
            <label htmlFor="confirmDelete" className="block text-sm font-medium text-gray-700 mb-1">
              Enter your email to confirm: {user?.email}
            </label>
            <input
              type="email"
              id="confirmDelete"
              value={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
              placeholder="Enter your email to confirm"
            />
          </div>
          
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Permanently Delete My Account
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings; 