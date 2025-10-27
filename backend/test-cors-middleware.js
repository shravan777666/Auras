// Simple test to verify CORS middleware is working
const express = require('express');
const app = express();

// Test CORS middleware
const allowedOrigins = [
  'https://auras-silk.vercel.app',
  'https://auras-hbxd6s8qb-shravan-ss-projects.vercel.app',
  'http://localhost:3000'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  console.log(`Request: ${req.method} ${req.url} from origin: ${origin}`);
  
  // Set CORS headers for all requests
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    console.log(`CORS headers set for origin: ${origin}`);
  } else if (!origin) {
    // For requests with no origin (mobile apps, Postman, curl)
    res.header('Access-Control-Allow-Origin', '*');
    console.log('CORS headers set for request with no origin');
  }
  
  // Handle preflight requests explicitly
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma, Expires, If-Modified-Since, If-None-Match');
    res.header('Access-Control-Max-Age', '86400'); // Cache preflight for 24 hours
    console.log('Preflight request handled');
    return res.status(204).send();
  }
  
  next();
});

// Test route
app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login endpoint working' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`CORS test server running on port ${PORT}`);
});