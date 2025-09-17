# Google OAuth 2.0 Setup Guide

This guide will help you set up Google OAuth 2.0 authentication for the Beauty Parlor Management System.

## Prerequisites

1. A Google Cloud Platform account
2. The backend and frontend servers running
3. MongoDB database connection

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google People API)

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, navigate to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type (unless you have a Google Workspace account)
3. Fill in the required information:
   - **App name**: Beauty Parlor Management System
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Add the following scopes:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
5. Add test users (your email addresses) for testing

## Step 3: Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application** as the application type
4. Configure the settings:
   - **Name**: Beauty Parlor OAuth Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:5004` (backend)
     - `http://localhost:3004` (frontend)
   - **Authorized redirect URIs**:
     - `http://localhost:5004/auth/google/callback`
5. Click **Create** and copy the Client ID and Client Secret

## Step 4: Configure Backend Environment

1. Copy `.env.example` to `.env` in the backend directory:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your Google OAuth credentials:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/auracare
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   
   # Server
   PORT=5004
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3004
   
   # Session
   SESSION_SECRET=your-session-secret-here
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id-from-step-3
   GOOGLE_CLIENT_SECRET=your-google-client-secret-from-step-3
   GOOGLE_CALLBACK_URL=http://localhost:5004/auth/google/callback
   ```

## Step 5: Test the OAuth Flow

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to the frontend URL (usually `http://localhost:3004`)

4. Go to the login or register page

5. Select your user role (Customer, Salon Owner, or Staff)

6. Click the "Continue with Google" button

7. You should be redirected to Google's OAuth consent screen

8. After authorizing, you should be redirected back to your application

## User Roles and Redirection

The system supports three user roles with different post-authentication flows:

### Customer
- **Setup Required**: No
- **Redirect**: Directly to Customer Dashboard
- **Profile Creation**: Automatic Customer profile creation

### Salon Owner
- **Setup Required**: Yes
- **Redirect**: To Salon Setup page (first time) or Salon Dashboard (returning)
- **Profile Creation**: Automatic Salon profile creation
- **Additional Step**: Requires admin approval after setup

### Staff
- **Setup Required**: Yes
- **Redirect**: To Staff Setup page (first time) or Staff Dashboard (returning)
- **Profile Creation**: Automatic Staff profile creation

## Troubleshooting

### Common Issues

1. **"Error 400: redirect_uri_mismatch"**
   - Ensure the redirect URI in Google Cloud Console matches exactly: `http://localhost:5004/auth/google/callback`
   - Check that there are no trailing slashes or extra characters

2. **"Access blocked: This app's request is invalid"**
   - Make sure you've configured the OAuth consent screen properly
   - Add your email as a test user if the app is not published

3. **"Cannot find module 'express-session'"**
   - Install the missing dependency: `npm install express-session`

4. **OAuth callback errors**
   - Check that the backend server is running on the correct port (5004)
   - Verify the FRONTEND_URL environment variable is set correctly

### Debug Mode

To enable debug logging for OAuth:

1. Add to your `.env` file:
   ```env
   DEBUG=passport:*
   ```

2. Restart the backend server

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use strong session secrets** in production
3. **Enable HTTPS** in production environments
4. **Regularly rotate OAuth credentials**
5. **Limit OAuth scopes** to only what's necessary

## Production Deployment

For production deployment:

1. Update OAuth redirect URIs to use your production domain
2. Set `NODE_ENV=production`
3. Use environment-specific configuration
4. Enable HTTPS
5. Use secure session configuration
6. Publish your OAuth consent screen (optional)

## API Endpoints

The following OAuth endpoints are available:

- `GET /auth/google?role={role}` - Initiate OAuth flow
- `GET /auth/google/callback` - OAuth callback handler
- `GET /auth/failure` - OAuth failure handler

## Frontend Integration

The frontend includes:

- `GoogleOAuthButton` component for role-based OAuth initiation
- `OAuthCallback` component for handling OAuth responses
- Automatic token storage and user redirection
- Error handling for OAuth failures

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check the backend server logs
3. Verify your Google Cloud Console configuration
4. Ensure all environment variables are set correctly
