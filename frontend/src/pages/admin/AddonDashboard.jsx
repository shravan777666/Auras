import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import AddonDashboardStats from '../../components/admin/AddonDashboardStats';
import AddonStaffPerformance from '../../components/admin/AddonStaffPerformance';

const AddonDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-800">Add-on Performance Dashboard</h1>
            <div className="flex items-center space-x-4">
              <Link 
                to="/admin" 
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Admin Dashboard
              </Link>
              <Link to="/" className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Home className="h-5 w-5 text-gray-600" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="mb-8">
          <AddonDashboardStats />
        </div>

        {/* Staff Performance */}
        <div className="mb-8">
          <AddonStaffPerformance />
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