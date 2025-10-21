import React, { useState, useEffect } from 'react';
import { TrendingUp, Store, Package, Users, DollarSign } from 'lucide-react';
import { adminService } from '../../services/adminService';

const AddonDashboardStats = ({ salonId = null }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    summary: {
      totalAddonSales: 0,
      totalRevenue: 0,
      totalAdminCommission: 0,
      totalSalonEarnings: 0
    },
    topSalons: [],
    topServices: []
  });

  useEffect(() => {
    fetchAddonDashboardStats();
  }, [salonId]);

  const fetchAddonDashboardStats = async () => {
    try {
      setLoading(true);
      // For admin dashboard stats, we don't pass salonId as it's meant to show overall stats
      // But we could modify this if needed for salon-specific stats
      const data = await adminService.getAddonDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching add-on dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Add-on Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-300 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Add-on Performance</h3>
        <button 
          onClick={fetchAddonDashboardStats}
          className="text-sm text-primary-600 hover:text-primary-800 font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-800">{stats.summary.totalAddonSales}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">₹{stats.summary.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Admin Commission</p>
              <p className="text-2xl font-bold text-gray-800">₹{stats.summary.totalAdminCommission.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Salon Earnings</p>
              <p className="text-2xl font-bold text-gray-800">₹{stats.summary.totalSalonEarnings.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <Store className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Salons and Services */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Salons */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Top Performing Salons</h4>
          {stats.topSalons.length > 0 ? (
            <div className="space-y-3">
              {stats.topSalons.slice(0, 5).map((salon, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                      <span className="text-primary-600 font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{salon.salonName}</p>
                      <p className="text-xs text-gray-500">{salon.count} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">₹{salon.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Commission: ₹{salon.commission.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No salon data available</p>
          )}
        </div>

        {/* Top Services */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Popular Add-on Services</h4>
          {stats.topServices.length > 0 ? (
            <div className="space-y-3">
              {stats.topServices.slice(0, 5).map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center mr-3">
                      <span className="text-secondary-600 font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{service.name}</p>
                      <p className="text-xs text-gray-500">{service.count} sales</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800">₹{service.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Commission: ₹{service.commission.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No service data available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddonDashboardStats;