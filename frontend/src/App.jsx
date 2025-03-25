import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import OAuthCallback from './pages/OAuthCallback';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Check if user is authenticated on initial load
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <div className="min-h-screen font-sans antialiased text-gray-900">
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login onLogin={login} /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <Register onLogin={login} /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/oauth/callback" 
          element={<OAuthCallback onLogin={login} />} 
        />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard onLogout={logout} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </div>
  );
}

export default App; 