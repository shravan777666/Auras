import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { customerService } from '../../services/customer'
import { 
  Calendar, 
  MapPin, 
  Star, 
  Clock, 
  User,
  Sparkles,
  Plus,
  ArrowRight,
  Mail,
  Phone,
  MessageCircle,
  Bell
} from 'lucide-react'
import SalonMap from '../../components/customer/SalonMap'
import RecommendationsSection from '../../components/customer/RecommendationsSection'
import { customerMessageService } from '../../services/customerMessage'
import MessageNotificationBadge from '../../components/customer/MessageNotificationBadge'
import OneClickBookingWidget from '../../components/customer/OneClickBookingWidget'
import CustomerLoyaltyCard from '../../components/customer/CustomerLoyaltyCard'
import FavoriteSalonCard from '../../components/customer/FavoriteSalonCard';
import BackButton from '../../components/common/BackButton';
import RecentSalonsCarousel from '../../components/customer/RecentSalonsCarousel';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002'
const IMAGE_BASE = (API_URL || '').replace(/\/+$/, '').replace(/\/api\/?$/, '')

const CustomerDashboard = () => {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState({
    statistics: {
      totalBookings: 0,
      upcomingBookings: 0,
      completedBookings: 0
    },
    recentBookings: [],
    favoriteServices: [],
    customerInfo: null
  })
  const [salons, setSalons] = useState([])
  const [salonsLoading, setSalonsLoading] = useState(false)
  const [pendingAppointments, setPendingAppointments] = useState([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)

  useEffect(() => {
    fetchDashboardData()
    fetchApprovedSalons() // This function needs to be defined
    fetchPendingAppointments()
    fetchUnreadMessageCount()
  }, [])

  // Refresh data when component becomes visible (e.g., returning from booking)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardData()
        fetchPendingAppointments()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Set up auto-refresh for pending appointments every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchPendingAppointments()
    }, 30000)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(refreshInterval)
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await customerService.getDashboard()
      console.log('Dashboard API response:', res)
      if (res?.success && res.data) {
        const { statistics = {}, recentBookings = [], favoriteServices = [], customerInfo = null } = res.data
        console.log('Dashboard statistics:', statistics)
        setDashboardData({
          statistics: {
            totalBookings: Number(statistics.totalBookings) || 0,
            upcomingBookings: Number(statistics.upcomingBookings) || 0,
            completedBookings: Number(statistics.completedBookings) || 0
          },
          recentBookings: Array.isArray(recentBookings) ? recentBookings : [],
          favoriteServices: Array.isArray(favoriteServices) ? favoriteServices : [],
          customerInfo: customerInfo || null
        })
      } else {
        console.log('No dashboard data received, using defaults')
        setDashboardData({
          statistics: { totalBookings: 0, upcomingBookings: 0, completedBookings: 0 },
          recentBookings: [],
          favoriteServices: [],
          customerInfo: null
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setDashboardData({
        statistics: { totalBookings: 0, upcomingBookings: 0, completedBookings: 0 },
        recentBookings: [],
        favoriteServices: [],
        customerInfo: null
      })
    } finally {
      setLoading(false)
    }
  }

  // UNCOMMENTED AND FIXED: Fetch approved salons function
  const fetchApprovedSalons = async () => {
    try {
      setSalonsLoading(true)
      const res = await customerService.browseSalons({ page: 1, limit: 12 })
      if (res?.success) {
        setSalons(res.data || [])
      }
    } catch (e) {
      console.error('Error loading salons:', e)
    } finally {
      setSalonsLoading(false)
    }
  }

  const fetchPendingAppointments = async () => {
    try {
      setPendingLoading(true)
      const response = await customerService.getPendingAppointments({ limit: 10 }) // Increased limit
      if (response.success) {
        setPendingAppointments(response.data || [])
        setLastUpdated(new Date())
        console.log(`Fetched ${response.data?.length || 0} pending appointments for customer`)
      } else {
        console.warn('Failed to fetch pending appointments:', response?.message)
        setPendingAppointments([])
      }
    } catch (error) {
      console.error('Error fetching pending appointments:', error)
      setPendingAppointments([])
    } finally {
      setPendingLoading(false)
    }
  }

  const fetchUnreadMessageCount = async () => {
    try {
      const response = await customerMessageService.getUnreadCount()
      if (response.success) {
        setUnreadMessageCount(response.data.totalUnreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching unread message count:', error)
      setUnreadMessageCount(0)
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BackButton fallbackPath="/customer/dashboard" className="mr-4" />
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold gradient-text">Auracare</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Message Notification Badge */}
              <MessageNotificationBadge />
              
              <div className="flex items-center space-x-2">
                {dashboardData.customerInfo?.profilePic || dashboardData.customerInfo?.profilePicture ? (
                  <img
                    src={`${IMAGE_BASE}/${String(dashboardData.customerInfo.profilePic || dashboardData.customerInfo.profilePicture).replace(/^\/+/, '')}`}
                    alt={dashboardData.customerInfo?.name || 'Profile'}
                    className="h-8 w-8 rounded-full object-cover border"
                    onError={(e)=>{ e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dashboardData.customerInfo?.name || user?.name || 'User')}&background=random&size=64` }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <span className="text-sm text-gray-700">{dashboardData.customerInfo?.name || user?.name}</span>
              </div>
              <Link
                to="/profile"
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <User className="h-4 w-4 mr-1" />
                Profile
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {dashboardData.customerInfo?.name || 'Valued Customer'}!</h1>
          <p className="text-gray-600">Manage your appointments and discover new beauty experiences</p>
        </div>

        {/* Favorite and Recent Salons */}
        <div className="mb-8">
          <FavoriteSalonCard />
        </div>
        <div className="mb-8">
          <RecentSalonsCarousel />
        </div>

        {/* Stats and Loyalty Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.statistics.totalBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.statistics.upcomingBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{dashboardData.statistics.completedBookings}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Loyalty Card */}
          <div>
            <CustomerLoyaltyCard customerId={user?.id} />
          </div>
        </div>

        {/* One-Click Booking and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <OneClickBookingWidget />
          </div>
          <div className="lg:col-span-2">
            <RecommendationsSection customerId={user?.id} />
          </div>
        </div>

        {/* Pending Appointments */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Pending Appointments</h2>
            <Link 
              to="/bookings" 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 flex items-center"
            >
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {pendingLoading ? (
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg mr-4"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : pendingAppointments && pendingAppointments.length > 0 ? (
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {pendingAppointments.map((appointment) => {
                  const salonName = appointment.salonId?.salonName || 'Unknown Salon'
                  const serviceNames = appointment.services?.map(s => 
                    s.serviceName || s.serviceId?.name || 'Service'
                  ).join(', ') || 'Services'
                  
                  // Format date and time
                  const appointmentDate = new Date(appointment.appointmentDate)
                  const formattedDate = appointmentDate.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric' 
                  })
                  const formattedTime = appointment.appointmentTime

                  return (
                    <li key={appointment._id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-white" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{salonName}</div>
                            <div className="text-sm text-gray-500">{serviceNames}</div>
                            <div className="flex items-center text-xs text-gray-400 mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{formattedDate} at {formattedTime}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            to={`/salon/${appointment.salonId?._id}`}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No pending appointments</h3>
              <p className="text-gray-500 mb-4">You don't have any pending appointments at the moment.</p>
              <Link
                to="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Book New Appointment
              </Link>
            </div>
          )}
        </div>

        {/* Recently Visited Salons Map */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Nearby Salons</h2>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <SalonMap salons={salons} loading={salonsLoading} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerDashboard
