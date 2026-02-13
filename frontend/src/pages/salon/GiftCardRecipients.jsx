import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard } from 'lucide-react';
import GiftCardRecipientsComponent from '../../components/salon/GiftCardRecipients';
import BackButton from '../../components/common/BackButton';

const GiftCardRecipients = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <BackButton fallbackPath="/salon/dashboard" className="text-gray-600 hover:text-gray-900" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gift Card Recipients</h1>
              <p className="text-gray-600 mt-1">View and manage all gift card recipients for your salon</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <CreditCard className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Gift Card Recipients Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <GiftCardRecipientsComponent />
      </div>
    </div>
  );
};

export default GiftCardRecipients;