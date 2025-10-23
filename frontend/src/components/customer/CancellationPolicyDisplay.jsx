import React, { useState, useEffect } from 'react';
import { AlertCircle, Info } from 'lucide-react';
import { cancellationPolicyService } from '../../services/cancellationPolicy';

const CancellationPolicyDisplay = ({ salonId, onAgreeChange }) => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    fetchPolicy();
  }, [salonId]);

  useEffect(() => {
    if (onAgreeChange) {
      onAgreeChange(agreed);
    }
  }, [agreed, onAgreeChange]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const response = await cancellationPolicyService.getPolicy(salonId);
      if (response?.success) {
        setPolicy(response.data);
      }
    } catch (error) {
      console.error('Error fetching cancellation policy:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!policy || !policy.isActive) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-medium text-blue-800 mb-2">Cancellation Policy</h3>
          <p className="text-blue-700 mb-3">
            {policy.policyMessage.replace('{noticePeriod}', policy.noticePeriod)}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-white rounded p-3">
              <p className="text-sm font-medium text-gray-900">Late Cancellation</p>
              <p className="text-sm text-gray-600">
                {policy.noticePeriod}+ hours before: {policy.lateCancellationPenalty}% fee
              </p>
            </div>
            <div className="bg-white rounded p-3">
              <p className="text-sm font-medium text-gray-900">No-Show</p>
              <p className="text-sm text-gray-600">
                After appointment time: {policy.noShowPenalty}% fee
              </p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center">
            <input
              id="policy-agreement"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="policy-agreement" className="ml-2 block text-sm text-gray-700">
              I agree to the cancellation policy
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationPolicyDisplay;