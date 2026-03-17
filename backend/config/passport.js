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

const ALLOWED_OAUTH_ROLES = new Set(['customer', 'salon', 'staff']);

const resolveOAuthRole = (req) => {
  const rawState = req?.query?.state;
  const sessionRole = req?.session?.oauthRole;

  // Accept plain role values and tolerate payload-like state values by extracting a prefix role token.
  const candidateFromState = typeof rawState === 'string' ? rawState.split(/[:|,]/)[0]?.trim() : undefined;

  if (candidateFromState && ALLOWED_OAUTH_ROLES.has(candidateFromState)) {
    return candidateFromState;
  }

  if (sessionRole && ALLOWED_OAUTH_ROLES.has(sessionRole)) {
    return sessionRole;
  }

  return 'customer';
};

const isDuplicateKeyError = (error) => {
  return error && error.code === 11000;
};

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
          
          // Resolve role safely from OAuth state/session with strict allow-list fallback.
          const role = resolveOAuthRole(req);
          
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
          try {
            user = await User.create(userData);
          } catch (createErr) {
            // Handle race conditions where the user is created in a concurrent OAuth callback.
            if (!isDuplicateKeyError(createErr)) {
              throw createErr;
            }
            console.warn('Duplicate user during OAuth create, loading existing account:', email);
            user = await User.findOne({ email });
            if (!user) {
              throw createErr;
            }
          }

          // Create corresponding profile based on role
          switch (role) {
            case 'customer':
              console.log('Creating customer profile');
              await Customer.findOneAndUpdate(
                { email },
                {
                  $setOnInsert: {
                    _id: user._id,
                    email,
                    type: 'customer'
                  },
                  $set: {
                    name,
                    isActive: true
                  }
                },
                { upsert: true, new: true }
              );
              break;
            
            case 'salon':
              console.log('Creating salon profile');
              await Salon.findOneAndUpdate(
                { email },
                {
                  $setOnInsert: {
                    email
                  },
                  $set: {
                    ownerName: name,
                    user: user._id,
                    setupCompleted: false,
                    isActive: true
                  }
                },
                { upsert: true, new: true }
              );
              break;
            
            case 'staff':
              console.log('Creating staff profile');
              await Staff.findOneAndUpdate(
                { email },
                {
                  $setOnInsert: {
                    email
                  },
                  $set: {
                    name,
                    user: user._id,
                    setupCompleted: false,
                    isActive: true
                  }
                },
                { upsert: true, new: true }
              );
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