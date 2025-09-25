import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import Salon from '../models/Salon.js';
import Staff from '../models/Staff.js';
import Customer from '../models/Customer.js';
import { sendAppointmentConfirmation } from '../utils/email.js';
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';

// Book new appointment
export const bookAppointment = asyncHandler(async (req, res) => {
  try {
    console.log('Booking appointment request:', req.body);
    console.log('User:', req.user);
    
    const userId = req.user.id;

    // Find customer profile
    const customerProfile = await Customer.findById(userId);
    if (!customerProfile) {
      return errorResponse(res, 'Customer profile not found', 404);
    }
    const customerId = customerProfile._id;
    const {
      salonId,
      services,
      appointmentDate,
      appointmentTime,
      staffId,
      customerNotes,
      specialRequests
    } = req.body;

    // Validate required fields
    if (!salonId || !services || !appointmentDate || !appointmentTime) {
      return errorResponse(res, 'Missing required fields: salonId, services, appointmentDate, appointmentTime', 400);
    }

    if (!Array.isArray(services) || services.length === 0) {
      return errorResponse(res, 'At least one service must be selected', 400);
    }

  // Verify salon exists and is active
  const salon = await Salon.findOne({ _id: salonId, isActive: true });
  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }

  // Verify services exist and belong to the salon
  const serviceIds = services.map(s => s.serviceId);
  const serviceRecords = await Service.find({
    _id: { $in: serviceIds },
    salonId,
    isActive: true
  });

  if (serviceRecords.length !== services.length) {
    return errorResponse(res, 'Some services not found or not available', 400);
  }

  // Calculate total duration and amount
  let totalDuration = 0;
  let totalAmount = 0;
  const serviceDetails = [];

  for (const service of services) {
    const serviceRecord = serviceRecords.find(s => s._id.toString() === service.serviceId);
    const durationMinutes = Number(serviceRecord.duration) || 0;
    const unitPrice = (
      serviceRecord.discountedPrice !== undefined && serviceRecord.discountedPrice !== null
        ? Number(serviceRecord.discountedPrice)
        : Number(serviceRecord.price)
    ) || 0;

    totalDuration += durationMinutes;
    totalAmount += unitPrice;

    serviceDetails.push({
      serviceId: service.serviceId,
      serviceName: serviceRecord.name,
      price: unitPrice,
      duration: durationMinutes
    });
  }

  // Verify staff availability if specified
  if (staffId) {
    const staff = await Staff.findOne({
      _id: staffId,
      assignedSalon: salonId,
      isActive: true
    });

    if (!staff) {
      return errorResponse(res, 'Selected staff member not found or not available', 400);
    }

    // Check if staff has required skills
    const requiredSkills = serviceRecords.map(s => s.category);
    const hasRequiredSkills = requiredSkills.some(skill => 
      staff.skills.includes(skill) || staff.skills.includes('All')
    );

    if (!hasRequiredSkills) {
      return errorResponse(res, 'Selected staff member does not have required skills for these services', 400);
    }
  }

  // Check for time conflicts
  const appointmentDateTime = new Date(appointmentDate);
  const [hours, minutes] = appointmentTime.split(':').map(Number);
  appointmentDateTime.setHours(hours, minutes);

  const conflictFilter = {
    $or: [
      { salonId },
      staffId ? { staffId } : {}
    ].filter(f => Object.keys(f).length > 0),
    appointmentDate: new Date(appointmentDate),
    status: { $in: ['Pending', 'Confirmed', 'In-Progress'] }
  };

  const conflictingAppointments = await Appointment.find(conflictFilter);

  for (const existing of conflictingAppointments) {
    const existingStart = existing.appointmentTime;
    const existingEnd = existing.estimatedEndTime;

    if (appointmentTime >= existingStart && appointmentTime < existingEnd) {
      return errorResponse(res, 'Time slot not available. Please choose a different time.', 409);
    }
  }

  // Create appointment
  const appointment = new Appointment({
    customerId,
    salonId,
    staffId,
    services: serviceDetails,
    appointmentDate: new Date(appointmentDate),
    appointmentTime,
    estimatedDuration: totalDuration,
    totalAmount: Number(totalAmount) || 0,
    finalAmount: Number(totalAmount) || 0,
    customerNotes,
    specialRequests,
    status: 'Pending',
    source: 'Website'
  });

  await appointment.save();

  // Update customer booking stats
  const customerToUpdate = await Customer.findById(customerId);
  if (customerToUpdate) {
    customerToUpdate.totalBookings = (customerToUpdate.totalBookings || 0) + 1;
    await customerToUpdate.save();
  }

  // Check if it's first visit to this salon
  const previousBookings = await Appointment.countDocuments({
    customerId,
    salonId,
    _id: { $ne: appointment._id }
  });

  if (previousBookings === 0) {
    appointment.isFirstVisit = true;
    await appointment.save();
  }

  // Send confirmation email (optional - don't fail if email fails)
  try {
    const appointmentDetails = {
      salonName: salon.salonName,
      date: appointmentDate,
      time: appointmentTime,
      services: serviceDetails.map(s => s.serviceName),
      totalAmount
    };

    await sendAppointmentConfirmation(
      customerProfile.email,
      customerProfile.name,
      appointmentDetails
    );
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
    // Don't fail the appointment booking if email fails
  }

  // Populate appointment for response
  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('salonId', 'salonName salonAddress contactNumber')
    .populate('staffId', 'name skills')
    .populate('services.serviceId', 'name category');

    return successResponse(res, populatedAppointment, 'Appointment booked successfully! Confirmation email sent.', 201);
  } catch (error) {
    console.error('Error booking appointment:', error);
    return errorResponse(res, `Failed to book appointment: ${error.message}`, 500);
  }
});

// Get appointment details
export const getAppointmentDetails = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.id;
  const userType = req.user.type;

  let filter = { _id: appointmentId };

  // Add user-specific filters
  switch (userType) {
    case 'customer':
      filter.customerId = userId;
      break;
    case 'salon':
      filter.salonId = userId;
      break;
    case 'staff':
      // For staff users, we need to resolve the staff ID from the user ID
      const Staff = (await import('../models/Staff.js')).default;
      const staff = await Staff.findOne({ user: userId });
      if (!staff) {
        return errorResponse(res, 'Staff profile not found', 404);
      }
      filter.staffId = staff._id;
      break;
    // Admin can access all appointments
  }

  const appointment = await Appointment.findOne(filter)
    .populate('customerId', 'name email')
    .populate('salonId', 'salonName salonAddress contactNumber businessHours')
    .populate('staffId', 'name skills contactNumber')
    .populate('services.serviceId', 'name description category price duration');

  if (!appointment) {
    return notFoundResponse(res, 'Appointment');
  }

  return successResponse(res, appointment, 'Appointment details retrieved successfully');
});

// Update appointment
export const updateAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const userId = req.user.id;
  const userType = req.user.type;
  const updates = req.body;

  let filter = { _id: appointmentId };

  // Add user-specific filters
  switch (userType) {
    case 'customer':
      filter.customerId = userId;
      break;
    case 'salon':
      // For salon users, we need to resolve the salon ID from the user ID
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(userId);
      if (!user || user.type !== 'salon') {
        return errorResponse(res, 'Access denied: Only salon owners can update appointments', 403);
      }
      const salonProfile = await Salon.findOne({ email: user.email });
      if (!salonProfile) {
        return notFoundResponse(res, 'Salon profile');
      }
      filter.salonId = salonProfile._id;
      
      console.log('🔧 Salon appointment update request:', {
        userId,
        salonId: salonProfile._id,
        appointmentId,
        updates
      });
      break;
    case 'staff':
      // For staff users, we need to resolve the staff ID from the user ID
      const StaffForUpdate = (await import('../models/Staff.js')).default;
      const staffForUpdate = await StaffForUpdate.findOne({ user: userId });
      if (!staffForUpdate) {
        return errorResponse(res, 'Staff profile not found', 404);
      }
      filter.staffId = staffForUpdate._id;
      break;
  }

  console.log('🔧 Searching for appointment with filter:', filter);
  
  const appointment = await Appointment.findOne(filter);
  if (!appointment) {
    console.log('🔧 Appointment not found with filter:', filter);
    return notFoundResponse(res, 'Appointment');
  }
  
  console.log('🔧 Found appointment:', appointment._id);

  // Restrict what each user type can update
  const allowedUpdates = {};

  switch (userType) {
    case 'customer':
      if (appointment.status === 'Pending') {
        if (updates.customerNotes) allowedUpdates.customerNotes = updates.customerNotes;
        if (updates.specialRequests) allowedUpdates.specialRequests = updates.specialRequests;
      }
      break;

    case 'salon':
    case 'staff':
      if (updates.status) allowedUpdates.status = updates.status;
      if (updates.salonNotes) allowedUpdates.salonNotes = updates.salonNotes;
      if (updates.staffNotes) allowedUpdates.staffNotes = updates.staffNotes;
      if (updates.staffId !== undefined) {
        allowedUpdates.staffId = updates.staffId;
        console.log('👥 Updating staff assignment:', { appointmentId, oldStaffId: appointment.staffId, newStaffId: updates.staffId });
      }
      break;

    case 'admin':
      Object.assign(allowedUpdates, updates);
      break;
  }

  console.log('🔄 Applying updates to appointment:', allowedUpdates);
  Object.assign(appointment, allowedUpdates);
  await appointment.save();
  console.log('✅ Appointment updated successfully:', { id: appointment._id, staffId: appointment.staffId });

  return successResponse(res, appointment, 'Appointment updated successfully');
});

// Get available time slots
export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { salonId, date, staffId } = req.query;

  if (!salonId || !date) {
    return errorResponse(res, 'Salon ID and date are required', 400);
  }

  // Get salon business hours
  const salon = await Salon.findById(salonId);
  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }

  const requestedDate = new Date(date);
  const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });

  if (!salon.businessHours.workingDays.includes(dayName)) {
    return successResponse(res, [], 'Salon is closed on this day');
  }

  // Generate time slots based on business hours
  const openTime = salon.businessHours.openTime;
  const closeTime = salon.businessHours.closeTime;

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
  const existingAppointments = await Appointment.find({
    salonId,
    appointmentDate: new Date(date),
    status: { $in: ['Pending', 'Confirmed', 'In-Progress'] },
    ...(staffId && { staffId })
  });

  // Remove occupied slots
  const availableSlots = slots.filter(slot => {
    return !existingAppointments.some(appointment => {
      return slot >= appointment.appointmentTime && slot < appointment.estimatedEndTime;
    });
  });

  return successResponse(res, availableSlots, 'Available time slots retrieved successfully');
});

// Get appointments summary
export const getAppointmentsSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.type;

  let matchFilter = {};

  switch (userType) {
    case 'customer':
      matchFilter.customerId = userId;
      break;
    case 'salon':
      matchFilter.salonId = userId;
      break;
    case 'staff':
      // For staff users, we need to resolve the staff ID from the user ID
      const StaffForSummary = (await import('../models/Staff.js')).default;
      const staffForSummary = await StaffForSummary.findOne({ user: userId });
      if (!staffForSummary) {
        return errorResponse(res, 'Staff profile not found', 404);
      }
      matchFilter.staffId = staffForSummary._id;
      break;
  }

  const summary = await Appointment.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$finalAmount' }
      }
    }
  ]);

  const formattedSummary = {
    pending: 0,
    confirmed: 0,
    'in-progress': 0,
    completed: 0,
    cancelled: 0,
    'no-show': 0,
    totalRevenue: 0
  };

  summary.forEach(item => {
    const status = item._id.toLowerCase().replace('-', '-');
    formattedSummary[status] = item.count;
    if (item._id === 'Completed') {
      formattedSummary.totalRevenue = item.totalAmount;
    }
  });

  return successResponse(res, formattedSummary, 'Appointments summary retrieved successfully');
});

export const submitReview = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { rating, feedback } = req.body;
  const userId = req.user.id;

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    customerId: userId,
  });

  if (!appointment) {
    return notFoundResponse(res, 'Appointment');
  }

  if (appointment.status !== 'Completed') {
    return errorResponse(res, 'You can only review completed appointments.', 400);
  }

  if (appointment.rating && appointment.rating.overall) {
    return errorResponse(res, 'You have already reviewed this appointment.', 400);
  }

  appointment.rating = rating;
  appointment.feedback = feedback;

  await appointment.save();

  return successResponse(res, appointment, 'Review submitted successfully');
});

export default {
  bookAppointment,
  getAppointmentDetails,
  updateAppointment,
  getAvailableSlots,
  getAppointmentsSummary,
  submitReview,
};