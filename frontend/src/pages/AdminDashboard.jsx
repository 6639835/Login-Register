import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 获取用户数据
        const usersResponse = await axios.get('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // 获取token黑名单数据
        const tokensResponse = await axios.get('/api/admin/tokens', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        setUsers(usersResponse.data.users);
        setTokens(tokensResponse.data.tokens);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data. You might not have admin privileges.');
        setLoading(false);
        
        // 如果返回401或403，可能是没有管理员权限
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          setTimeout(() => navigate('/login'), 2000);
        }
      }
    };

    fetchData();
  }, [navigate]);

  // 处理删除用户
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/admin/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setUsers(users.filter(user => user.id !== userId));
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Failed to delete user');
      }
    }
  };

  // 切换用户验证状态
  const handleToggleVerification = async (userId, currentStatus) => {
    try {
      await axios.put(`/api/admin/users/${userId}/verify`, 
        { is_verified: !currentStatus },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // 更新本地状态
      setUsers(users.map(user => {
        if (user.id === userId) {
          return { ...user, is_verified: !user.is_verified };
        }
        return user;
      }));
    } catch (err) {
      console.error('Error updating user verification:', err);
      alert('Failed to update user verification status');
    }
  };

  if (loading) return <div className="container mx-auto p-4">Loading...</div>;
  if (error) return <div className="container mx-auto p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <a 
          href="/dashboard" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
      
      {/* 选项卡 */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px">
          <li className="mr-2">
            <button 
              className={`inline-block p-4 ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('users')}
            >
              Users
            </button>
          </li>
          <li className="mr-2">
            <button 
              className={`inline-block p-4 ${activeTab === 'tokens' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('tokens')}
            >
              Token Blacklist
            </button>
          </li>
        </ul>
      </div>
      
      {/* 用户数据表格 */}
      {activeTab === 'users' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">ID</th>
                <th className="py-2 px-4 border-b text-left">Name</th>
                <th className="py-2 px-4 border-b text-left">Email</th>
                <th className="py-2 px-4 border-b text-left">Auth Type</th>
                <th className="py-2 px-4 border-b text-left">Verified</th>
                <th className="py-2 px-4 border-b text-left">2FA Enabled</th>
                <th className="py-2 px-4 border-b text-left">Created At</th>
                <th className="py-2 px-4 border-b text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{user.id}</td>
                  <td className="py-2 px-4 border-b">{user.name}</td>
                  <td className="py-2 px-4 border-b">{user.email}</td>
                  <td className="py-2 px-4 border-b">{user.auth_type}</td>
                  <td className="py-2 px-4 border-b">
                    <span 
                      className={`inline-block px-2 py-1 rounded text-xs ${user.is_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {user.is_verified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">
                    <span 
                      className={`inline-block px-2 py-1 rounded text-xs ${user.two_factor_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {user.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-2 px-4 border-b">{new Date(user.created_at).toLocaleString()}</td>
                  <td className="py-2 px-4 border-b">
                    <button 
                      onClick={() => handleToggleVerification(user.id, user.is_verified)}
                      className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                    >
                      {user.is_verified ? 'Unverify' : 'Verify'}
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-4 text-center text-gray-500">No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Token黑名单表格 */}
      {activeTab === 'tokens' && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b text-left">ID</th>
                <th className="py-2 px-4 border-b text-left">Token (truncated)</th>
                <th className="py-2 px-4 border-b text-left">Type</th>
                <th className="py-2 px-4 border-b text-left">Blacklisted At</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(token => (
                <tr key={token.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b">{token.id}</td>
                  <td className="py-2 px-4 border-b">{token.token.substring(0, 20)}...</td>
                  <td className="py-2 px-4 border-b">{token.token_type}</td>
                  <td className="py-2 px-4 border-b">{new Date(token.blacklisted_at).toLocaleString()}</td>
                </tr>
              ))}
              {tokens.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-500">No blacklisted tokens found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 