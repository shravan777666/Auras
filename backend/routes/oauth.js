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
  passport.authenticate('google', { 
    failureRedirect: '/google/failure',
    session: true // Keep session to preserve role data
  }), 
  (req, res, next) => {
    console.log('=== GOOGLE AUTH SUCCESS ===');
    console.log('User authenticated:', req.user);
    googleCallback(req, res, next);
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