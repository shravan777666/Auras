import multer from 'multer';
import path from 'path';
import { errorResponse } from '../utils/responses.js';

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    if (file.fieldname === 'businessLicense') {
      uploadPath += 'licenses/';
    } else if (file.fieldname === 'salonLogo' || file.fieldname === 'salonImages') {
      uploadPath += 'images/';
    } else if (file.fieldname === 'profilePicture' || file.fieldname === 'governmentId' || file.fieldname === 'certificates') {
      uploadPath += 'staff/';
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// Check file type
const checkFileType = (file, cb, allowedTypes, maxSize, fieldName) => {
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    if (file.size > maxSize) {
      return cb(new Error(`${fieldName} file size exceeds ${maxSize / (1024 * 1024)}MB`));
    }
    return cb(null, true);
  } else {
    cb(new Error(`Invalid ${fieldName} file type. Allowed types: ${allowedTypes}`));
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'businessLicense') {
      checkFileType(file, cb, /jpeg|jpg|png|pdf/, 5 * 1024 * 1024, 'Business License');
    } else if (file.fieldname === 'salonLogo' || file.fieldname === 'salonImages') {
      checkFileType(file, cb, /jpeg|jpg|png/, 5 * 1024 * 1024, 'Image');
    } else if (file.fieldname === 'profilePicture') {
      checkFileType(file, cb, /jpeg|jpg|png/, 5 * 1024 * 1024, 'Profile Picture');
    } else if (file.fieldname === 'governmentId') {
      checkFileType(file, cb, /jpeg|jpg|png|pdf/, 5 * 1024 * 1024, 'Government ID');
    } else if (file.fieldname === 'certificates') {
      checkFileType(file, cb, /jpeg|jpg|png|pdf/, 5 * 1024 * 1024, 'Certificate');
    } else {
      cb(new Error('Unknown field name'));
    }
  },
});

// Middleware for handling upload errors
export const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return errorResponse(res, `File upload error: ${err.message}`, 400);
  } else if (err) {
    return errorResponse(res, err.message, 400);
  }
  next();
};

export { upload };

export const salonSetupUploads = upload.fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'salonLogo', maxCount: 1 },
  { name: 'salonImages', maxCount: 5 },
]);