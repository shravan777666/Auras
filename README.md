# AuraCares Beauty Parlor Management System

## Overview
AuraCares is a comprehensive beauty parlor management system that connects customers with salons and stylists. This system includes features for appointment booking, staff management, service listings, and more.

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

## 🎨 UI/UX Features

### Design System
- **Color Palette**: Primary blues and secondary purples
- **Typography**: Inter font family
- **Components**: Consistent button styles, form inputs, cards
- **Icons**: Lucide React icon library
- **Animations**: Smooth transitions and hover effects

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interface
- Optimized for all screen sizes

### Accessibility
- ARIA labels and roles
- Keyboard navigation support
- High contrast colors
- Screen reader friendly

## 🔒 Security Features

### Authentication Security
- JWT tokens with expiration
- Secure password requirements
- Rate limiting on auth endpoints
- Session management

### Data Protection
- Input validation and sanitization
- XSS protection
- CSRF protection
- Secure headers with Helmet

### API Security
- Role-based access control
- Protected routes
- Request rate limiting
- Error handling without data exposure

## 📧 Email Configuration

The system uses Nodemailer with Gmail for:
- Welcome emails
- OTP for password reset
- Appointment confirmations
- Appointment reminders
- Salon approval notifications
- Salon rejection notifications
- Staff approval notifications

### Gmail Setup
1. Enable 2-factor authentication
2. Generate App Password
3. Use app password in environment variables

### Environment Variables
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Email Templates
- **OTP Email**: Password reset requests
- **Appointment Confirmation**: Booking confirmations
- **Salon Approval**: Notification when salon is approved
- **Salon Rejection**: Notification when salon is rejected
- **Staff Approval**: Notification to salon owner when staff is approved

## 🚀 Deployment

### Backend Deployment (Railway/Heroku)
```bash
# Set environment variables
# Deploy with git push
```

### Frontend Deployment (Vercel/Netlify)
```bash
npm run build
# Deploy dist folder
```

### Database Deployment
- Use MongoDB Atlas for production
- Configure connection string
- Set up proper indexing

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Test Coverage
- Unit tests for utilities
- Integration tests for API endpoints
- Component tests for React components

## 📈 Performance Optimization

### Frontend
- Code splitting with React.lazy
- Image optimization
- Bundle size optimization
- Caching strategies

### Backend
- Database indexing
- Query optimization
- Connection pooling
- Response compression

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use ESLint and Prettier
- Follow React and Node.js best practices
- Write meaningful commit messages
- Add comments for complex logic

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Known Issues

- Google OAuth requires HTTPS in production
- File uploads limited to 5MB
- Email rate limiting may affect high-volume usage

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Push notifications
- [ ] Video consultations
- [ ] Loyalty program
- [ ] Advanced reporting
- [ ] Enhanced financial prediction with more sophisticated ML models
- [ ] Seasonal and trend analysis for financial forecasting
- [ ] Real-time financial data updates
- [ ] Custom financial report templates
- [ ] Budget planning and forecasting tools

## 📞 Support

For support and questions:
- Email: support@auracare.com
- Documentation: [docs.auracare.com](https://docs.auracare.com)
- Issues: GitHub Issues

## 🙏 Acknowledgments

- React team for the amazing framework
- MongoDB team for the excellent database
- TailwindCSS for the utility-first CSS framework
- All the open-source contributors

---

**Built with ❤️ for the beauty industry**

*Auracare - Your Beauty, Our Priority* ✨