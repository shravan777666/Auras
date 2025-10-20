import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { customerService } from "../../services/customer";
import { loyaltyService } from "../../services/loyalty";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SalonAvailabilityDisplay from "../../components/customer/SalonAvailabilityDisplay";
import LoyaltyRedemptionWidget from "../../components/customer/LoyaltyRedemptionWidget";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { Clock } from "lucide-react";

const BookAppointment = () => {
  const { salonId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState(null);
  const [salonList, setSalonList] = useState([]);
  const [salonsLoading, setSalonsLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [dateError, setDateError] = useState("");
  const [redemptionData, setRedemptionData] = useState({
    usePoints: false,
    pointsToRedeem: 0,
    discountAmount: 0
  });
  // Addon states
  const [idleSlots, setIdleSlots] = useState([]);
  const [addonSuggestions, setAddonSuggestions] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);

  // Check for pre-filled data from one-click booking widget or loyalty redemption
  useEffect(() => {
    const preselectedData = location.state;
    if (preselectedData) {
      // Set preselected salon if available
      if (preselectedData.preselectedSalon && !salonId) {
        // Navigate to the specific salon page
        navigate(`/customer/book-appointment/${preselectedData.preselectedSalon}`, { replace: true });
      }
      
      // Set preselected date and time
      if (preselectedData.preselectedDate) {
        setAppointmentDate(preselectedData.preselectedDate);
      }
      if (preselectedData.preselectedTime) {
        setAppointmentTime(preselectedData.preselectedTime);
      }
      
      // Check if loyalty points redemption was preselected
      if (preselectedData.redeemPoints) {
        setRedemptionData(prev => ({
          ...prev,
          usePoints: true
        }));
      }
    }
  }, [location, salonId, navigate]);

  // Trigger addon suggestions when we have salon data and user info
  useEffect(() => {
    if (salon && user && addonSuggestions.length === 0) {
      console.log('Triggering initial addon suggestions');
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        suggestAddonsBasedOnHistory();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [salon, user, addonSuggestions.length]);

  // Additional trigger for addon suggestions when services are selected
  useEffect(() => {
    if (salon && user && selectedServices.length > 0 && addonSuggestions.length === 0) {
      console.log('Triggering addon suggestions based on selected services');
      const timer = setTimeout(() => {
        suggestAddonsBasedOnHistory();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedServices.length, salon, user, addonSuggestions.length]);

  useEffect(() => {
    if (!salonId) { setLoading(false); return; }
    (async () => {
      try {
        const res = await customerService.getSalonDetails(salonId);
        if (res?.success) {
          setSalon(res.data);
          
          // If there's a preselected service, select it
          const preselectedData = location.state;
          if (preselectedData && preselectedData.preselectedService) {
            const serviceToSelect = res.data.services?.find(service => 
              service.name === preselectedData.preselectedService
            );
            if (serviceToSelect) {
              setSelectedServices([{ serviceId: serviceToSelect._id }]);
            }
          }
        }
      } catch (e) {
        toast.error("Failed to load salon details");
      } finally {
        setLoading(false);
      }
    })();
  }, [salonId, location.state]);

  useEffect(() => {
    if (salonId) return;
    (async () => {
      try {
        setSalonsLoading(true);
        const res = await customerService.browseSalons({ page: 1, limit: 30 });
        if (res?.success) setSalonList(res.data || []);
      } catch (e) {
        // silent
      } finally {
        setSalonsLoading(false);
      }
    })();
  }, [salonId]);

  // Detect idle slots when date and time are selected
  useEffect(() => {
    if (!salonId || !appointmentDate) return;
    
    console.log('Detecting idle slots for:', { salonId, appointmentDate, appointmentTime });
    
    const detectIdleSlots = async () => {
      try {
        const dateStr = appointmentDate; // YYYY-MM-DD format
        const res = await customerService.detectIdleSlots(salonId, dateStr);
        console.log('Idle slots response:', res);
        if (res?.success) {
          setIdleSlots(res.data || []);
          // If we have idle slots, we can suggest add-ons
          if (res.data?.length > 0) {
            console.log('Found idle slots, suggesting addons:', res.data[0]);
            suggestAddons(res.data[0]); // Use the first idle slot for suggestions
          } else {
            console.log('No idle slots found, suggesting based on history');
            // Even if no idle slots, we can still suggest addons based on customer history
            suggestAddonsBasedOnHistory();
          }
        }
      } catch (error) {
        console.error("Failed to detect idle slots:", error);
        // Even on error, try to suggest addons based on history
        suggestAddonsBasedOnHistory();
      }
    };

    // Add a small delay to ensure all values are set
    const timer = setTimeout(detectIdleSlots, 500);
    return () => clearTimeout(timer);
  }, [salonId, appointmentDate]);

  // Initialize with default suggestions when services are selected
  useEffect(() => {
    if (!salon || !user) return;
    
    // When services are first selected, show loading state and then suggestions
    if (selectedServices.length > 0 && addonSuggestions.length === 0) {
      console.log('Services selected, initializing addon suggestions');
      // Show loading state immediately
      // Generate initial suggestions after a short delay
      const timer = setTimeout(() => {
        suggestAddonsBasedOnHistory();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedServices.length, addonSuggestions.length, salon, user]);

  // Always ensure addon suggestions are available when services are selected
  useEffect(() => {
    if (!salon || !user) return;
    
    // If we have selected services but no addon suggestions, generate some
    if (selectedServices.length > 0 && addonSuggestions.length === 0) {
      console.log('Ensuring addon suggestions are available');
      // Try to generate suggestions with a delay to allow for API calls
      const timer = setTimeout(() => {
        if (addonSuggestions.length === 0) {
          console.log('Generating fallback addon suggestions');
          generateFallbackSuggestions();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedServices.length, addonSuggestions.length, salon, user]);

  // Ensure addon suggestions are always available
  useEffect(() => {
    if (!salon || !user) return;
    
    // If we have selected services, ensure we have addon suggestions
    if (selectedServices.length > 0) {
      // If no suggestions after 3 seconds, generate fallback ones
      const fallbackTimer = setTimeout(() => {
        if (addonSuggestions.length === 0) {
          console.log('Generating fallback addon suggestions');
          generateFallbackSuggestions();
        }
      }, 3000);
      
      return () => clearTimeout(fallbackTimer);
    }
  }, [selectedServices.length, addonSuggestions.length, salon, user]);

  // Suggest add-ons based on customer history (fallback when no idle slots)
  const suggestAddonsBasedOnHistory = async () => {
    try {
      console.log('Suggesting addons based on customer history');
      
      // Always generate suggestions, even if API calls fail
      if (salon?.services?.length > 0) {
        // Filter out already selected services
        const availableServices = salon.services.filter(
          service => !selectedServices.some(selected => selected.serviceId === service._id)
        );
        
        if (availableServices.length > 0) {
          // Try to get customer history, but don't wait for it
          let customerData = null;
          try {
            const historyRes = await customerService.getCustomerHistory(user.id, salonId);
            console.log('Customer history response:', historyRes);
            if (historyRes?.success) {
              customerData = historyRes.data;
            }
          } catch (error) {
            console.warn("Failed to get customer history, using defaults:", error);
          }
          
          // Create suggestions with personalized discounts
          const suggestions = [];
          const maxSuggestions = Math.min(3, availableServices.length);
          
          for (let i = 0; i < maxSuggestions; i++) {
            const suggestedService = availableServices[i];
            // Base discount on customer loyalty if available
            let baseDiscount = 0.15;
            if (customerData?.customerLoyalty > 5) {
              baseDiscount = 0.20; // Higher discount for loyal customers
            } else if (customerData?.customerLoyalty > 10) {
              baseDiscount = 0.25; // Even higher discount for very loyal customers
            }
            
            // Add variety to discounts
            const discountRate = baseDiscount + (i * 0.03);
            
            suggestions.push({
              service: suggestedService,
              gapSize: 30, // Default gap size
              discount: Math.min(0.30, discountRate), // Cap at 30%
              estimatedPrice: suggestedService.discountedPrice || suggestedService.price
            });
          }
          
          console.log('Setting addon suggestions based on history:', suggestions);
          setAddonSuggestions(suggestions);
          return;
        }
      }
      
      // Fallback to default suggestions if nothing else works
      generateDefaultSuggestions();
    } catch (error) {
      console.error("Failed to suggest add-ons based on history:", error);
      // Even on error, show some default suggestions
      generateDefaultSuggestions();
    }
  };

  // Generate default suggestions when everything else fails
  const generateDefaultSuggestions = () => {
    console.log('Generating default addon suggestions');
    
    if (salon?.services?.length > 0) {
      // Show 1-2 services with standard discounts
      const availableServices = salon.services.filter(
        service => !selectedServices.some(selected => selected.serviceId === service._id)
      );
      
      if (availableServices.length > 0) {
        const suggestions = [];
        const maxSuggestions = Math.min(2, availableServices.length);
        
        for (let i = 0; i < maxSuggestions; i++) {
          const service = availableServices[i];
          suggestions.push({
            service: service,
            gapSize: 30,
            discount: 0.15 + (i * 0.05), // 15% or 20%
            estimatedPrice: service.discountedPrice || service.price || 0
          });
        }
        
        console.log('Setting default addon suggestions:', suggestions);
        setAddonSuggestions(suggestions);
        return;
      }
    }
    
    // Ultimate fallback - generic suggestions
    setAddonSuggestions([{
      service: {
        _id: 'generic_service',
        name: 'Premium Hair Treatment',
        category: 'Treatment',
        price: 300,
        discountedPrice: 240
      },
      gapSize: 45,
      discount: 0.20, // 20% discount
      estimatedPrice: 300
    }]);
  };

  // Suggest add-ons based on idle slot and customer history
  const suggestAddons = async (idleSlot) => {
    if (!user?.id || !salonId || !idleSlot) return;
    
    try {
      console.log('Suggesting addons based on idle slot:', idleSlot);
      // Get customer history
      const historyRes = await customerService.getCustomerHistory(user.id, salonId);
      console.log('Customer history response:', historyRes);
      
      // Prepare prediction data
      const predictionData = {
        timeGapSize: idleSlot.gapSize,
        customerId: user.id,
        salonId: salonId,
        dayOfWeek: new Date(appointmentDate).getDay()
      };
      
      console.log('Prediction data:', predictionData);
      
      // Get prediction from ML service
      const predictionRes = await customerService.predictAddonAcceptance(predictionData);
      console.log('Prediction response:', predictionRes);
      
      // Always show suggestions for better user experience, but adjust based on prediction
      if (salon?.services?.length > 0) {
        // Filter out already selected services
        const availableServices = salon.services.filter(
          service => !selectedServices.some(selected => selected.serviceId === service._id)
        );
        
        if (availableServices.length > 0) {
          // Adjust discount based on prediction confidence
          let discountRate = 0.15; // Default discount
          if (predictionRes?.success && predictionRes.data?.probability) {
            // Scale discount based on probability (0.1 to 0.3)
            discountRate = 0.1 + (predictionRes.data.probability * 0.2);
          }
          
          // Suggest 1-2 services based on availability
          const maxSuggestions = Math.min(2, availableServices.length);
          const suggestions = [];
          
          for (let i = 0; i < maxSuggestions; i++) {
            const suggestedService = availableServices[i];
            const serviceDiscount = discountRate + (i * 0.03); // Slightly increase discount for additional services
            
            suggestions.push({
              service: suggestedService,
              gapSize: idleSlot.gapSize,
              discount: Math.min(0.30, serviceDiscount), // Cap at 30%
              estimatedPrice: suggestedService.discountedPrice || suggestedService.price
            });
          }
          
          console.log('Setting addon suggestions based on idle slot:', suggestions);
          setAddonSuggestions(suggestions);
        }
      }
    } catch (error) {
      console.error("Failed to suggest add-ons:", error);
      // Fallback to history-based suggestions
      suggestAddonsBasedOnHistory();
    }
  };

  // Generate comprehensive fallback suggestions
  const generateFallbackSuggestions = () => {
    if (!salon?.services?.length) {
      // Even if no services, show a generic suggestion
      setAddonSuggestions([{
        service: {
          _id: 'generic_addon',
          name: 'Premium Consultation',
          category: 'Consultation',
          price: 200,
          discountedPrice: 150
        },
        gapSize: 30,
        discount: 0.25, // 25% discount
        estimatedPrice: 200
      }]);
      return;
    }
    
    // Filter out already selected services
    const availableServices = salon.services.filter(
      service => !selectedServices.some(selected => selected.serviceId === service._id)
    );
    
    // If we have available services, suggest them
    if (availableServices.length > 0) {
      const suggestions = [];
      const maxSuggestions = Math.min(3, availableServices.length);
      
      for (let i = 0; i < maxSuggestions; i++) {
        const service = availableServices[i];
        // Vary the discounts for different services
        const discount = 0.10 + (i * 0.07); // 10%, 17%, 24%
        
        suggestions.push({
          service: service,
          gapSize: 25 + (i * 10), // 25, 35, 45 min
          discount: Math.min(0.30, discount), // Cap at 30%
          estimatedPrice: service.discountedPrice || service.price || 0
        });
      }
      
      console.log('Generated comprehensive fallback suggestions:', suggestions);
      setAddonSuggestions(suggestions);
    } else {
      // All services selected, suggest a premium package
      setAddonSuggestions([{
        service: {
          _id: 'complete_package',
          name: 'Complete Beauty Package',
          category: 'Package',
          price: 1000,
          discountedPrice: 750
        },
        gapSize: 90,
        discount: 0.25, // 25% discount
        estimatedPrice: 1000
      }]);
    }
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Validate date selection
  const validateDate = (selectedDate) => {
    if (!selectedDate) {
      setDateError("");
      return true;
    }

    const today = new Date();
    const selected = new Date(selectedDate);
    
    // Reset time to compare only dates
    today.setHours(0, 0, 0, 0);
    selected.setHours(0, 0, 0, 0);

    if (selected < today) {
      setDateError("Please select a valid date. Past dates are not allowed.");
      return false;
    }

    setDateError("");
    return true;
  };

  // Handle date change with validation
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setAppointmentDate(selectedDate);
    validateDate(selectedDate);
  };

  // Enhanced service selection with automatic addon suggestion triggering
  const toggleService = (service) => {
    console.log('Toggling service:', service);
    const exists = selectedServices.find(s => s.serviceId === service._id);
    let newSelectedServices;
    
    if (exists) {
      newSelectedServices = selectedServices.filter(s => s.serviceId !== service._id);
    } else {
      newSelectedServices = [...selectedServices, { serviceId: service._id }];
    }
    
    setSelectedServices(newSelectedServices);
    console.log('Updated selected services:', newSelectedServices);
    
    // Trigger addon suggestions when services are selected
    if (newSelectedServices.length > 0) {
      console.log('Service selected, triggering addon suggestions');
      // Clear previous suggestions and generate new ones
      setAddonSuggestions([]);
      setTimeout(() => {
        suggestAddonsBasedOnHistory();
      }, 300);
    } else {
      // If no services selected, clear addon suggestions
      setAddonSuggestions([]);
      setSelectedAddons([]);
    }
  };

  // Toggle addon selection
  const toggleAddon = (addon) => {
    console.log('Toggling addon:', addon);
    const exists = selectedAddons.find(a => a.serviceId === addon.service._id);
    if (exists) {
      console.log('Removing addon from selection');
      setSelectedAddons(selectedAddons.filter(a => a.serviceId !== addon.service._id));
    } else {
      console.log('Adding addon to selection');
      setSelectedAddons([...selectedAddons, { 
        serviceId: addon.service._id,
        serviceName: addon.service.name,
        price: addon.estimatedPrice * (1 - addon.discount),
        originalPrice: addon.estimatedPrice
      }]);
    }
    console.log('Updated selected addons:', selectedAddons);
  };

  // Use useCallback to prevent unnecessary re-renders
  const handleRedemptionChange = useCallback((data) => {
    // Only update if the data actually changed
    setRedemptionData(prev => {
      if (prev.usePoints === data.usePoints && 
          prev.pointsToRedeem === data.pointsToRedeem && 
          prev.discountAmount === data.discountAmount) {
        return prev; // No change needed
      }
      return data;
    });
  }, []);

  const calculateServiceTotal = () => {
    if (!salon || selectedServices.length === 0) return 0;
    
    return selectedServices.reduce((total, selected) => {
      const service = salon.services.find(s => s._id === selected.serviceId);
      if (service) {
        const price = service.discountedPrice ?? service.price ?? 0;
        return total + Number(price);
      }
      return total;
    }, 0);
  };

  const calculateAddonTotal = () => {
    return selectedAddons.reduce((total, addon) => total + Number(addon.price || 0), 0);
  };

  const submitBooking = async () => {
    if (!salon?._id || (selectedServices.length === 0 && selectedAddons.length === 0) || !appointmentDate || !appointmentTime) {
      toast.error("Please select services, date, and time");
      return;
    }

    // Validate date before submitting
    if (!validateDate(appointmentDate)) {
      toast.error("Please select a valid date. Past dates are not allowed.");
      return;
    }
    
    try {
      const serviceTotal = calculateServiceTotal();
      const addonTotal = calculateAddonTotal();
      const totalAmount = serviceTotal + addonTotal;
      
      console.log('Booking details:', {
        salonId: salon._id,
        selectedServices,
        selectedAddons,
        totalServices: selectedServices.length,
        totalAddons: selectedAddons.length,
        totalAmount
      });
      
      // Validate redemption data
      if (redemptionData.usePoints && redemptionData.pointsToRedeem > 0) {
        if (redemptionData.pointsToRedeem > totalAmount) {
          toast.error("Points value cannot exceed service total");
          return;
        }
        
        if (redemptionData.pointsToRedeem < 100) {
          toast.error("Minimum redemption is 100 points");
          return;
        }
        
        if (redemptionData.pointsToRedeem % 100 !== 0) {
          toast.error("Points must be redeemed in multiples of 100");
          return;
        }
      }
      
      // Prepare services array (include both regular services and addons)
      const allServices = [
        ...selectedServices,
        ...selectedAddons.map(addon => ({ serviceId: addon.serviceId }))
      ];
      
      console.log('All services to book:', allServices);
      
      const payload = {
        salonId: salon._id,
        services: allServices,
        appointmentDate,
        appointmentTime,
        customerNotes,
        ...(redemptionData.usePoints && redemptionData.pointsToRedeem > 0 && {
          pointsToRedeem: redemptionData.pointsToRedeem,
          discountAmount: redemptionData.discountAmount
        })
      };
      
      const res = await customerService.bookAppointment(payload);
      if (res?.success) {
        toast.success("Appointment booked successfully!");
        
        // If points were redeemed, show a success message
        if (redemptionData.usePoints && redemptionData.pointsToRedeem > 0) {
          toast.success(`Successfully redeemed ${redemptionData.pointsToRedeem} points for ₹${redemptionData.discountAmount} discount!`);
        }
        
        setSelectedServices([]);
        setSelectedAddons([]);
        setAppointmentDate("");
        setAppointmentTime("");
        setCustomerNotes("");
        setRedemptionData({
          usePoints: false,
          pointsToRedeem: 0,
          discountAmount: 0
        });
        
        // Navigate to My Bookings page to show the new booking
        setTimeout(() => {
          navigate("/customer/bookings");
        }, 1500);
      } else {
        toast.error(res?.message || "Failed to book appointment");
      }
    } catch (e) {
      console.error('Booking error:', e);
      toast.error(e?.response?.data?.message || "Failed to book appointment");
    }
  };

  const serviceTotal = calculateServiceTotal();
  const addonTotal = calculateAddonTotal();
  const overallTotal = serviceTotal + addonTotal;
  const finalAmount = redemptionData.usePoints 
    ? Math.max(0, overallTotal - redemptionData.discountAmount) 
    : overallTotal;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Book Appointment</h1>
      {!salon ? (
        <div className="bg-white rounded-md shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Select a Salon</h2>
          {salonsLoading ? (
            <LoadingSpinner />
          ) : salonList.length === 0 ? (
            <p className="text-sm text-gray-500">No approved salons available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {salonList.map(s => {
                const logo = s.documents?.salonLogo || null;
                const address = typeof s.salonAddress === 'string' ? s.salonAddress : [s.salonAddress?.city, s.salonAddress?.state].filter(Boolean).join(', ');
                return (
                  <Link key={s._id} to={`/customer/book-appointment/${s._id}`} className="border rounded-lg p-3 hover:shadow">
                    <div className="flex items-center mb-2">
                      {logo ? (
                        <img src={logo} alt={s.salonName} className="h-10 w-10 rounded object-cover border mr-2" onError={(e)=>{e.currentTarget.style.display='none'}} />
                      ) : (
                        <div className="h-10 w-10 bg-gray-100 rounded mr-2" />
                      )}
                      <div>
                        <p className="font-medium">{s.salonName}</p>
                        {address && <p className="text-xs text-gray-500">{address}</p>}
                      </div>
                    </div>
                    <span className="text-sm text-primary-600">Book here →</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-md shadow p-6">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-semibold">{salon.salonName}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Select Services</h3>
              <div className="space-y-2 max-h-72 overflow-auto border rounded p-3">
                {(salon.services || []).map(s => {
                  const checked = !!selectedServices.find(x => x.serviceId === s._id);
                  return (
                    <label key={s._id} className="flex items-center justify-between py-1">
                      <span>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{s.category}</span>
                      </span>
                      <span className="text-sm text-gray-700">₹{(s.discountedPrice ?? s.price) || 0}</span>
                      <input type="checkbox" className="ml-3" checked={checked} onChange={() => toggleService(s)} />
                    </label>
                  );
                })}
                {(!salon.services || salon.services.length === 0) && (
                  <p className="text-sm text-gray-500">No services available.</p>
                )}
              </div>
              
              {/* Addon Suggestions */}
              <div className="mt-4 border-2 border-dashed border-blue-300 rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-blue-800 flex items-center text-lg">
                    <span className="bg-blue-500 text-white p-1 rounded mr-2">🎁</span>
                    Special Add-on Offers
                  </h3>
                  {selectedServices.length > 0 && (
                    <button 
                      onClick={suggestAddonsBasedOnHistory}
                      className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors flex items-center"
                    >
                      <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                  )}
                </div>
                <p className="text-sm text-blue-700 mb-3">Enhance your salon experience with these exclusive services!</p>
                
                {selectedServices.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-gray-600">Select a service to see personalized add-on offers</p>
                  </div>
                ) : addonSuggestions.length > 0 ? (
                  <div className="space-y-3 border rounded-lg p-3 bg-white shadow-sm">
                    {addonSuggestions.map((addon, index) => {
                      const checked = !!selectedAddons.find(a => a.serviceId === addon.service._id);
                      const discountedPrice = addon.estimatedPrice * (1 - addon.discount);
                      const savings = addon.estimatedPrice - discountedPrice;
                      
                      return (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 rounded transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900">{addon.service.name}</span>
                              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                Save ₹{savings.toFixed(0)}
                              </span>
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="text-lg font-bold text-green-600">₹{discountedPrice.toFixed(0)}</span>
                              <span className="ml-2 text-sm text-gray-500 line-through">₹{addon.estimatedPrice}</span>
                              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                {Math.round(addon.discount * 100)}% OFF
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>Available for next {addon.gapSize} minutes</span>
                            </div>
                          </div>
                          <input 
                            type="checkbox" 
                            className="ml-3 h-6 w-6 text-blue-600 rounded focus:ring-blue-500 border-2"
                            checked={checked} 
                            onChange={() => toggleAddon(addon)} 
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="flex justify-center mb-3">
                      <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-blue-700 font-medium">Finding the perfect add-ons for you...</p>
                    <p className="text-sm text-blue-600 mt-1">Personalizing offers based on your preferences</p>
                    <div className="mt-4 flex justify-center space-x-3">
                      <button 
                        onClick={generateFallbackSuggestions}
                        className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
                      >
                        Show Instant Offers
                      </button>
                      <button 
                        onClick={suggestAddonsBasedOnHistory}
                        className="text-sm bg-white hover:bg-gray-100 text-blue-600 border border-blue-300 px-4 py-2 rounded transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Loyalty Redemption Widget */}
              {(selectedServices.length > 0 || selectedAddons.length > 0) && user?.id && (
                <div className="mt-4">
                  <LoyaltyRedemptionWidget
                    customerId={user.id}
                    serviceTotal={overallTotal}
                    onRedemptionChange={handleRedemptionChange}
                    initialRedeemPoints={redemptionData.usePoints}
                  />
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium mb-2">Select Date & Time</h3>
              <p className="text-sm text-gray-600 mb-3">
                📅 You can only book appointments for today or future dates
              </p>
              <div className="space-y-3">
                <div>
                  <input 
                    type="date" 
                    value={appointmentDate} 
                    onChange={handleDateChange}
                    min={getTodayDate()}
                    className={`w-full border rounded px-3 py-2 ${dateError ? 'border-red-500' : ''}`}
                  />
                  {dateError && (
                    <p className="text-red-500 text-sm mt-1">{dateError}</p>
                  )}
                </div>
                <input type="time" value={appointmentTime} onChange={(e)=>setAppointmentTime(e.target.value)} className="w-full border rounded px-3 py-2" />
                <textarea placeholder="Notes (optional)" value={customerNotes} onChange={(e)=>setCustomerNotes(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} />
                
                {/* Booking Summary */}
                {(selectedServices.length > 0 || selectedAddons.length > 0) && (
                  <div className="border rounded p-3 bg-gray-50">
                    <h4 className="font-medium mb-2">Booking Summary</h4>
                    {selectedServices.map((selected, index) => {
                      const service = salon.services.find(s => s._id === selected.serviceId);
                      if (!service) return null;
                      return (
                        <div key={index} className="flex justify-between text-sm py-1">
                          <span>{service.name}</span>
                          <span>₹{service.discountedPrice ?? service.price ?? 0}</span>
                        </div>
                      );
                    })}
                    {selectedAddons.map((addon, index) => (
                      <div key={index} className="flex justify-between text-sm py-1">
                        <span>{addon.serviceName} (Add-on)</span>
                        <span>₹{addon.price}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-300 my-2 pt-2">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>₹{overallTotal}</span>
                      </div>
                      {redemptionData.usePoints && redemptionData.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Points Discount</span>
                          <span>-₹{redemptionData.discountAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-lg mt-1">
                        <span>Final Amount</span>
                        <span>₹{finalAmount.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={submitBooking} 
                  disabled={!!dateError || (selectedServices.length === 0 && selectedAddons.length === 0)}
                  className={`px-4 py-2 text-white rounded ${!!dateError || (selectedServices.length === 0 && selectedAddons.length === 0) ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
                >
                  Book Appointment
                </button>
              </div>
              
              {/* Display salon availability when a date is selected */}
              <SalonAvailabilityDisplay 
                salonId={salon._id} 
                selectedDate={appointmentDate} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;