import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { cancellationPolicyService } from '../../services/cancellationPolicy';

const CancellationPolicyManager = ({ salonId }) => {
  const [policy, setPolicy] = useState({
    noticePeriod: 24,
    lateCancellationPenalty: 50,
    noShowPenalty: 100,
    isActive: true,
    policyMessage: 'Please cancel your appointment at least {noticePeriod} hours in advance to avoid penalties.'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (salonId) {
      fetchPolicy();
    }
  }, [salonId]);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const response = await cancellationPolicyService.getPolicy(salonId);
      if (response?.success && response.data.isActive) {
        setPolicy(response.data);
      }
    } catch (error) {
      console.error('Error fetching cancellation policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const policyData = {
        salonId,
        ...policy,
        policyMessage: `Please cancel your appointment at least ${policy.noticePeriod} hours in advance to avoid penalties.`
      };

      const response = await cancellationPolicyService.createOrUpdatePolicy(policyData);
      
      if (response?.success) {
        setSuccess('Cancellation policy saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error saving cancellation policy:', error);
      setError(error.response?.data?.message || 'Failed to save cancellation policy. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setPolicy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Cancellation Policy</h2>
        {policy.isActive && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-4 w-4 mr-1" />
            Active
          </span>
        )}
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm text-blue-800">
              Set your cancellation policy to manage late cancellations and no-shows
            </span>
          </div>
          <div className="flex items-center">
            <span className="mr-3 text-sm font-medium text-gray-700">Active</span>
            <button
              type="button"
              onClick={() => handleInputChange('isActive', !policy.isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                policy.isActive ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  policy.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {policy.isActive && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notice Period (hours)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={policy.noticePeriod}
                  onChange={(e) => handleInputChange('noticePeriod', parseInt(e.target.value) || 24)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 text-sm">hours</span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Customers must cancel at least {policy.noticePeriod} hours before their appointment
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Late Cancellation Penalty (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={policy.lateCancellationPenalty}
                    onChange={(e) => handleInputChange('lateCancellationPenalty', parseInt(e.target.value) || 0)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Applied when customers cancel within {policy.noticePeriod} hours
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No-Show Penalty (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={policy.noShowPenalty}
                    onChange={(e) => handleInputChange('noShowPenalty', parseInt(e.target.value) || 0)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Applied when customers don't show up for their appointment
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Policy Preview</h3>
              <p className="text-sm text-gray-600">
                {policy.policyMessage.replace('{noticePeriod}', policy.noticePeriod)}
              </p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="text-sm">
                  <span className="font-medium">Late Cancellation:</span> {policy.lateCancellationPenalty}% fee
                </div>
                <div className="text-sm">
                  <span className="font-medium">No-Show:</span> {policy.noShowPenalty}% fee
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || !policy.isActive}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : 'Save Policy'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CancellationPolicyManager;