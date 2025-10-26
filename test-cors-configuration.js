// Simple Express server to test CORS configuration
const express = require('express');
const cors = require('cors');

const app = express();

// CORS configuration
const allowedOrigins = [
  'https://auras-silk.vercel.app',
  'http://localhost:3000',
  'http://localhost:3008'
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('Checking origin:', origin);
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Allowed origin:', origin);
      return callback(null, true);
    }
    
    // Block other origins
    console.log('❌ Blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Test route
app.post('/api/auth/login', (req, res) => {
  res.json({ message: 'Login endpoint working' });
});

// Handle preflight explicitly
app.options('/api/auth/login', (req, res) => {
  console.log('Handling preflight request');
  res.sendStatus(204);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`CORS test server running on port ${PORT}`);
});