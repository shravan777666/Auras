// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

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

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log('✅ Registering Google OAuth strategy');
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `http://localhost:${process.env.PORT || 5000}/auth/google/callback`,
        passReqToCallback: true // This allows us to access req.query.role
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
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
            delete req.session.oauthRole;
          }

          if (!email) {
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
            // Existing user - update Google info if needed
            if (!user.googleId) {
              user.googleId = googleId;
              user.provider = 'google';
              user.avatar = avatar;
              await user.save();
            }
            return done(null, user);
          }

          // New user - create based on role
          if (!role || !['customer', 'salon', 'staff'].includes(role)) {
            return done(new Error('Invalid or missing role parameter'));
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

          user = await User.create(userData);

          // Create corresponding profile based on role
          switch (role) {
            case 'customer':
              await Customer.create({
                name,
                email,
                user: user._id,
                isActive: true
              });
              break;
            
            case 'salon':
              await Salon.create({
                ownerName: name,
                email,
                user: user._id,
                setupCompleted: false,
                isActive: true
              });
              break;
            
            case 'staff':
              await Staff.create({
                name,
                email,
                user: user._id,
                setupCompleted: false,
                isActive: true
              });
              break;
          }

          return done(null, user);
        } catch (err) {
          console.error('Google OAuth Error:', err);
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