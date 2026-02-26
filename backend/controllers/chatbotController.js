import Salon from '../models/Salon.js';
import Service from '../models/Service.js';
import Staff from '../models/Staff.js';
import Appointment from '../models/Appointment.js';
import Queue from '../models/Queue.js';
import AddOnOffer from '../models/AddOnOffer.js';
import Razorpay from 'razorpay';
import mongoose from 'mongoose';

// In-memory session store (for production, use Redis or similar)
const chatSessions = new Map();

// Session timeout (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Helper function to clean up expired sessions
const cleanExpiredSessions = () => {
  const now = Date.now();
  for (const [sessionId, session] of chatSessions.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      chatSessions.delete(sessionId);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanExpiredSessions, 5 * 60 * 1000);

/**
 * Get or create chat session
 */
const getSession = (userId) => {
  const sessionId = userId.toString();
  let session = chatSessions.get(sessionId);
  
  if (!session) {
    session = {
      userId,
      state: 'initial',
      conversationHistory: [],
      bookingData: {},
      lastActivity: Date.now()
    };
    chatSessions.set(sessionId, session);
  } else {
    session.lastActivity = Date.now();
  }
  
  return session;
};

/**
 * Update chat session
 */
const updateSession = (userId, updates) => {
  const sessionId = userId.toString();
  const session = chatSessions.get(sessionId);
  
  if (session) {
    Object.assign(session, updates);
    session.lastActivity = Date.now();
    chatSessions.set(sessionId, session);
  }
  
  return session;
};

/**
 * Helper: Format date and time to YYYY-MM-DDTHH:mm format
 */
const formatAppointmentDateTime = (date, timeSlot) => {
  try {
    // If date is already in YYYY-MM-DD format
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // timeSlot might be like "10:00 AM" or "10:00"
      let time24 = timeSlot;
      
      // Convert 12-hour format to 24-hour if needed
      if (timeSlot.includes('AM') || timeSlot.includes('PM')) {
        const [time, period] = timeSlot.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        
        time24 = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
      
      return `${date}T${time24}`;
    }
    
    // If date is a Date object
    if (date instanceof Date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}T${timeSlot}`;
    }
    
    // Fallback: try to parse and format
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${timeSlot}`;
  } catch (error) {
    console.error('Error formatting appointment date time:', error);
    throw new Error('Invalid date or time format');
  }
};

/**
 * Helper: Calculate estimated end time
 */
const calculateEndTime = (startTime, durationMinutes) => {
  try {
    // startTime format: "HH:mm"
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  } catch (error) {
    console.error('Error calculating end time:', error);
    return startTime; // Return start time as fallback
  }
};

/**
 * Helper: Check for time slot conflicts
 */
const checkTimeSlotConflict = async (salonId, date, timeSlot, staffId = null) => {
  try {
    const appointmentDate = formatAppointmentDateTime(date, timeSlot);
    
    const query = {
      salonId: salonId,
      appointmentDate: appointmentDate,
      status: { $in: ['Pending', 'Approved', 'In-Progress'] }
    };
    
    if (staffId) {
      query.staffId = staffId;
    }
    
    const existingAppointment = await Appointment.findOne(query);
    return existingAppointment !== null;
  } catch (error) {
    console.error('Error checking time slot conflict:', error);
    return false; // Don't block booking on error
  }
};

/**
 * Reset chat session
 */
export const resetSession = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || (!req.user._id && !req.user.id)) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user._id || req.user.id;
    const sessionId = userId.toString();
    
    chatSessions.delete(sessionId);
    
    res.status(200).json({
      success: true,
      message: 'Chat session reset successfully'
    });
  } catch (error) {
    console.error('Error resetting chat session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset chat session',
      error: error.message
    });
  }
};

/**
 * Process user message and generate response
 */
export const processMessage = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || (!req.user._id && !req.user.id)) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { message, action, data } = req.body;
    const userId = req.user._id || req.user.id;
    const session = getSession(userId);
    
    // Add user message to conversation history
    if (message || action) {
      session.conversationHistory.push({
        role: 'user',
        content: message || action,
        timestamp: new Date()
      });
    }
    
    let response;
    
    // Handle different actions and conversation states
    if (action) {
      response = await handleAction(action, data, session, userId);
    } else if (message) {
      response = await handleMessage(message, session, userId);
    } else {
      response = {
        message: "I'm Aura, your personal salon assistant! How can I help you today?",
        options: [
          { label: 'Book an Appointment', action: 'start_booking' },
          { label: 'Browse Salons', action: 'browse_salons' },
          { label: 'View Active Offers', action: 'view_offers' },
          { label: 'Check Queue Status', action: 'check_queue' }
        ]
      };
    }
    
    // Add bot response to conversation history
    session.conversationHistory.push({
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      options: response.options,
      data: response.data
    });
    
    // Update session state
    updateSession(userId, { conversationHistory: session.conversationHistory });
    
    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error processing message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process your message. Please try again.',
      error: error.message
    });
  }
};

/**
 * Handle action-based requests
 */
const handleAction = async (action, data, session, userId) => {
  switch (action) {
    case 'start_booking':
      return await handleStartBooking(session);
    
    case 'browse_salons':
      return await handleBrowseSalons(data, session);
    
    case 'select_salon':
      return await handleSelectSalon(data, session);
    
    case 'view_services':
      return await handleViewServices(data, session);
    
    case 'select_service':
      return await handleSelectService(data, session);
    
    case 'view_offers':
      return await handleViewOffers(data, session);
    
    case 'select_offer':
      return await handleSelectOffer(data, session);
    
    case 'view_staff':
      return await handleViewStaff(data, session);
    
    case 'select_staff':
      return await handleSelectStaff(data, session);
    
    case 'view_slots':
      return await handleViewSlots(data, session);
    
    case 'select_slot':
      return await handleSelectSlot(data, session);
    
    case 'check_queue':
      return await handleCheckQueue(data, session);
    
    case 'confirm_booking':
      return await handleConfirmBooking(data, session, userId);
    
    case 'initiate_payment':
      return handleInitiatePayment(data);
    
    case 'cancel_booking':
      return handleCancelBooking(session);
    
    default:
      return {
        message: "I'm not sure how to help with that. Would you like to start a new booking?",
        options: [
          { label: 'Book an Appointment', action: 'start_booking' },
          { label: 'Browse Salons', action: 'browse_salons' }
        ]
      };
  }
};

/**
 * Handle text message input
 */
const handleMessage = async (message, session, userId) => {
  const lowerMessage = message.toLowerCase();
  
  // Intent detection
  if (lowerMessage.includes('book') || lowerMessage.includes('appointment')) {
    return await handleStartBooking(session);
  } else if (lowerMessage.includes('salon') || lowerMessage.includes('browse')) {
    return await handleBrowseSalons({}, session);
  } else if (lowerMessage.includes('offer') || lowerMessage.includes('deal') || lowerMessage.includes('discount')) {
    return await handleViewOffers({}, session);
  } else if (lowerMessage.includes('queue') || lowerMessage.includes('wait')) {
    return await handleCheckQueue({}, session);
  } else if (lowerMessage.includes('help')) {
    return {
      message: "I can help you with the following:\n• Book appointments\n• Browse salons\n• View active offers\n• Check queue status\n• View available staff\n\nWhat would you like to do?",
      options: [
        { label: 'Book an Appointment', action: 'start_booking' },
        { label: 'Browse Salons', action: 'browse_salons' },
        { label: 'View Active Offers', action: 'view_offers' },
        { label: 'Check Queue Status', action: 'check_queue' }
      ]
    };
  } else {
    return {
      message: "I'm Aura, your salon assistant! I can help you book appointments, browse salons, view offers, and more. What would you like to do?",
      options: [
        { label: 'Book an Appointment', action: 'start_booking' },
        { label: 'Browse Salons', action: 'browse_salons' },
        { label: 'View Active Offers', action: 'view_offers' }
      ]
    };
  }
};

/**
 * Start booking flow
 */
const handleStartBooking = async (session) => {
  updateSession(session.userId, { state: 'selecting_salon', bookingData: {} });
  
  return {
    message: "Great! Let's find the perfect salon for you. Would you like to browse salons or search by location?",
    options: [
      { label: 'Browse All Salons', action: 'browse_salons', data: {} },
      { label: 'Search by Location', action: 'browse_salons', data: { searchType: 'location' } }
    ]
  };
};

/**
 * Browse salons
 */
const handleBrowseSalons = async (data, session) => {
  try {
    console.log('handleBrowseSalons - Starting with data:', data);
    
    const { searchType, location, page = 1, limit = 6 } = data;
    
    // Use correct field names from Salon model
    let query = { 
      isActive: true, 
      setupCompleted: true, 
      approvalStatus: 'approved' 
    };
    
    console.log('handleBrowseSalons - Query:', query);
    
    if (searchType === 'location' && location) {
      // Add location-based filtering if coordinates are provided
      if (location.coordinates) {
        // This would require GeoJSON support in your Salon model
        query.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: location.coordinates
            },
            $maxDistance: location.radius || 10000 // 10km default
          }
        };
      }
    }
    
    const salons = await Salon.find(query)
      .select('salonName salonAddress address city state latitude longitude contactNumber phone businessHours rating documents salonImage profileImage')
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    
    console.log('handleBrowseSalons - Found salons:', salons.length);
    
    const total = await Salon.countDocuments(query);
    console.log('handleBrowseSalons - Total count:', total);
    
    if (salons.length === 0) {
      // Provide helpful debug info
      const allSalonsCount = await Salon.countDocuments({});
      const activeSalonsCount = await Salon.countDocuments({ isActive: true });
      const approvedSalonsCount = await Salon.countDocuments({ approvalStatus: 'approved' });
      const setupCompletedCount = await Salon.countDocuments({ setupCompleted: true });
      
      console.log('handleBrowseSalons - Debug counts:', {
        total: allSalonsCount,
        active: activeSalonsCount,
        approved: approvedSalonsCount,
        setupCompleted: setupCompletedCount
      });
      
      return {
        message: "I couldn't find any salons at the moment. Would you like to try a different search?",
        options: [
          { label: 'Try Again', action: 'browse_salons' },
          { label: 'Start Over', action: 'start_booking' }
        ]
      };
    }
    
    const salonOptions = salons.slice(0, 5).map(salon => {
      // Get address string from salonAddress or address field
      const addressStr = typeof salon.salonAddress === 'string' 
        ? salon.salonAddress 
        : salon.salonAddress?.city || salon.city || salon.address || '';
      
      const location = addressStr || 'Location not specified';
      const rating = salon.rating?.average || salon.rating;
      
      return {
        label: salon.salonName || 'Unnamed Salon',
        sublabel: `${location} ${rating ? `⭐ ${Number(rating).toFixed(1)}` : ''}`,
        action: 'select_salon',
        data: { salonId: salon._id.toString() }
      };
    });
    
    if (total > limit) {
      salonOptions.push({
        label: 'View More Salons',
        action: 'browse_salons',
        data: { page: page + 1, limit }
      });
    }
    
    updateSession(session.userId, { state: 'selecting_salon' });
    
    return {
      message: `I found ${total} salon${total > 1 ? 's' : ''} for you! Select one to view details:`,
      options: salonOptions,
      data: { salons: salons }
    };
  } catch (error) {
    console.error('Error browsing salons:', error);
    return {
      message: "Sorry, I encountered an error while fetching salons. Please try again.",
      options: [
        { label: 'Try Again', action: 'browse_salons' },
        { label: 'Start Over', action: 'start_booking' }
      ]
    };
  }
};

/**
 * Select a salon
 */
const handleSelectSalon = async (data, session) => {
  try {
    const { salonId } = data;
    
    console.log('handleSelectSalon - salonId:', salonId);
    
    if (!salonId || !mongoose.Types.ObjectId.isValid(salonId)) {
      return {
        message: "Invalid salon selection. Please try again.",
        options: [{ label: 'Browse Salons', action: 'browse_salons' }]
      };
    }
    
    const salon = await Salon.findById(salonId)
      .select('salonName salonAddress address city state contactNumber phone businessHours rating description')
      .lean();
    
    console.log('handleSelectSalon - Found salon:', salon ? salon.salonName : 'not found');
    
    if (!salon) {
      return {
        message: "Sorry, I couldn't find that salon. Please select another one.",
        options: [{ label: 'Browse Salons', action: 'browse_salons' }]
      };
    }
    
    // Get location string
    const addressStr = typeof salon.salonAddress === 'string' 
      ? salon.salonAddress 
      : salon.salonAddress?.city || salon.city || salon.address || 'Unknown location';
    
    // Update booking data
    session.bookingData.salonId = salonId;
    session.bookingData.salonName = salon.salonName;
    updateSession(session.userId, { 
      state: 'salon_selected', 
      bookingData: session.bookingData 
    });
    
    return {
      message: `Great choice! You selected **${salon.salonName}** in ${addressStr}.\n\nWhat would you like to do next?`,
      options: [
        { label: 'View Services', action: 'view_services', data: { salonId } },
        { label: 'View Active Offers', action: 'view_offers', data: { salonId } },
        { label: 'Check Queue Status', action: 'check_queue', data: { salonId } },
        { label: 'Choose Different Salon', action: 'browse_salons' }
      ],
      data: { salon: salon }
    };
  } catch (error) {
    console.error('Error selecting salon:', error);
    return {
      message: "Sorry, I encountered an error. Please try again.",
      options: [{ label: 'Browse Salons', action: 'browse_salons' }]
    };
  }
};

/**
 * View services
 */
const handleViewServices = async (data, session) => {
  try {
    const { salonId } = data;
    const targetSalonId = salonId || session.bookingData.salonId;
    
    console.log('handleViewServices - targetSalonId:', targetSalonId);
    
    if (!targetSalonId) {
      return {
        message: "Please select a salon first.",
        options: [{ label: 'Browse Salons', action: 'browse_salons' }]
      };
    }
    
    // Service model uses 'salonId' field
    const services = await Service.find({ salonId: targetSalonId, isActive: true })
      .select('name category price duration description')
      .lean();
    
    console.log('handleViewServices - Found services:', services.length);
    
    if (services.length === 0) {
      return {
        message: "This salon doesn't have any services listed yet. Would you like to check offers or choose another salon?",
        options: [
          { label: 'View Offers', action: 'view_offers', data: { salonId: targetSalonId } },
          { label: 'Choose Different Salon', action: 'browse_salons' }
        ]
      };
    }
    
    // Group services by category
    const servicesByCategory = services.reduce((acc, service) => {
      const category = service.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(service);
      return acc;
    }, {});
    
    const serviceOptions = services.slice(0, 8).map(service => ({
      label: service.name,
      sublabel: `₹${service.price} • ${service.duration} min`,
      action: 'select_service',
      data: { serviceId: service._id.toString(), salonId: targetSalonId }
    }));
    
    updateSession(session.userId, { state: 'viewing_services' });
    
    return {
      message: `Here are the available services at **${session.bookingData.salonName || 'this salon'}**:`,
      options: serviceOptions,
      data: { services: services, servicesByCategory }
    };
  } catch (error) {
    console.error('Error viewing services:', error);
    return {
      message: "Sorry, I couldn't load the services. Please try again.",
      options: [
        { label: 'Try Again', action: 'view_services' },
        { label: 'View Offers Instead', action: 'view_offers' }
      ]
    };
  }
};

/**
 * Select a service
 */
const handleSelectService = async (data, session) => {
  try {
    const { serviceId, salonId } = data;
    
    if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
      return {
        message: "Invalid service selection. Please try again.",
        options: [{ label: 'View Services', action: 'view_services' }]
      };
    }
    
    const service = await Service.findById(serviceId)
      .select('name category price duration description');
    
    if (!service) {
      return {
        message: "Sorry, I couldn't find that service. Please select another one.",
        options: [{ label: 'View Services', action: 'view_services' }]
      };
    }
    
    // Update booking data
    session.bookingData.serviceId = serviceId;
    session.bookingData.serviceName = service.name;
    session.bookingData.servicePrice = service.price;
    session.bookingData.serviceDuration = service.duration;
    updateSession(session.userId, { 
      state: 'service_selected', 
      bookingData: session.bookingData 
    });
    
    return {
      message: `Perfect! You've selected **${service.name}** (₹${service.price}, ${service.duration} min).\n\nWould you like to choose a specific staff member or see available time slots?`,
      options: [
        { label: 'Choose Staff Member', action: 'view_staff', data: { serviceId, salonId } },
        { label: 'View Available Slots', action: 'view_slots', data: { serviceId, salonId } },
        { label: 'Choose Different Service', action: 'view_services' }
      ],
      data: { service: service.toObject() }
    };
  } catch (error) {
    console.error('Error selecting service:', error);
    return {
      message: "Sorry, I encountered an error. Please try again.",
      options: [{ label: 'View Services', action: 'view_services' }]
    };
  }
};

/**
 * View active offers
 */
const handleViewOffers = async (data, session) => {
  try {
    const { salonId } = data;
    const targetSalonId = salonId || session.bookingData.salonId;
    
    console.log('handleViewOffers - targetSalonId:', targetSalonId);
    
    if (!targetSalonId) {
      return {
        message: "Please select a salon first to view their offers.",
        options: [{ label: 'Browse Salons', action: 'browse_salons' }]
      };
    }
    
    // AddOnOffer model uses 'salonId', 'endDate', 'discountedPrice'
    const now = new Date();
    const offers = await AddOnOffer.find({
      salonId: targetSalonId,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now }
    }).select('serviceName description discountType discountValue basePrice discountedPrice startDate endDate').lean();
    
    console.log('handleViewOffers - Found offers:', offers.length);
    
    if (offers.length === 0) {
      return {
        message: "This salon doesn't have any active offers at the moment. Would you like to view services instead?",
        options: [
          { label: 'View Services', action: 'view_services', data: { salonId: targetSalonId } },
          { label: 'Choose Different Salon', action: 'browse_salons' }
        ]
      };
    }
    
    const offerOptions = offers.slice(0, 6).map(offer => {
      const savings = offer.basePrice - offer.discountedPrice;
      return {
        label: offer.serviceName || 'Special Offer',
        sublabel: `₹${offer.discountedPrice} (Save ₹${savings})`,
        action: 'select_offer',
        data: { offerId: offer._id.toString(), salonId: targetSalonId }
      };
    });
    
    updateSession(session.userId, { state: 'viewing_offers' });
    
    return {
      message: `Here are the active offers at **${session.bookingData.salonName || 'this salon'}**:`,
      options: offerOptions,
      data: { offers: offers }
    };
  } catch (error) {
    console.error('Error viewing offers:', error);
    return {
      message: "Sorry, I couldn't load the offers. Please try again.",
      options: [
        { label: 'Try Again', action: 'view_offers' },
        { label: 'View Services Instead', action: 'view_services' }
      ]
    };
  }
};

/**
 * Select an offer
 */
const handleSelectOffer = async (data, session) => {
  try {
    const { offerId, salonId } = data;
    
    console.log('handleSelectOffer - offerId:', offerId);
    
    if (!offerId || !mongoose.Types.ObjectId.isValid(offerId)) {
      return {
        message: "Invalid offer selection. Please try again.",
        options: [{ label: 'View Offers', action: 'view_offers' }]
      };
    }
    
    const offer = await AddOnOffer.findById(offerId)
      .select('serviceName description discountType discountValue basePrice discountedPrice endDate')
      .lean();
    
    console.log('handleSelectOffer - Found offer:', offer ? offer.serviceName : 'not found');
    
    if (!offer) {
      return {
        message: "Sorry, I couldn't find that offer. Please select another one.",
        options: [{ label: 'View Offers', action: 'view_offers' }]
      };
    }
    
    // Update booking data
    session.bookingData.offerId = offerId;
    session.bookingData.offerName = offer.serviceName;
    session.bookingData.offerPrice = offer.discountedPrice;
    updateSession(session.userId, { 
      state: 'offer_selected', 
      bookingData: session.bookingData 
    });
    
    return {
      message: `Great! You've selected the **${offer.serviceName}** offer (₹${offer.discountedPrice}).\n\nWould you like to choose a specific staff member or see available time slots?`,
      options: [
        { label: 'Choose Staff Member', action: 'view_staff', data: { offerId, salonId } },
        { label: 'View Available Slots', action: 'view_slots', data: { offerId, salonId } },
        { label: 'Choose Different Offer', action: 'view_offers' }
      ],
      data: { offer: offer }
    };
  } catch (error) {
    console.error('Error selecting offer:', error);
    return {
      message: "Sorry, I encountered an error. Please try again.",
      options: [{ label: 'View Offers', action: 'view_offers' }]
    };
  }
};

/**
 * View staff members
 */
const handleViewStaff = async (data, session) => {
  try {
    const { salonId, serviceId } = data;
    const targetSalonId = salonId || session.bookingData.salonId;
    
    console.log('handleViewStaff - targetSalonId:', targetSalonId);
    
    if (!targetSalonId) {
      return {
        message: "Please select a salon first.",
        options: [{ label: 'Browse Salons', action: 'browse_salons' }]
      };
    }
    
    // Staff model uses 'assignedSalon' and 'approvalStatus'
    let query = { 
      assignedSalon: targetSalonId, 
      approvalStatus: 'approved' 
    };
    
    const staff = await Staff.find(query)
      .select('name specialization experience rating profilePicture')
      .limit(10)
      .lean();
    
    console.log('handleViewStaff - Found staff:', staff.length);
    
    if (staff.length === 0) {
      return {
        message: "No staff members are available at the moment. Would you like to view available time slots for any staff member?",
        options: [
          { label: 'View Available Slots', action: 'view_slots', data: { salonId: targetSalonId } },
          { label: 'Choose Different Salon', action: 'browse_salons' }
        ]
      };
    }
    
    const staffOptions = staff.map(member => ({
      label: member.name,
      sublabel: `${member.specialization || 'Stylist'} ${member.rating ? `⭐ ${member.rating.toFixed(1)}` : ''}`,
      action: 'select_staff',
      data: { staffId: member._id.toString(), salonId: targetSalonId }
    }));
    
    staffOptions.push({
      label: 'Skip (Any Available Staff)',
      action: 'view_slots',
      data: { salonId: targetSalonId }
    });
    
    updateSession(session.userId, { state: 'viewing_staff' });
    
    return {
      message: `Here are the available staff members at **${session.bookingData.salonName || 'this salon'}**:`,
      options: staffOptions,
      data: { staff: staff }
    };
  } catch (error) {
    console.error('Error viewing staff:', error);
    return {
      message: "Sorry, I couldn't load the staff members. Please try again.",
      options: [
        { label: 'Try Again', action: 'view_staff' },
        { label: 'View Slots Instead', action: 'view_slots' }
      ]
    };
  }
};

/**
 * Select a staff member
 */
const handleSelectStaff = async (data, session) => {
  try {
    const { staffId, salonId } = data;
    
    console.log('handleSelectStaff - staffId:', staffId);
    
    if (!staffId || !mongoose.Types.ObjectId.isValid(staffId)) {
      return {
        message: "Invalid staff selection. Please try again.",
        options: [{ label: 'View Staff', action: 'view_staff' }]
      };
    }
    
    const staff = await Staff.findById(staffId)
      .select('name specialization experience rating')
      .lean();
    
    console.log('handleSelectStaff - Found staff:', staff ? staff.name : 'not found');
    
    if (!staff) {
      return {
        message: "Sorry, I couldn't find that staff member. Please select another one.",
        options: [{ label: 'View Staff', action: 'view_staff' }]
      };
    }
    
    // Update booking data
    session.bookingData.staffId = staffId;
    session.bookingData.staffName = staff.name;
    updateSession(session.userId, { 
      state: 'staff_selected', 
      bookingData: session.bookingData 
    });
    
    return {
      message: `Perfect! You've selected **${staff.name}** as your stylist.\n\nNow let's find an available time slot.`,
      options: [
        { label: 'View Available Slots', action: 'view_slots', data: { staffId, salonId } },
        { label: 'Choose Different Staff', action: 'view_staff' }
      ],
      data: { staff: staff }
    };
  } catch (error) {
    console.error('Error selecting staff:', error);
    return {
      message: "Sorry, I encountered an error. Please try again.",
      options: [{ label: 'View Staff', action: 'view_staff' }]
    };
  }
};

/**
 * View available time slots
 */
const handleViewSlots = async (data, session) => {
  try {
    const { salonId, staffId, date } = data;
    const targetSalonId = salonId || session.bookingData.salonId;
    const targetStaffId = staffId || session.bookingData.staffId;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    if (!targetSalonId) {
      return {
        message: "Please select a salon first.",
        options: [{ label: 'Browse Salons', action: 'browse_salons' }]
      };
    }
    
    // Generate time slots (9 AM to 7 PM)
    const slots = [];
    const startHour = 9;
    const endHour = 19;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time: timeString,
          available: true // Simplified - in production, check actual availability
        });
      }
    }
    
    // Check existing appointments to mark unavailable slots
    // Appointment model uses 'salonId' field
    const appointmentQuery = {
      salonId: targetSalonId,
      date: new Date(targetDate),
      status: { $in: ['pending', 'confirmed'] }
    };
    
    if (targetStaffId) {
      appointmentQuery.staffId = targetStaffId;
    }
    
    const existingAppointments = await Appointment.find(appointmentQuery)
      .select('timeSlot')
      .lean();
    
    console.log('handleViewSlots - Existing appointments:', existingAppointments.length);
    
    const bookedSlots = existingAppointments.map(apt => apt.timeSlot);
    
    const availableSlots = slots.filter(slot => !bookedSlots.includes(slot.time));
    
    if (availableSlots.length === 0) {
      return {
        message: "No slots are available for the selected date. Would you like to try a different date or staff member?",
        options: [
          { label: 'Choose Different Date', action: 'view_slots', data: { salonId: targetSalonId, staffId: targetStaffId } },
          { label: 'Choose Different Staff', action: 'view_staff' },
          { label: 'Start Over', action: 'start_booking' }
        ]
      };
    }
    
    const slotOptions = availableSlots.slice(0, 10).map(slot => ({
      label: slot.time,
      sublabel: `Available`,
      action: 'select_slot',
      data: { 
        timeSlot: slot.time, 
        date: targetDate,
        salonId: targetSalonId,
        staffId: targetStaffId
      }
    }));
    
    updateSession(session.userId, { state: 'viewing_slots' });
    
    return {
      message: `Here are the available time slots for ${targetDate}:`,
      options: slotOptions,
      data: { slots: availableSlots, date: targetDate }
    };
  } catch (error) {
    console.error('Error viewing slots:', error);
    return {
      message: "Sorry, I couldn't load the time slots. Please try again.",
      options: [
        { label: 'Try Again', action: 'view_slots' },
        { label: 'Start Over', action: 'start_booking' }
      ]
    };
  }
};

/**
 * Select a time slot
 */
const handleSelectSlot = async (data, session) => {
  try {
    const { timeSlot, date, salonId, staffId } = data;
    
    if (!timeSlot || !date) {
      return {
        message: "Invalid time slot selection. Please try again.",
        options: [{ label: 'View Slots', action: 'view_slots' }]
      };
    }
    
    // Update booking data
    session.bookingData.timeSlot = timeSlot;
    session.bookingData.date = date;
    updateSession(session.userId, { 
      state: 'slot_selected', 
      bookingData: session.bookingData 
    });
    
    // Generate booking summary
    const summary = `
**Booking Summary:**
📍 Salon: ${session.bookingData.salonName || 'N/A'}
${session.bookingData.serviceName ? `💇 Service: ${session.bookingData.serviceName}` : ''}
${session.bookingData.offerName ? `🎁 Offer: ${session.bookingData.offerName}` : ''}
${session.bookingData.staffName ? `👤 Staff: ${session.bookingData.staffName}` : ''}
📅 Date: ${date}
🕐 Time: ${timeSlot}
💰 Price: ₹${session.bookingData.servicePrice || session.bookingData.offerPrice || 'TBD'}

Would you like to confirm this booking?
    `.trim();
    
    return {
      message: summary,
      options: [
        { label: 'Confirm Booking', action: 'confirm_booking', data: session.bookingData },
        { label: 'Change Time Slot', action: 'view_slots' },
        { label: 'Cancel', action: 'cancel_booking' }
      ],
      data: { bookingSummary: session.bookingData }
    };
  } catch (error) {
    console.error('Error selecting slot:', error);
    return {
      message: "Sorry, I encountered an error. Please try again.",
      options: [{ label: 'View Slots', action: 'view_slots' }]
    };
  }
};

/**
 * Check queue status
 */
const handleCheckQueue = async (data, session) => {
  try {
    const { salonId } = data;
    const targetSalonId = salonId || session.bookingData.salonId;
    
    console.log('handleCheckQueue - targetSalonId:', targetSalonId);
    
    if (!targetSalonId) {
      return {
        message: "Please select a salon first to check the queue status.",
        options: [{ label: 'Browse Salons', action: 'browse_salons' }]
      };
    }
    
    // Queue model uses 'salonId' field
    const queueEntries = await Queue.find({
      salonId: targetSalonId,
      status: 'waiting'
    }).sort({ tokenNumber: 1 }).lean();
    
    const currentService = await Queue.findOne({
      salonId: targetSalonId,
      status: 'in_service'
    }).populate('customerId', 'name').lean();
    
    console.log('handleCheckQueue - Queue entries:', queueEntries.length);
    
    const waitingCount = queueEntries.length;
    const estimatedWait = waitingCount * 30; // 30 minutes per person (simplified)
    
    let message = `**Queue Status for ${session.bookingData.salonName || 'this salon'}:**\n\n`;
    
    if (currentService) {
      message += `🔴 Currently serving: Token #${currentService.tokenNumber}\n`;
    }
    
    message += `👥 People waiting: ${waitingCount}\n`;
    message += `⏱️ Estimated wait time: ${estimatedWait} minutes\n\n`;
    
    if (waitingCount === 0) {
      message += `Great news! There's no queue right now. This is a perfect time to visit!`;
    } else if (waitingCount < 3) {
      message += `The queue is short. Would you like to join?`;
    } else {
      message += `The queue is a bit long. You might want to book an appointment instead.`;
    }
    
    return {
      message,
      options: [
        { label: 'Book Appointment', action: 'start_booking' },
        { label: 'View Services', action: 'view_services', data: { salonId: targetSalonId } },
        { label: 'Choose Different Salon', action: 'browse_salons' }
      ],
      data: { 
        queueStatus: {
          waiting: waitingCount,
          estimatedWait,
          currentService: currentService?.tokenNumber
        }
      }
    };
  } catch (error) {
    console.error('Error checking queue:', error);
    return {
      message: "Sorry, I couldn't check the queue status. Please try again.",
      options: [
        { label: 'Try Again', action: 'check_queue' },
        { label: 'Browse Salons', action: 'browse_salons' }
      ]
    };
  }
};

/**
 * Confirm booking
 */
const handleConfirmBooking = async (data, session, userId) => {
  try {
    const bookingData = session.bookingData;
    
    console.log('handleConfirmBooking - Starting with booking data:', bookingData);
    
    // Validate required fields
    if (!bookingData.salonId || !bookingData.date || !bookingData.timeSlot) {
      console.error('handleConfirmBooking - Missing required fields:', { 
        salonId: !!bookingData.salonId, 
        date: !!bookingData.date, 
        timeSlot: !!bookingData.timeSlot 
      });
      return {
        message: "❌ **Incomplete Booking Information**\n\nSome required details are missing. Please start the booking process again.",
        options: [{ label: 'Start New Booking', action: 'start_booking' }]
      };
    }
    
    // Must have either service or offer
    if (!bookingData.serviceId && !bookingData.offerId) {
      console.error('handleConfirmBooking - No service or offer selected');
      return {
        message: "❌ **Service Selection Required**\n\nPlease select either a service or an offer to continue with your booking.",
        options: [
          { label: 'View Services', action: 'view_services' },
          { label: 'View Offers', action: 'view_offers' }
        ]
      };
    }
    
    // Check for time slot conflicts
    const hasConflict = await checkTimeSlotConflict(
      bookingData.salonId, 
      bookingData.date, 
      bookingData.timeSlot, 
      bookingData.staffId
    );
    
    if (hasConflict) {
      console.warn('handleConfirmBooking - Time slot conflict detected');
      return {
        message: "⚠️ **Time Slot Unavailable**\n\nSorry, this time slot has just been booked by another customer. Please select a different time.",
        options: [
          { label: 'View Available Slots', action: 'view_slots', data: { salonId: bookingData.salonId } },
          { label: 'Start Over', action: 'start_booking' }
        ]
      };
    }
    
    // Format appointment date to YYYY-MM-DDTHH:mm
    let appointmentDate;
    try {
      appointmentDate = formatAppointmentDateTime(bookingData.date, bookingData.timeSlot);
      console.log('handleConfirmBooking - Formatted appointment date:', appointmentDate);
    } catch (error) {
      console.error('handleConfirmBooking - Date formatting error:', error);
      return {
        message: "❌ **Invalid Date Format**\n\nThere was an error processing your selected date and time. Please try selecting again.",
        options: [
          { label: 'View Slots Again', action: 'view_slots' },
          { label: 'Start Over', action: 'start_booking' }
        ]
      };
    }
    
    // Prepare appointment data
    const appointmentData = {
      customerId: userId,
      salonId: bookingData.salonId,
      appointmentDate: appointmentDate,
      appointmentTime: bookingData.timeSlot,
      status: 'Pending',
      source: 'Chatbot',
      paymentStatus: 'Pending'
    };
    
    // Handle service selection
    let serviceDuration = 60; // Default duration
    let serviceAmount = 0;
    
    if (bookingData.serviceId) {
      // Service-based booking
      appointmentData.services = [{
        serviceId: bookingData.serviceId,
        serviceName: bookingData.serviceName || 'Service',
        price: bookingData.servicePrice || 0,
        duration: bookingData.serviceDuration || 60
      }];
      serviceDuration = bookingData.serviceDuration || 60;
      serviceAmount = bookingData.servicePrice || 0;
      appointmentData.totalAmount = serviceAmount;
      appointmentData.finalAmount = serviceAmount;
    } else if (bookingData.offerId) {
      // Offer-only booking - fetch offer details
      console.log('handleConfirmBooking - Fetching offer details for offer ID:', bookingData.offerId);
      
      try {
        const offer = await AddOnOffer.findById(bookingData.offerId)
          .select('serviceName basePrice discountedPrice')
          .lean();
        
        if (!offer) {
          console.error('handleConfirmBooking - Offer not found:', bookingData.offerId);
          return {
            message: "❌ **Offer Not Found**\n\nThe selected offer is no longer available. Please select a different offer or service.",
            options: [
              { label: 'View Available Offers', action: 'view_offers' },
              { label: 'View Services', action: 'view_services' }
            ]
          };
        }
        
        // Create service entry for offer
        appointmentData.services = [{
          serviceId: null, // No service ID for offers
          serviceName: offer.serviceName || bookingData.offerName || 'Special Offer',
          price: offer.discountedPrice || bookingData.offerPrice || 0,
          duration: 60 // Default duration for offers
        }];
        
        serviceDuration = 60;
        serviceAmount = offer.discountedPrice || bookingData.offerPrice || 0;
        appointmentData.totalAmount = offer.basePrice || serviceAmount;
        appointmentData.finalAmount = serviceAmount;
        
        console.log('handleConfirmBooking - Offer details loaded:', {
          serviceName: offer.serviceName,
          basePrice: offer.basePrice,
          discountedPrice: offer.discountedPrice
        });
      } catch (error) {
        console.error('handleConfirmBooking - Error fetching offer:', error);
        return {
          message: "❌ **Error Loading Offer**\n\nThere was an error processing your selected offer. Please try again.",
          options: [
            { label: 'View Offers Again', action: 'view_offers' },
            { label: 'Start Over', action: 'start_booking' }
          ]
        };
      }
    }
    
    // Add staff if selected
    if (bookingData.staffId) {
      appointmentData.staffId = bookingData.staffId;
    }
    
    // Calculate estimated duration and end time
    appointmentData.estimatedDuration = serviceDuration;
    appointmentData.estimatedEndTime = calculateEndTime(bookingData.timeSlot, serviceDuration);
    
    console.log('handleConfirmBooking - Final appointment data:', appointmentData);
    
    // Create appointment
    const appointment = new Appointment(appointmentData);
    await appointment.save();
    
    console.log('handleConfirmBooking - Appointment created successfully:', appointment._id);
    
    // Initialize Razorpay for payment
    let razorpayOrder = null;
    try {
      if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID,
          key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        
        const orderOptions = {
          amount: Math.round(appointmentData.finalAmount * 100), // Convert to paise
          currency: 'INR',
          receipt: `appt_${appointment._id}`,
          payment_capture: 1,
          notes: {
            appointmentId: appointment._id.toString(),
            salonId: bookingData.salonId.toString(),
            customerId: userId.toString()
          }
        };
        
        razorpayOrder = await razorpay.orders.create(orderOptions);
        console.log('handleConfirmBooking - Razorpay order created:', razorpayOrder.id);
      }
    } catch (razorpayError) {
      console.error('handleConfirmBooking - Razorpay order creation failed:', razorpayError);
      // Don't fail the booking, just skip payment integration
    }
    
    // Clear session after successful booking
    chatSessions.delete(userId.toString());
    
    // Use lean object for response
    const appointmentObj = appointment.toObject();
    
    // Prepare success message
    const successMessage = `🎉 **Booking Created Successfully!**\n\nYour appointment has been booked!\n\n**Booking Details:**\n📍 Salon: ${bookingData.salonName}\n💇 Service: ${appointmentData.services[0].serviceName}\n${bookingData.staffName ? `👤 Staff: ${bookingData.staffName}\n` : ''}📅 Date: ${bookingData.date}\n🕐 Time: ${bookingData.timeSlot}\n⏱️ Duration: ${serviceDuration} minutes\n💰 Amount: ₹${appointmentData.finalAmount}\n\n**Booking ID:** ${appointment._id}\n\n${razorpayOrder ? '💳 Please proceed with payment to confirm your appointment.' : 'Your appointment is confirmed!'}`;
    
    // Prepare response options
    const responseOptions = [];
    
    if (razorpayOrder) {
      // Add payment option if Razorpay is configured
      responseOptions.push({
        label: '💳 Proceed to Payment',
        action: 'initiate_payment',
        data: {
          appointmentId: appointment._id.toString(),
          orderId: razorpayOrder.id,
          amount: appointmentData.finalAmount,
          currency: 'INR',
          razorpayKeyId: process.env.RAZORPAY_KEY_ID
        }
      });
    }
    
    responseOptions.push(
      { label: 'View My Bookings', action: 'view_bookings' },
      { label: 'Book Another', action: 'start_booking' }
    );
    
    return {
      message: successMessage,
      options: responseOptions,
      data: { 
        appointment: appointmentObj, 
        bookingConfirmed: true,
        razorpayOrder: razorpayOrder ? {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency
        } : null
      }
    };
  } catch (error) {
    console.error('handleConfirmBooking - Error:', error);
    console.error('handleConfirmBooking - Stack trace:', error.stack);
    
    // Provide specific error messages based on error type
    let errorMessage = "❌ **Booking Failed**\n\n";
    
    if (error.name === 'ValidationError') {
      errorMessage += "Some booking details are invalid. Please check your selections and try again.\n\n";
      errorMessage += `Details: ${error.message}`;
    } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      errorMessage += "There was a database error. Please try again in a moment.";
    } else if (error.message.includes('date') || error.message.includes('time')) {
      errorMessage += "There was an issue with your selected date or time. Please select again.";
    } else {
      errorMessage += "An unexpected error occurred. You can try again or book directly from the dashboard.";
    }
    
    return {
      message: errorMessage,
      options: [
        { label: 'Try Again', action: 'view_slots' },
        { label: 'Start Over', action: 'start_booking' },
        { label: 'Contact Support', action: 'help' }
      ]
    };
  }
};

/**
 * Handle payment initiation
 */
const handleInitiatePayment = (data) => {
  const { appointmentId, orderId, amount, currency, razorpayKeyId } = data;
  
  console.log('handleInitiatePayment - Payment data received:', { appointmentId, orderId, amount });
  
  if (!appointmentId || !orderId) {
    return {
      message: "❌ **Payment Information Missing**\n\nUnable to initiate payment. Please contact support with your booking ID.",
      options: [
        { label: 'View My Bookings', action: 'view_bookings' },
        { label: 'Contact Support', action: 'help' }
      ]
    };
  }
  
  // Return payment details for frontend to handle Razorpay checkout
  return {
    message: "💳 **Ready for Payment**\n\nClick the button below to proceed with secure payment via Razorpay.\n\n✅ Secure payment gateway\n✅ Multiple payment options\n✅ Instant confirmation",
    options: [
      { label: 'Pay Now', action: 'open_razorpay', data: data },
      { label: 'Pay Later', action: 'view_bookings' }
    ],
    data: {
      paymentRequired: true,
      razorpayConfig: {
        key: razorpayKeyId,
        amount: amount * 100, // Convert to paise
        currency: currency || 'INR',
        order_id: orderId,
        name: 'AuraCares',
        description: 'Appointment Booking Payment',
        appointmentId: appointmentId
      }
    }
  };
};

/**
 * Cancel booking
 */
const handleCancelBooking = (session) => {
  // Clear booking data
  session.bookingData = {};
  updateSession(session.userId, { state: 'initial', bookingData: {} });
  
  return {
    message: "Booking cancelled. Is there anything else I can help you with?",
    options: [
      { label: 'Start New Booking', action: 'start_booking' },
      { label: 'Browse Salons', action: 'browse_salons' },
      { label: 'View Offers', action: 'view_offers' }
    ]
  };
};

/**
 * Get conversation history
 */
export const getConversationHistory = async (req, res) => {
  try {
    console.log('getConversationHistory - Starting');
    console.log('getConversationHistory - req.user:', req.user);
    
    // Check if user is authenticated
    if (!req.user || (!req.user._id && !req.user.id)) {
      console.log('getConversationHistory - No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userId = req.user._id || req.user.id;
    console.log('getConversationHistory - userId:', userId);
    
    const session = getSession(userId);
    console.log('getConversationHistory - session:', { 
      state: session.state, 
      historyLength: session.conversationHistory?.length 
    });
    
    res.status(200).json({
      success: true,
      data: {
        conversationHistory: session.conversationHistory || [],
        currentState: session.state || 'initial',
        bookingData: session.bookingData || {}
      }
    });
  } catch (error) {
    console.error('Error getting conversation history:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to get conversation history',
      error: error.message
    });
  }
};
