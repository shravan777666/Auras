# Deployment Guide for Auracare Application

## Backend Deployment on Render

### Environment Variables Required:
1. `MONGODB_URI` - MongoDB connection string
2. `JWT_SECRET` - Secret key for JWT token generation
3. `GOOGLE_CLIENT_ID` - Google OAuth Client ID
4. `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
5. `EMAIL_USER` - Email address for sending notifications
6. `EMAIL_PASS` - App password for email account
7. `SESSION_SECRET` - Secret for session management
8. `FRONTEND_URL` - URL of your deployed frontend (e.g., https://auras.onrender.com)
9. `RAZORPAY_KEY_ID` - Razorpay API key ID
10. `RAZORPAY_KEY_SECRET` - Razorpay API key secret

### Render Configuration:
- Build Command: `npm install`
- Start Command: `npm start`
- Port: `10000` (automatically set by Render)
- Health Check Path: `/health`

## Frontend Deployment on Vercel

### Environment Variables Required:
1. `VITE_API_URL` - URL of your deployed backend API (e.g., https://your-backend.onrender.com/api)

### Vercel Configuration:
- Build Command: `npm install && npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

## Local Development

### Backend (.env file):
```
MONGODB_URI=your_mongodb_connection_string
PORT=5011
NODE_ENV=development
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5011/api/auth/google/callback
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:3008
SESSION_SECRET=your_session_secret
```

### Frontend (.env file):
```
VITE_API_URL=http://localhost:5011/api
```

## Troubleshooting

### CORS Issues:
If you encounter CORS errors, ensure the `FRONTEND_URL` environment variable in your backend matches your frontend URL.

### API Connection Issues:
1. Verify that `VITE_API_URL` in frontend matches your backend URL
2. Check that backend is running and accessible
3. Ensure proper CORS configuration in backend

### Authentication Issues:
1. Verify Google OAuth credentials are correct
2. Ensure `GOOGLE_CALLBACK_URL` matches your deployed backend URL
3. Check that `FRONTEND_URL` is correctly set
