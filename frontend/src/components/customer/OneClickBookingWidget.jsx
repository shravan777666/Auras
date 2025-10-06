import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { customerService } from '../../services/customer';
import { Clock, Calendar, MapPin, User, Star } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const OneClickBookingWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingPreference, setBookingPreference] = useState(null);
  const [nextAvailability, setNextAvailability] = useState(null);

  useEffect(() => {
    if (user && user.id) {
      fetchBookingPreference(user.id);
    }
  }, [user]);

  const fetchBookingPreference = async (customerId) => {
    try {
      setLoading(true);
      // Get customer's one-click booking preference from the new endpoint
      const response = await customerService.getOneClickBookingPreference(customerId);
      
      if (!response?.success) {
        throw new Error(response?.message || 'Failed to fetch booking preference');
      }

      const preference = response.data;
      
      if (!preference) {
        // No booking preference found
        setLoading(false);
        return;
      }

      setBookingPreference({
        service: preference.service,
        salon: preference.salon
      });
      
      if (preference.nextAvailability) {
        setNextAvailability(preference.nextAvailability);
      }
    } catch (err) {
      console.error('Error fetching booking preference:', err);
      setError('Failed to load your booking preference');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (bookingPreference && nextAvailability) {
      // Navigate to booking page with pre-filled data
      navigate('/customer/book-appointment', {
        state: {
          preselectedSalon: bookingPreference.salon.id,
          preselectedService: bookingPreference.service,
          preselectedDate: nextAvailability.date,
          preselectedTime: nextAvailability.time
        }
      });
    }
  };

  // Don't show widget if user is not a customer or not logged in
  if (!user || user.type !== 'customer') {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner text="Analyzing your preferences..." />
        </div>
      </div>
    );
  }

  if (error) {
    // Don't show the widget if there's an error
    return null;
  }

  if (!bookingPreference) {
    // Don't show the widget if no preferences found
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-100 rounded-xl p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Book your usual {bookingPreference.service} at {bookingPreference.salon.name}
          </h3>
          
          {nextAvailability && (
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <Calendar className="h-4 w-4 mr-1 text-primary-600" />
              <span>Next availability: {nextAvailability.day}, {nextAvailability.date} at {nextAvailability.time}</span>
            </div>
          )}
          
          <button
            onClick={handleBookNow}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Clock className="h-4 w-4 mr-2" />
            Book Now
          </button>
        </div>
        
        <div className="flex-shrink-0">
          <div className="bg-primary-100 p-3 rounded-lg">
            <Star className="h-6 w-6 text-primary-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OneClickBookingWidget;