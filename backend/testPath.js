// Test the path normalization function
import path from 'path';

// Mock request object
const mockReq = {
  protocol: 'http',
  get: (header) => {
    if (header === 'host') return 'localhost:5011';
    return null;
  }
};

// Test cases
const testPaths = [
  'uploads\\staff\\profilePicture-1758261052162.jpg',
  'backend/uploads/staff/profilePicture-1758261052162.jpg',
  'uploads/staff/profilePicture-1758261052162.jpg',
  'staff/profilePicture-1758261052162.jpg'
];

// Import the getFileUrl function
const getRequestBaseUrl = (req) => {
  try {
    // Prefer explicit BASE_URL when provided
    if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
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

  // Normalize path separators (convert Windows backslashes to forward slashes)
  let normalizedPath = String(filePath).replace(/\\/g, '/');

  // Handle path discrepancies - if the path starts with 'backend/uploads', remove the 'backend' part
  // If it starts with 'uploads', it's correct
  // If it doesn't start with either, prepend 'uploads/'
  if (normalizedPath.startsWith('backend/uploads/')) {
    normalizedPath = normalizedPath.substring('backend/'.length);
  } else if (normalizedPath.startsWith('uploads/')) {
    // Path is already correct
  } else if (!normalizedPath.startsWith('/')) {
    // Prepend uploads/ if not already there
    normalizedPath = `uploads/${normalizedPath}`;
  }

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

// Test each path
testPaths.forEach((testPath, index) => {
  console.log(`\nTest ${index + 1}:`);
  const result = getFileUrl(testPath, mockReq);
  console.log('Result URL:', result);
});