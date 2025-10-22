import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Info } from 'lucide-react';
import { loyaltyService } from '../../services/loyalty';

const LoyaltyRedemptionWidget = ({ 
  serviceTotal, 
  onRedemptionChange,
  initialRedeemPoints = false
}) => {
  // Don't render if no service total
  if (!serviceTotal || serviceTotal <= 0) {
    return null;
  }
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usePoints, setUsePoints] = useState(initialRedeemPoints);
  const [pointsToRedeem, setPointsToRedeem] = useState(100); // Default to minimum

  useEffect(() => {
    const fetchLoyaltyData = async () => {
      try {
        setLoading(true);
        console.log('Fetching loyalty data');
        const response = await loyaltyService.getCustomerLoyaltyDetails();
        console.log('Loyalty data response:', response);
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

  // Use useCallback to prevent unnecessary re-renders
  const handlePointsChange = useCallback((e) => {
    const value = parseInt(e.target.value) || 0;
    if (loyaltyData) {
      // Ensure value is within valid range
      const maxRedeemable = Math.min(
        loyaltyData.loyaltyPoints, 
        Math.floor(serviceTotal / 100) * 100
      );
      
      const validatedValue = Math.min(Math.max(100, value), maxRedeemable);
      // Round to nearest 100
      const roundedValue = Math.floor(validatedValue / 100) * 100;
      setPointsToRedeem(roundedValue);
    }
  }, [loyaltyData, serviceTotal]);

  // Only call onRedemptionChange when specific values change
  useEffect(() => {
    // Notify parent component of redemption changes
    if (onRedemptionChange) {
      if (usePoints && loyaltyData) {
        // Validate points to redeem
        const maxRedeemable = Math.min(
          loyaltyData.loyaltyPoints, 
          Math.floor(serviceTotal / 100) * 100 // Max points that can be used based on service total
        );
        
        // Ensure pointsToRedeem is within valid range
        const validatedPoints = Math.min(
          Math.max(100, pointsToRedeem), 
          maxRedeemable
        );
        
        // Round down to nearest 100
        const roundedPoints = Math.floor(validatedPoints / 100) * 100;
        
        const redemptionInfo = {
          usePoints,
          pointsToRedeem: roundedPoints,
          discountAmount: roundedPoints
        };
        
        onRedemptionChange(redemptionInfo);
      } else if (usePoints) {
        // User has enabled points but we don't have loyalty data yet
        // Send basic info to show the UI elements
        const redemptionInfo = {
          usePoints: true,
          pointsToRedeem: 0,
          discountAmount: 0
        };
        
        onRedemptionChange(redemptionInfo);
      } else {
        const redemptionInfo = {
          usePoints: false,
          pointsToRedeem: 0,
          discountAmount: 0
        };
        
        onRedemptionChange(redemptionInfo);
      }
    }
  }, [usePoints, pointsToRedeem, loyaltyData, serviceTotal, onRedemptionChange]); // Add all dependencies

  // Reset points when usePoints is toggled off
  useEffect(() => {
    if (!usePoints) {
      setPointsToRedeem(100);
    }
  }, [usePoints]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  if (error || !loyaltyData) {
    return null;
  }

  const { loyaltyPoints } = loyaltyData;
  
  // Calculate maximum redeemable points based on service total
  const maxRedeemablePoints = Math.min(
    loyaltyPoints, 
    Math.floor(serviceTotal / 100) * 100
  );
  
  // Calculate discount amount
  const discountAmount = usePoints ? pointsToRedeem : 0;
  
  // Calculate final amount after discount
  const finalAmount = Math.max(0, serviceTotal - discountAmount);

  // If customer doesn't have enough points to redeem, don't show the widget
  if (loyaltyPoints < 100) {
    return null;
  }

  return (
    <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Gift className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="font-medium text-blue-900">Loyalty Points Redemption</h3>
        </div>
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={usePoints}
            onChange={(e) => setUsePoints(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-blue-800">Use Points</span>
        </label>
      </div>

      {usePoints && (
        <div className="space-y-3">
          <div className="text-sm text-blue-800">
            <p>Available: {loyaltyPoints} points (₹{loyaltyPoints} value)</p>
            <p>Maximum redeemable: {maxRedeemablePoints} points (₹{maxRedeemablePoints} value)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">
              Points to Redeem (multiples of 100)
            </label>
            <input
              type="number"
              min="100"
              max={maxRedeemablePoints}
              step="100"
              value={pointsToRedeem}
              onChange={handlePointsChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-between text-xs text-blue-700 mt-1">
              <span>Min: 100</span>
              <span>Max: {maxRedeemablePoints}</span>
            </div>
          </div>

          <div className="bg-white rounded-md p-3 border border-blue-200">
            <div className="flex justify-between text-sm">
              <span className="text-blue-900">Original Price:</span>
              <span className="font-medium">₹{serviceTotal}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-blue-900">Loyalty Discount:</span>
              <span className="font-medium text-green-600">-₹{discountAmount}</span>
            </div>
            <div className="flex justify-between text-base font-semibold mt-2 pt-2 border-t border-blue-100">
              <span className="text-blue-900">Total After Discount:</span>
              <span className="text-blue-900">₹{finalAmount}</span>
            </div>
            <div className="mt-2 text-xs text-blue-700">
              You save ₹{discountAmount} with loyalty points!
            </div>
          </div>

          {serviceTotal <= 100 && (
            <div className="flex items-center text-sm text-yellow-700 bg-yellow-50 rounded-md p-2">
              <Info className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Minimum booking amount should be more than ₹100 to use points</span>
            </div>
          )}
        </div>
      )}

      {!usePoints && (
        <div className="text-sm text-blue-800">
          <p>You have {loyaltyPoints} points available (₹{loyaltyPoints} value)</p>
          <p className="mt-1">Redeem 100 points for ₹100 discount on your booking</p>
        </div>
      )}
    </div>
  );
};

export default LoyaltyRedemptionWidget;