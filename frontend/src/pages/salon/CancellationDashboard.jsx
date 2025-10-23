import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CancellationPolicyManager from '../../components/salon/CancellationPolicyManager';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { salonService } from '../../services/salon';

const CancellationDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCancellations: 0,
    lateCancellations: 0,
    noShows: 0,
    totalFees: 0,
    avgFee: 0
  });
  const [recentCancellations, setRecentCancellations] = useState([]);

  useEffect(() => {
    fetchCancellationData();
  }, []);

  const fetchCancellationData = async () => {
    try {
      setLoading(true);
      // Fetch actual data from the backend
      const response = await salonService.getCancellationStats();
      if (response.success) {
        setStats(response.data.stats);
        setRecentCancellations(response.data.recentCancellations || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cancellation data:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getCancellationTypeColor = (type) => {
    switch (type) {
      case 'Late':
        return 'bg-yellow-100 text-yellow-800';
      case 'No-Show':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading cancellation dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link 
                to="/salon/dashboard" 
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Cancellation Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">{user?.salonName || user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Cancellations</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalCancellations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Late Cancellations</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.lateCancellations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">No-Shows</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.noShows}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Fees</p>
                <p className="text-2xl font-semibold text-gray-900">₹{stats.totalFees}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Fee</p>
                <p className="text-2xl font-semibold text-gray-900">₹{stats.avgFee}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cancellation Policy Manager */}
          <div className="lg:col-span-1">
            <CancellationPolicyManager salonId={user?.salonId} />
          </div>

          {/* Recent Cancellations */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Cancellations</h2>
              
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fee
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentCancellations.map((cancellation) => (
                      <tr key={cancellation._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{cancellation.customerName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(cancellation.appointmentDate)}</div>
                          <div className="text-sm text-gray-500">{cancellation.appointmentTime}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCancellationTypeColor(cancellation.cancellationType)}`}>
                            {cancellation.cancellationType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{cancellation.fee}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {cancellation.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {recentCancellations.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No recent cancellations</h3>
                  <p className="text-gray-500">There are no cancellations to display at this time.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationDashboard;