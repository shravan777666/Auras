import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customer';
import { useCart } from '../../contexts/CartContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BackButton from '../../components/common/BackButton';
import ServiceListing from '../../components/customer/ServiceListing';
import { ShoppingCart, Package, Tag, Clock, Calendar, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const CombinedBooking = () => {
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
    clearCart,
    removeItemFromCart
  } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [activeTab, setActiveTab] = useState('services'); // 'services' or 'products'

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
        
        // Preselect services if passed in location state
        if (location.state?.preselectedServices) {
          setSelectedServices(location.state.preselectedServices);
        }
      } catch (error) {
        toast.error('Failed to load booking data');
        console.error('Error fetching booking data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (salonId) {
      fetchData();
    }
  }, [salonId, location.state]);

  const handleServiceSelect = (service) => {
    setSelectedServices(prev => {
      const isSelected = prev.some(s => s.serviceId === service._id);
      if (isSelected) {
        return prev.filter(s => s.serviceId !== service._id);
      } else {
        return [...prev, { serviceId: service._id }];
      }
    });
  };

  const handleRemoveSelectedService = (serviceId) => {
    setSelectedServices(prev => prev.filter(s => s.serviceId !== serviceId));
  };

  const handleProceedToBooking = async () => {
    if (selectedServices.length === 0 && servicesInCart.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      toast.error('Please select appointment date and time');
      return;
    }

    try {
      // Combine selected services and services in cart
      const allServices = [
        ...selectedServices,
        ...servicesInCart.map(s => ({ serviceId: s._id }))
      ];

      // Prepare booking payload
      const payload = {
        salonId,
        services: allServices,
        date: appointmentDate,
        time: appointmentTime,
        notes: customerNotes,
        products: productsInCart.map(p => ({
          productId: p._id,
          quantity: p.quantity
        }))
      };

      // In a real implementation, this would call your backend API to book the appointment
      // For now, we'll simulate a successful booking
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear the cart after successful booking
      clearCart(salonId);
      
      toast.success('Appointment booked successfully!');
      
      // Navigate to confirmation page
      navigate('/customer/bookings', {
        state: {
          bookingSuccess: true,
          appointmentDetails: {
            salonName: salon.salonName,
            date: appointmentDate,
            time: appointmentTime,
            services: allServices.length,
            products: productsInCart.length
          }
        }
      });
    } catch (error) {
      toast.error('Failed to book appointment. Please try again.');
      console.error('Booking error:', error);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <BackButton fallbackPath="/customer/dashboard" className="mb-4" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Book Appointment & Shop</h1>
          {salon && (
            <p className="text-gray-600 mt-1">
              Book services and add products from {salon.salonName}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            {/* Tabs */}
            <div className="flex border-b mb-6">
              <button
                onClick={() => setActiveTab('services')}
                className={`py-2 px-4 font-medium ${
                  activeTab === 'services'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="h-4 w-4 inline mr-2" />
                Services
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-2 px-4 font-medium ${
                  activeTab === 'products'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="h-4 w-4 inline mr-2" />
                Products ({productsInCart.length})
              </button>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'services' ? (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Available Services</h2>
                <ServiceListing 
                  services={salon?.services || []} 
                  salonId={salonId}
                  onServiceSelect={handleServiceSelect}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Products</h2>
                {productsInCart.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No products in your cart</p>
                    <button
                      onClick={() => navigate(`/customer/shop/${salonId}`)}
                      className="mt-3 text-blue-600 hover:text-blue-800"
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {productsInCart.map(product => (
                      <div key={product._id} className="flex items-center border-b pb-3">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="h-16 w-16 object-cover rounded mr-3"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-200 rounded mr-3 flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.category || 'General'}</p>
                          <p className="text-sm font-semibold">₹{product.price?.toFixed(2)} × {product.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{(product.price * product.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Appointment Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Appointment Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special requests or notes for your appointment..."
              />
            </div>
          </div>
        </div>
        
        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Booking
            </h2>
            
            {selectedServices.length === 0 && servicesInCart.length === 0 && productsInCart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nothing selected yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Select services or add products to get started
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {/* Selected Services */}
                  {(selectedServices.length > 0 || servicesInCart.length > 0) && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Services
                      </h3>
                      <div className="space-y-2">
                        {/* Directly selected services */}
                        {selectedServices.map(selectedService => {
                          const service = salon?.services?.find(s => s._id === selectedService.serviceId);
                          if (!service) return null;
                          
                          return (
                            <div key={`selected-${selectedService.serviceId}`} className="flex justify-between text-sm">
                              <div>
                                <span>{service.name}</span>
                                <button 
                                  onClick={() => handleRemoveSelectedService(selectedService.serviceId)}
                                  className="ml-2 text-red-500 hover:text-red-700 text-xs"
                                >
                                  ×
                                </button>
                              </div>
                              <span>₹{(service.discountedPrice ?? service.price) || 0}</span>
                            </div>
                          );
                        })}
                        
                        {/* Services in cart */}
                        {servicesInCart.map(cartService => (
                          <div key={`cart-${cartService._id}`} className="flex justify-between text-sm">
                            <div>
                              <span>{cartService.name}</span>
                              <span className="ml-1 text-gray-500">× {cartService.quantity}</span>
                              <button 
                                onClick={() => {
                                  removeItemFromCart(salonId, cartService._id);
                                  toast.success(`${cartService.name} removed from cart`);
                                }}
                                className="ml-2 text-red-500 hover:text-red-700 text-xs"
                              >
                                ×
                              </button>
                            </div>
                            <span>₹{((cartService.discountedPrice ?? cartService.price) * cartService.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Products in cart */}
                  {productsInCart.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        Products
                      </h3>
                      <div className="space-y-2">
                        {productsInCart.map(product => (
                          <div key={product._id} className="flex justify-between text-sm">
                            <div>
                              <span>{product.name}</span>
                              <span className="ml-1 text-gray-500">× {product.quantity}</span>
                              <button 
                                onClick={() => {
                                  removeItemFromCart(salonId, product._id);
                                  toast.success(`${product.name} removed from cart`);
                                }}
                                className="ml-2 text-red-500 hover:text-red-700 text-xs"
                              >
                                ×
                              </button>
                            </div>
                            <span>₹{(product.price * product.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="space-y-2">
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
                    
                    <div className="flex justify-between pt-2 border-t font-bold">
                      <span>Grand Total</span>
                      <span className="text-lg text-green-600">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleProceedToBooking}
                    className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Calendar className="h-5 w-5" />
                    Confirm Booking
                  </button>
                  
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    You'll be able to pay for everything in a single transaction
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CombinedBooking;