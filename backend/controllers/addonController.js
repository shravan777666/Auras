import Appointment from '../models/Appointment.js';
import Staff from '../models/Staff.js';
import SalonSettings from '../models/SalonSettings.js';
import Customer from '../models/Customer.js';
import Service from '../models/Service.js';
import AddonSales from '../models/AddonSales.js';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';
import { v4 as uuidv4 } from 'uuid';

// Helper function to convert time string to minutes since midnight
const timeToMinutes = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper function to convert minutes since midnight to time string
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Detect idle time slots for staff
export const detectIdleSlots = asyncHandler(async (req, res) => {
  try {
    const { salonId, date, staffId } = req.query;
    
    if (!salonId || !date) {
      return errorResponse(res, 'Salon ID and date are required', 400);
    }
    
    // Get salon settings
    let settings = await SalonSettings.findOne({ salonId });
    if (!settings) {
      // Create default settings if they don't exist
      settings = new SalonSettings({ salonId });
      await settings.save();
    }
    
    // Get all appointments for the salon on the specified date
    const appointments = await Appointment.find({
      salonId,
      appointmentDate: new RegExp(`^${date}`), // Match appointments starting with this date
      status: { $in: ['Pending', 'Approved', 'In-Progress'] }
    }).sort({ appointmentTime: 1 });
    
    // Group appointments by staff
    const staffAppointments = {};
    appointments.forEach(appointment => {
      const staff = appointment.staffId || 'unassigned';
      if (!staffAppointments[staff]) {
        staffAppointments[staff] = [];
      }
      staffAppointments[staff].push(appointment);
    });
    
    // Find idle slots for each staff member
    const idleSlots = [];
    
    // If a specific staff member is requested, only check that staff
    const staffIds = staffId ? [staffId] : Object.keys(staffAppointments);
    
    for (const id of staffIds) {
      const appointmentsForStaff = staffAppointments[id] || [];
      
      // Sort appointments by time
      appointmentsForStaff.sort((a, b) => timeToMinutes(a.appointmentTime) - timeToMinutes(b.appointmentTime));
      
      // Check gaps between appointments
      for (let i = 0; i < appointmentsForStaff.length - 1; i++) {
        const currentAppointment = appointmentsForStaff[i];
        const nextAppointment = appointmentsForStaff[i + 1];
        
        const currentEndMinutes = timeToMinutes(currentAppointment.appointmentTime) + currentAppointment.estimatedDuration;
        const nextStartMinutes = timeToMinutes(nextAppointment.appointmentTime);
        
        const gapSize = nextStartMinutes - currentEndMinutes;
        
        // Check if gap is within the configured range
        if (gapSize >= settings.minGapForOffer && gapSize <= settings.maxGapForOffer) {
          idleSlots.push({
            staffId: id,
            gapStart: minutesToTime(currentEndMinutes),
            gapEnd: minutesToTime(nextStartMinutes),
            gapSize: gapSize,
            appointmentBefore: currentAppointment._id,
            appointmentAfter: nextAppointment._id
          });
        }
      }
    }
    
    return successResponse(res, idleSlots, 'Idle slots detected successfully');
  } catch (error) {
    console.error('Error detecting idle slots:', error);
    return errorResponse(res, 'Failed to detect idle slots', 500);
  }
});

// Get customer history for add-on prediction
export const getCustomerHistory = asyncHandler(async (req, res) => {
  try {
    const { customerId, salonId } = req.query;
    
    if (!customerId || !salonId) {
      return errorResponse(res, 'Customer ID and Salon ID are required', 400);
    }
    
    // Get customer profile
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return notFoundResponse(res, 'Customer');
    }
    
    // Count total appointments for this customer at this salon
    const totalAppointments = await Appointment.countDocuments({
      customerId,
      salonId,
      status: 'Completed'
    });
    
    // Check if customer has previous add-on purchases
    // This would require tracking add-on purchases in the database
    const hasAddonHistory = await Appointment.countDocuments({
      customerId,
      salonId,
      status: 'Completed',
      services: { $exists: true, $not: { $size: 1 } } // Services array exists and not equal to 1 service means multiple services (add-on)
    });
    
    const customerData = {
      customerLoyalty: totalAppointments,
      pastAddOnHistory: hasAddonHistory > 0 ? 1 : 0
    };
    
    return successResponse(res, customerData, 'Customer history retrieved successfully');
  } catch (error) {
    console.error('Error getting customer history:', error);
    return errorResponse(res, 'Failed to retrieve customer history', 500);
  }
});

// Predict add-on acceptance using ML service
export const predictAddonAcceptance = asyncHandler(async (req, res) => {
  try {
    const { 
      timeGapSize, 
      customerId, 
      salonId, 
      dayOfWeek 
    } = req.body;
    
    if (!timeGapSize || !customerId || !salonId || dayOfWeek === undefined) {
      return errorResponse(res, 'Missing required fields: timeGapSize, customerId, salonId, dayOfWeek', 400);
    }
    
    // Get salon settings for discount rate
    let settings = await SalonSettings.findOne({ salonId });
    if (!settings) {
      // Create default settings if they don't exist
      settings = new SalonSettings({ salonId });
      await settings.save();
    }
    
    // Get customer history
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return notFoundResponse(res, 'Customer');
    }
    
    // Count total appointments for this customer at this salon
    const totalAppointments = await Appointment.countDocuments({
      customerId,
      salonId,
      status: 'Completed'
    });
    
    // Check if customer has previous add-on purchases
    const hasAddonHistory = await Appointment.countDocuments({
      customerId,
      salonId,
      status: 'Completed',
      services: { $exists: true, $not: { $size: 1 } } // Services array exists and not equal to 1 service means multiple services (add-on)
    });
    
    // Prepare data for ML prediction
    const predictionData = {
      time_gap_size: timeGapSize,
      discount_offered: settings.dynamicAddonDiscount,
      customer_loyalty: totalAppointments,
      past_add_on_history: hasAddonHistory > 0 ? 1 : 0,
      day_of_week: dayOfWeek
    };
    
    // In a real implementation, we would call the ML service
    // For now, we'll simulate a prediction
    // In production, you would make an HTTP request to the ML service:
    /*
    const mlResponse = await fetch('http://localhost:5001/predict-addon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(predictionData)
    });
    
    const mlResult = await mlResponse.json();
    */
    
    // Simulate ML prediction (in a real scenario, this would come from the ML service)
    // Simple logic: higher loyalty and gap size increase acceptance probability
    const loyaltyFactor = Math.min(totalAppointments / 10, 1); // Normalize to 0-1
    const gapFactor = Math.min(timeGapSize / 120, 1); // Normalize to 0-1
    const discountFactor = settings.dynamicAddonDiscount;
    const historyFactor = hasAddonHistory > 0 ? 1 : 0.5;
    
    // Calculate probability (0-1)
    const probability = (loyaltyFactor * 0.3 + gapFactor * 0.2 + discountFactor * 0.3 + historyFactor * 0.2);
    const prediction = probability > 0.5 ? 1 : 0;
    
    const result = {
      prediction,
      probability: Math.round(probability * 100) / 100,
      message: prediction === 1 
        ? "Add-on offer is likely to be accepted" 
        : "Add-on offer is likely to be rejected"
    };
    
    return successResponse(res, result, 'Add-on acceptance prediction generated successfully');
  } catch (error) {
    console.error('Error predicting add-on acceptance:', error);
    return errorResponse(res, 'Failed to predict add-on acceptance', 500);
  }
});

// Calculate commission and split revenue
export const calculateCommission = asyncHandler(async (req, res) => {
  try {
    const { 
      serviceName,
      basePrice,
      salonId,
      staffId,
      customerId,
      appointmentId
    } = req.body;
    
    if (!serviceName || !basePrice || !salonId || !staffId || !customerId || !appointmentId) {
      return errorResponse(res, 'Missing required fields: serviceName, basePrice, salonId, staffId, customerId, appointmentId', 400);
    }
    
    // Get salon settings for commission rate
    let settings = await SalonSettings.findOne({ salonId });
    if (!settings) {
      // Create default settings if they don't exist
      settings = new SalonSettings({ salonId });
      await settings.save();
    }
    
    // Calculate discounted price
    const discountedPrice = basePrice * (1 - settings.dynamicAddonDiscount);
    
    // Calculate commission and earnings
    const adminCommissionAmount = discountedPrice * settings.adminCommissionRate;
    const salonEarning = discountedPrice - adminCommissionAmount;
    
    // Create add-on sale record
    const saleId = `addon_${uuidv4()}`;
    const addonSale = new AddonSales({
      saleId,
      salonId,
      staffId,
      customerId,
      appointmentId,
      serviceName,
      basePrice,
      discountedPrice,
      adminCommissionAmount,
      salonEarning
    });
    
    await addonSale.save();
    
    const result = {
      saleId,
      serviceName,
      basePrice,
      discountedPrice,
      adminCommissionAmount,
      salonEarning,
      commissionRate: settings.adminCommissionRate,
      discountRate: settings.dynamicAddonDiscount
    };
    
    return successResponse(res, result, 'Commission calculated and sale recorded successfully');
  } catch (error) {
    console.error('Error calculating commission:', error);
    return errorResponse(res, 'Failed to calculate commission', 500);
  }
});

export default {
  detectIdleSlots,
  getCustomerHistory,
  predictAddonAcceptance,
  calculateCommission
};