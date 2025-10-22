import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser } = useAuth();
  const toastShownRef = useRef(false); // Ref to track if toast has been shown

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
          let errorMessage = 'Authentication failed';
          switch (error) {
            case 'oauth_failed':
              errorMessage = 'Google authentication failed. Please try again.';
              break;
            case 'oauth_cancelled':
              errorMessage = 'Google authentication was cancelled.';
              break;
            case 'oauth_error':
              errorMessage = 'An error occurred during authentication.';
              break;
            case 'invalid_role':
              errorMessage = 'Invalid user role detected.';
              break;
            default:
              errorMessage = 'Authentication failed. Please try again.';
          }
          
          toast.error(errorMessage);
          navigate('/login');
          return;
        }

        if (!token || !userParam) {
          toast.error('Invalid authentication response');
          navigate('/login');
          return;
        }

        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Store token and user info
        localStorage.setItem('auracare_token', token);
        localStorage.setItem('auracare_user', JSON.stringify(user));

        // Update auth context directly (avoid calling API login)
        updateUser(user);

        // Show success message only once
        if (!toastShownRef.current) {
          toast.success(`Welcome ${user.name}! Redirecting to your dashboard...`);
          toastShownRef.current = true;
        }

        // Redirect based on user type and setup status
        setTimeout(() => {
          switch (user.type) {
            case 'customer':
              navigate('/customer/dashboard');
              break;
            case 'salon':
              navigate(user.setupCompleted ? '/salon/dashboard' : '/salon/setup');
              break;
            case 'staff':
              navigate(user.setupCompleted ? '/staff/dashboard' : '/staff/setup');
              break;
            case 'admin':
              navigate('/admin/dashboard');
              break;
            default:
              navigate('/login');
          }
        }, 1000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error('Failed to process authentication. Please try again.');
        navigate('/login');
      }
    };

    handleOAuthCallback();
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Processing your authentication...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;