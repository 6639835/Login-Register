import { useState } from 'react';
import { updateProfile, changePassword, deleteAccount } from '../services/apiService';

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
  
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="border-b pb-4 mb-4">
        <div className="flex space-x-4">
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
      
      {/* Delete Account Form */}
      {activeTab === 'delete' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-red-600">Delete Account</h2>
          <p className="text-gray-600">
            This action is permanent and cannot be undone. All your data will be permanently removed.
          </p>
          
          {deleteError && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {deleteError}
            </div>
          )}
          
          <div>
            <label htmlFor="confirm_delete" className="block text-sm font-medium text-gray-700 mb-1">
              Type your email to confirm: <span className="font-medium">{user.email}</span>
            </label>
            <input
              type="text"
              id="confirm_delete"
              value={confirmDelete}
              onChange={(e) => {
                setConfirmDelete(e.target.value);
                setDeleteError('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            />
          </div>
          
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Permanently Delete Account
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings; 