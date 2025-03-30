import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import OAuthCallback from './pages/OAuthCallback';
import VerifyEmail from './pages/VerifyEmail';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated on initial load
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans antialiased text-gray-900 bg-gray-50">
      <div className="min-h-screen flex flex-col">
        {/* Background elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-secondary-200 to-secondary-300 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-gradient-to-br from-warning-200 to-warning-300 rounded-full mix-blend-multiply blur-3xl opacity-20 animate-pulse-slow"></div>
        </div>
        
        {/* Main content */}
        <main className="flex-grow z-10">
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
            <Route 
              path="/verify-email/:token" 
              element={<VerifyEmail />} 
            />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="py-6 text-center text-gray-500 text-sm mt-auto z-10">
          <div className="page-container">
            <p>&copy; {new Date().getFullYear()} SecureAuth App. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App; 