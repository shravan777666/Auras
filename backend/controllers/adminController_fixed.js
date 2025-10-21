import Admin from '../models/Admin.js';
import Salon from '../models/Salon.js';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import Appointment from '../models/Appointment.js';
import Customer from '../models/Customer.js';
import { successResponse, errorResponse, notFoundResponse, paginatedResponse } from '../utils/responses.js';
import asyncHandler from 'express-async-handler';
import { sendSalonApprovalEmail, sendSalonRejectionEmail, sendStaffApprovalNotificationEmail, sendStaffApprovalEmail } from '../config/email.js';

// Helper to get the server base URL from the current request
const getRequestBaseUrl = (req) => {
  try {
    // Prefer explicit BASE_URL when provided
    if (process.env.BASE_URL) return process.env.BASE_URL.replace(///$/, '');
    const protocol = (req && req.protocol) ? req.protocol : 'http';
    const host = (req && req.get) ? req.get('host') : undefined;
    if (host) return `${protocol}://${host}`;
  } catch (e) {
    // fallthrough
  }
  // Final fallback to localhost using the actual running port if provided
  return `http://localhost:${process.env.PORT || 5000}`;
};

// Helper function to convert file path to full URL
const getFileUrl = (filePath, req) => {
  if (!filePath) return null;

  // Normalize path separators
  const normalizedPath = String(filePath).replace(/\\/g, '/');

  // Compute base URL from request or env
  const baseUrl = getRequestBaseUrl(req);

  // Ensure leading slash for path part
  const pathWithSlash = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;

  // Construct the full URL
  const fullUrl = `${baseUrl}${pathWithSlash}`;

  console.log('Generated file URL:', {
    originalPath: filePath,
    normalizedPath,
    baseUrl,
    fullUrl
  });

  return fullUrl;
};

// Helper function to convert documents object with file paths to URLs
const convertDocumentsToUrls = (documents, req) => {
  if (!documents) return {};
  
  const converted = {};
  
  // For salon documents
  if (documents.businessLicense) {
    converted.businessLicense = getFileUrl(documents.businessLicense, req);
  }
  
  if (documents.salonLogo) {
    converted.salonLogo = getFileUrl(documents.salonLogo, req);
  }
  
  if (documents.salonImages && Array.isArray(documents.salonImages)) {
    converted.salonImages = documents.salonImages.map(imagePath => getFileUrl(imagePath, req));
  }
  
  // For staff documents
  if (documents.governmentId) {
    converted.governmentId = getFileUrl(documents.governmentId, req);
  }
  
  if (documents.certificates && Array.isArray(documents.certificates)) {
    converted.certificates = documents.certificates.map(certPath => getFileUrl(certPath, req));
  }
  
  return converted;
};