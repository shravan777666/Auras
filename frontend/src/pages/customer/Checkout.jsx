import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customer';
import { useCart } from '../../contexts/CartContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BackButton from '../../components/common/BackButton';
import { ShoppingCart, Package, Clock, Tag, CreditCard, MapPin, User } from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout = () => {
  const { salonId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    getCart, 
    getServicesInCart, 
    getProductsInCart, 
    getTotalServicePrice, 
    getTotalProductPrice, 
    getTotalPrice,
    clearCart
  } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);

  // Get cart items
  const cart = getCart(salonId);
  const servicesInCart = getServicesInCart(salonId);
  const productsInCart = getProductsInCart(salonId);
  const serviceTotal = getTotalServicePrice(salonId);
  const productTotal = getTotalProductPrice(salonId);
  const grandTotal = getTotalPrice(salonId);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch salon details
        const salonRes = await customerService.getSalonDetails(salonId);
        if (salonRes?.success) {
          setSalon(salonRes.data);
        }
      } catch (error) {
        toast.error('Failed to load checkout data');
        console.error('Error fetching checkout data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (salonId) {
      fetchData();
    }
  }, [salonId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlaceOrder = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error('Please fill in all required customer information');
      return;
    }

    setProcessing(true);
    
    try {
      // In a real implementation, this would call your backend API to process the order
      // For now, we'll simulate a successful checkout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear the cart after successful checkout
      clearCart(salonId);
      
      toast.success('Order placed successfully!');
      
      // Navigate to confirmation page
      navigate('/customer/orders/confirmation', {
        state: {
          orderId: `ORD-${Date.now()}`,
          total: grandTotal,
          items: cart
        }
      });
    } catch (error) {
      toast.error('Failed to process order. Please try again.');
      console.error('Checkout error:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <BackButton fallbackPath={`/customer/shop/${salonId}`} className="mb-4" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          {salon && (
            <p className="text-gray-600 mt-1">
              Complete your purchase from {salon.salonName}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
            
            {servicesInCart.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Services
                </h3>
                <div className="space-y-3">
                  {servicesInCart.map(service => (
                    <div key={`service-${service._id}`} className="flex justify-between border-b pb-3">
                      <div>
                        <h4 className="font-medium">{service.name}</h4>
                        <p className="text-sm text-gray-500">
                          {service.duration ? `${service.duration} mins` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{(service.discountedPrice ?? service.price)?.toFixed(2)}</p>
                        {service.quantity > 1 && (
                          <p className="text-sm text-gray-500">Qty: {service.quantity}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {productsInCart.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Products
                </h3>
                <div className="space-y-3">
                  {productsInCart.map(product => (
                    <div key={`product-${product._id}`} className="flex justify-between border-b pb-3">
                      <div className="flex items-center">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="h-12 w-12 object-cover rounded mr-3"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded mr-3 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <p className="text-sm text-gray-500">{product.category || 'General'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">₹{product.price?.toFixed(2)} × {product.quantity}</p>
                        <p className="text-sm font-semibold">₹{(product.price * product.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Customer Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={customerInfo.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={customerInfo.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <input
                  type="text"
                  name="address"
                  value={customerInfo.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter delivery address"
                />
              </div>
            </div>
          </div>
          
          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment Method
            </h2>
            
            <div className="space-y-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3">
                  <span className="block font-medium">Credit/Debit Card</span>
                  <span className="block text-sm text-gray-500">Pay with your credit or debit card</span>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3">
                  <span className="block font-medium">UPI Payment</span>
                  <span className="block text-sm text-gray-500">Pay using UPI apps like PhonePe, Google Pay, etc.</span>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <div className="ml-3">
                  <span className="block font-medium">Cash on Delivery</span>
                  <span className="block text-sm text-gray-500">Pay cash when you receive your order</span>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Order Total & Place Order */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Total</h2>
            
            <div className="space-y-3">
              {serviceTotal > 0 && (
                <div className="flex justify-between">
                  <span>Services Total</span>
                  <span>₹{serviceTotal.toFixed(2)}</span>
                </div>
              )}
              
              {productTotal > 0 && (
                <div className="flex justify-between">
                  <span>Products Total</span>
                  <span>₹{productTotal.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between pt-3 border-t">
                <span className="font-bold">Grand Total</span>
                <span className="font-bold text-lg text-green-600">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            
            <button
              onClick={handlePlaceOrder}
              disabled={processing || cart.length === 0}
              className={`w-full mt-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 ${
                processing || cart.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {processing ? (
                <>
                  <LoadingSpinner size="sm" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Place Order
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              By placing your order, you agree to our Terms and Conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;