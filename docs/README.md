# AuraCares Beauty Parlor Management System

## Overview
AuraCares is a comprehensive beauty parlor management system that connects customers with salons and stylists. This system includes features for appointment booking, staff management, service listings, and more.

## New Feature: Cloudinary Image Management System

### Overview
AuraCares now integrates with Cloudinary for efficient image management. This system handles profile pictures for customers, staff, and salons, as well as salon images and other media.

### Features
1. **Cloud Storage**: Images are stored on Cloudinary's CDN for fast delivery
2. **Automatic Optimization**: Images are automatically optimized for web delivery
3. **Responsive Images**: Automatic resizing and format conversion
4. **Secure Uploads**: Authenticated image uploads with validation
5. **Easy Management**: Simple API for uploading, retrieving, and deleting images

### Backend Components
- **Cloudinary Configuration**: Centralized Cloudinary setup with environment variables
- **Image Upload Routes**: Dedicated endpoints for different image types
- **Image Controller**: Business logic for image management
- **Image Utilities**: Helper functions for image operations

### Frontend Components
- **ImageUpload Component**: Reusable React component for image uploads
- **Image Service**: API service for image operations
- **Profile Pages**: Updated profile pages with Cloudinary integration

### API Endpoints
- `POST /api/image-upload/customer/profile` - Upload customer profile image
- `POST /api/image-upload/staff/profile` - Upload staff profile image
- `POST /api/image-upload/salon/image` - Upload salon image

### Usage
1. Users can upload profile images through the profile edit pages
2. Images are automatically optimized and stored on Cloudinary
3. URLs are returned and stored in the database
4. Images are displayed throughout the application

## New Feature: Salon Appointment Cancellation Policy System

### Features
1. **Flexible Cancellation Policies**: Salon owners can set custom notice periods (24-48 hours) and penalty fees
2. **Automated Fee Calculation**: System automatically calculates late cancellation (50%) and no-show (100%) fees
3. **Customer Agreement**: Policy displayed on booking page with required checkbox agreement
4. **Automated Reminders**: Email reminders sent 48-24 hours before appointments
5. **Owner Dashboard**: Track cancellations, fees, and policy effectiveness
6. **Secure Integration**: Full frontend/backend validation with error handling

### Backend Components
- **CancellationPolicy Model**: Stores salon-specific cancellation rules
- **Enhanced Appointment Model**: Tracks cancellation types, fees, and agreements
- **Cancellation Policy Controller**: API endpoints for policy management
- **Automated Reminders**: Cron job for sending policy reminders
- **Database Migration**: Adds new fields to existing appointments

### Frontend Components
- **CancellationPolicyDisplay**: Shows policy on booking page with agreement checkbox
- **CancelAppointmentModal**: Handles cancellation requests with reason input
- **CancellationPolicyManager**: Salon dashboard for setting policies
- **CancellationDashboard**: Owner view for tracking cancellations and fees
- **Updated MyBookings**: Integrated cancellation functionality

### API Endpoints
- `GET /api/cancellation-policy/:salonId` - Get salon's cancellation policy
- `POST /api/cancellation-policy` - Create/update salon's cancellation policy
- `GET /api/cancellation-policy` - Get all policies for salon owner

### Usage
1. Salon owners set policies via the Cancellation Dashboard
2. Customers see policies during booking and must agree before proceeding
3. System automatically calculates fees based on cancellation timing
4. Email reminders are sent before appointments
5. Owners can track all cancellation data in their dashboard

## Installation
- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Gmail account (for email services)
- Google Cloud Console account (for OAuth)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd auracare
```

### 2. Backend Setup
```bash
cd backend
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your configurations

# Start the backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your configurations

# Start the frontend development server
npm run dev
```

### 4. Database Setup
The application will automatically:
- Connect to MongoDB
- Create necessary collections
- Set up the default admin account

**Default Admin Credentials:**
- Email: admin@gmail.com
- Password: Admin@123

### 5. Google OAuth Setup (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Update `.env` files with your client ID and secret

## 🚀 Deployment

### Deploying to Render

1. **Create Render Accounts**
   - Go to [render.com](https://render.com) and create an account
   - Connect your GitHub repository

2. **Deploy the Backend**
   - In Render dashboard, click "New+" → "Web Service"
   - Connect your GitHub repository
   - Set the following configuration:
     - Name: `auracare-backend`
     - Runtime: `Node`
     - Build command: `npm install`
     - Start command: `npm start`
     - Root directory: `backend`
   - Add environment variables in the Render dashboard:
     - `NODE_ENV`: `production`
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Your JWT secret
     - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID
     - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret
     - `GOOGLE_CALLBACK_URL`: Your backend URL + `/api/auth/google/callback`
     - `EMAIL_USER`: Your email for sending notifications
     - `EMAIL_PASS`: Your email app password
     - `FRONTEND_URL`: Your frontend URL
     - `RAZORPAY_KEY_ID`: Your Razorpay key ID
     - `RAZORPAY_KEY_SECRET`: Your Razorpay key secret

3. **Deploy the Frontend**
   - In Render dashboard, click "New+" → "Static Site"
   - Connect your GitHub repository
   - Set the following configuration:
     - Name: `auracare-frontend`
     - Build command: `npm install && npm run build`
     - Publish directory: `dist`
     - Root directory: `frontend`
   - Add environment variables:
     - `VITE_API_URL`: Your backend URL + `/api`

4. **Update URLs**
   - After deployment, update the `GOOGLE_CALLBACK_URL` in your backend settings to use the Render backend URL
   - Update the `FRONTEND_URL` in your backend settings to use the Render frontend URL

### Environment Variables

#### Backend (.env)
```
# Database Configuration
MONGODB_URI=your_mongodb_connection_string

# Server Configuration
PORT=5011
NODE_ENV=production

# JWT Configuration
JWT_SECRET=your_jwt_secret

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=your_backend_url/api/auth/google/callback

# Email Configuration
EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password
EMAIL_FROM="Auracare Beauty Parlor" <noreply@auracare.com>

# Frontend URL
FRONTEND_URL=your_frontend_url

# Admin Default Credentials
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=Admin@123

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dzbjcacnn
CLOUDINARY_API_KEY=876578995275917
CLOUDINARY_API_SECRET=X5ELAMbkjO6-VOEMcAgc_0CNsfw
```

#### Frontend (.env)
```
VITE_API_URL=your_backend_url/api
VITE_CLOUDINARY_CLOUD_NAME=dzbjcacnn
VITE_CLOUDINARY_API_KEY=876578995275917
```

## 📁 Project Structure

```
auracare/
├── backend/
│   ├── config/          # Database and passport configuration
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Authentication, validation, etc.
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── utils/           # Helper functions
│   ├── ml-service/      # Financial prediction ML service
│   ├── .env             # Environment variables
│   ├── server.js        # Main server file
│   └── package.json
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── contexts/    # React contexts
│   │   ├── hooks/       # Custom hooks
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── utils/       # Helper functions
│   ├── .env             # Environment variables
│   ├── package.json
│   └── vite.config.js
├── FINANCIAL_PREDICTION_SYSTEM.md      # Financial prediction documentation
├── FINANCIAL_SUMMARY.md                # Financial summary documentation
├── LOYALTY_POINTS_SYSTEM.md            # Loyalty program documentation
└── README.md
```

## 🗄️ Database Schema

### Collections
- **admins** - System administrators
- **salons** - Salon owners and salon information
- **staff** - Staff members and their details
- **customers** - Customer accounts
- **services** - Service catalog
- **appointments** - Booking records

### Key Relationships
- Salons → Staff (One-to-Many)
- Salons → Services (One-to-Many)
- Appointments → Customer, Salon, Staff, Services (Many-to-One)

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register          # User registration
POST   /api/auth/login             # User login
GET    /api/auth/google            # Google OAuth
POST   /api/auth/forgot-password   # Password reset
POST   /api/auth/verify-otp        # OTP verification
```

### Admin
```
GET    /api/admin/dashboard/stats  # Dashboard statistics
GET    /api/admin/salons           # All salons
GET    /api/admin/staff            # All staff
GET    /api/admin/customers        # All customers
```

### Financial Management
```
GET    /api/admin/financial-summary/summary          # Financial summary data
GET    /api/admin/financial-summary/salon-performance # Salon performance data
GET    /api/admin/financial-summary/revenue-trend     # Revenue trend data
GET    /api/admin/financial-summary/expense-breakdown # Expense breakdown data
```

### Financial Prediction
```
GET    /api/financial-forecast/forecast  # Get next week's revenue prediction
POST   /api/financial-forecast/train     # Train the model with new data
```

### Salon Management
```
POST   /api/salon/setup           # Complete salon setup
GET    /api/salon/dashboard       # Salon dashboard
POST   /api/salon/staff/hire      # Hire staff
GET    /api/salon/appointments    # Salon appointments
```

### Customer
```
GET    /api/customer/salons       # Browse salons
POST   /api/appointment/book      # Book appointment
GET    /api/customer/bookings     # Customer bookings
```

### Loyalty Program
```
POST   /api/loyalty/customer/redeem               # Redeem loyalty points
GET    /api/loyalty/customer/:id/details          # Get customer loyalty details
GET    /api/loyalty/salon/dashboard-metrics       # Get loyalty analytics
GET    /api/loyalty/salon/top-customers           # Get top loyalty customers
```