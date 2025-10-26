import React from 'react';
import { Button } from '@mui/material';

const GoogleOAuthButton = ({ role = 'customer', variant = "outlined", fullWidth = true, children }) => {
  const handleGoogleAuth = () => {
    // Get the backend API URL from environment variables
    const apiUrl = import.meta.env.VITE_API_URL;
    
    // Debug logging
    console.log('Google OAuth Button - Environment Variables:', {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      apiUrl,
      role
    });
    
    // Construct the OAuth URL
    // The OAuth endpoint is at /api/auth/google relative to the API base URL
    // Fix: Use apiUrl directly without replacing '/api'
    const authUrl = `${apiUrl}/auth/google?role=${role}`;
    
    console.log('Constructed Google OAuth URL:', authUrl);
    
    // Redirect to Google OAuth
    window.location.href = authUrl;
  };

  return (
    <Button
      variant={variant}
      fullWidth={fullWidth}
      onClick={handleGoogleAuth}
      startIcon={
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      }
      sx={{
        textTransform: 'none',
        fontSize: '16px',
        padding: '12px 16px',
        border: '1px solid #dadce0',
        color: '#3c4043',
        '&:hover': {
          backgroundColor: '#f8f9fa',
          border: '1px solid #dadce0',
        },
      }}
    >
      {children || 'Continue with Google'}
    </Button>
  );
};

export default GoogleOAuthButton;