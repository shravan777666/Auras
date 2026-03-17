import express from 'express';
import passport from 'passport';
import { googleAuth, googleCallback, googleFailure } from '../controllers/authController.js';

const router = express.Router();

// Google OAuth routes
router.get('/google', (req, res, next) => {
  console.log('=== GOOGLE AUTH ROUTE HIT ===');
  console.log('Request details:', {
    url: req.url,
    query: req.query,
    headers: req.headers
  });
  googleAuth(req, res, next);
});

router.get('/google/callback', 
  (req, res, next) => {
    console.log('=== GOOGLE CALLBACK ROUTE HIT ===');
    console.log('Request details:', {
      url: req.url,
      query: req.query,
      headers: req.headers
    });
    next();
  },
  (req, res, next) => {
    passport.authenticate('google', { session: true }, (err, user, info) => {
      if (err) {
        console.error('Google OAuth passport callback error:', err);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3008';
        return res.redirect(`${frontendUrl}/?error=oauth_error&message=${encodeURIComponent(err.message || 'OAuth failed')}`);
      }

      if (!user) {
        console.warn('Google OAuth returned no user:', info);
        return res.redirect('/api/auth/google/failure');
      }

      req.logIn(user, (loginErr) => {
        if (loginErr) {
          console.error('Google OAuth login session error:', loginErr);
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3008';
          return res.redirect(`${frontendUrl}/?error=oauth_error&message=${encodeURIComponent(loginErr.message || 'Session login failed')}`);
        }

        console.log('=== GOOGLE AUTH SUCCESS ===');
        console.log('User authenticated:', req.user);
        return googleCallback(req, res, next);
      });
    })(req, res, next);
  }
);

router.get('/google/failure', (req, res) => {
  console.log('=== GOOGLE AUTH FAILURE ROUTE HIT ===');
  console.log('Request details:', {
    url: req.url,
    query: req.query,
    headers: req.headers
  });
  googleFailure(req, res);
});

export default router;