import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Gift, Users } from 'lucide-react';
import { loyaltyService } from '../../services/loyalty';

const LoyaltyAnalyticsCard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await loyaltyService.getLoyaltyDashboardMetrics();
        setMetrics(response.data);
      } catch (err) {
        console.error('Error fetching loyalty metrics:', err);
        setError('Failed to load loyalty metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const {
    totalPointsIssued,
    totalPointsRedeemed,
    redemptionRatio,
    period
  } = metrics;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Loyalty Program</h3>
        <div className="text-sm text-gray-500">
          {period?.monthName} {period?.year}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Star className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <div className="text-sm text-gray-600">Points Issued</div>
              <div className="text-xl font-bold text-gray-900">{totalPointsIssued}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Gift className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <div className="text-sm text-gray-600">Points Redeemed</div>
              <div className="text-xl font-bold text-gray-900">{totalPointsRedeemed}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <div className="text-sm text-gray-600">Redemption Rate</div>
              <div className="text-xl font-bold text-gray-900">{redemptionRatio}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Loyalty Program Insights</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            Customers earn 1 point for every ₹10 spent
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            100 points can be redeemed for ₹100 discount
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">•</span>
            Higher tiers unlock exclusive benefits
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LoyaltyAnalyticsCard;