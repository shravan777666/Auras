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

const Report = () => {
  const [report, setReport] = useState({
    totalRevenue: 0,
    totalAppointments: 0,
    newCustomers: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch report data
        const reportResponse = await staffService.getStaffReport();
        setReport(reportResponse.data);

        // Fetch upcoming appointments
        const upcomingResponse = await staffService.getUpcomingAppointments({ limit: 10 });
        setUpcomingAppointments(upcomingResponse.data || []);
      } catch (error) {
        console.error('Error fetching report or upcoming appointments:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Report</h1>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<DollarSign size={32} className="text-green-500" />}
            title="Total Revenue"
            value={`$${report.totalRevenue}`}
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
          <ReportCard title="Revenue Over Time" className="h-full">
            <div className="h-64 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <TrendingUp size={48} className="text-blue-500 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Chart visualization coming soon</p>
                <p className="text-sm text-gray-500">Integrate with Chart.js or Recharts for detailed analytics</p>
              </div>
            </div>
          </ReportCard>

          <ReportCard title="Upcoming Appointments" className="h-full">
            {upcomingAppointments.length > 0 ? (
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
                    {upcomingAppointments.map((appointment, index) => (
                      <tr key={index} className="hover:bg-gray-50">
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
