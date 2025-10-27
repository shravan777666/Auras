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
    console.log('OAuthCallback component mounted');
    console.log('Current search params:', Object.fromEntries(searchParams.entries()));
    
    const handleOAuthCallback = async () => {
      try {
        const token = searchParams.get('token');
        const email = searchParams.get('email');
        const name = searchParams.get('name');
        const type = searchParams.get('type');
        const setupCompleted = searchParams.get('setupCompleted') === 'true';
        const error = searchParams.get('error');
        const message = searchParams.get('message');

        console.log('Parsed params:', { token, email, name, type, setupCompleted, error, message });

        // Handle error cases first
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
              errorMessage = message || 'An error occurred during authentication.';
              break;
            case 'user_not_found':
              errorMessage = 'User not found in database. Please register first.';
              break;
            default:
              errorMessage = 'Authentication failed. Please try again.';
          }
          
          console.log('OAuth error:', errorMessage);
          toast.error(errorMessage);
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }

        // Check for required parameters
        if (!token || !email || !name || !type) {
          console.log('Missing required parameters');
          toast.error('Invalid authentication response. Redirecting to login...');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }

        // Extract user ID from JWT token
        let userId = null;
        try {
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload.id || null;
          }
        } catch (e) {
          console.error('Error extracting user ID from token:', e);
        }

        // Reconstruct user object from individual parameters
        const user = {
          id: userId || generateTempId(), // Use extracted ID or generate temporary one
          name,
          email,
          type,
          setupCompleted: setupCompleted || type === 'customer' // Customers don't need setup
        };
        
        console.log('Reconstructed user:', user);
        
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
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        toast.error('Failed to process authentication. Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    };

    // Helper function to generate a temporary ID
    const generateTempId = () => {
      return 'temp_' + Math.random().toString(36).substr(2, 9);
    };

    handleOAuthCallback();
  }, [searchParams, navigate, updateUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600">Processing your authentication...</p>
        <p className="mt-2 text-sm text-gray-500">If you see this page for more than a few seconds, please check the browser console for errors.</p>
      </div>
    </div>
  );
};

export default OAuthCallback;