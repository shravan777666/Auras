// Load environment variables first
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Salon from '../models/Salon.js';
import Staff from '../models/Staff.js';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, { id: user._id, type: user.type });
});

// Deserialize user from session
passport.deserializeUser(async (sessionData, done) => {
  try {
    const user = await User.findById(sessionData.id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Google OAuth Strategy
console.log('Checking Google OAuth environment variables...');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'Not set (using default)');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ Registering Google OAuth strategy');
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || (process.env.NODE_ENV === 'production' 
        ? "https://auracare-backend.onrender.com/api/auth/google/callback"
        : "http://localhost:5011/api/auth/google/callback"),
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          console.log('=== GOOGLE OAUTH CALLBACK EXECUTED ===');
          console.log('Google OAuth callback received:', {
            profile: {
              id: profile.id,
              displayName: profile.displayName,
              emails: profile.emails,
              photos: profile.photos
            },
            reqQuery: req.query,
            reqSession: req.session
          });

          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const name = profile.displayName;
          const avatar = profile.photos?.[0]?.value;
          
          // Get role from session (stored in googleAuth function) or from state parameter
          // Google sends the state parameter back in req.query.state during callback
          let role = req.query?.state || req.session?.oauthRole;
          
          // Log OAuth role resolution for debugging
          console.log('OAuth User Registration - Role:', role, 'Email:', email);
          
          // Clear the session role after use to prevent conflicts
          if (req.session?.oauthRole) {
            console.log('Clearing session role:', req.session.oauthRole);
            delete req.session.oauthRole;
          }

          if (!email) {
            console.log('❌ No email found in Google profile');
            return done(new Error('No email found in Google profile'));
          }

          // Check if user already exists
          let user = await User.findOne({ 
            $or: [
              { email: email },
              { googleId: googleId }
            ]
          });

          if (user) {
            console.log('User already exists:', user.email, user.type);
            // Existing user - update Google info if needed
            if (!user.googleId) {
              user.googleId = googleId;
              user.provider = 'google';
              user.avatar = avatar;
              await user.save();
              console.log('Updated existing user with Google info');
            }
            return done(null, user);
          }

          // New user - create based on role
          if (!role || !['customer', 'salon', 'staff'].includes(role)) {
            console.log('Invalid or missing role parameter:', role);
            // Default to customer if no valid role provided
            role = 'customer';
            console.log('Defaulting to customer role');
          }

          // Create new user
          const userData = {
            name,
            email,
            googleId,
            provider: 'google',
            avatar,
            type: role,
            setupCompleted: role === 'customer' ? true : false, // Customers don't need setup
            isActive: true
          };

          console.log('Creating new user with data:', userData);
          user = await User.create(userData);

          // Create corresponding profile based on role
          switch (role) {
            case 'customer':
              console.log('Creating customer profile');
              await Customer.create({
                _id: user._id, // Use the same ID as the User document for consistency
                name,
                email,
                isActive: true
              });
              break;
            
            case 'salon':
              console.log('Creating salon profile');
              await Salon.create({
                ownerName: name,
                email,
                user: user._id,
                setupCompleted: false,
                isActive: true
              });
              break;
            
            case 'staff':
              console.log('Creating staff profile');
              await Staff.create({
                name,
                email,
                user: user._id,
                setupCompleted: false,
                isActive: true
              });
              break;
          }

          console.log('User created successfully:', user.email, user.type);
          return done(null, user);
        } catch (err) {
          console.error('Google OAuth Error:', err);
          console.error('Error stack:', err.stack);
          return done(err);
        }
      }
    )
  );
} else {
  console.log('❌ Google OAuth strategy NOT registered - missing environment variables');
  console.log('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file');
}

export default passport;