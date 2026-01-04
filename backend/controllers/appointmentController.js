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

// Helper function to format date to YYYY-MM-DDTHH:mm
const formatToISOString = (date) => {
  return date.toISOString().slice(0, 16);
};

// Helper function to parse appointment date and time
const parseAppointmentDateTime = (appointmentDate, appointmentTime) => {
  if (appointmentDate.includes('T')) {
    // Already in YYYY-MM-DDTHH:mm format
    return new Date(appointmentDate);
  } else {
    // Legacy format: separate date and time
    const [hours, minutes] = appointmentTime.split(':').map(Number);
    const date = new Date(appointmentDate);
    date.setHours(hours, minutes);
    return date;
  }
};

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
      specialRequests,
      pointsToRedeem,
      discountAmount
    } = req.body;

    // Validate required fields
    if (!salonId || !services || !appointmentDate || !appointmentTime) {
      return errorResponse(res, 'Missing required fields: salonId, services, appointmentDate, appointmentTime', 400);
    }

    if (!Array.isArray(services) || services.length === 0) {
      return errorResponse(res, 'At least one service must be selected', 400);
    }

    // Format appointment date to YYYY-MM-DDTHH:mm
    let formattedAppointmentDate;
    if (appointmentDate.includes('T')) {
      // Already in correct format
      formattedAppointmentDate = appointmentDate.slice(0, 16); // Ensure it's exactly YYYY-MM-DDTHH:mm
    } else {
      // Combine date and time
      formattedAppointmentDate = `${appointmentDate}T${appointmentTime}`;
    }

    // Validate appointment date - must be today or future
    const appointmentDateTimeForValidation = new Date(formattedAppointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to compare only dates
    
    const appointmentDateOnly = new Date(appointmentDateTimeForValidation);
    appointmentDateOnly.setHours(0, 0, 0, 0);
    
    if (appointmentDateOnly < today) {
      return errorResponse(res, 'Appointment date cannot be in the past. Please select today or a future date.', 400);
    }

    console.log('📅 Date validation passed:', {
      appointmentDate: formattedAppointmentDate,
      appointmentDateOnly: appointmentDateOnly.toISOString().split('T')[0],
      today: today.toISOString().split('T')[0],
      isValid: appointmentDateOnly >= today
    });

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

    // Handle loyalty points redemption
    let finalAmount = Number(totalAmount) || 0;
    let pointsRedeemed = 0;
    let discountFromPoints = 0;
    
    if (pointsToRedeem && discountAmount) {
      // Validate points redemption
      if (pointsToRedeem < 100) {
        return errorResponse(res, 'Minimum redemption is 100 points', 400);
      }
      
      if (pointsToRedeem % 100 !== 0) {
        return errorResponse(res, 'Points must be redeemed in multiples of 100', 400);
      }
      
      if (pointsToRedeem > customerProfile.loyaltyPoints) {
        return errorResponse(res, `Insufficient points. You have ${customerProfile.loyaltyPoints} points available.`, 400);
      }
      
      // Validate discount amount (100 points = ₹100 discount)
      if (discountAmount !== pointsToRedeem) {
        return errorResponse(res, 'Invalid discount amount. Points redemption value must equal points count.', 400);
      }
      
      // Check if discount exceeds total amount
      if (discountAmount > finalAmount) {
        return errorResponse(res, 'Discount amount cannot exceed service total', 400);
      }
      
      // Apply discount
      finalAmount = Math.max(0, finalAmount - discountAmount);
      pointsRedeemed = pointsToRedeem;
      discountFromPoints = discountAmount;
      
      // Update customer's loyalty points
      customerProfile.loyaltyPoints = customerProfile.loyaltyPoints - pointsToRedeem;
      customerProfile.totalPointsRedeemed = (customerProfile.totalPointsRedeemed || 0) + pointsToRedeem;
      await customerProfile.save();
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

    // Check for time conflicts including STAFF_BLOCKED appointments
    const appointmentDateTimeForConflictCheck = parseAppointmentDateTime(appointmentDate, appointmentTime);

    const conflictFilter = {
      $or: [
        { salonId },
        staffId ? { staffId } : {}
      ].filter(f => Object.keys(f).length > 0),
      appointmentDate: formattedAppointmentDate,
      status: { $in: ['Pending', 'Confirmed', 'In-Progress', 'STAFF_BLOCKED'] } // Include STAFF_BLOCKED
    };

    const conflictingAppointments = await Appointment.find(conflictFilter);

    // Helper function to convert time string to minutes since midnight
    const timeToMinutes = (timeString) => {
      if (!timeString) return 0;
      const [hours, minutes] = timeString.split(':').map(Number);
      return (hours * 60) + minutes;
    };

    // Check for conflicts using proper time comparison
    for (const existing of conflictingAppointments) {
      const existingStartMinutes = timeToMinutes(existing.appointmentTime);
      const existingEndMinutes = timeToMinutes(existing.estimatedEndTime);
      const appointmentStartMinutes = timeToMinutes(appointmentTime);
      const appointmentEndMinutes = appointmentStartMinutes + totalDuration;

      // Check if there's a time overlap
      if (appointmentStartMinutes < existingEndMinutes && existingStartMinutes < appointmentEndMinutes) {
        if (existing.status === 'STAFF_BLOCKED') {
          return errorResponse(res, `Conflict: Staff member is unavailable during this time (${existing.reason || 'Blocked Time'})`, 409);
        }
        return errorResponse(res, 'Time slot not available. Please choose a different time.', 409);
      }
    }

    // Create appointment
    const appointment = new Appointment({
      customerId,
      salonId,
      staffId,
      services: serviceDetails,
      appointmentDate: formattedAppointmentDate,
      appointmentTime,
      estimatedDuration: totalDuration,
      totalAmount: Number(totalAmount) || 0,
      finalAmount: finalAmount,
      customerNotes,
      specialRequests,
      status: 'Pending', // Will be updated to 'Confirmed' after payment
      source: 'Website',
      pointsRedeemed: pointsRedeemed,
      discountFromPoints: discountFromPoints,
      paymentStatus: 'Pending' // Payment status will be updated after payment
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
        totalAmount: finalAmount,
        ...(pointsRedeemed > 0 && {
          pointsRedeemed: pointsRedeemed,
          discountFromPoints: discountFromPoints
        })
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
    .populate('salonId', 'salonName salonAddress contactNumber')
    .populate('staffId', 'name skills')
    .populate('services.serviceId', 'name description category price duration');

  if (!appointment) {
    return notFoundResponse(res, 'Appointment');
  }

  return successResponse(res, appointment, 'Appointment details retrieved successfully');
});

// Update appointment
export const updateAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const updates = req.body;
  const userId = req.user.id;
  const userType = req.user.type;

  console.log('🔧 Update appointment request:', { appointmentId, updates, userId, userType });

  // Find appointment with proper population
  const appointment = await Appointment.findById(appointmentId)
    .populate('customerId', 'name email')
    .populate('salonId', 'salonName contactEmail')
    .populate('staffId', 'name email position')
    .populate('services.serviceId', 'name duration price');

  if (!appointment) {
    console.log('❌ Appointment not found:', appointmentId);
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
        
        // Staff assignment should not automatically update status - salon owner must approve manually
        // if (updates.staffId && appointment.status === 'Pending') {
        //   allowedUpdates.status = 'Approved';
        //   console.log('📋 Auto-updating appointment status from Pending to Approved due to staff assignment');
        // }
      }
      break;

    case 'admin':
      Object.assign(allowedUpdates, updates);
      break;
  }

  // Format appointmentDate if it's being updated
  if (updates.appointmentDate && updates.appointmentTime) {
    if (updates.appointmentDate.includes('T')) {
      allowedUpdates.appointmentDate = updates.appointmentDate.slice(0, 16);
    } else {
      allowedUpdates.appointmentDate = `${updates.appointmentDate}T${updates.appointmentTime}`;
    }
  }

  // Ensure existing appointmentDate is in correct format before saving
  // This is important when we're just updating other fields like staffId
  const ensureCorrectDateFormat = (dateString) => {
    if (!dateString) return dateString;
    
    // If it's already in the correct format, return as is
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Handle different date formats
    try {
      let date;
      
      // If it's a JavaScript Date object
      if (dateString instanceof Date) {
        date = dateString;
      }
      // If it's in YYYY-MM-DD format (just date)
      else if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        // Combine with appointment time if available
        const time = appointment.appointmentTime || '00:00';
        return `${dateString}T${time}`;
      }
      // If it's in ISO format with seconds/milliseconds, truncate
      else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(dateString)) {
        return dateString.slice(0, 16);
      }
      // Try to parse as Date
      else {
        date = new Date(dateString);
      }
      
      if (date && !isNaN(date.getTime())) {
        return date.toISOString().slice(0, 16);
      }
    } catch (e) {
      console.warn('Date format conversion failed:', e.message, 'for date:', dateString);
    }
    
    return dateString;
  };

  // Ensure the existing appointmentDate is in correct format
  appointment.appointmentDate = ensureCorrectDateFormat(appointment.appointmentDate);

  console.log('🔄 Applying updates to appointment:', allowedUpdates);
  Object.assign(appointment, allowedUpdates);
  await appointment.save();
  console.log('✅ Appointment updated successfully:', { id: appointment._id, staffId: appointment.staffId });

  // Check if staff was assigned and send email notification to customer
  if (updates.staffId !== undefined && appointment.customerId && appointment.customerId.email) {
    try {
      // Import the email utility function
      const { sendAppointmentStaffAssignmentEmail } = await import('../utils/email.js');
      
      // Prepare appointment details for email
      const appointmentDetails = {
        salonName: appointment.salonId?.salonName || 'Your Salon',
        staffName: appointment.staffId?.name || 'Staff Member',
        staffPosition: appointment.staffId?.position || 'Staff',
        date: new Date(appointment.appointmentDate).toDateString(),
        time: appointment.appointmentTime,
        services: appointment.services.map(s => s.serviceId?.name || 'Service'),
        status: appointment.status
      };
      
      // Send email notification to customer
      await sendAppointmentStaffAssignmentEmail(
        appointment.customerId.email,
        appointment.customerId.name || 'Customer',
        appointmentDetails
      );
      
      console.log('📧 Appointment staff assignment email sent to customer:', appointment.customerId.email);
    } catch (emailError) {
      console.error('❌ Error sending appointment staff assignment email:', emailError);
    }
  }

  // Populate the updated appointment with staff and customer data
  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate('staffId', 'name email position')
    .populate('customerId', 'name email phone')
    .populate('salonId', 'salonName')
    .populate('services.serviceId', 'name duration price');

  return successResponse(res, populatedAppointment, 'Appointment updated successfully');
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

  // Format date for query
  const formattedDate = formatToISOString(requestedDate).slice(0, 10); // Get YYYY-MM-DD part

  // Get existing appointments for the date
  const existingAppointments = await Appointment.find({
    salonId,
    appointmentDate: new RegExp(`^${formattedDate}`), // Match appointments starting with this date
    status: { $in: ['Pending', 'Approved', 'In-Progress', 'STAFF_BLOCKED'] },
    ...(staffId && { staffId })
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

// Reschedule appointment
export const rescheduleAppointment = asyncHandler(async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { newDateTime, newStaffId, newStatus, notes } = req.body;
    const salonOwnerId = req.user.id;

    console.log('Rescheduling appointment:', {
      appointmentId,
      newDateTime,
      newStaffId,
      newStatus,
      notes,
      salonOwnerId
    });

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('staffId', 'name')
      .populate('customerId', 'name email')
      .populate('salonId', 'salonName')
      .populate('services.serviceId', 'name category'); // Add category to services population

    console.log('Debug - Appointment for rescheduling:', {
      id: appointment._id,
      services: appointment.services,
      servicesType: typeof appointment.services,
      servicesLength: appointment.services?.length
    });

    if (!appointment) {
      return notFoundResponse(res, 'Appointment');
    }

    // Check if salon owner has permission to reschedule this appointment
    console.log('Debug - Permission check:');
    console.log('Debug - appointment.salonId:', appointment.salonId);
    const salon = await Salon.findById(appointment.salonId);
    console.log('Debug - Found salon for permission check:', salon);
    console.log('Debug - salon._id:', salon?._id);
    console.log('Debug - salon.ownerId:', salon?.ownerId);
    console.log('Debug - salonOwnerId (authenticated user):', salonOwnerId);
    if (!salon || salon.ownerId.toString() !== salonOwnerId) {
      console.log('Debug - Permission denied');
      return errorResponse(res, 'You do not have permission to reschedule this appointment', 403);
    }
    console.log('Debug - Permission granted');

    // Validate staff availability if staff is being changed
    if (newStaffId && newStaffId !== appointment.staffId?._id.toString()) {
      const newStaff = await Staff.findById(newStaffId);
      if (!newStaff) {
        return errorResponse(res, 'New staff member not found', 400);
      }

      // Debug logging to help identify the issue
      console.log('Staff validation debug info:', {
        newStaffId,
        newStaffAssignedSalon: newStaff.assignedSalon,
        appointmentSalonId: appointment.salonId,
        newStaffAssignedSalonType: typeof newStaff.assignedSalon,
        appointmentSalonIdType: typeof appointment.salonId
      });

      // Check if new staff belongs to the same salon
      // The staff.assignedSalon is set to the salon document's ID
      // The appointment.salonId is also the salon document's ID
      // These should be the same for valid staff assignment
      
      const staffAssignedSalonId = newStaff.assignedSalon;
      
      // Extract appointment salon ID correctly regardless of whether it's populated or not
      let appointmentSalonId;
      if (appointment.salonId && typeof appointment.salonId === 'object' && appointment.salonId._id) {
        // It's a populated object
        appointmentSalonId = appointment.salonId._id;
      } else {
        // It's an ObjectId or string
        appointmentSalonId = appointment.salonId;
      }
      
      // If staff is not assigned to any salon
      if (!staffAssignedSalonId) {
        return errorResponse(res, 'Selected staff member does not belong to this salon', 400);
      }
      
      // Compare the salon document IDs directly - they should be the same
      if (staffAssignedSalonId.toString() !== appointmentSalonId.toString()) {
        return errorResponse(res, 'Selected staff member does not belong to this salon', 400);
      }

      // Check for time conflicts for new staff
      const conflictFilter = {
        staffId: newStaffId,
        appointmentDate: newDateTime,
        status: { $in: ['Pending', 'Approved', 'In-Progress', 'STAFF_BLOCKED'] },
        _id: { $ne: appointmentId } // Exclude current appointment
      };

      const conflictingAppointments = await Appointment.find(conflictFilter);
      
      if (conflictingAppointments.length > 0) {
        return errorResponse(res, 'New staff member is not available at the selected time', 409);
      }
    }

    // Update appointment fields
    const updates = {};
    
    if (newDateTime) {
      updates.appointmentDate = newDateTime;
    }
    
    if (newStaffId) {
      updates.staffId = newStaffId;
    }
    
    if (newStatus) {
      updates.status = newStatus;
    }
    
    // Add rescheduling notes
    if (notes) {
      const timestamp = new Date().toISOString();
      const rescheduleNote = `\n[Rescheduled on ${timestamp}] ${notes}`;
      updates.salonNotes = appointment.salonNotes 
        ? `${appointment.salonNotes}${rescheduleNote}` 
        : rescheduleNote;
    }

    // Apply updates
    Object.assign(appointment, updates);
    await appointment.save();

    // Populate the updated appointment
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('staffId', 'name email position')
      .populate('customerId', 'name email phone')
      .populate('salonId', 'salonName')
      .populate('services.serviceId', 'name duration price');

    return successResponse(res, populatedAppointment, 'Appointment rescheduled successfully');
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return errorResponse(res, `Failed to reschedule appointment: ${error.message}`, 500);
  }
});

// Block time slot for staff
export const blockTimeSlot = asyncHandler(async (req, res) => {
  const { staffId, salonId, appointmentDate, appointmentTime, estimatedDuration, reason } = req.body;

  if (!staffId || !salonId || !appointmentDate || !appointmentTime || !estimatedDuration) {
    return errorResponse(res, 'Missing required fields', 400);
  }

  const appointment = new Appointment({
    salonId,
    staffId,
    appointmentDate,
    appointmentTime,
    estimatedDuration,
    reason,
    status: 'STAFF_BLOCKED',
    // Add a dummy customerId to satisfy the model requirement
    customerId: '000000000000000000000000',
    services: [],
  });

  await appointment.save();

  return successResponse(res, appointment, 'Time slot blocked successfully', 201);
});

export const checkInAppointment = asyncHandler(async (req, res) => {
  try {
    const { salonId } = req.body;
    const customerId = req.user.id;
    
    if (!salonId) {
      return errorResponse(res, 'Salon ID is required', 400);
    }
    
    // Find appointments for this customer at this salon that are approved and upcoming
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const appointment = await Appointment.findOne({
      customerId,
      salonId,
      status: 'Approved', // Only allow check-in for approved appointments
      appointmentDate: { $gte: today.toISOString().split('T')[0] }, // Only today or future appointments
    }).sort({ appointmentDate: 1, appointmentTime: 1 });
    
    if (!appointment) {
      return errorResponse(res, 'No upcoming appointments found at this salon', 404);
    }
    
    // Check if appointment is today
    const appointmentDate = new Date(appointment.appointmentDate);
    const isToday = appointmentDate.toDateString() === new Date().toDateString();
    
    if (!isToday) {
      return errorResponse(res, 'Appointment is not scheduled for today', 400);
    }
    
    // Update appointment status to 'In-Progress' or add an 'arrived' status if we want to track arrival separately
    // For now, we'll add a checkInTime field to track when customer arrived
    appointment.checkInTime = new Date();
    appointment.status = 'In-Progress'; // Or we could add a new 'arrived' status
    
    await appointment.save();
    
    return successResponse(res, {
      appointment: appointment,
      message: 'Successfully checked in for appointment'
    }, 'Successfully checked in for appointment');
    
  } catch (error) {
    console.error('Error checking in appointment:', error);
    return errorResponse(res, 'Server error while checking in appointment', 500);
  }
});

export default {
  bookAppointment,
  getAppointmentDetails,
  updateAppointment,
  getAvailableSlots,
  getAppointmentsSummary,
  submitReview,
  blockTimeSlot,
  rescheduleAppointment,
  checkInAppointment
};