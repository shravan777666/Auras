import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BackButton from '../../components/common/BackButton';
import { CheckCircle, ShoppingCart, Package, Clock } from 'lucide-react';

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const { orderId, total, items = [] } = location.state || {};
  
  // Separate services and products
  const services = items.filter(item => item.itemType === 'service');
  const products = items.filter(item => item.itemType === 'product');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <BackButton fallbackPath="/customer/dashboard" className="mb-4" />
      
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your purchase. Your order has been successfully placed.
        </p>
        
        {orderId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-8 inline-block">
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="font-mono font-bold">{orderId}</p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border rounded-lg p-4">
            <ShoppingCart className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="font-semibold">{items.length} Items</p>
          </div>
          
          <div className="border rounded-lg p-4">
            <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="font-semibold">Processing</p>
          </div>
          
          <div className="border rounded-lg p-4">
            <Package className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="font-semibold">₹{total?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
        
        {services.length > 0 && (
          <div className="text-left mb-6">
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Services Booked
            </h3>
            <div className="space-y-2">
              {services.map((service, index) => (
                <div key={index} className="flex justify-between border-b pb-2">
                  <span>{service.name}</span>
                  <span>₹{(service.discountedPrice ?? service.price)?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {products.length > 0 && (
          <div className="text-left mb-6">
            <h3 className="font-bold text-lg mb-3 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Products Ordered
            </h3>
            <div className="space-y-2">
              {products.map((product, index) => (
                <div key={index} className="flex justify-between border-b pb-2">
                  <span>{product.name} × {product.quantity}</span>
                  <span>₹{(product.price * product.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
          
          <button
            onClick={() => navigate('/customer/bookings')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;