import { successResponse, errorResponse } from '../utils/responses.js';
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import Customer from '../models/Customer.js';
import Salon from '../models/Salon.js';
import User from '../models/User.js';

// Rule-based recommendation logic
// If a client's last service was "Haircut," suggest "Spa Package"
// If "Massage," suggest "Facial"
// If no history, return an empty list
const getRecommendation = (lastService) => {
  if (!lastService) return [];
  
  switch (lastService) {
    case 'Haircut':
      return ['Spa Package'];
    case 'Massage':
      return ['Facial'];
    case 'Facial':
      return ['Haircut'];
    case 'Spa Package':
      return ['Massage'];
    default:
      return []; // Return empty list for unknown services
  }
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
          lastService: appointment.services.length > 0 ? appointment.services[0].serviceName : null,
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
          lastService: appointment.services.length > 0 ? appointment.services[0].serviceName : null,
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
      lastService = recentAppointment.services[0].serviceName;
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
    
    // In a real implementation, this would send an email or notification
    console.log(`Sending recommendations to ${customer.name} (${customer.email}):`, recommendations);
    
    return successResponse(res, {
      clientId,
      message: `Recommendations sent to ${customer.name}`
    }, 'Recommendations sent successfully');
  } catch (error) {
    console.error('Error sending recommendations:', error);
    return errorResponse(res, 'Failed to send recommendations: ' + error.message, 500);
  }
};