import express from 'express';
import passport from 'passport';
import { googleAuth, googleCallback, googleFailure } from '../controllers/authController.js';

const router = express.Router();

// Google OAuth routes
router.get('/google', googleAuth);

router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/auth/google/failure',
    session: true // Keep session to preserve role data
  }), 
  googleCallback
);

router.get('/google/failure', googleFailure);

export default router;
