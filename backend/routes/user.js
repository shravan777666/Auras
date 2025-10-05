import express from 'express';
import { searchUsers } from '../controllers/userController.js';
import { authenticateToken as auth, requireRole as roleAuth } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/users/search
// @desc    Search for users
// @access  Private (Salon Owner)
router.get('/search', auth, roleAuth('salon'), searchUsers);

export default router;