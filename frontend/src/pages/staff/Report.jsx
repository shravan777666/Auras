import React, { useEffect, useState } from 'react';
import { staffService } from '../../services/staff';
import { DollarSign, Calendar, User, TrendingUp } from 'lucide-react';

// A reusable card for displaying statistics
const StatCard = ({ icon, title, value, color }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md flex items-center gap-4 border-l-4 ${color} hover:shadow-lg transition-all`}>
    {icon}
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

// A reusable card for displaying sections
const ReportCard = ({ title, children, className = '' }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <TrendingUp className="text-blue-500" size={20} />
      {title}
    </h2>
    {children}
  </div>
);

// Simple bar chart component for revenue over time
const RevenueChart = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="h-64 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <TrendingUp size={48} className="text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No revenue data available</p>
        </div>
      </div>
    );
  }

  // Convert data to array and get max value for scaling
  const dataArray = Object.entries(data);
  const maxValue = Math.max(...dataArray.map(([_, value]) => value), 1);
  
  return (
    <div className="h-64 overflow-x-auto">
      <div className="flex items-end justify-between h-5/6 min-w-full" style={{ minWidth: `${dataArray.length * 30}px` }}>
        {dataArray.map(([date, value], index) => {
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const dateObj = new Date(date);
          const day = dateObj.getDate();
          const month = dateObj.toLocaleString('default', { month: 'short' });
          
          return (
            <div key={index} className="flex flex-col items-center flex-1 px-1">
              <div className="flex flex-col items-center w-full">
                <div 
                  className="w-3/4 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-all"
                  style={{ height: `${Math.max(height, 5)}%` }}
                ></div>
                <div className="text-xs text-gray-600 mt-1 text-center">
                  <div>{day}</div>
                  <div>{month}</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">
                ${value.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Report = () => {
  const [report, setReport] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    newCustomers: 0,
    revenueOverTime: {},
    upcomingAppointments: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch report data
        const reportResponse = await staffService.getStaffReport();
        setReport(reportResponse.data);
      } catch (error) {
        console.error('Error fetching report:', error);
        setError('Failed to load report data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Report</h1>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<DollarSign size={32} className="text-green-500" />}
            title="Total Revenue"
            value={`$${report.totalRevenue.toFixed(2)}`}
            color="border-green-500"
          />
          <StatCard
            icon={<Calendar size={32} className="text-blue-500" />}
            title="Total Appointments"
            value={report.totalAppointments}
            color="border-blue-500"
          />
          <StatCard
            icon={<User size={32} className="text-purple-500" />}
            title="New Customers"
            value={report.newCustomers}
            color="border-purple-500"
          />
        </div>

        {/* Revenue Over Time Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ReportCard title="Revenue Over Time (Last 30 Days)" className="h-full">
            <RevenueChart data={report.revenueOverTime} />
          </ReportCard>

          <ReportCard title="Upcoming Appointments" className="h-full">
            {report.upcomingAppointments && report.upcomingAppointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {report.upcomingAppointments.map((appointment) => (
                      <tr key={appointment._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.appointmentTime}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.customerId?.name || 'Unknown Client'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {appointment.services?.[0]?.serviceId?.name || 'Service'}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            appointment.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'In-Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No upcoming appointments</p>
              </div>
            )}
          </ReportCard>
        </div>
      </div>
    </div>
  );
};

export default Report;