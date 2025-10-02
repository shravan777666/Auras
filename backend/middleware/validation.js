import { param, query, body, validationResult, header } from 'express-validator';

// Common result handler
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
  }
  next();
};

// Custom email validation - allow common domains
const validateEmailDomain = (email) => {
  const domain = email.split('@')[1];
  const allowedDomains = ['.com', '.org', '.net', '.edu', '.gov', '.co.in', '.in'];
  
  if (!domain || !allowedDomains.some(allowed => domain.endsWith(allowed))) {
    throw new Error('Please use a valid email domain (.com, .org, .net, .edu, .gov, .in, etc.)');
  }
  return true;
};

// Reasonable password validation
const validateStrongPassword = (password) => {
  const minLength = 6;
  
  if (password.length < minLength) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'user'];
  if (commonPasswords.includes(password.toLowerCase())) {
    throw new Error('This password is too common. Please choose a different one');
  }
  
  return true;
};

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
  query('endDate').optional().isISO8601().withMessage('endDate must be a valid date'),
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

// Reviews
export const validateCreateReview = [
  body('appointmentId').isMongoId().withMessage('Valid appointmentId is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isString().isLength({ max: 2000 }).withMessage('Comment too long'),
  handleValidation,
];

export const validateListReviews = [
  param('salonId').isMongoId().withMessage('Invalid salonId'),
  ...validatePagination,
];

// Auth
export const validateUserRegistration = [
  body('name').isString().notEmpty(),
  body('email')
    .isEmail()
    .custom(validateEmailDomain),
  body('password')
    .custom(validateStrongPassword),
  body('userType').isIn(['admin', 'salon', 'staff', 'customer']).withMessage('Invalid userType'),
  handleValidation
];

export const validateUserLogin = [
  body('email')
    .isEmail()
    .custom(validateEmailDomain),
  body('password').isString(),
  body('userType').isIn(['admin', 'salon', 'staff', 'customer']).withMessage('Invalid userType'),
  handleValidation
];

export const validatePasswordReset = [
  body('email')
    .isEmail()
    .custom(validateEmailDomain),
  handleValidation
];

export const validateOTP = [
  body('email')
    .isEmail()
    .custom(validateEmailDomain),
  body('otp').isString().isLength({ min: 4, max: 8 }),
  handleValidation
];

export const validateNewPassword = [
  body('email')
    .isEmail()
    .custom(validateEmailDomain),
  body('newPassword')
    .custom(validateStrongPassword),
  handleValidation
];
