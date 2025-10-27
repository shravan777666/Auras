// Simple global error handler and helpers

export const globalErrorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  
  // Ensure we haven't already sent a response
  if (res.headersSent) {
    console.error('Headers already sent, cannot send error response');
    return next(err);
  }
  
  // Always return JSON with proper CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires, If-Modified-Since, If-None-Match');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Always return JSON
  res.status(status).json({ success: false, message });
};

// Helpers expected by controllers
export const successResponse = (res, data = {}, message = 'Success', status = 200) => {
  return res.status(status).json({ success: true, message, data });
};

export const errorResponse = (res, message = 'Bad Request', status = 400) => {
  return res.status(status).json({ success: false, message });
};

export const paginatedResponse = (res, items, meta) => {
  return res.status(200).json({ success: true, data: items, meta });
};

export const notFoundResponse = (res, entity = 'Resource') => {
  return res.status(404).json({ success: false, message: `${entity} not found` });
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};