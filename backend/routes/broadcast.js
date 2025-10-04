import express from 'express';
import {
  getAllSkills,
  getTargetCount,
  sendBroadcast,
  getBroadcastHistory,
  getBroadcastAnalytics,
  getBroadcastDetails
} from '../controllers/broadcastController.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireSalonOwner, requireSalonSetup } from '../middleware/roleAuth.js';
import { body, query, param, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation error', 
      errors: errors.array() 
    });
  }
  next();
};

// Validation rules
const validateBroadcast = [
  body('subject')
    .notEmpty()
    .withMessage('Subject is required')
    .isLength({ max: 200 })
    .withMessage('Subject must be 200 characters or less'),
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 2000 })
    .withMessage('Message must be 2000 characters or less'),
  body('targetSkill')
    .notEmpty()
    .withMessage('Target skill is required'),
  body('category')
    .optional()
    .isIn(['opportunity', 'announcement', 'training', 'event', 'general'])
    .withMessage('Invalid category'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  handleValidation
];

const validateTargetCount = [
  query('skill')
    .notEmpty()
    .withMessage('Skill parameter is required'),
  handleValidation
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidation
];

const validateBroadcastId = [
  param('broadcastId')
    .isMongoId()
    .withMessage('Invalid broadcast ID'),
  handleValidation
];

// Apply authentication and authorization to all routes
router.use(authenticateToken);
router.use(requireSalonOwner);
router.use(requireSalonSetup);

// Routes

// GET /api/broadcast/skills - Get all unique skills
router.get('/skills', getAllSkills);

// GET /api/broadcast/target-count - Get target count for specific skill
router.get('/target-count', validateTargetCount, getTargetCount);

// POST /api/broadcast/send - Send broadcast to staff
router.post('/send', validateBroadcast, sendBroadcast);

// GET /api/broadcast/history - Get broadcast history for salon
router.get('/history', validatePagination, getBroadcastHistory);

// GET /api/broadcast/analytics - Get broadcast analytics
router.get('/analytics', getBroadcastAnalytics);

// GET /api/broadcast/:broadcastId - Get detailed broadcast information
router.get('/:broadcastId', validateBroadcastId, getBroadcastDetails);

export default router;
