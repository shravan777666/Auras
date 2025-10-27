// Load environment variables FIRST before any other imports
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the backend directory
dotenv.config({ path: path.join(__dirname, '.env') });

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import passport from './config/passport.js';
import connectDB from './config/database.js';
import { globalErrorHandler } from './utils/responses.js';
import { startCancellationReminders } from './utils/cancellationReminder.js';

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
import reviewRoutes from './routes/review.js';
import recommendationRoutes from './routes/recommendation.js';
import clientProfileRoutes from './routes/clientProfile.js';
import customerMessageRoutes from './routes/customerMessage.js';
import revenueRoutes from './routes/revenue.js';
import broadcastRoutes from './routes/broadcast.js';
import staffNotificationRoutes from './routes/staffNotification.js';
import staffInvitationRoutes from './routes/staffInvitation.js';
import userRoutes from './routes/user.js';
import alertsRoutes from './routes/alerts.js';

// Add the new import for schedule requests
import scheduleRequestsRoutes from './routes/scheduleRequests.js';

// Import financial forecast routes
import financialForecastRoutes from './routes/financialForecast.js';
import expenseForecastRoutes from './routes/expenseForecast.js';

// Add financial summary routes
import financialSummaryRoutes from './routes/financialSummary.js';

// Add loyalty routes
import loyaltyRoutes from './routes/loyalty.js';

// Import internal feedback routes
import internalFeedbackRoutes from './routes/internalFeedbackRoutes.js';

// Import salon settings routes
import salonSettingsRoutes from './routes/salonSettings.js';

// Import addon routes
import addonRoutes from './routes/addon.js';

// Import addon dashboard routes
import addonDashboardRoutes from './routes/addonDashboard.js';

// Import payment routes
import paymentRoutes from './routes/payment.js';

// Import payroll routes
import payrollRoutes from './routes/payroll.js';

// Import cancellation policy routes
import cancellationPolicyRoutes from './routes/cancellationPolicy.js';
import customerNotificationRoutes from './routes/customerNotification.js';

// Create Express app
const app = express();

// Add debugging middleware at the very beginning
app.use((req, res, next) => {
  console.log(`🔍 Middleware chain start: ${req.method} ${req.url}`);
  next();
});

// ========== CORS CONFIGURATION ==========
// Apply CORS middleware first, before any other middleware
app.use((req, res, next) => {
  // Allow all origins for development - in production, you might want to be more specific
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires, If-Modified-Since, If-None-Match');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Handle preflight requests globally
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires, If-Modified-Since, If-None-Match');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

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
      imgSrc: ["'self'", "data:", "blob:", "https:", "http:", "*"],
      scriptSrc: ["'self'", "https://apis.google.com"],
      connectSrc: ["'self'", "https:", "http:"],
      frameSrc: ["'self'", "https://apis.google.com"]
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ========== END CORS CONFIGURATION ==========

// Rate limiting with debugging
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes - ignore env variable
  max: 50000, // Very high limit - ignore env variable
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const p = req.path || '';
    const shouldSkip = 
      req.method === 'OPTIONS' ||
      p.startsWith('/auth/login') ||
      p.startsWith('/auth/register') ||
      p.startsWith('/auth/refresh-token') ||
      p.startsWith('/api/auth/login') ||  // Add this line to ensure API login is not rate limited
      p.startsWith('/api/auth/register') ||  // Add this line to ensure API register is not rate limited
      p.startsWith('/api/salon/') ||
      p.startsWith('/api/client-profiles') ||
      p.startsWith('/api/recommendations') ||
      p.startsWith('/api/customer/') ||
      p.startsWith('/api/appointment/') ||
      p.startsWith('/api/service/') ||
      p.startsWith('/health') ||
      p.startsWith('/uploads') ||
      p.startsWith('/api/reviews');
    
    if (!shouldSkip) {
      console.log(`🚫 Rate limiting applied to: ${req.method} ${p}`);
    }
    
    return shouldSkip;
  },
  onLimitReached: (req) => {
    console.log(`🚨 Rate limit exceeded for: ${req.method} ${req.path} from IP: ${req.ip}`);
  }
});

// Environment and rate limiting setup
console.log('🔧 Environment Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS
});

// Completely disable rate limiting for development
if (process.env.NODE_ENV === 'production') {
  console.log('🔒 Rate limiting enabled for production');
  app.use('/api/', limiter);
} else {
  console.log('🔧 Rate limiting completely disabled in development mode');
  // Add a middleware that always allows requests in development
  app.use('/api/', (req, res, next) => {
    // Add rate limit headers for consistency but don't actually limit
    res.set({
      'X-RateLimit-Limit': '10000',
      'X-RateLimit-Remaining': '9999',
      'X-RateLimit-Reset': new Date(Date.now() + 15 * 60 * 1000)
    });
    next();
  });
}

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
  saveUninitialized: false, // This might cause issues with OAuth, let's keep it as is for now
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Configure static file serving
import fs from 'fs';

// __filename and __dirname are already defined at the top

// Ensure uploads directories exist in the correct location (backend directory)
const uploadsDir = path.join(__dirname, 'uploads');

try {
  const requiredDirs = [
    uploadsDir,
    path.join(uploadsDir, 'customers'),
    path.join(uploadsDir, 'staff'),
    path.join(uploadsDir, 'images'),
    path.join(uploadsDir, 'licenses')
  ];
  requiredDirs.forEach((dir) => {
    try { 
      fs.mkdirSync(dir, { recursive: true }); 
    } catch (_) {}
  });
} catch (_) {}

// Serve static files from uploads directory
app.use('/uploads', (req, res, next) => {
  // Allow all origins for development/static assets
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires, If-Modified-Since, If-None-Match');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'require-corp');
  res.header('Cross-Origin-Opener-Policy', 'same-origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Set CORS headers for static files
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cross-Origin-Embedder-Policy', 'require-corp');
    res.set('Cross-Origin-Opener-Policy', 'same-origin');
    
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

// Test endpoint to check staff data
app.get('/test-staff', async (req, res) => {
  try {
    const adminController = await import('./controllers/adminController.js');
    const staff = await adminController.default.getAllStaff(req, res);
    return res.status(200).json({ staff });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Root URL → return API information instead of redirecting
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auracare Backend API Server',
    version: '1.0.0',
    documentation: '/api/docs', // If you have API docs
    health: '/health',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes); // Mount OAuth routes under /api/auth to match frontend expectations
app.use('/api/customer', customerRoutes);
app.use('/api/salon', salonRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/appointment', appointmentRoutes);
app.use('/api/service', serviceRoutes);
app.use('/api/schedule-requests', scheduleRequestsRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/financial-forecast', financialForecastRoutes);
app.use('/api/expense-forecast', expenseForecastRoutes);
// Move financial summary routes under admin
app.use('/api/admin/financial-summary', financialSummaryRoutes);
app.use('/api/loyalty', loyaltyRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/client-profiles', clientProfileRoutes);
app.use('/api/customer/messages', customerMessageRoutes);
app.use('/api/broadcast', broadcastRoutes);
app.use('/api/staff-invitations', staffInvitationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/salon-settings', salonSettingsRoutes);
app.use('/api/addon', addonRoutes);
app.use('/api/addon-dashboard', addonDashboardRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/cancellation-policy', cancellationPolicyRoutes);

// Add internal feedback routes
app.use('/api/internal-feedback', internalFeedbackRoutes);

// Add payment routes
app.use('/api/payment', paymentRoutes);

// Add payroll routes
app.use('/api/payroll', payrollRoutes);

// Add customer notification routes
app.use('/api/customer/notifications', customerNotificationRoutes);

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
      forgotPassword: '/api/forgot-password',
      reviews: '/api/reviews',
      recommendations: '/api/recommendations',
      users: '/api/users',
      staffInvitations: '/api/staff-invitations',
      financialSummary: '/api/admin/financial-summary',
      salonSettings: '/api/salon-settings',
      addon: '/api/addon',
      addonDashboard: '/api/addon-dashboard',
      expenseForecast: '/api/expense-forecast',
      customerNotifications: '/api/customer/notifications'
    }
  });
});

// Global error handler
app.use(globalErrorHandler);

// Start server with graceful EADDRINUSE handling and port fallback
console.log('🔧 PORT from environment:', process.env.PORT);
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5011;
console.log('🔧 DEFAULT_PORT calculated:', DEFAULT_PORT);

const startServer = (port, attemptsLeft = 5) => {
  // Validate port is within valid range
  if (port < 0 || port > 65535) {
    console.error(`❌ Invalid port number: ${port}. Port must be between 0 and 65535.`);
    if (attemptsLeft > 0) {
      console.log(`🔄 Trying default port 5011...`);
      return startServer(5011, attemptsLeft - 1);
    } else {
      console.error('❌ No valid port found. Exiting...');
      process.exit(1);
    }
  }
  
  console.log(`🔧 Attempting to start server on port ${port}`);
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
        // Ensure the next port is within valid range
        const nextPort = port + 1;
        if (nextPort <= 65535) {
          console.log(`🔄 Trying port ${nextPort}...`);
          server.close(() => startServer(nextPort, attemptsLeft - 1));
        } else {
          console.error('❌ No available ports found within valid range. Exiting...');
          process.exit(1);
        }
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

// Start the server - Use environment PORT or 5011 as default
const PORT = process.env.PORT || 5011;
startServer(PORT);

// Start background jobs
// startLowBookingAlerts(); // Function not implemented
// startScheduleRequestReminders(); // Function not implemented
startCancellationReminders();

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  process.exit(0);
});