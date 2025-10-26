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

  useEffect(() => {
    fetchApprovedSalons()
  }, [])

  const fetchApprovedSalons = async () => {
    try {
      setLoading(true)
      const res = await customerService.browseSalons({ page: 1, limit: 50 })
      if (res?.success) {
        setSalons(res.data || [])
      }
    } catch (e) {
      console.error('Error loading salons:', e)
    } finally {
      setLoading(false)
    }
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

      {/* Map Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Nearby Salons Map</h1>
            <p className="text-gray-600 mt-1">Find salons near you and discover new beauty experiences</p>
          </div>
          
          <div className="p-4">
            <SalonMap />
          </div>
        </div>
      </main>
    </div>
  )
}

export default MapView