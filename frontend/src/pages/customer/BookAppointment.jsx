import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { customerService } from "../../services/customer";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import toast from "react-hot-toast";

const BookAppointment = () => {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState(null);
  const [salonList, setSalonList] = useState([]);
  const [salonsLoading, setSalonsLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");

  useEffect(() => {
    if (!salonId) { setLoading(false); return; }
    (async () => {
      try {
        const res = await customerService.getSalonDetails(salonId);
        if (res?.success) {
          setSalon(res.data);
        }
      } catch (e) {
        toast.error("Failed to load salon details");
      } finally {
        setLoading(false);
      }
    })();
  }, [salonId]);

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

  const toggleService = (service) => {
    const exists = selectedServices.find(s => s.serviceId === service._id);
    if (exists) {
      setSelectedServices(selectedServices.filter(s => s.serviceId !== service._id));
    } else {
      setSelectedServices([...selectedServices, { serviceId: service._id }]);
    }
  };

  const submitBooking = async () => {
    if (!salon?._id || selectedServices.length === 0 || !appointmentDate || !appointmentTime) {
      toast.error("Please select services, date, and time");
      return;
    }
    try {
      const payload = {
        salonId: salon._id,
        services: selectedServices,
        appointmentDate,
        appointmentTime,
        customerNotes
      };
      const res = await customerService.bookAppointment(payload);
      if (res?.success) {
        toast.success("Appointment booked successfully!");
        setSelectedServices([]);
        setAppointmentDate("");
        setAppointmentTime("");
        setCustomerNotes("");
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
            </div>
            <div>
              <h3 className="font-medium mb-2">Select Date & Time</h3>
              <div className="space-y-3">
                <input type="date" value={appointmentDate} onChange={(e)=>setAppointmentDate(e.target.value)} className="w-full border rounded px-3 py-2" />
                <input type="time" value={appointmentTime} onChange={(e)=>setAppointmentTime(e.target.value)} className="w-full border rounded px-3 py-2" />
                <textarea placeholder="Notes (optional)" value={customerNotes} onChange={(e)=>setCustomerNotes(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} />
                <button onClick={submitBooking} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Book Appointment</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;