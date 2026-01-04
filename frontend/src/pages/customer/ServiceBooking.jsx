import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customer';
import { useCart } from '../../contexts/CartContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BackButton from '../../components/common/BackButton';
import ServiceListing from '../../components/customer/ServiceListing';
import { ShoppingCart, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const ServiceBooking = () => {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const { getServicesInCart, getServiceCount, getTotalServicePrice, removeItemFromCart } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  // Get services in cart for this salon
  const servicesInCart = getServicesInCart(salonId);
  const serviceCount = getServiceCount(salonId);
  const totalPrice = getTotalServicePrice(salonId);

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
        toast.error('Failed to load salon data');
        console.error('Error fetching salon data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (salonId) {
      fetchData();
    }
  }, [salonId]);

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

  const handleProceedToBooking = () => {
    if (selectedServices.length === 0 && servicesInCart.length === 0) {
      toast.error('Please select at least one service or add services to cart');
      return;
    }

    // Navigate to the full booking page with preselected services
    navigate(`/customer/book-appointment/${salonId}`, {
      state: {
        preselectedServices: [...selectedServices, ...servicesInCart.map(s => ({ serviceId: s._id }))]
      }
    });
  };

  const handleProceedToCheckout = () => {
    if (servicesInCart.length === 0) {
      toast.error('Please add at least one service to cart');
      return;
    }

    // Navigate to checkout page for services only
    navigate(`/customer/checkout/${salonId}`, {
      state: {
        checkoutType: 'services'
      }
    });
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <BackButton fallbackPath="/customer/dashboard" className="mb-4" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Book Services</h1>
          {salon && (
            <p className="text-gray-600 mt-1">
              Select services from {salon.salonName}
            </p>
          )}
          <div className="mt-2">
            <button
              onClick={() => navigate(`/customer/combined-booking/${salonId}`)}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Add Products to Booking
            </button>
          </div>
        </div>
        
        {(serviceCount > 0 || selectedServices.length > 0) && (
          <div className="mt-4 md:mt-0 flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-semibold">
                Total: ₹{totalPrice.toFixed(2)}
              </span>
              {serviceCount > 0 && (
                <button
                  onClick={handleProceedToCheckout}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Checkout ({serviceCount})
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Services Listing */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Available Services</h2>
            <ServiceListing 
              services={salon?.services || []} 
              salonId={salonId}
              onServiceSelect={handleServiceSelect}
            />
          </div>
        </div>
        
        {/* Selected Services Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Selection
            </h2>
            
            {selectedServices.length === 0 && servicesInCart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No services selected</p>
                <p className="text-sm text-gray-400 mt-1">
                  Select services from the list to book an appointment
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {/* Directly selected services */}
                  {selectedServices.map(selectedService => {
                    const service = salon?.services?.find(s => s._id === selectedService.serviceId);
                    if (!service) return null;
                    
                    return (
                      <div key={selectedService.serviceId} className="border-b pb-3 last:border-b-0">
                        <div className="flex justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{service.name}</h3>
                            <p className="text-sm text-gray-500">₹{(service.discountedPrice ?? service.price) || 0}</p>
                          </div>
                          <button 
                            onClick={() => {
                              handleServiceSelect(service);
                              toast.success(`${service.name} removed from selection`);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Services in cart */}
                  {servicesInCart.map(cartService => (
                    <div key={cartService._id} className="border-b pb-3 last:border-b-0">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{cartService.name}</h3>
                          <p className="text-sm text-gray-500">₹{(cartService.discountedPrice ?? cartService.price) || 0} × {cartService.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-medium">
                            ₹{((cartService.discountedPrice ?? cartService.price) * cartService.quantity).toFixed(2)}
                          </span>
                          <button 
                            onClick={() => {
                              removeItemFromCart(salonId, cartService._id);
                              toast.success(`${cartService.name} removed from cart`);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span>Total:</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={handleProceedToBooking}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Calendar className="h-5 w-5" />
                    Proceed to Booking
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceBooking;