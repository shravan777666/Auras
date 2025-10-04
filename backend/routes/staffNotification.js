import express from 'express';
import {
  getStaffNotifications,
  markNotificationAsRead,
  markMultipleAsRead,
  archiveNotification,
  getNotificationStats,
  sendReply
} from '../controllers/staffNotificationController.js';
import { requireStaff } from '../middleware/roleAuth.js';
import { body, query, param, validationResult } from 'express-validator';

const router = express.Router();

// Validation middleware
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({ 
      success: false, 
      message: 'Validation error', 
      errors: errors.array() 
    });
  }
  next();
};

// Validation rules
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('unreadOnly')
    .optional()
    .isIn(['true', 'false', true, false])
    .withMessage('unreadOnly must be a boolean value'),
  query('includeArchived')
    .optional()
    .isIn(['true', 'false', true, false])
    .withMessage('includeArchived must be a boolean value'),
  query('category')
    .optional()
    .isIn(['opportunity', 'announcement', 'training', 'event', 'general'])
    .withMessage('Invalid category'),
  handleValidation
];

const validateNotificationId = [
  param('notificationId')
    .isMongoId()
    .withMessage('Invalid notification ID'),
  handleValidation
];

const validateMultipleIds = [
  body('notificationIds')
    .isArray({ min: 1 })
    .withMessage('notificationIds must be a non-empty array'),
  body('notificationIds.*')
    .isMongoId()
    .withMessage('Each notification ID must be valid'),
  handleValidation
];

const validateReply = [
  body('message')
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 1000 })
    .withMessage('Message must be less than 1000 characters'),
  body('recipient')
    .isMongoId()
    .withMessage('Recipient ID must be valid'),
  body('originalMessageId')
    .isMongoId()
    .withMessage('Original message ID must be valid'),
  handleValidation
];

const validateTimeframe = [
  query('timeframe')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Timeframe must be between 1 and 365 days'),
  handleValidation
];

// Apply authentication and staff role to all routes
router.use(requireStaff);

// Add logging middleware for debugging
router.use('/reply', (req, res, next) => {
  console.log('📨 Reply request received:', {
    method: req.method,
    url: req.url,
    body: req.body,
    user: req.user ? { id: req.user.id, type: req.user.type } : null
  });
  next();
});

// Routes

// GET /api/staff/notifications - Get notifications for logged-in staff
router.get('/', validatePagination, getStaffNotifications);

// GET /api/staff/notifications/stats - Get notification statistics (must be before parameterized routes)
router.get('/stats', validateTimeframe, getNotificationStats);

// POST /api/staff/notifications/reply - Send a reply to a notification
router.post('/reply', validateReply, sendReply);

// PUT /api/staff/notifications/mark-read - Mark multiple notifications as read
router.put('/mark-read', validateMultipleIds, markMultipleAsRead);

// PUT /api/staff/notifications/:notificationId/read - Mark single notification as read
router.put('/:notificationId/read', validateNotificationId, markNotificationAsRead);

// PUT /api/staff/notifications/:notificationId/archive - Archive notification
router.put('/:notificationId/archive', validateNotificationId, archiveNotification);

export default router;