import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../services/api';
import { ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState({
    isLoading: true,
    isSuccess: false,
    message: 'Verifying your email address...',
  });
  
  useEffect(() => {
    // If reason parameter exists, it means there was an error from the backend redirect
    if (reason) {
      let errorMessage = 'Failed to verify your email address.';
      
      if (reason === 'used') {
        errorMessage = 'This verification link has already been used.';
      } else if (reason === 'invalid') {
        errorMessage = 'This verification link is invalid or has expired.';
      } else if (reason === 'user') {
        errorMessage = 'User account not found for this verification link.';
      }
      
      setStatus({
        isLoading: false,
        isSuccess: false,
        message: errorMessage,
      });
      return;
    }
    
    // If no token, don't attempt verification
    if (!token) {
      setStatus({
        isLoading: false,
        isSuccess: false,
        message: 'No verification token provided.',
      });
      return;
    }
    
    const verifyUserEmail = async () => {
      try {
        const response = await verifyEmail(token);
        setStatus({
          isLoading: false,
          isSuccess: true,
          message: response.message || 'Email verified successfully!',
        });
        toast.success('Email verification successful!');
        
        // Auto-redirect after successful verification
        setTimeout(() => {
          navigate('/login?verified=true');
        }, 3000);
      } catch (error) {
        setStatus({
          isLoading: false,
          isSuccess: false,
          message: error.message || 'Failed to verify email address.',
        });
        toast.error(error.message || 'Verification failed');
      }
    };
    
    verifyUserEmail();
  }, [token, reason, navigate]);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {status.isLoading ? (
          <ArrowPathIcon className="mx-auto h-12 w-12 text-primary-600 animate-spin" />
        ) : status.isSuccess ? (
          <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
        ) : (
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-500" />
        )}
        
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {status.isLoading ? 'Verifying Email' : status.isSuccess ? 'Email Verified!' : 'Verification Failed'}
        </h2>
        
        <p className="mt-2 text-center text-sm text-gray-600">
          {status.message}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow rounded-lg sm:px-10">
          <div className="space-y-6">
            {status.isSuccess ? (
              <>
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-800">
                        Your email has been successfully verified. You will be redirected to the login page shortly.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Go to login
                  </Link>
                </div>
              </>
            ) : !status.isLoading && (
              <>
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">
                        {status.message} Please try again or request a new verification link.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="text-center space-y-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Go to login
                  </Link>
                  
                  <div>
                    <Link 
                      to="/forgot-password" 
                      className="font-medium text-primary-600 hover:text-primary-500 flex items-center justify-center mt-4"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-1" />
                      Request new verification
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail; 