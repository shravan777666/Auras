import { param, query, body, validationResult, header } from 'express-validator';

// Common result handler
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
  }
  next();
};

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  handleValidation
];

export const validateObjectId = (name) => [
  param(name).isMongoId().withMessage(`Invalid ${name} format`),
  handleValidation
];


// Salon
export const validateSalonSetup = [
  body('salonName').isString().notEmpty().withMessage('Salon name is required'),
  body('description').isString().notEmpty().withMessage('Description is required'),
  body('contactNumber').isString().notEmpty().withMessage('Contact number is required'),
  body('salonAddress').custom((value) => {
    if (typeof value === 'string') {
      try {
        JSON.parse(value);
        return true;
      } catch (e) {
        throw new Error('Invalid address format');
      }
    }
    return typeof value === 'object' && value !== null;
  }).withMessage('Valid address is required'),
  body('businessHours').custom((value) => {
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return parsed.openTime && parsed.closeTime && Array.isArray(parsed.workingDays);
      } catch (e) {
        throw new Error('Invalid business hours format');
      }
    }
    return typeof value === 'object' && value !== null && value.openTime && value.closeTime && Array.isArray(value.workingDays);
  }).withMessage('Valid business hours are required'),
  handleValidation
];

// Staff
export const validateStaffSetup = [
  body('contactNumber').isString().notEmpty().withMessage('Contact number is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth is required'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Valid gender is required'),
  // Accept skills either as an actual array or as a JSON string (from multipart/form-data)
  body('skills')
    .customSanitizer((value) => {
      if (!value) return value;
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : value;
        } catch (e) {
          // not JSON, return original value (will fail isArray below)
          return value;
        }
      }
      return value;
    })
    .isArray().withMessage('Skills must be an array'),
  body('experience')
    .optional()
    .customSanitizer((value) => {
      if (!value) return value;
      if (typeof value === 'object') return value;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }
      return value;
    }),
  body('availability')
    .optional()
    .customSanitizer((value) => {
      if (!value) return value;
      if (typeof value === 'object') return value;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }
      return value;
    }),
  body('address')
    .optional()
    .customSanitizer((value) => {
      if (!value) return value;
      if (typeof value === 'object') return value;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      }
      return value;
    }),
  handleValidation
];

// Service
export const validateService = [
  body('name').isString().notEmpty(),
  body('category').isString().notEmpty(),
  body('price').isNumeric(),
  body('duration').isNumeric(),
  handleValidation
];

// Appointment
export const validateAppointment = [
  body('salonId').isString().notEmpty(),
  body('services').isArray({ min: 1 }),
  body('appointmentDate').isString().notEmpty(),
  body('appointmentTime').isString().notEmpty(),
  handleValidation
];

// Auth
export const validateUserRegistration = [
  body('name').isString().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('userType').isIn(['admin', 'salon', 'staff', 'customer']).withMessage('Invalid userType'),
  handleValidation
];

export const validateUserLogin = [
  body('email').isEmail(),
  body('password').isString(),
  body('userType').isIn(['admin', 'salon', 'staff', 'customer']).withMessage('Invalid userType'),
  handleValidation
];

export const validatePasswordReset = [
  body('email').isEmail(),
  handleValidation
];

export const validateOTP = [
  body('email').isEmail(),
  body('otp').isString().isLength({ min: 4, max: 8 }),
  handleValidation
];

export const validateNewPassword = [
  body('email').isEmail(),
  body('newPassword').isLength({ min: 6 }),
  handleValidation
];