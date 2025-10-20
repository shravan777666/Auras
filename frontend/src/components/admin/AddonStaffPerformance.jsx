import React, { useState, useEffect } from 'react';
import { Users, Package, DollarSign, TrendingUp } from 'lucide-react';
import { adminService } from '../../services/adminService';

const AddonStaffPerformance = () => {
  const [loading, setLoading] = useState(true);
  const [staffPerformance, setStaffPerformance] = useState([]);

  useEffect(() => {
    fetchStaffPerformance();
  }, []);

  const fetchStaffPerformance = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAddonStaffPerformance();
      setStaffPerformance(data);
    } catch (error) {
      console.error('Error fetching staff performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Staff Add-on Performance</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-12"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Staff Add-on Performance</h3>
        <button 
          onClick={fetchStaffPerformance}
          className="text-sm text-primary-600 hover:text-primary-800 font-medium"
        >
          Refresh
        </button>
      </div>

      {staffPerformance.length > 0 ? (
        <div className="space-y-3">
          {staffPerformance.map((staff, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                  <Users className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{staff.staffName}</p>
                  <p className="text-sm text-gray-600">{staff.count} add-on sales</p>
                </div>
              </div>
              <div className="flex space-x-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Revenue</p>
                  <p className="font-semibold text-gray-800">₹{staff.revenue.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Commission</p>
                  <p className="font-semibold text-gray-800">₹{staff.commission.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Earnings</p>
                  <p className="font-semibold text-gray-800">₹{staff.earnings.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No staff performance data available</p>
        </div>
      )}
    </div>
  );
};

export default AddonStaffPerformance;