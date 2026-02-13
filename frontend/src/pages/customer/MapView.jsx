import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { customerService } from '../../services/customer'
import SalonMap from '../../components/customer/SalonMap'
import { MapPin, ArrowLeft } from 'lucide-react'

const MapView = () => {
  const { user } = useAuth()
  const [salons, setSalons] = useState([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchApprovedSalons()
  }, [])

  const fetchApprovedSalons = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await customerService.getSalonLocations()
      if (res?.success) {
        setSalons(res.data || [])
      } else {
        setError('Failed to load salons. Please try again later.')
      }
    } catch (e) {
      console.error('Error loading salons:', e)
      setError('Failed to load salons. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Function to handle user location updates from SalonMap
  const handleUserLocation = (location) => {
    setUserLocation(location)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/customer/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span className="text-lg font-medium">Back to Dashboard</span>
              </Link>
            </div>
            
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="bg-primary-600 p-1.5 rounded-lg">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <span className="ml-2 text-lg font-bold text-gray-900">Salon Map</span>
              </div>
            </div>
            
            <div className="flex items-center">
              <Link to="/customer/explore-salons" className="text-primary-600 hover:text-primary-700 font-medium">
                Explore Salons
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Nearby Salons Map</h1>
            <p className="text-gray-600 mt-1">Find salons near you and discover new beauty experiences</p>
            {userLocation && (
              <p className="text-sm text-gray-500 mt-2">
                Your location: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
              </p>
            )}
          </div>
          
          <div className="p-4">
            <SalonMap salons={salons} onUserLocation={handleUserLocation} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default MapView