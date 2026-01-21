import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Calendar, Mail, MessageCircle, User, CheckCircle, IndianRupee } from 'lucide-react';
import giftCardService from '../../services/giftCardService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const GiftCardPurchase = () => {
  const { giftCardId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { giftCard, salonId } = location.state || {};
  
  const [purchaseData, setPurchaseData] = useState({
    recipientEmail: '',
    personalMessage: '',
    expiryDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [giftCardDetails, setGiftCardDetails] = useState(null);

  // Load gift card details if not passed in location state
  const loadGiftCardDetails = async () => {
    if (!giftCard) {
      try {
        setLoading(true);
        const response = await giftCardService.getGiftCardTemplateById(giftCardId);
        if (response.success) {
          setGiftCardDetails(response.data);
        } else {
          toast.error(response.message || 'Failed to load gift card details');
          navigate(-1);
        }
      } catch (error) {
        console.error('Error loading gift card details:', error);
        toast.error('Failed to load gift card details');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    } else {
      setGiftCardDetails(giftCard);
    }
  };

  useEffect(() => {
    loadGiftCardDetails();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPurchaseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!purchaseData.recipientEmail) {
      toast.error('Please enter recipient email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(purchaseData.recipientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare order data
      const orderData = {
        giftCardId: giftCardId,
        recipientEmail: purchaseData.recipientEmail,
        personalMessage: purchaseData.personalMessage,
        ...(purchaseData.expiryDate && { expiryDate: purchaseData.expiryDate }),
        salonId: salonId || giftCard?.salonId._id || giftCard?.salonId
      };
      
      // Create payment order
      console.log('Creating payment order with data:', orderData);
      const orderResponse = await giftCardService.createPaymentOrder(orderData);
      console.log('Payment order response:', orderResponse);
      
      if (orderResponse.success) {
        // Check if Razorpay is available
        if (!window.Razorpay) {
          toast.error('Payment gateway is not loaded. Please refresh the page and try again.');
          setLoading(false);
          return;
        }
        
        // Check if the Razorpay key is configured
        if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
          // In development, we can simulate payment if no key is configured
          console.warn('Razorpay key not configured. In production, this would be required.');
          
          // Simulate successful payment in development
          if (import.meta.env.MODE === 'development' || window.location.hostname === 'localhost') {
            try {
              // Skip actual payment and directly verify with backend
              const verifyResponse = await giftCardService.verifyPayment({
                razorpay_order_id: orderResponse.data.orderId,
                razorpay_payment_id: `pay_${Math.random().toString(36).substr(2, 9)}`, // Mock payment ID
                razorpay_signature: 'mock_signature_for_dev', // Mock signature
                orderId: orderResponse.data.orderId
              });
              
              if (verifyResponse.success) {
                toast.success('Gift card purchased successfully! The recipient will receive an email notification.');
                
                // Navigate back to gift cards
                navigate(`/customer/gift-cards/${salonId}`);
              } else {
                toast.error(verifyResponse.message || 'Payment verification failed');
              }
            } catch (error) {
              console.error('Error in simulated payment:', error);
              toast.error(error.message || 'Simulated payment failed');
            } finally {
              setLoading(false);
            }
            return;
          } else {
            toast.error('Payment configuration is not set up. Please contact support.');
            setLoading(false);
            return;
          }
        }
        
        // Log the payment details for debugging
        console.log('Payment details:', {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderResponse.data.amount,
          currency: orderResponse.data.currency,
          name: orderResponse.data.name,
          orderId: orderResponse.data.orderId
        });
        
        // Initialize Razorpay
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Enter the Key ID generated from the Dashboard
          amount: orderResponse.data.amount, // Amount is in paise
          currency: orderResponse.data.currency,
          name: orderResponse.data.name,
          description: orderResponse.data.description,
          image: orderResponse.data.image,
          order_id: orderResponse.data.orderId, // Order ID created by backend
          handler: async function (response) {
            console.log('Payment successful:', response);
            // Verify payment with backend
            try {
              const verifyResponse = await giftCardService.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: orderResponse.data.orderId
              });
              
              if (verifyResponse.success) {
                toast.success('Gift card purchased successfully! The recipient will receive an email notification.');
                
                // Navigate back to gift cards
                navigate(`/customer/gift-cards/${salonId}`);
              } else {
                toast.error(verifyResponse.message || 'Payment verification failed');
              }
            } catch (error) {
              console.error('Error verifying payment:', error);
              toast.error(error.message || 'Payment verification failed');
            }
          },
          prefill: {
            name: orderResponse.data.customerName,
            email: orderResponse.data.customerEmail,
            contact: orderResponse.data.customerPhone
          },
          theme: {
            color: '#7e22ce' // Indigo purple color
          },
          modal: {
            ondismiss: function() {
              console.log('Payment was cancelled');
              toast.info('Payment was cancelled');
              setLoading(false);
            }
          }
        };
        
        // Open Razorpay checkout
        console.log('Opening Razorpay checkout with options:', options);
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        toast.error(orderResponse.message || 'Failed to create payment order');
      }
    } catch (error) {
      console.error('Error creating payment order:', error);
      toast.error(error.message || 'Failed to create payment order');
      setLoading(false);
    }
  };

  // Format amount for display
  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading && !giftCardDetails) {
    return <LoadingSpinner text="Loading gift card details..." />;
  }

  if (!giftCardDetails) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Gift Card Not Found</h3>
          <p className="text-gray-500 mb-6">The requested gift card could not be found.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Gift Cards
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Purchase Gift Card</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gift Card Preview */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-100 rounded-xl p-6 border-2 border-dashed border-pink-200">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mb-4">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{giftCardDetails.name}</h3>
            
            <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {formatAmount(giftCardDetails.amount)}
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Code:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">{giftCardDetails.code}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Valid Until:</span>
                  <span>{formatDate(giftCardDetails.expiryDate)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Type:</span>
                  <span>
                    {giftCardDetails.usageType === 'BOTH' ? 'Services & Products' : 
                     giftCardDetails.usageType === 'SERVICE_ONLY' ? 'Services Only' : 
                     giftCardDetails.usageType === 'PRODUCT_ONLY' ? 'Products Only' : 
                     giftCardDetails.usageType.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
            
            {giftCardDetails.description && (
              <p className="text-gray-700 text-sm italic">{giftCardDetails.description}</p>
            )}
          </div>
        </div>

        {/* Purchase Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Complete Your Purchase</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Recipient Email
              </label>
              <input
                type="email"
                name="recipientEmail"
                value={purchaseData.recipientEmail}
                onChange={handleChange}
                placeholder="Enter recipient's email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <MessageCircle className="h-4 w-4 mr-2" />
                Personal Message (Optional)
              </label>
              <textarea
                name="personalMessage"
                value={purchaseData.personalMessage}
                onChange={handleChange}
                placeholder="Write a personal message for the recipient..."
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                name="expiryDate"
                value={purchaseData.expiryDate}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <IndianRupee className="h-5 w-5 mr-2" />
                    Pay Now - {formatAmount(giftCardDetails.amount)}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Gift card will be sent to recipient's email
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Recipient can use the gift card at the salon
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                You'll receive a confirmation of purchase
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GiftCardPurchase;