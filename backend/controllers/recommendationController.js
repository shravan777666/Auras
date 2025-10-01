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
    // req.user.id should be the customer's ID directly for customer role
    if (req.user.role === 'customer' && req.user.id !== customerId) {
      return errorResponse(res, 'Access denied. You can only view your own recommendations', 403);
    }
    
    // Find the customer to verify they exist
    const customer = await Customer.findById(customerId);
    if (!customer) {
      console.log('Customer not found for ID:', customerId);
      return errorResponse(res, 'Customer not found', 404);
    }
    
    console.log('Found customer for recommendations:', customer._id);
    
    // Get active recommendations for the customer
    const recommendations = await Recommendation.getActiveForCustomer(customerId, { limit: 50 });
    
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