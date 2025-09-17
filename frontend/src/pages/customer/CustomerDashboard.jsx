import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { 
  Calendar, 
  MapPin, 
  Star, 
  Clock, 
  User,
  Sparkles,
  Plus,
  ArrowRight
} from 'lucide-react'

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
    favoriteServices: []
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setDashboardData({
          statistics: {
            totalBookings: 12,
            upcomingBookings: 2,
            completedBookings: 10
          },
          recentBookings: [
            {
              id: 1,
              salonName: 'Glamour Studio',
              services: ['Haircut', 'Hair Styling'],
              date: '2025-01-15',
              time: '10:00 AM',
              status: 'Confirmed'
            },
            {
              id: 2,
              salonName: 'Beauty Palace',
              services: ['Facial', 'Manicure'],
              date: '2025-01-20',
              time: '2:00 PM',
              status: 'Pending'
            }
          ],
          favoriteServices: [
            { name: 'Haircut', category: 'Hair' },
            { name: 'Facial', category: 'Skin' },
            { name: 'Manicure', category: 'Nails' }
          ]
        })
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
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
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.name}</span>
              </div>
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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! ✨
          </h1>
          <p className="text-gray-600 mt-2">
            Ready to book your next beauty appointment?
          </p>
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
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">My Bookings</h3>
                <p className="text-gray-600 text-sm">View booking history</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </div>
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
              {dashboardData.recentBookings.map((booking) => (
                <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{booking.salonName}</h3>
                      <p className="text-sm text-gray-600">
                        {booking.services.join(', ')}
                      </p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {booking.date} at {booking.time}
                      </div>
                    </div>
                    <span className={`badge ${
                      booking.status === 'Confirmed' ? 'badge-success' : 
                      booking.status === 'Pending' ? 'badge-warning' : 'badge-gray'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Favorite Services */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Favorite Services</h2>

            <div className="space-y-3">
              {dashboardData.favoriteServices.map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.category}</p>
                  </div>
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerDashboard