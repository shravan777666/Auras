// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from './config/passport.js';
import connectDB from './config/database.js';
import { globalErrorHandler } from './utils/responses.js';

// Import routes
import authRoutes from './routes/auth.js';
import oauthRoutes from './routes/oauth.js';
import adminRoutes from './routes/admin.js';
import salonRoutes from './routes/salon.js';
import staffRoutes from './routes/staff.js';
import customerRoutes from './routes/customer.js';
import serviceRoutes from './routes/service.js';
import appointmentRoutes from './routes/appointment.js';
import forgotPasswordRoutes from './routes/forgotPassword.js';

// Create Express app
const app = express();

app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      // Allow images from same-origin, data URLs, and other http/https origins (dev backends)
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
      scriptSrc: ["'self'", "https://apis.google.com"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  'http://127.0.0.1:5173'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    try {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      // Direct allowlist match
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // In development, allow any localhost origin (covers different ports)
      if (process.env.NODE_ENV !== 'production' && /localhost|127\.0\.0\.1/.test(origin)) {
        return callback(null, true);
      }

      // Not allowed - log for debugging and return explicit failure
      console.warn('Blocked CORS origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    } catch (e) {
      console.error('CORS origin check error:', e);
      // Fail-open in case of unexpected errors during development
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      return callback(new Error('CORS error'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma']
};

// Register CORS middleware
app.use(cors(corsOptions));
// Handle preflight
app.options('*', cors(corsOptions));

// Serve static files with proper CORS headers (handled below at the consolidated handler)

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Configure static file serving
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enable broad CORS and CORP headers for static asset access from admin frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // Allow other origins to fetch these resources (fixes NotSameOrigin blocks)
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// Serve static files from uploads directory
app.use('/uploads', (req, res, next) => {
  // Allow all origins for development/static assets
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set cache control for images
    if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filePath)) {
      res.set('Cache-Control', 'public, max-age=86400');
    }
    
    // Set content type based on file extension
    if (/\.(jpg|jpeg)$/i.test(filePath)) {
      res.set('Content-Type', 'image/jpeg');
    } else if (/\.png$/i.test(filePath)) {
      res.set('Content-Type', 'image/png');
    } else if (/\.gif$/i.test(filePath)) {
      res.set('Content-Type', 'image/gif');
    } else if (/\.webp$/i.test(filePath)) {
      res.set('Content-Type', 'image/webp');
    } else if (/\.svg$/i.test(filePath)) {
      res.set('Content-Type', 'image/svg+xml');
    } else if (/\.pdf$/i.test(filePath)) {
      res.set('Content-Type', 'application/pdf');
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auracare API is running smoothly! ✨',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Root URL → redirect to frontend Home
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
app.get('/', (req, res) => {
  return res.redirect(FRONTEND_URL);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/auth', oauthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/salon', salonRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/appointment', appointmentRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);

// Handle undefined routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: {
      auth: '/api/auth',
      admin: '/api/admin',
      salon: '/api/salon',
      staff: '/api/staff',
      customer: '/api/customer',
      service: '/api/service',
      appointment: '/api/appointment',
      forgotPassword: '/api/forgot-password'
    }
  });
});

// Global error handler
app.use(globalErrorHandler);

// Start server with graceful EADDRINUSE handling and port fallback
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = (port, attemptsLeft = 5) => {
  const server = app.listen(port, '0.0.0.0');

  server.on('listening', () => {
    console.log(`\n🚀 Auracare Backend Server Started Successfully on port ${port}!`);
    console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Server URL: http://localhost:${port}`);
    console.log(`🏥 Health Check: http://localhost:${port}/health`);
    console.log(`📚 API Base: http://localhost:${port}/api\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use.`);
      if (attemptsLeft > 0) {
        console.log(`🔄 Trying port ${port + 1}...`);
        server.close(() => startServer(port + 1, attemptsLeft - 1));
      } else {
        console.error('❌ No available ports found. Exiting...');
        process.exit(1);
      }
    } else {
      console.error('❌ Server error:', err);
      process.exit(1);
    }
  });
};

// Start the server
startServer(DEFAULT_PORT);

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  process.exit(0);
});