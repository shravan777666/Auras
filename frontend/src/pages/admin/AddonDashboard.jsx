import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Home, Store } from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import AddonDashboardStats from '../../components/admin/AddonDashboardStats';
import AddonStaffPerformance from '../../components/admin/AddonStaffPerformance';
import { adminService } from '../../services/adminService';

const AddonDashboard = () => {
  const [salons, setSalons] = useState([]);
  const [selectedSalonId, setSelectedSalonId] = useState(null);
  const [loadingSalons, setLoadingSalons] = useState(true);

  useEffect(() => {
    fetchSalons();
  }, []);

  const fetchSalons = async () => {
    try {
      setLoadingSalons(true);
      const response = await adminService.getAllSalons();
      setSalons(response.data || []);
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setLoadingSalons(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">Add-on Performance Dashboard</h1>
            <div className="flex items-center space-x-4">
              <BackButton fallbackPath="/admin/dashboard" />
              <Link to="/" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Home className="h-5 w-5 text-gray-600" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Salon Selection */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Select Salon</h3>
          {loadingSalons ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              <select
                value={selectedSalonId || ''}
                onChange={(e) => setSelectedSalonId(e.target.value || null)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a salon</option>
                {salons.map((salon) => (
                  <option key={salon._id} value={salon._id}>
                    {salon.salonName} ({salon.ownerName || 'No owner'})
                  </option>
                ))}
              </select>
              
              {selectedSalonId && (
                <button
                  onClick={() => setSelectedSalonId(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Clear Selection
                </button>
              )}
            </div>
          )}
        </div>

        {/* Dashboard Stats */}
        <div className="mb-8">
          <AddonDashboardStats salonId={selectedSalonId} />
        </div>

        {/* Staff Performance */}
        <div className="mb-8">
          <AddonStaffPerformance salonId={selectedSalonId} />
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">About Add-on Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">How It Works</h4>
              <p className="text-sm text-gray-600">
                The system automatically detects idle time slots in staff schedules and suggests discounted services to customers using machine learning predictions.
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Revenue Sharing</h4>
              <p className="text-sm text-gray-600">
                Revenue is split between salons and the platform based on configurable commission rates. The default commission rate is 15%.
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-800 mb-2">Performance Metrics</h4>
              <p className="text-sm text-gray-600">
                Track top performing salons, popular services, and staff performance to optimize your business strategy.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddonDashboard;