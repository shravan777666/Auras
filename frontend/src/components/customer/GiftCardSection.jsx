import React, { useState, useEffect } from 'react';
import { CreditCard, Calendar, Tag, Info } from 'lucide-react';
import giftCardService from '../../services/giftCardService';
import { toast } from 'react-toastify';

const GiftCardSection = ({ salonId }) => {
  const [giftCards, setGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showRedemptionForm, setShowRedemptionForm] = useState(false);
  const [giftCardCode, setGiftCardCode] = useState('');

  // Fetch active gift cards for the salon
  const fetchGiftCards = async () => {
    try {
      setLoading(true);
      const response = await giftCardService.getActiveGiftCards(salonId);
      if (response.success) {
        setGiftCards(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch gift cards');
      }
    } catch (error) {
      console.error('Error fetching gift cards:', error);
      toast.error('Failed to fetch gift cards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (salonId) {
      fetchGiftCards();
    }
  }, [salonId]);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format amount for display
  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Handle gift card redemption
  const handleRedemption = async (e) => {
    e.preventDefault();
    try {
      const response = await giftCardService.redeemGiftCard(giftCardCode, salonId);
      if (response.success) {
        toast.success('Gift card redeemed successfully!');
        setGiftCardCode('');
        setShowRedemptionForm(false);
        // Optionally update UI to reflect redemption
      } else {
        toast.error(response.message || 'Failed to redeem gift card');
      }
    } catch (error) {
      console.error('Error redeeming gift card:', error);
      toast.error('Failed to redeem gift card');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Gift Cards
        </h3>
        <div className="text-gray-500">Loading gift cards...</div>
      </div>
    );
  }

  if (giftCards.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Gift Cards
        </h3>
        <div className="text-gray-500">No active gift cards available at this salon.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard className="h-5 w-5" />
        Gift Cards
      </h3>
      
      <div className="space-y-4">
        {giftCards.map((card) => (
          <div key={card._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900">{card.name}</h4>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {card.code}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    <span>{formatAmount(card.amount)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>Expires: {formatDate(card.expiryDate)}</span>
                  </div>
                </div>
                
                {card.description && (
                  <p className="text-sm text-gray-700 mb-2">{card.description}</p>
                )}
                
                <div className="text-xs text-gray-500">
                  Valid for: {card.usageType === 'BOTH' ? 'Services & Products' : 
                             card.usageType === 'SERVICE_ONLY' ? 'Services Only' : 
                             card.usageType === 'PRODUCT_ONLY' ? 'Products Only' : 
                             card.usageType.replace('_', ' ').toLowerCase()}
                </div>
                

              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => setShowRedemptionForm(!showRedemptionForm)}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center justify-center gap-2"
        >
          <CreditCard className="h-4 w-4" />
          Redeem Gift Card
        </button>
        
        {showRedemptionForm && (
          <form onSubmit={handleRedemption} className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter Gift Card Code
              </label>
              <input
                type="text"
                value={giftCardCode}
                onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                placeholder="Enter gift card code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Redeem Card
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default GiftCardSection;