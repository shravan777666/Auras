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
              <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold gradient-text">Auracare</span>
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
                to="/customer/edit-profile"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Edit Profile
              </Link>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center">
              {dashboardData.customerInfo?.profilePic || dashboardData.customerInfo?.profilePicture ? (
                <img
                  src={`${IMAGE_BASE}/${String(dashboardData.customerInfo.profilePic || dashboardData.customerInfo.profilePicture).replace(/^\/+/, '')}`}
                  alt={dashboardData.customerInfo?.name || 'Profile'}
                  className="h-16 w-16 rounded-full object-cover border"
                  onError={(e)=>{ e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dashboardData.customerInfo?.name || user?.name || 'User')}&background=random&size=128` }}
                />
              ) : (
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(dashboardData.customerInfo?.name || user?.name || 'User')}&background=random&size=128`}
                  alt="Profile placeholder"
                  className="h-16 w-16 rounded-full object-cover border"
                />
              )}
              <div className="ml-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welcome back, {dashboardData.customerInfo?.name || user?.name}! ✨</h1>
                <p className="text-gray-600 mt-1">Ready to book your next beauty appointment?</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
              {dashboardData.customerInfo?.email && (
                <div className="flex items-center text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="truncate">{dashboardData.customerInfo.email}</span>
                </div>
              )}
              {(dashboardData.customerInfo?.contactNumber || dashboardData.customerInfo?.phone) && (
                <div className="flex items-center text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                  <Phone className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{dashboardData.customerInfo.contactNumber || dashboardData.customerInfo.phone}</span>
                </div>
              )}
              {dashboardData.customerInfo?.address && (
                <div className="flex items-center text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="truncate">
                    {[
                      dashboardData.customerInfo.address.street,
                      dashboardData.customerInfo.address.city,
                      dashboardData.customerInfo.address.state,
                      dashboardData.customerInfo.address.country
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* One-Click Booking Widget */}
        <div className="mb-8">
          <OneClickBookingWidget />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/customer/book-appointment"
            className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6 rounded-xl hover:from-primary-600 hover:to-primary-700 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Book Appointment</h3>
                <p className="text-primary-100 text-sm">Find and book with top salons</p>
              </div>
              <Plus className="h-8 w-8 text-primary-200 group-hover:text-white transition-colors" />
            </div>
          </Link>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Browse Salons</h3>
                <p className="text-gray-600 text-sm">Discover salons near you</p>
              </div>
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <div className="mt-4">
              <SalonMap onNavigateNearest />
            </div>
          </div>

          <Link
            to="/customer/my-bookings"
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Bookings</h3>
                <p className="text-gray-600 text-sm">View booking history</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400 group-hover:text-primary-600 transition-colors" />
            </div>
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-primary-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.statistics.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-warning-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.statistics.upcomingBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="bg-success-100 p-3 rounded-full">
                <Star className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.statistics.completedBookings}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Pending Approvals</h2>
              {lastUpdated && (
                <p className="text-xs text-gray-500 mt-1">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchPendingAppointments}
                disabled={pendingLoading}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Clock className="h-4 w-4" />
                {pendingLoading ? 'Refreshing...' : 'Refresh'}
              </button>
              <Link to="/customer/my-bookings" className="text-sm text-primary-600 hover:text-primary-500 flex items-center">
                View all bookings
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
          
          {pendingLoading ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Loading pending appointments...</span>
              </div>
            </div>
          ) : pendingAppointments.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No pending appointments</p>
              <p className="text-sm text-gray-500 mt-1">All your appointments are confirmed or completed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAppointments.map((appointment) => {
                const salonName = appointment.salonId?.salonName || 'Unknown Salon'
                const services = appointment.services || []
                const appointmentDate = appointment.appointmentDate ? new Date(appointment.appointmentDate).toLocaleDateString() : 'N/A'
                const appointmentTime = appointment.appointmentTime || 'N/A'
                const totalAmount = appointment.finalAmount || appointment.totalAmount || 0
                const customerNotes = appointment.customerNotes || ''
                const bookingId = appointment._id
                
                return (
                  <div key={appointment._id} className="bg-white p-6 rounded-xl shadow-sm border border-yellow-200 border-l-4 border-l-yellow-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <Clock className="h-5 w-5 text-yellow-500 mr-2" />
                          <h3 className="text-lg font-semibold text-gray-900">{salonName}</h3>
                          <span className="ml-3 px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                            Pending Approval
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>{appointmentDate} at {appointmentTime}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">Booking ID:</span>
                            <span className="ml-1 font-mono">{bookingId.slice(-8)}</span>
                          </div>
                        </div>
                        
                        {services.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Services:</p>
                            <div className="space-y-1">
                              {services.map((service, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                  <span className="text-gray-900">{service.serviceName || service.serviceId?.name || 'Service'}</span>
                                  <span className="text-gray-600">₹{service.price || service.serviceId?.price || 0}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {customerNotes && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-1">Your Notes:</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{customerNotes}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="text-lg font-semibold text-gray-900">
                            Total: ₹{totalAmount}
                          </div>
                          <div className="text-sm text-gray-500">
                            Waiting for salon confirmation
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recommendations Section */}
        <div className="mb-8">
          <RecommendationsSection />
        </div>

        {/* Browse Salons */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Browse Salons</h2>
            <Link to="/customer/book-appointment" className="text-sm text-primary-600 hover:text-primary-500 flex items-center">
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          {salonsLoading ? (
            <LoadingSpinner text="Loading salons..." />
          ) : salons.length === 0 ? (
            <div className="text-center text-gray-500 p-6 bg-white rounded-xl border">No salons available yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {salons.map((s, idx) => {
                const logo = s.documents?.salonLogo ? s.documents.salonLogo : null
                const address = typeof s.salonAddress === 'string' ? s.salonAddress : [s.salonAddress?.street, s.salonAddress?.city, s.salonAddress?.state].filter(Boolean).join(', ')
                const services = Array.isArray(s.services) ? s.services.slice(0,3).map(x => x.name).join(', ') : ''
                const phone = s.contactNumber || s.phone || ''
                return (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition">
                    <div className="flex items-center mb-3">
                      {logo ? (
                        <img src={logo} alt={s.salonName} className="h-12 w-12 rounded-lg object-cover border mr-3" onError={(e)=>{e.currentTarget.style.display='none'}} />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center mr-3">
                          <Sparkles className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{s.salonName}</h3>
                        {address && <p className="text-xs text-gray-500">{address}</p>}
                      </div>
                    </div>
                    {services && (
                      <p className="text-sm text-gray-700 mb-2"><span className="font-medium">Services:</span> {services}{Array.isArray(s.services) && s.services.length>3 ? '…' : ''}</p>
                    )}
                    {phone && (
                      <p className="text-sm text-gray-600">Contact: {phone}</p>
                    )}
                    <div className="mt-3 flex gap-3">
                      <Link to={`/customer/salon/${s._id}`} className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm">View Details <ArrowRight className="h-4 w-4 ml-1" /></Link>
                      <Link to={`/customer/book-appointment/${s._id}`} className="inline-flex items-center text-secondary-600 hover:text-secondary-700 text-sm">Book Now <ArrowRight className="h-4 w-4 ml-1" /></Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
              <Link
                to="/customer/bookings"
                className="text-sm text-primary-600 hover:text-primary-500 flex items-center"
              >
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <div className="space-y-4">
              {dashboardData.recentBookings.length === 0 && (
                <div className="text-sm text-gray-500">No recent bookings found.</div>
              )}
              {dashboardData.recentBookings.map((booking) => {
                const key = booking._id || booking.id
                const salonName = booking.salonId?.salonName || booking.salonName || 'Salon'
                const services = Array.isArray(booking.services)
                  ? booking.services.map(s => s.serviceId?.name || s.name).filter(Boolean)
                  : []
                const date = booking.appointmentDate || booking.date
                const time = booking.appointmentTime || booking.time
                const status = booking.status
                return (
                  <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{salonName}</h3>
                      <p className="text-sm text-gray-600">
                        {services.join(', ')}
                      </p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {date ? new Date(date).toLocaleDateString() : ''} {time ? `at ${time}` : ''}
                      </div>
                    </div>
                    <span className={`badge ${
                      status === 'Confirmed' ? 'badge-success' : 
                      status === 'Pending' ? 'badge-warning' : 'badge-gray'
                    }`}>
                      {status}
                    </span>
                  </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Favorite Services */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Favorite Services</h2>

            <div className="space-y-3">
              {dashboardData.favoriteServices.length === 0 && (
                <div className="text-sm text-gray-500">No favorite services yet.</div>
              )}
              {dashboardData.favoriteServices.map((service, index) => {
                const name = service.name
                const category = service.category
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">{name}</h3>
                      <p className="text-sm text-gray-600">{category}</p>
                    </div>
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerDashboard