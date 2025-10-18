import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { customerService } from "../../services/customer";
import { loyaltyService } from "../../services/loyalty";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import SalonAvailabilityDisplay from "../../components/customer/SalonAvailabilityDisplay";
import LoyaltyRedemptionWidget from "../../components/customer/LoyaltyRedemptionWidget";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";

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

  const toggleService = (service) => {
    const exists = selectedServices.find(s => s.serviceId === service._id);
    if (exists) {
      setSelectedServices(selectedServices.filter(s => s.serviceId !== service._id));
    } else {
      setSelectedServices([...selectedServices, { serviceId: service._id }]);
    }
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

  const submitBooking = async () => {
    if (!salon?._id || selectedServices.length === 0 || !appointmentDate || !appointmentTime) {
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
      
      // Validate redemption data
      if (redemptionData.usePoints && redemptionData.pointsToRedeem > 0) {
        if (redemptionData.pointsToRedeem > serviceTotal) {
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
      
      const payload = {
        salonId: salon._id,
        services: selectedServices,
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
          navigate("/customer/my-bookings");
        }, 1500);
      } else {
        toast.error(res?.message || "Failed to book appointment");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to book appointment");
    }
  };

  const serviceTotal = calculateServiceTotal();
  const finalAmount = redemptionData.usePoints 
    ? Math.max(0, serviceTotal - redemptionData.discountAmount) 
    : serviceTotal;

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
              
              {/* Loyalty Redemption Widget */}
              {selectedServices.length > 0 && user?.id && (
                <div className="mt-4">
                  <LoyaltyRedemptionWidget
                    customerId={user.id}
                    serviceTotal={serviceTotal}
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
                
                <button 
                  onClick={submitBooking} 
                  disabled={!!dateError}
                  className={`px-4 py-2 text-white rounded ${dateError ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'}`}
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