import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LoadingSpinner from './components/common/LoadingSpinner'
import ErrorBoundary from './components/common/ErrorBoundary'

// Lazy load components for better performance
const Home = React.lazy(() => import('./pages/common/Home'))
const Login = React.lazy(() => import('./pages/auth/Login'))
const Register = React.lazy(() => import('./pages/auth/Register'))
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'))
const OAuthCallback = React.lazy(() => import('./components/auth/OAuthCallback'))

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'))
const ManageSalons = React.lazy(() => import('./pages/admin/ManageSalons'))
const AdminManageStaff = React.lazy(() => import('./pages/admin/ManageStaff'))
const PendingApprovals = React.lazy(() => import('./pages/admin/PendingApprovals'))
const ApprovedSalons = React.lazy(() => import('./pages/admin/ApprovedSalons'))
const FinancialSummary = React.lazy(() => import('./pages/admin/FinancialSummary'))
const SalonDetailsPage = React.lazy(() => import('./pages/admin/SalonDetailsPage'))
const AddonDashboard = React.lazy(() => import('./pages/admin/AddonDashboard'))

// Salon Pages
const SalonDashboard = React.lazy(() => import('./pages/salon/SalonDashboard'))
const SalonSetup = React.lazy(() => import('./pages/salon/SalonSetup'))
const WaitingApproval = React.lazy(() => import('./pages/salon/WaitingApproval'))
const EditSalonProfile = React.lazy(() => import('./pages/salon/EditSalonProfile'))
const AddStaff = React.lazy(() => import('./pages/salon/AddStaff'))
const SearchInviteStaff = React.lazy(() => import('./pages/salon/SearchInviteStaff'))
const ManageStaff = React.lazy(() => import('./pages/salon/ManageStaff'))
const GlobalStaffDirectory = React.lazy(() => import('./pages/salon/GlobalStaffDirectory'))
const ManageServices = React.lazy(() => import('./pages/salon/ManageServices'))
const SalonAppointments = React.lazy(() => import('./pages/salon/SalonAppointments'))
const StaffAvailability = React.lazy(() => import('./pages/salon/StaffAvailability'))
const SalonRevenueDashboard = React.lazy(() => import('./pages/salon/RevenueDashboard'))
const FinancialDashboard = React.lazy(() => import('./pages/salon/FinancialDashboard'))
const ClientRecommendationsPage = React.lazy(() => import('./pages/salon/ClientRecommendationsPage'))
const SalonNotifications = React.lazy(() => import('./pages/salon/SalonNotifications'))
const CancellationDashboard = React.lazy(() => import('./pages/salon/CancellationDashboard'))
const Reports = React.lazy(() => import('./pages/salon/Reports'))

// Staff Pages
const StaffDashboard = React.lazy(() => import('./pages/staff/StaffDashboard'))
const StaffSetup = React.lazy(() => import('./pages/staff/StaffSetup'))
const StaffWaitingApproval = React.lazy(() => import('./pages/staff/StaffWaitingApproval'))
const CompletedAppointments = React.lazy(() => import('./pages/staff/CompletedAppointments'))
const StaffEditProfile = React.lazy(() => import('./pages/staff/StaffEditProfile'))
const StaffSchedule = React.lazy(() => import('./pages/staff/StaffSchedule'))
const StaffServices = React.lazy(() => import('./pages/staff/StaffServices'))
const StaffReport = React.lazy(() => import('./pages/staff/Report'))
const StaffBroadcasts = React.lazy(() => import('./pages/staff/StaffBroadcasts'))
const StaffInvitations = React.lazy(() => import('./pages/staff/StaffInvitations'))

// Customer Pages
const CustomerDashboard = React.lazy(() => import('./pages/customer/CustomerDashboard'))
const BookAppointment = React.lazy(() => import('./pages/customer/BookAppointment'))
const SalonDetails = React.lazy(() => import('./pages/customer/SalonDetails'))
const MyBookings = React.lazy(() => import('./pages/customer/MyBookings'))
const EditCustomerProfile = React.lazy(() => import('./pages/customer/EditCustomerProfile'))
const CustomerProfile = React.lazy(() => import('./pages/customer/CustomerProfile'));
const CustomerMessages = React.lazy(() => import('./pages/customer/CustomerMessages'));
const ExploreSalons = React.lazy(() => import('./pages/customer/ExploreSalons'));
const MapView = React.lazy(() => import('./pages/customer/MapView'));
const Favorites = React.lazy(() => import('./pages/customer/Favorites'));
const Recommendations = React.lazy(() => import('./pages/customer/Recommendations'));
const SearchResults = React.lazy(() => import('./pages/common/SearchResults'))
const TestImageUpload = React.lazy(() => import('./pages/customer/TestImageUpload'))

// Common Pages
const About = React.lazy(() => import('./pages/common/About'))
const Contact = React.lazy(() => import('./pages/common/Contact'))
const NotFound = React.lazy(() => import('./pages/common/NotFound'))
const Unauthorized = React.lazy(() => import('./pages/common/Unauthorized'))

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.type)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

const Root = () => {
  const { loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  // Always show Home page at root URL
  return <Home />
}

// Redirect based on user type and setup status
const DashboardRedirect = () => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  switch (user.type) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />
    case 'salon':
      if (user.approvalStatus === 'pending') {
        return <Navigate to="/salon/waiting-approval" replace />;
      }
      if (user.approvalStatus === 'rejected') {
        return <Navigate to="/unauthorized" replace />; // Or a specific rejection page
      }
      return <Navigate to={user.setupCompleted ? "/salon/dashboard" : "/salon/setup"} replace />;
    case 'staff':
      if (user.approvalStatus === 'pending') {
        return <Navigate to="/staff/waiting-approval" replace />;
      }
      if (user.approvalStatus === 'rejected') {
        return <Navigate to="/unauthorized" replace />;
      }
      return <Navigate to={user.setupCompleted ? "/staff/dashboard" : "/staff/setup"} replace />
    case 'customer':
      return <Navigate to="/customer/dashboard" replace />
    default:
      return <Navigate to="/login" replace />
  }
}

// Setup Required Route - redirects to setup if not completed
const SetupRequiredRoute = ({ children, setupPath }) => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // If user is a salon and approvalStatus is pending, redirect to waiting approval page
  if (user.type === 'salon' && user.approvalStatus === 'pending') {
    return <Navigate to="/salon/waiting-approval" replace />;
  }

  // If user is a staff and approvalStatus is pending, redirect to waiting approval page
  if (user.type === 'staff' && user.approvalStatus === 'pending') {
    return <Navigate to="/staff/waiting-approval" replace />;
  }

  if (!user.setupCompleted) {
    return <Navigate to={setupPath} replace />
  }

  return children
}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Root />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/search" element={<SearchResults />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Dashboard Redirect */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="addon-dashboard" element={<AddonDashboard />} />
                  <Route path="salons" element={<ManageSalons />} />
                  <Route path="pending-approvals" element={<PendingApprovals />} />
                  <Route path="staff" element={<AdminManageStaff />} />
                  <Route path="approved-salons" element={<ApprovedSalons />} />
                  <Route path="financial-summary" element={<FinancialSummary />} />
                  <Route path="salon/:id/details" element={<SalonDetailsPage />} />
                </Routes>
              </ProtectedRoute>
            }
          />

          {/* Salon Routes */}
          <Route
            path="/salon/setup"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SalonSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/waiting-approval"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <WaitingApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/dashboard"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <SalonDashboard />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/edit-profile"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <EditSalonProfile />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/staff/new"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <SearchInviteStaff />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/staff/add"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <AddStaff />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/staff"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <ManageStaff />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/global-staff"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <GlobalStaffDirectory />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/services"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <ManageServices />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/appointments"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <SalonAppointments />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/staff-availability"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <StaffAvailability />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/revenue"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <SalonRevenueDashboard />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/expenses"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <FinancialDashboard />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/recommendations"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <ClientRecommendationsPage />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/notifications"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <SalonNotifications />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/cancellations"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <CancellationDashboard />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salon/reports"
            element={
              <ProtectedRoute allowedRoles={['salon']}>
                <SetupRequiredRoute setupPath="/salon/setup">
                  <Reports />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />

          {/* Staff Routes */}
          <Route
            path="/staff/setup"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/waiting-approval"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <StaffWaitingApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <SetupRequiredRoute setupPath="/staff/setup">
                  <StaffDashboard />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/completed-appointments"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <SetupRequiredRoute setupPath="/staff/setup">
                  <CompletedAppointments />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/edit-profile"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <SetupRequiredRoute setupPath="/staff/setup">
                  <StaffEditProfile />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/schedule"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <SetupRequiredRoute setupPath="/staff/setup">
                  <StaffSchedule />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/services"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <SetupRequiredRoute setupPath="/staff/setup">
                  <StaffServices />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/report"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <SetupRequiredRoute setupPath="/staff/setup">
                  <StaffReport />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/broadcasts"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <SetupRequiredRoute setupPath="/staff/setup">
                  <StaffBroadcasts />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/invitations"
            element={
              <ProtectedRoute allowedRoles={['staff']}>
                <SetupRequiredRoute setupPath="/staff/setup">
                  <StaffInvitations />
                </SetupRequiredRoute>
              </ProtectedRoute>
            }
          />

          {/* Customer Routes */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/book"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/book-appointment"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/book-appointment/:salonId"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/salon/:salonId"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <SalonDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/bookings"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/edit-profile"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <EditCustomerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/profile"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/*"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/messages"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerMessages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/explore-salons"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <ExploreSalons />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/map"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <MapView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/favorites"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/recommendations"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Recommendations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/test-image-upload"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <TestImageUpload />
              </ProtectedRoute>
            }
          />

          {/* Catch-all Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;