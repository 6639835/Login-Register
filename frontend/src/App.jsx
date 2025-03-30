import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import OAuthCallback from './pages/OAuthCallback';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { isAuthenticated, getCurrentUser } from './services/apiService';

function App() {
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null
  });
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is authenticated on initial load
    const checkAuth = () => {
      const authState = isAuthenticated();
      const user = getCurrentUser();
      
      setAuthStatus({
        isAuthenticated: authState,
        user: user,
        isLoading: false
      });
    };
    
    checkAuth();
    
    // Handle session expiry events
    const handleSessionExpiry = () => {
      setAuthStatus({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });
      navigate('/login?session_expired=true');
    };
    
    window.addEventListener('auth:sessionExpired', handleSessionExpiry);
    
    return () => {
      window.removeEventListener('auth:sessionExpired', handleSessionExpiry);
    };
  }, [navigate]);

  const handleLogin = (token) => {
    setAuthStatus({
      isAuthenticated: true,
      isLoading: false,
      user: getCurrentUser()
    });
  };

  const handleLogout = () => {
    setAuthStatus({
      isAuthenticated: false,
      isLoading: false,
      user: null
    });
  };
  
  if (authStatus.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans antialiased text-gray-900 bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '8px',
            background: '#fff',
            color: '#333',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.1)'
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
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
              element={authStatus.isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/login" 
              element={!authStatus.isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/register" 
              element={!authStatus.isAuthenticated ? <Register onLogin={handleLogin} /> : <Navigate to="/dashboard" />} 
            />
            <Route 
              path="/oauth/callback" 
              element={<OAuthCallback onLogin={handleLogin} />} 
            />
            <Route 
              path="/dashboard" 
              element={authStatus.isAuthenticated ? <Dashboard user={authStatus.user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/verify-email/:token" 
              element={<VerifyEmail />} 
            />
            <Route 
              path="/forgot-password" 
              element={<ForgotPassword />} 
            />
            <Route 
              path="/reset-password/:token" 
              element={<ResetPassword onLogin={handleLogin} />} 
            />
            <Route 
              path="/verification-success" 
              element={<Navigate to="/login?verified=true" />} 
            />
            <Route 
              path="/verification-failed" 
              element={<VerifyEmail error={true} />} 
            />
            <Route 
              path="*" 
              element={<Navigate to="/" />} 
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