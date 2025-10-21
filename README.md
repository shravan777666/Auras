# Auracare - Beauty Parlor Management System 💄✨

A complete, production-ready MERN stack application for beauty parlor booking and management. Built with modern technologies and best practices for scalability, security, and user experience.

## 🌟 Features

### Multi-Role Authentication System
- **Admin**: Super user with full system access
- **Salon Owners**: Manage salons, staff, and services
- **Staff**: Handle appointments and manage availability
- **Customers**: Browse salons and book appointments

### 🔐 Authentication & Security
- JWT-based authentication
- Google OAuth 2.0 integration
- OTP-based password recovery
- Role-based access control (RBAC)
- Secure API endpoints

### 🏪 Salon Management
- Complete salon setup wizard
- Staff hiring and management
- Service catalog management
- Appointment scheduling
- Business analytics

### 👥 Staff Features
- Profile setup and management
- Availability scheduling
- Appointment management
- Performance tracking

### 🛍️ Customer Experience
- Browse salons by location
- Service search and filtering
- Easy appointment booking
- Booking history and management
- Rating and review system

### 💰 Financial Management System
- **Admin Financial Dashboard**: Comprehensive profit/loss analytics
- **Revenue Trend Analysis**: Visualize revenue trends over time
- **Salon Performance Tracking**: Compare performance across salons
- **Expense Breakdown**: Detailed categorization of business expenses
- **Interactive Visualizations**: Charts and graphs for data analysis
- **Export Functionality**: Generate reports in PDF/Excel formats

### 💰 Financial Prediction System
- **Next Week Revenue Forecasting**: Predict next week's revenue using Linear Regression
- **Historical Data Analysis**: Train model with actual salon appointment data
- **Confidence Scoring**: Get confidence levels for predictions
- **Trend Analysis**: Visualize revenue trends and percentage changes
- **Dashboard Integration**: Seamlessly integrated into the financial dashboard

### 🏆 Loyalty Points Program
- **Points Earning**: Customers earn 1 point for every ₹10 spent
- **Points Redemption**: 100 points = ₹100 discount on future bookings
- **Tiered Rewards**: Standard, Silver, Gold, and Platinum tiers with exclusive benefits
- **Real-time Tracking**: Live points balance in customer dashboard
- **Analytics Dashboard**: Owner insights on loyalty program performance
- **Top Customers Recognition**: Highlight most loyal customers

### 📱 Technical Features
- Responsive design (mobile-first)
- Real-time notifications
- Email integration (Nodemailer)
- File upload support
- Search and filtering
- Pagination
- Data validation

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **React Hook Form** - Form management
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **Passport.js** - Authentication middleware
- **Nodemailer** - Email service
- **Multer** - File uploads

### DevOps & Security
- **Helmet** - Security headers
- **CORS** - Cross-origin requests
- **Rate Limiting** - API protection
- **Input Validation** - Data sanitization
- **Environment Variables** - Configuration management

## 🚀 Quick Start

### Prerequisites
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