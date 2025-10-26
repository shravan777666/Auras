import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  Bell,
  Search,
  Filter,
  Heart,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  Home,
  History,
  UserCircle,
  Lock,
  CreditCard,
  Scissors
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
  const navigate = useNavigate()
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
  const [recentSalons, setRecentSalons] = useState([])
  const [salonsLoading, setSalonsLoading] = useState(false)
  const [pendingAppointments, setPendingAppointments] = useState([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    fetchDashboardData()
    fetchApprovedSalons()
    fetchPendingAppointments()
    fetchUnreadMessageCount()
    fetchRecentSalons()
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
      setLoading(true);
      const [dashboardRes, recentSalonsRes, unreadCountRes] = await Promise.all([
        customerService.getDashboard(),
        customerService.getRecentSalons(),
        customerMessageService.getUnreadCount()
      ]);

      if (dashboardRes?.success) {
        setDashboardData(dashboardRes.data);
      }

      if (recentSalonsRes?.success) {
        setRecentSalons(recentSalonsRes.data || []);
      }

      if (unreadCountRes?.success) {
        setUnreadMessageCount(unreadCountRes.data?.totalUnreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

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

  const fetchRecentSalons = async () => {
    try {
      const res = await customerService.getRecentSalons()
      if (res?.success) {
        console.log('Recent salons:', res.data)
        setRecentSalons(res.data || [])
      }
    } catch (e) {
      console.error('Error loading recent salons:', e)
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

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" /> Confirmed
        </span>
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" /> Pending
        </span>
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" /> Cancelled
        </span>
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>
    }
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'history', label: 'History', icon: History },
    { id: 'profile', label: 'Profile', icon: UserCircle }
  ]

  const renderOverviewSection = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back, {dashboardData.customerInfo?.name || 'Valued Customer'}!</h1>
          <p className="text-gray-600 mt-1">Manage your appointments and discover new beauty experiences</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link
            to="/customer/book"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Book New Appointment
          </Link>
        </div>
      </div>

      {/* Recent/Nearby Salons - Moved to top */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Recent & Nearby Salons</h2>
          <div className="flex space-x-3">
            <Link to="/customer/map" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View Map
            </Link>
            <Link to="/customer/explore-salons" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4">
            <div className="flex space-x-4">
              {recentSalons && recentSalons.length > 0 ? (
                recentSalons.slice(0, 2).map((salon) => (
                  <div key={salon._id} className="flex-shrink-0 w-64 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      {salon.profileImage || salon.salonImage ? (
                        <img 
                          src={`${import.meta.env.VITE_API_URL || ''}${salon.profileImage || salon.salonImage}`} 
                          alt={salon.salonName || salon.name} 
                          className="w-16 h-16 rounded-xl object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                          <Scissors className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">{salon.salonName || salon.name}</h3>
                        <p className="text-xs text-gray-500">Last visited: {salon.lastVisit ? new Date(salon.lastVisit).toLocaleDateString() : 'Recent'}</p>
                      </div>
                    </div>
                    <Link 
                      to={`/customer/book-appointment/${salon._id}`} 
                      className="mt-3 w-full py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 inline-block text-center"
                    >
                      Book Again
                    </Link>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex-shrink-0 w-64 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">Shravan</h3>
                        <p className="text-xs text-gray-500">Last visited: Oct 20, 2025</p>
                      </div>
                    </div>
                    <Link to="/customer/book-appointment/salon1" className="mt-3 w-full py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 inline-block text-center">
                      Book Again
                    </Link>
                  </div>
                  <div className="flex-shrink-0 w-64 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                      <div className="ml-3">
                        <h3 className="font-medium text-gray-900">Test Salon</h3>
                        <p className="text-xs text-gray-500">Last visited: Sep 15, 2025</p>
                      </div>
                    </div>
                    <Link to="/customer/book-appointment/salon2" className="mt-3 w-full py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 inline-block text-center">
                      Book Again
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/customer/bookings" className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Calendar className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">My Bookings</p>
              <p className="text-lg font-bold text-gray-900">{dashboardData.statistics.totalBookings}</p>
            </div>
          </div>
        </Link>

        <Link to="/customer/favorites" className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-pink-50 rounded-lg">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Favorites</p>
              <p className="text-lg font-bold text-gray-900">{dashboardData.favoriteServices.length}</p>
            </div>
          </div>
        </Link>

        <Link to="/customer/messages" className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Messages</p>
              <p className="text-lg font-bold text-gray-900">{unreadMessageCount}</p>
            </div>
          </div>
        </Link>

        <Link to="/customer/recommendations" className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Recommended</p>
              <p className="text-lg font-bold text-gray-900">12</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.statistics.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.statistics.upcomingBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Star className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.statistics.completedBookings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loyalty Points Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Award className="h-5 w-5 text-primary-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Loyalty Points</p>
              <p className="text-2xl font-bold text-primary-600">38</p>
            </div>
          </div>
          <Link to="/customer/loyalty" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View Details
          </Link>
        </div>
      </div>

    </div>
  )

  const renderAppointmentsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          Book New Appointment
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
        </div>
        {pendingLoading ? (
          <div className="p-6">
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
                      <div className="flex-shrink-0 h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary-600" />
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
                    <div className="flex flex-col items-end">
                      {getStatusBadge(appointment.status)}
                      <div className="flex space-x-2 mt-2">
                        <Link
                          to={`/customer/bookings/${appointment._id}`}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No upcoming appointments</h3>
            <p className="text-gray-500 mb-4">You don't have any upcoming appointments at the moment.</p>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Book New Appointment
            </Link>
          </div>
        )}
      </div>
    </div>
  )

  const renderHistorySection = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Service History</h1>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Completed Appointments</h2>
        </div>
        <ul className="divide-y divide-gray-200">
          {dashboardData.recentBookings && dashboardData.recentBookings.length > 0 ? (
            dashboardData.recentBookings.slice(0, 5).map((booking) => (
              <li key={booking._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Star className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{booking.salonName || 'Unknown Salon'}</div>
                      <div className="text-sm text-gray-500">{booking.serviceName || 'Service'}</div>
                      <div className="flex items-center text-xs text-gray-400 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center text-yellow-400 mr-4">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < (booking.rating || 0) ? 'fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <Link
                      to={`/customer/bookings/${booking._id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="p-8 text-center">
              <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No service history yet</h3>
              <p className="text-gray-500">Your completed appointments will appear here.</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  )

  const renderProfileSection = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col items-center">
              {dashboardData.customerInfo?.profilePic || dashboardData.customerInfo?.profilePicture ? (
                <img
                  src={`${IMAGE_BASE}/${String(dashboardData.customerInfo.profilePic || dashboardData.customerInfo.profilePicture).replace(/^\/+/, '')}`}
                  alt={dashboardData.customerInfo?.name || 'Profile'}
                  className="h-20 w-20 rounded-full object-cover border-2 border-primary-100"
                  onError={(e)=>{ e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dashboardData.customerInfo?.name || user?.name || 'User')}&background=random&size=64` }}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-600" />
                </div>
              )}
              <h2 className="mt-4 text-lg font-bold text-gray-900">{dashboardData.customerInfo?.name || user?.name}</h2>
              <p className="text-gray-600 text-sm">{dashboardData.customerInfo?.email || user?.email}</p>
              <div className="mt-4 flex space-x-3">
                <Link
                  to="/customer/edit-profile"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
                >
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mt-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/customer/profile" className="flex items-center text-gray-700 hover:text-primary-600">
                  <User className="h-4 w-4 mr-3" />
                  Personal Information
                </Link>
              </li>
              <li>
                <Link to="/customer/profile" className="flex items-center text-gray-700 hover:text-primary-600">
                  <Lock className="h-4 w-4 mr-3" />
                  Security Settings
                </Link>
              </li>
              <li>
                <Link to="/customer/profile" className="flex items-center text-gray-700 hover:text-primary-600">
                  <Bell className="h-4 w-4 mr-3" />
                  Notification Preferences
                </Link>
              </li>
              <li>
                <Link to="/customer/profile" className="flex items-center text-gray-700 hover:text-primary-600">
                  <CreditCard className="h-4 w-4 mr-3" />
                  Payment Methods
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500">Full Name</label>
                <p className="mt-1 text-sm text-gray-900">{dashboardData.customerInfo?.name || user?.name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Email Address</label>
                <p className="mt-1 text-sm text-gray-900">{dashboardData.customerInfo?.email || user?.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Phone Number</label>
                <p className="mt-1 text-sm text-gray-900">{dashboardData.customerInfo?.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Member Since</label>
                <p className="mt-1 text-sm text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="bg-primary-600 p-1.5 rounded-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-lg font-bold text-gray-900">Auracare</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`flex items-center px-1 py-4 text-sm font-medium relative ${
                      activeSection === item.id
                        ? 'text-primary-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {item.label}
                    {activeSection === item.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
                    )}
                  </button>
                )
              })}
            </nav>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4">
              {/* Search Icon */}
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
                <Search className="h-5 w-5" />
              </button>

              {/* Message Notification */}
              <MessageNotificationBadge />

              {/* User Profile and Logout */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {dashboardData.customerInfo?.profilePic || dashboardData.customerInfo?.profilePicture ? (
                    <img
                      src={`${IMAGE_BASE}/${String(dashboardData.customerInfo.profilePic || dashboardData.customerInfo.profilePicture).replace(/^\/+/, '')}`}
                      alt={dashboardData.customerInfo?.name || 'Profile'}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={(e)=>{ e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dashboardData.customerInfo?.name || user?.name || 'User')}&background=random&size=64` }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-600" />
                    </div>
                  )}
                </div>

                {/* Logout Button - Mobile */}
                <button
                  onClick={logout}
                  className="md:hidden flex items-center px-2 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>

                {/* Logout Button - Desktop */}
                <button
                  onClick={logout}
                  className="hidden md:flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>

              {/* Book New Appointment Button */}
              <Link
                to="/customer/book"
                className="hidden md:inline-flex items-center px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Book New
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Render active section */}
        {activeSection === 'overview' && renderOverviewSection()}
        {activeSection === 'appointments' && renderAppointmentsSection()}
        {activeSection === 'history' && renderHistorySection()}
        {activeSection === 'profile' && renderProfileSection()}
      </main>
    </div>
  );
};

export default CustomerDashboard