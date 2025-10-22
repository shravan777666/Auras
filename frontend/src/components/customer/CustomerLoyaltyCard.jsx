import React, { useState, useEffect } from 'react';
import { Star, Trophy, Gift } from 'lucide-react';
import { loyaltyService } from '../../services/loyalty';
import { useNavigate } from 'react-router-dom';

const CustomerLoyaltyCard = () => {
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      try {
        setLoading(true);
        const response = await loyaltyService.getCustomerLoyaltyDetails();
        setLoyaltyData(response.data);
      } catch (err) {
        console.error('Error fetching loyalty data:', err);
        setError('Failed to load loyalty information');
      } finally {
        setLoading(false);
      }
    };

    fetchLoyaltyData();
  }, []);

  const handleRedeemPoints = () => {
    // Navigate to booking page with redemption flag
    navigate('/customer/book-appointment', { state: { redeemPoints: true } });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="text-center text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!loyaltyData) {
    return null;
  }

  const {
    loyaltyPoints,
    totalPointsEarned,
    totalPointsRedeemed,
    loyaltyTier,
    pointsValue
  } = loyaltyData;

  // Determine tier color
  const getTierColor = (tier) => {
    switch (tier.toLowerCase()) {
      case 'platinum': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'gold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'silver': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Determine tier icon
  const getTierIcon = (tier) => {
    switch (tier.toLowerCase()) {
      case 'platinum': return <Trophy className="h-5 w-5 text-purple-600" />;
      case 'gold': return <Trophy className="h-5 w-5 text-yellow-600" />;
      case 'silver': return <Trophy className="h-5 w-5 text-gray-600" />;
      default: return <Star className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Loyalty Points</h3>
        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getTierColor(loyaltyTier)}`}>
          {getTierIcon(loyaltyTier)}
          <span className="ml-1">{loyaltyTier}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{loyaltyPoints}</div>
          <div className="text-sm text-gray-600">Available Points</div>
          <div className="text-xs text-gray-500 mt-1">₹{pointsValue} value</div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">₹{pointsValue}</div>
          <div className="text-sm text-gray-600">Redeemable Value</div>
          <div className="text-xs text-gray-500 mt-1">Min. 100 pts</div>
        </div>
      </div>

      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>Total Earned</span>
        <span className="font-medium">{totalPointsEarned} pts</span>
      </div>

      <div className="flex justify-between text-sm text-gray-600 mb-4">
        <span>Total Redeemed</span>
        <span className="font-medium">{totalPointsRedeemed} pts</span>
      </div>

      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-blue-800">
            <Gift className="h-4 w-4 mr-2" />
            <span>Redeem 100 points for ₹100 discount</span>
          </div>
          <button
            onClick={handleRedeemPoints}
            disabled={loyaltyPoints < 100}
            className={`text-xs px-2 py-1 rounded ${loyaltyPoints >= 100 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            Redeem
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerLoyaltyCard;