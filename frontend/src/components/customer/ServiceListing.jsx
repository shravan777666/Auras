import React from 'react';
import { ShoppingCart, Clock, Tag } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

const ServiceListing = ({ services = [], salonId, onServiceSelect }) => {
  const { getServicesInCart, addServiceToCart } = useCart();
  
  // Get services currently in cart for this salon
  const servicesInCart = getServicesInCart(salonId);

  const isInCart = (serviceId) => {
    return servicesInCart.some(item => item._id === serviceId);
  };

  const getServiceQuantity = (serviceId) => {
    const service = servicesInCart.find(item => item._id === serviceId);
    return service ? service.quantity : 0;
  };

  const handleAddToCart = (service) => {
    addServiceToCart(salonId, service);
  };

  const handleServiceSelect = (service) => {
    if (onServiceSelect) {
      onServiceSelect(service);
    }
  };

  return (
    <div className="space-y-3">
      {services.map(service => {
        const inCart = isInCart(service._id);
        const quantity = getServiceQuantity(service._id);
        
        return (
          <div key={service._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{service.name}</h3>
                  <span className="text-lg font-bold text-green-600">
                    ₹{(service.discountedPrice ?? service.price) || 0}
                  </span>
                </div>
                
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{service.duration || 0} mins</span>
                  <span className="mx-2">•</span>
                  <Tag className="h-4 w-4 mr-1" />
                  <span>{service.category || 'General'}</span>
                </div>
                
                {service.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {service.description}
                  </p>
                )}
              </div>
              
              <div className="ml-4 flex flex-col items-end">
                {inCart ? (
                  <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    <span>Added ({quantity})</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAddToCart(service)}
                    className="flex items-center bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    <span>Add</span>
                  </button>
                )}
                
                <button
                  onClick={() => handleServiceSelect(service)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  Select for Booking
                </button>
              </div>
            </div>
          </div>
        );
      })}
      
      {services.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No services available at this time.</p>
        </div>
      )}
    </div>
  );
};

export default ServiceListing;