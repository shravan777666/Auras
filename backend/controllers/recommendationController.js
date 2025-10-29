import { successResponse, errorResponse } from '../utils/responses.js';
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import Customer from '../models/Customer.js';
import Salon from '../models/Salon.js';
import User from '../models/User.js';
import Recommendation from '../models/Recommendation.js';

// Enhanced rule-based recommendation logic
// Generate intelligent recommendations based on client's last service
const getRecommendation = (lastService) => {
  if (!lastService) {
    // Default recommendations for new clients
    return [
      'Basic Haircut',
      'Classic Facial', 
      'Swedish Massage - 60 min',
      'Basic Manicure',
      'Eyebrow Threading'
    ];
  }
  
  const serviceLower = lastService.toLowerCase();
  const recommendations = [];
  
  // Hair services recommendations
  if (serviceLower.includes('hair') || serviceLower.includes('cut') || serviceLower.includes('style') || serviceLower.includes('keratin') || serviceLower.includes('color')) {
    recommendations.push(
      'Deep Conditioning Treatment',
      'Scalp Treatment',
      'Hair Styling',
      'Anti-Aging Facial',
      'Hair & Skin Combo Package'
    );
  }
  // Skin/Facial services recommendations  
  else if (serviceLower.includes('facial') || serviceLower.includes('skin') || serviceLower.includes('wax') || serviceLower.includes('peel')) {
    recommendations.push(
      'Hair Styling',
      'Brightening Facial',
      'Body Scrub',
      'Spa Manicure',
      'Spa Package - Massage + Facial + Scrub'
    );
  }
  // Massage/Spa services recommendations
  else if (serviceLower.includes('massage') || serviceLower.includes('spa') || serviceLower.includes('aromatherapy')) {
    recommendations.push(
      'Basic Facial',
      'Deep Tissue Massage',
      'Hot Stone Massage',
      'Body Scrub & Wrap',
      'Reflexology'
    );
  }
  // Nail services recommendations
  else if (serviceLower.includes('nail') || serviceLower.includes('manicure') || serviceLower.includes('pedicure')) {
    recommendations.push(
      'Gel Manicure',
      'Spa Pedicure', 
      'Nail Art Design',
      'Hand Treatment',
      'Basic Facial'
    );
  }
  // Makeup services recommendations
  else if (serviceLower.includes('makeup') || serviceLower.includes('bridal')) {
    recommendations.push(
      'Hair Styling',
      'Spa Manicure',
      'Eyebrow Threading',
      'Eyelash Extensions',
      'Bridal Package'
    );
  }
  // Grooming services recommendations
  else if (serviceLower.includes('beard') || serviceLower.includes('shave') || serviceLower.includes('threading') || serviceLower.includes('grooming')) {
    recommendations.push(
      'Haircut - Men',
      'Hot Shave',
      'Eyebrow Threading',
      'Basic Facial',
      'Beard Styling'
    );
  }
  // Package services recommendations
  else if (serviceLower.includes('package') || serviceLower.includes('combo')) {
    recommendations.push(
      'Swedish Massage',
      'Anti-Aging Facial',
      'Hair Treatment',
      'Spa Pedicure',
      'Seasonal Offers'
    );
  }
  // Default recommendations for unknown services
  else {
    recommendations.push(
      'Basic Haircut',
      'Classic Facial',
      'Swedish Massage - 60 min',
      'Basic Manicure',
      'Spa Package'
    );
  }
  
  return recommendations.slice(0, 5); // Return top 5 recommendations
};

// Get recent clients who have taken appointments at this salon
export const getRecentClients = async (req, res) => {
  try {
    console.log('getRecentClients called with user:', req.user);
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return errorResponse(res, 'User not authenticated', 401);
    }
    
    // Get the salon owner's user ID from the request
    const userId = req.user.id;
    
    // Find the salon associated with this user
    const salon = await Salon.findOne({ ownerId: userId });
    
    if (!salon) {
      console.log('Salon not found for user ID:', userId);
      return errorResponse(res, 'Salon not found for this user', 404);
    }
    
    console.log('Found salon:', salon._id);
    
    // Get all appointments for this salon, sorted by date (most recent first)
    const appointments = await Appointment.find({ salonId: salon._id })
      .sort({ appointmentDate: -1, createdAt: -1 })
      .populate('customerId', 'name email')
      .populate('services.serviceId', 'name')
      .limit(50); // Limit to recent appointments
    
    console.log('Found appointments:', appointments.length);
    
    // Group appointments by customer to get their last service
    const customerMap = new Map();
    
    for (const appointment of appointments) {
      // Skip appointments without customer info
      if (!appointment.customerId) continue;
      
      const customerId = appointment.customerId._id.toString();
      
      // If we haven't seen this customer yet, or if this appointment is more recent
      if (!customerMap.has(customerId) || 
          new Date(appointment.appointmentDate) > new Date(customerMap.get(customerId).appointmentDate) ||
          (new Date(appointment.appointmentDate).getTime() === new Date(customerMap.get(customerId).appointmentDate).getTime() && 
           new Date(appointment.createdAt) > new Date(customerMap.get(customerId).createdAt))) {
        customerMap.set(customerId, {
          id: customerId,
          name: appointment.customerId.name,
          email: appointment.customerId.email,
          lastService: appointment.services.length > 0 ? (appointment.services[0].serviceName || appointment.services[0].serviceId?.name) : null,
          lastAppointmentDate: appointment.appointmentDate,
          createdAt: appointment.createdAt
        });
      }
    }
    
    // Convert map to array and sort by most recent appointment
    const recentClients = Array.from(customerMap.values())
      .sort((a, b) => {
        // Sort by appointment date first, then by creation time
        const dateComparison = new Date(b.lastAppointmentDate) - new Date(a.lastAppointmentDate);
        if (dateComparison !== 0) return dateComparison;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    
    console.log('Returning recent clients:', recentClients.length);
    return successResponse(res, recentClients, 'Recent clients retrieved successfully');
  } catch (error) {
    console.error('Error fetching recent clients:', error);
    return errorResponse(res, 'Failed to retrieve recent clients: ' + error.message, 500);
  }
};

// Get all clients for the salon
export const getClients = async (req, res) => {
  try {
    console.log('getClients called with user:', req.user);
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return errorResponse(res, 'User not authenticated', 401);
    }
    
    // Get the salon owner's user ID from the request
    const userId = req.user.id;
    
    // Find the salon associated with this user
    const salon = await Salon.findOne({ ownerId: userId });
    
    if (!salon) {
      console.log('Salon not found for user ID:', userId);
      return errorResponse(res, 'Salon not found for this user', 404);
    }
    
    console.log('Found salon for getClients:', salon._id);
    
    // Get all appointments for this salon
    const appointments = await Appointment.find({ salonId: salon._id })
      .populate('customerId', 'name email')
      .populate('services.serviceId', 'name');
    
    console.log('Found appointments for getClients:', appointments.length);
    
    // Group appointments by customer to get their last service
    const clientMap = new Map();
    
    for (const appointment of appointments) {
      // Skip appointments without customer info
      if (!appointment.customerId) continue;
      
      const customerId = appointment.customerId._id.toString();
      
      // If we haven't seen this customer yet, or if this appointment is more recent
      if (!clientMap.has(customerId) || 
          new Date(appointment.appointmentDate) > new Date(clientMap.get(customerId).appointmentDate) ||
          (new Date(appointment.appointmentDate).getTime() === new Date(clientMap.get(customerId).appointmentDate).getTime() && 
           new Date(appointment.createdAt) > new Date(clientMap.get(customerId).createdAt))) {
        clientMap.set(customerId, {
          id: customerId,
          name: appointment.customerId.name,
          email: appointment.customerId.email,
          lastService: appointment.services.length > 0 ? (appointment.services[0].serviceName || appointment.services[0].serviceId?.name) : null,
          appointmentDate: appointment.appointmentDate,
          createdAt: appointment.createdAt
        });
      }
    }
    
    // Convert map to array
    const clients = Array.from(clientMap.values());
    
    console.log('Returning clients:', clients.length);
    return successResponse(res, clients, 'Clients retrieved successfully');
  } catch (error) {
    console.error('Error fetching clients:', error);
    return errorResponse(res, 'Failed to retrieve clients: ' + error.message, 500);
  }
};

// Get recommendations for a specific client
export const getClientRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('getClientRecommendations called for client ID:', id, 'with user:', req.user);
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return errorResponse(res, 'User not authenticated', 401);
    }
    
    // Get the salon owner's user ID from the request
    const userId = req.user.id;
    
    // Find the salon associated with this user
    const salon = await Salon.findOne({ ownerId: userId });
    
    if (!salon) {
      console.log('Salon not found for user ID:', userId);
      return errorResponse(res, 'Salon not found for this user', 404);
    }
    
    console.log('Found salon for recommendations:', salon._id);
    
    // Find the customer
    const customer = await Customer.findById(id);
    
    if (!customer) {
      console.log('Customer not found for ID:', id);
      return errorResponse(res, 'Customer not found', 404);
    }
    
    console.log('Found customer:', customer._id);
    
    // Get the most recent appointment for this customer at this salon
    const recentAppointment = await Appointment.findOne({
      customerId: id,
      salonId: salon._id
    })
    .sort({ appointmentDate: -1, createdAt: -1 })
    .populate('services.serviceId', 'name');
    
    console.log('Found recent appointment:', recentAppointment?._id);
    
    let lastService = null;
    if (recentAppointment && recentAppointment.services.length > 0) {
      lastService = recentAppointment.services[0].serviceName || recentAppointment.services[0].serviceId?.name;
    }
    
    // Get recommendations based on last service
    const recommendations = getRecommendation(lastService);
    
    console.log('Returning recommendations for client:', id, recommendations);
    return successResponse(res, {
      clientId: customer._id,
      clientName: customer.name,
      lastService: lastService,
      recommendations
    }, 'Recommendations retrieved successfully');
  } catch (error) {
    console.error('Error fetching client recommendations:', error);
    return errorResponse(res, 'Failed to retrieve recommendations: ' + error.message, 500);
  }
};

// Send recommendations to client
export const sendRecommendations = async (req, res) => {
  try {
    const { clientId, recommendations } = req.body;
    console.log('sendRecommendations called for client ID:', clientId, 'with user:', req.user);
    
    // Validate input
    if (!clientId || !recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
      return errorResponse(res, 'Client ID and recommendations array are required', 400);
    }
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return errorResponse(res, 'User not authenticated', 401);
    }
    
    // Get the salon owner's user ID from the request
    const userId = req.user.id;
    
    // Find the salon associated with this user
    const salon = await Salon.findOne({ ownerId: userId });
    
    if (!salon) {
      console.log('Salon not found for user ID:', userId);
      return errorResponse(res, 'Salon not found for this user', 404);
    }
    
    console.log('Found salon for sending recommendations:', salon._id);
    
    // Find the customer
    const customer = await Customer.findById(clientId);
    
    if (!customer) {
      console.log('Customer not found for ID:', clientId);
      return errorResponse(res, 'Customer not found', 404);
    }
    
    console.log('Found customer for sending recommendations:', customer._id);
    
    // Get the customer's last service for context
    const recentAppointment = await Appointment.findOne({
      customerId: clientId,
      salonId: salon._id
    })
    .sort({ appointmentDate: -1, createdAt: -1 })
    .populate('services.serviceId', 'name');
    
    let lastService = null;
    if (recentAppointment && recentAppointment.services.length > 0) {
      lastService = recentAppointment.services[0].serviceName || recentAppointment.services[0].serviceId?.name;
    }
    
    // Format recommendations for database storage
    const formattedRecommendations = recommendations.map(rec => ({
      serviceName: rec,
      description: `Recommended based on your previous service: ${lastService || 'your preferences'}`,
      estimatedPrice: 0, // Could be enhanced to include actual pricing
      estimatedDuration: '' // Could be enhanced to include duration estimates
    }));
    
    // Check if there's already an active recommendation for this customer from this salon
    const existingRecommendation = await Recommendation.findOne({
      customerId: clientId,
      salonId: salon._id,
      status: { $in: ['sent', 'viewed'] },
      expiresAt: { $gt: new Date() }
    });
    
    let savedRecommendation;
    
    if (existingRecommendation) {
      // Update existing recommendation
      existingRecommendation.recommendations = formattedRecommendations;
      existingRecommendation.sentAt = new Date();
      existingRecommendation.status = 'sent';
      existingRecommendation.viewedAt = null;
      existingRecommendation.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      existingRecommendation.metadata.basedOnService = lastService || '';
      existingRecommendation.notes = `Updated recommendations sent by ${salon.salonName}`;
      
      savedRecommendation = await existingRecommendation.save();
      console.log('Updated existing recommendation:', savedRecommendation._id);
    } else {
      // Create new recommendation
      const newRecommendation = new Recommendation({
        customerId: clientId,
        salonId: salon._id,
        recommendations: formattedRecommendations,
        status: 'sent',
        notes: `Recommendations sent by ${salon.salonName}`,
        metadata: {
          basedOnService: lastService || '',
          recommendationType: 'personalized'
        }
      });
      
      savedRecommendation = await newRecommendation.save();
      console.log('Created new recommendation:', savedRecommendation._id);
    }
    
    // In a real implementation, this would send an email or push notification
    console.log(`Recommendations saved and sent to ${customer.name} (${customer.email}):`, recommendations);
    
    return successResponse(res, {
      clientId,
      recommendationId: savedRecommendation._id,
      message: `Recommendations sent to ${customer.name}`,
      recommendationsCount: recommendations.length
    }, 'Recommendations sent successfully');
  } catch (error) {
    console.error('Error sending recommendations:', error);
    return errorResponse(res, 'Failed to send recommendations: ' + error.message, 500);
  }
};

// Get recommendations for a customer
export const getCustomerRecommendations = async (req, res) => {
  try {
    const { customerId } = req.params;
    console.log('getCustomerRecommendations called for customer ID:', customerId);
    
    // Validate customer ID
    if (!customerId) {
      return errorResponse(res, 'Customer ID is required', 400);
    }
    
    // Check if user is authenticated and is the customer or admin
    if (!req.user || !req.user.id) {
      return errorResponse(res, 'User not authenticated', 401);
    }
    
    // For customer access, verify they can only access their own recommendations
    // req.user.type should be 'customer' for customer role, and req.user.id should match customerId
    if (req.user.type === 'customer' && req.user.id !== customerId) {
      return errorResponse(res, 'Access denied. You can only view your own recommendations', 403);
    }
    
    // Find the customer to verify they exist
    // Try multiple approaches to find the customer (similar to getCustomerLoyaltyDetails):
    // 1. Find by user reference (Google OAuth users might have this)
    let customer = await Customer.findOne({ user: customerId });
    
    // 2. If not found, try to find by ID directly (regular registration users)
    if (!customer) {
      customer = await Customer.findById(customerId);
    }
    
    // 3. If still not found, try to find by email (fallback)
    if (!customer) {
      customer = await Customer.findOne({ email: req.user.email });
    }
    
    if (!customer) {
      console.log('Customer not found for ID:', customerId);
      return errorResponse(res, 'Customer not found', 404);
    }
    
    console.log('Found customer for recommendations:', customer._id);
    
    // Get active recommendations for the customer
    const recommendations = await Recommendation.getActiveForCustomer(customer._id, { limit: 50 });
    
    // Mark recommendations as viewed if they haven't been viewed yet
    const unviewedRecommendations = recommendations.filter(rec => rec.status === 'sent');
    if (unviewedRecommendations.length > 0) {
      await Promise.all(unviewedRecommendations.map(rec => rec.markAsViewed()));
      console.log(`Marked ${unviewedRecommendations.length} recommendations as viewed`);
    }
    
    // Format recommendations for frontend
    const formattedRecommendations = recommendations.map(rec => ({
      id: rec._id,
      salonId: rec.salonId?._id || rec.salonId, // Include the salon ID for booking navigation
      salonName: rec.salonId?.salonName || 'Unknown Salon',
      salonAddress: rec.salonId?.salonAddress || '',
      salonContact: rec.salonId?.contactNumber || '',
      recommendations: rec.recommendations || [],
      status: rec.status,
      sentAt: rec.sentAt,
      viewedAt: rec.viewedAt,
      expiresAt: rec.expiresAt,
      notes: rec.notes,
      basedOnService: rec.metadata?.basedOnService || '',
      recommendationType: rec.metadata?.recommendationType || 'personalized',
      isExpired: rec.isExpired()
    }));
    
    console.log(`Returning ${formattedRecommendations.length} recommendations for customer:`, customerId);
    return successResponse(res, formattedRecommendations, 'Customer recommendations retrieved successfully');
  } catch (error) {
    console.error('Error fetching customer recommendations:', error);
    return errorResponse(res, 'Failed to retrieve customer recommendations: ' + error.message, 500);
  }
};

// Get one-click booking preference for a customer
export const getOneClickBookingPreference = async (req, res) => {
  try {
    const { customerId } = req.params;
    console.log('getOneClickBookingPreference called for customer ID:', customerId);
    
    // Validate customer ID
    if (!customerId) {
      return errorResponse(res, 'Customer ID is required', 400);
    }
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return errorResponse(res, 'User not authenticated', 401);
    }
    
    // For customer access, verify they can only access their own data
    if (req.user.type === 'customer' && req.user.id !== customerId) {
      return errorResponse(res, 'Access denied. You can only access your own booking preferences', 403);
    }
    
    // Find the customer to verify they exist
    // Try multiple approaches to find the customer (similar to getCustomerLoyaltyDetails):
    // 1. Find by user reference (Google OAuth users might have this)
    let customer = await Customer.findOne({ user: customerId });
    
    // 2. If not found, try to find by ID directly (regular registration users)
    if (!customer) {
      customer = await Customer.findById(customerId);
    }
    
    // 3. If still not found, try to find by email (fallback)
    if (!customer) {
      customer = await Customer.findOne({ email: req.user.email });
    }
    
    if (!customer) {
      console.log('Customer not found for ID:', customerId);
      return errorResponse(res, 'Customer not found', 404);
    }
    
    console.log('Found customer for booking preference:', customer._id);
    
    // Get customer's recent appointments (last 10)
    const recentAppointments = await Appointment.find({ customerId: customer._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('salonId', 'salonName businessHours')
      .populate('services.serviceId', 'name duration');
    
    if (!recentAppointments || recentAppointments.length === 0) {
      return successResponse(res, null, 'No booking history found');
    }
    
    // Analyze booking history to find most frequent service and salon
    const serviceCount = {};
    const salonCount = {};
    
    recentAppointments.forEach(appointment => {
      // Count services
      if (appointment.services && Array.isArray(appointment.services)) {
        appointment.services.forEach(service => {
          const serviceName = service.serviceName || service.serviceId?.name;
          if (serviceName) {
            const serviceKey = `${serviceName}-${appointment.salonId?._id || appointment.salonId}`;
            serviceCount[serviceKey] = (serviceCount[serviceKey] || 0) + 1;
          }
        });
      }
      
      // Count salons
      const salonId = appointment.salonId?._id || appointment.salonId;
      if (salonId) {
        salonCount[salonId] = {
          count: (salonCount[salonId]?.count || 0) + 1,
          name: appointment.salonId?.salonName || 'Unknown Salon',
          id: salonId,
          businessHours: appointment.salonId?.businessHours
        };
      }
    });
    
    // Find most frequent service-salon combination
    let mostFrequentService = null;
    let maxServiceCount = 0;
    let associatedSalon = null;
    
    for (const [serviceKey, count] of Object.entries(serviceCount)) {
      if (count > maxServiceCount) {
        maxServiceCount = count;
        const [serviceName, salonId] = serviceKey.split('-');
        mostFrequentService = serviceName;
        associatedSalon = Object.values(salonCount).find(salon => salon.id.toString() === salonId);
      }
    }
    
    // If we couldn't find a service-salon combination, fall back to most frequent salon
    if (!mostFrequentService && Object.keys(salonCount).length > 0) {
      let maxSalonCount = 0;
      for (const [salonId, salonData] of Object.entries(salonCount)) {
        if (salonData.count > maxSalonCount) {
          maxSalonCount = salonData.count;
          associatedSalon = salonData;
        }
      }
      
      // Use the most recent service from this salon
      const salonAppointments = recentAppointments.filter(app => 
        (app.salonId?._id || app.salonId)?.toString() === associatedSalon.id.toString()
      );
      
      if (salonAppointments.length > 0 && salonAppointments[0].services.length > 0) {
        const service = salonAppointments[0].services[0];
        mostFrequentService = service.serviceName || service.serviceId?.name;
      }
    }
    
    if (!mostFrequentService || !associatedSalon) {
      return successResponse(res, null, 'Insufficient booking history to determine preference');
    }
    
    // Find next availability for this salon and service
    const nextAvailability = await findNextAvailability(associatedSalon.id, mostFrequentService);
    
    const bookingPreference = {
      service: mostFrequentService,
      salon: {
        id: associatedSalon.id,
        name: associatedSalon.name
      },
      nextAvailability
    };
    
    console.log('Returning booking preference for customer:', customerId, bookingPreference);
    return successResponse(res, bookingPreference, 'Booking preference retrieved successfully');
  } catch (error) {
    console.error('Error fetching booking preference:', error);
    return errorResponse(res, 'Failed to retrieve booking preference: ' + error.message, 500);
  }
};

// Helper function to find next availability for a salon and service
const findNextAvailability = async (salonId, serviceName) => {
  try {
    // Check today and next few days for availability (next 7 days)
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      try {
        // Get the salon to access business hours
        const salon = await Salon.findById(salonId);
        if (!salon) {
          continue;
        }
        
        // Check if salon is open on this day
        const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'long' });
        if (!salon.businessHours.workingDays.includes(dayName)) {
          continue;
        }
        
        // Generate time slots based on business hours
        const openTime = salon.businessHours.openTime;
        const closeTime = salon.businessHours.closeTime;
        
        if (!openTime || !closeTime) {
          continue;
        }
        
        const slots = [];
        const [openHour, openMin] = openTime.split(':').map(Number);
        const [closeHour, closeMin] = closeTime.split(':').map(Number);
        
        let currentHour = openHour;
        let currentMin = openMin;
        
        while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
          const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
          slots.push(timeSlot);
          
          currentMin += 30; // 30-minute slots
          if (currentMin >= 60) {
            currentMin = 0;
            currentHour++;
          }
        }
        
        // Get existing appointments for the date
        const formattedDate = dateStr;
        const existingAppointments = await Appointment.find({
          salonId,
          appointmentDate: new RegExp(`^${formattedDate}`),
          status: { $in: ['Pending', 'Approved', 'In-Progress'] }
        });
        
        // Remove occupied slots
        // Helper function to convert time string to minutes since midnight
        const timeToMinutes = (timeString) => {
          if (!timeString) return 0;
          const [hours, minutes] = timeString.split(':').map(Number);
          return (hours * 60) + minutes;
        };

        const availableSlots = slots.filter(slot => {
          const slotMinutes = timeToMinutes(slot);
          return !existingAppointments.some(appointment => {
            const appointmentStartMinutes = timeToMinutes(appointment.appointmentTime);
            const appointmentEndMinutes = timeToMinutes(appointment.estimatedEndTime);
            // Check for time overlap: slot starts before appointment ends AND slot ends after appointment starts
            return slotMinutes < appointmentEndMinutes && (slotMinutes + 30) > appointmentStartMinutes;
          });
        });
        
        // If we found available slots, return the first one
        if (availableSlots.length > 0) {
          return {
            date: dateStr,
            time: availableSlots[0],
            day: checkDate.toLocaleDateString('en-US', { weekday: 'short' })
          };
        }
      } catch (err) {
        // Continue to next day if error occurred
        continue;
      }
    }
    
    // If no availability found, return null
    return null;
  } catch (error) {
    console.error('Error finding next availability:', error);
    // Return a default availability for demo purposes
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      date: tomorrow.toISOString().split('T')[0],
      time: '10:00',
      day: tomorrow.toLocaleDateString('en-US', { weekday: 'short' })
    };
  }
};
