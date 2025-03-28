import React from 'react';

const SocialLogin = () => {
  const handleSocialLogin = (provider) => {
    window.location.href = `http://localhost:5000/api/auth/${provider}`;
  };
  
  return (
    <div className="mt-8">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-3 gap-3">
        <button 
          type="button"
          onClick={() => handleSocialLogin('github')}
          className="btn btn-secondary flex justify-center items-center hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37273 0 0 5.37273 0 12C0 17.31 3.435 21.8264 8.20455 23.4545C8.80909 23.5636 9 23.1818 9 22.8545C9 22.5545 9 21.8182 9 20.8091C5.67273 21.5455 4.96364 19.2 4.96364 19.2C4.41818 17.8036 3.63636 17.4545 3.63636 17.4545C2.54545 16.7273 3.72727 16.7273 3.72727 16.7273C4.90909 16.8182 5.54545 17.9673 5.54545 17.9673C6.54545 19.8 8.30909 19.2545 9 18.9273C9.13636 18.1364 9.44545 17.5909 9.77273 17.2909C7.13636 16.9909 4.34545 15.9545 4.34545 11.3182C4.34545 10.0091 4.8 8.94545 5.54545 8.06364C5.4 7.77273 5 6.55455 5.63636 4.92727C5.63636 4.92727 6.63636 4.60909 8.96364 6.13636C9.93636 5.87273 10.95 5.73636 12 5.73636C13.05 5.73636 14.0636 5.87273 15.0364 6.13636C17.3636 4.60909 18.3636 4.92727 18.3636 4.92727C19 6.55455 18.6 7.77273 18.4545 8.06364C19.2 8.94545 19.6545 10.0091 19.6545 11.3182C19.6545 15.9545 16.8545 16.9909 14.2182 17.2909C14.6364 17.6727 15 18.4091 15 19.5545C15 21.1818 15 22.4364 15 22.8545C15 23.1818 15.1909 23.5636 15.8 23.4545C20.565 21.8264 24 17.31 24 12C24 5.37273 18.6273 0 12 0Z"/>
          </svg>
        </button>
        
        <button 
          type="button"
          onClick={() => handleSocialLogin('facebook')}
          className="btn btn-secondary flex justify-center items-center hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </button>
        
        <button 
          type="button"
          onClick={() => handleSocialLogin('google')}
          className="btn btn-secondary flex justify-center items-center hover:bg-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107"/>
            <path d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z" fill="#FF3D00"/>
            <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z" fill="#4CAF50"/>
            <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SocialLogin; 