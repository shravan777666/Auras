import Customer from '../models/Customer.js';
import fs from 'fs';
import path from 'path';
import Salon from '../models/Salon.js';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import CancellationPolicy from '../models/CancellationPolicy.js';
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';

// Helper function to get the server base URL from the current request
const getRequestBaseUrl = (req) => {
  try {
    // Prefer explicit BASE_URL when provided
    if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/$/, '');
    const protocol = (req && req.protocol) ? req.protocol : 'http';
    const host = (req && req.get) ? req.get('host') : undefined;
    if (host) return `${protocol}://${host}`;
  } catch (e) {
    // fallthrough
  }
  // Final fallback to localhost using the actual running port if provided
  return `http://localhost:${process.env.PORT || 5011}`;
};

// Helper function to convert file path to full URL
const getFileUrl = (filePath, req) => {
  if (!filePath) return null;

  // Normalize path separators
  const normalizedPath = String(filePath).replace(/\\/g, '/');

  // Compute base URL from request or env
  const baseUrl = getRequestBaseUrl(req);

  // Ensure leading slash for path part
  const pathWithSlash = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;

  // Construct the full URL
  const fullUrl = `${baseUrl}${pathWithSlash}`;

  return fullUrl;
};

// Helper function to convert documents object with file paths to URLs
const convertDocumentsToUrls = (documents, req) => {
  if (!documents) return {};
  
  const converted = {};
  
  // Handle businessLicense
  if (documents.businessLicense) {
    converted.businessLicense = getFileUrl(documents.businessLicense, req);
  }
  
  // Handle salonLogo
  if (documents.salonLogo) {
    converted.salonLogo = getFileUrl(documents.salonLogo, req);
  }
  
  // Handle salonImages array
  if (documents.salonImages && Array.isArray(documents.salonImages)) {
    converted.salonImages = documents.salonImages.map(imagePath => getFileUrl(imagePath, req));
  }
  
  // Handle profileImage (for staff)
  if (documents.profileImage) {
    converted.profileImage = getFileUrl(documents.profileImage, req);
  }
  
  return converted;
};

// Get customer dashboard
export const getDashboard = asyncHandler(async (req, res) => {
  const customerId = req.user?.id;
  try {
    if (!customerId) {
      return successResponse(res, {
        customerInfo: null,
        statistics: { totalBookings: 0, upcomingBookings: 0, completedBookings: 0 },
        favoriteServices: [],
        recentBookings: []
      }, 'No customer ID in token; returning empty dashboard');
    }

    const customerInfo = await Customer.findById(customerId).lean();

    const [
      totalBookings,
      upcomingBookings,
      completedBookings,
      favoriteServices,
      recentBookings
    ] = await Promise.all([
      Appointment.countDocuments({ customerId }),
      Appointment.countDocuments({ 
        customerId,
        status: { $in: ['Pending', 'Confirmed'] },
        appointmentDate: { $gte: new Date() }
      }),
      Appointment.countDocuments({ customerId, status: 'Completed' }),
      Service.find({ 
        _id: { $in: (customerInfo?.preferences?.favoriteServices || []).filter(Boolean) }
      }).select('name category').limit(5).lean(),
      Appointment.find({ customerId })
        .populate('salonId', 'salonName')
        .populate('services.serviceId', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    return successResponse(res, {
      customerInfo,
      statistics: {
        totalBookings: Number(totalBookings) || 0,
        upcomingBookings: Number(upcomingBookings) || 0,
        completedBookings: Number(completedBookings) || 0
      },
      favoriteServices: Array.isArray(favoriteServices) ? favoriteServices : [],
      recentBookings: Array.isArray(recentBookings) ? recentBookings : []
    }, 'Dashboard data retrieved successfully');
  } catch (error) {
    console.error('Customer dashboard error:', { error: error?.message, stack: error?.stack, user: req.user });
    return successResponse(res, {
      customerInfo: null,
      statistics: { totalBookings: 0, upcomingBookings: 0, completedBookings: 0 },
      favoriteServices: [],
      recentBookings: []
    }, 'Dashboard data fallback due to server error');
  }
});

// Get customer profile
export const getProfile = asyncHandler(async (req, res) => {
  const customerId = req.user.id;

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
    return notFoundResponse(res, 'Customer profile');
  }

  // Convert profile picture path to URL if it exists
  const responseData = {
    ...customer.toObject(),
    profilePic: customer.profilePic ? getFileUrl(customer.profilePic, req) : null,
  };

  return successResponse(res, responseData, 'Profile retrieved successfully');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const updates = req.body;
  console.log('[customerController.updateProfile] Start', {
    customerId,
    hasFile: !!req.file,
    baseUrl: req.baseUrl,
  });

  // Handle address object if it comes as a stringified JSON
  if (updates.address && typeof updates.address === 'string') {
    try {
      updates.address = JSON.parse(updates.address);
    } catch (error) {
      return errorResponse(res, 'Invalid address format. Expected a JSON object.', 400);
    }
  }

  // Never accept profile picture fields from the body; they must come from multer
  if (Object.prototype.hasOwnProperty.call(updates, 'profilePicture')) delete updates.profilePicture;
  if (Object.prototype.hasOwnProperty.call(updates, 'profilePic')) delete updates.profilePic;

  // If a new profile picture is uploaded, set updates.profilePic to /uploads/customers/<filename>
  if (req.file) {
    try {
      // Build the expected served path
      const filename = req.file.filename || '';
      const servedPath = `/uploads/customers/${filename}`;
      updates.profilePic = servedPath.replace(/\\/g, '/');
      console.log('[customerController.updateProfile] Received file', {
        field: req.file.fieldname,
        destination: req.file.destination,
        filename: req.file.filename,
        servedPath: updates.profilePic,
      });

      // Attempt to remove previous profile picture if it exists
      // Try multiple approaches to find the customer for the existing profile picture check:
      // 1. Find by user reference (Google OAuth users might have this)
      let existingCustomer = await Customer.findOne({ user: customerId });
      
      // 2. If not found, try to find by ID directly (regular registration users)
      if (!existingCustomer) {
        existingCustomer = await Customer.findById(customerId);
      }
      
      // 3. If still not found, try to find by email (fallback)
      if (!existingCustomer) {
        existingCustomer = await Customer.findOne({ email: req.user.email });
      }
      
      const oldPath = existingCustomer?.profilePic;
      if (oldPath && typeof oldPath === 'string' && oldPath !== updates.profilePic) {
        const normalizedOld = oldPath.replace(/^\/+/, '');
        const absoluteOld = path.join(path.dirname(new URL(import.meta.url).pathname), '..', normalizedOld)
          .replace(/%20/g, ' ');
        // Use fs.unlink in a safe, non-blocking manner
        fs.unlink(absoluteOld, (err) => {
          if (err) {
            console.warn('[customerController.updateProfile] Could not delete old profile pic', { oldPath, absoluteOld, error: err?.message });
          } else {
            console.log('[customerController.updateProfile] Deleted old profile pic', { absoluteOld });
          }
        });
      }
    } catch (e) {
      console.warn('[customerController.updateProfile] File handling error', { error: e?.message });
    }
  }

  // Remove sensitive or immutable fields from the update payload
  delete updates.password; // Password should be updated via a separate, dedicated endpoint
  delete updates.email; // Disallow email changes for now to avoid account ownership issues
  delete updates.totalBookings;
  delete updates.loyaltyPoints;

  // Try multiple approaches to find and update the customer:
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
    return notFoundResponse(res, 'Customer profile');
  }

  // Update the customer document
  Object.keys(updates).forEach(key => {
    customer[key] = updates[key];
  });
  
  await customer.save();

  console.log('[customerController.updateProfile] Success', {
    customerId: customer._id,
    profilePic: customer?.profilePic || null,
  });
  
  // Convert profile picture path to URL if it exists
  const responseData = {
    ...customer.toObject(),
    profilePic: customer.profilePic ? getFileUrl(customer.profilePic, req) : null,
  };
  
  return successResponse(res, responseData, 'Profile updated successfully');
});

// Browse salons
export const browseSalons = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const filter = { isActive: true, setupCompleted: true, approvalStatus: 'approved' };

  // Location filter
  if (req.query.city) {
    filter['salonAddress.city'] = { $regex: req.query.city, $options: 'i' };
  }

  // Search filter
  if (req.query.search) {
    filter.$or = [
      { salonName: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Service filter
  if (req.query.services) {
    const serviceNames = req.query.services.split(',');
    const services = await Service.find({
      name: { $in: serviceNames.map(name => new RegExp(name, 'i')) }
    }).distinct('salonId');
    filter._id = { $in: services };
  }

  const [salons, totalSalons] = await Promise.all([
    Salon.find(filter)
      .populate('services', 'name category price')
      .select('salonName salonAddress contactNumber description businessHours rating documents services profileImage salonImage')
      .skip(skip)
      .limit(limit)
      .sort({ 'rating.average': -1, createdAt: -1 }),
    Salon.countDocuments(filter)
  ]);

  // Convert file paths to full URLs
  const salonsWithUrls = salons.map(salon => {
    const salonObj = salon.toObject();
    
    // Handle profileImage
    if (salonObj.profileImage) {
      salonObj.profileImage = getFileUrl(salonObj.profileImage, req);
    }
    
    // Handle salonImage
    if (salonObj.salonImage) {
      salonObj.salonImage = getFileUrl(salonObj.salonImage, req);
    }
    
    // Handle documents
    if (salonObj.documents) {
      salonObj.documents = convertDocumentsToUrls(salonObj.documents, req);
    }
    
    return salonObj;
  });

  const totalPages = Math.ceil(totalSalons / limit);

  return paginatedResponse(res, salonsWithUrls, {
    page,
    limit,
    totalPages,
    totalItems: totalSalons
  });
});

// Get salon details
export const getSalonDetails = asyncHandler(async (req, res) => {
  const { salonId } = req.params;

  const salon = await Salon.findOne({ _id: salonId, isActive: true })
    .populate({
      path: 'services',
      match: { isActive: true },
      select: 'name description category price duration rating images'
    })
    .populate({
      path: 'staff',
      match: { isActive: true },
      select: 'name skills experience rating profilePicture availability position'
    });

  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }

  // Convert file paths to full URLs
  const salonObj = salon.toObject();
  
  // Handle profileImage
  if (salonObj.profileImage) {
    salonObj.profileImage = getFileUrl(salonObj.profileImage, req);
  }
  
  // Handle salonImage
  if (salonObj.salonImage) {
    salonObj.salonImage = getFileUrl(salonObj.salonImage, req);
  }
  
  // Handle documents
  if (salonObj.documents) {
    salonObj.documents = convertDocumentsToUrls(salonObj.documents, req);
  }
  
  // Handle staff profile pictures
  if (salonObj.staff && Array.isArray(salonObj.staff)) {
    salonObj.staff = salonObj.staff.map(staff => {
      const staffObj = staff.toObject ? staff.toObject() : staff;
      if (staffObj.profilePicture) {
        staffObj.profilePicture = getFileUrl(staffObj.profilePicture, req);
      }
      return staffObj;
    });
  }
  
  // Handle service images
  if (salonObj.services && Array.isArray(salonObj.services)) {
    salonObj.services = salonObj.services.map(service => {
      const serviceObj = service.toObject ? service.toObject() : service;
      if (serviceObj.images && Array.isArray(serviceObj.images)) {
        serviceObj.images = serviceObj.images.map(imagePath => getFileUrl(imagePath, req));
      }
      return serviceObj;
    });
  }

  return successResponse(res, salonObj, 'Salon details retrieved successfully');
});

// Get salon availability for a specific date
export const getSalonAvailability = asyncHandler(async (req, res) => {
  try {
    // salonId comes from route params, date comes from query params
    const { salonId } = req.params;
    const { date } = req.query;
    
    if (!salonId || !date) {
      return errorResponse(res, 'Salon ID and date are required', 400);
    }
    
    // Validate date format
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
      return errorResponse(res, 'Invalid date format', 400);
    }
    
    // Get salon information
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return notFoundResponse(res, 'Salon');
    }
    
    // Import Staff model (was missing)
    const Staff = (await import('../models/Staff.js')).default;
    
    // Get staff assigned to this salon with more detailed information
    const staff = await Staff.find({
      assignedSalon: salonId,
      isActive: true,
      approvalStatus: 'approved'
    })
    .select('name position skills profilePicture availability')
    .sort({ name: 1 });
    
    // Get appointments for the selected date
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);
    
    const appointmentFilter = {
      salonId: salonId,
      appointmentDate: {
        $gte: startDate,
        $lte: endDate
      },
      status: { $in: ['Pending', 'Approved', 'In-Progress', 'Confirmed'] }
    };
    
    const appointments = await Appointment.find(appointmentFilter)
      .populate('staffId', 'name position profilePicture')
      .populate('customerId', 'name')
      .populate('services.serviceId', 'name duration')
      .sort({ appointmentDate: 1, appointmentTime: 1 });
    
    // Group appointments by staff
    const staffAppointments = staff.map(staffMember => {
      const staffAppts = appointments.filter(apt =>
        apt.staffId && apt.staffId._id && staffMember._id && 
        apt.staffId._id.toString() === staffMember._id.toString()
      );
      
      // Format working hours from availability
      let workingHours = 'Not specified';
      if (staffMember.availability && staffMember.availability.workingHours) {
        const { startTime, endTime } = staffMember.availability.workingHours;
        if (startTime && endTime) {
          workingHours = `${startTime} - ${endTime}`;
        }
      }
      
      return {
        staff: {
          _id: staffMember._id,
          name: staffMember.name,
          position: staffMember.position || 'Staff',
          profilePicture: staffMember.profilePicture,
          workingHours
        },
        appointments: staffAppts.map(apt => {
          // Extract time from appointmentDate if it contains time, otherwise use appointmentTime
          let startTime = apt.appointmentTime;
          if (apt.appointmentDate && apt.appointmentDate.includes('T')) {
            const timePart = apt.appointmentDate.split('T')[1];
            if (timePart) {
              startTime = timePart.substring(0, 5); // Get HH:mm part
            }
          }
          
          // Calculate end time based on duration
          let endTime = 'N/A';
          if (startTime !== 'N/A' && apt.estimatedDuration) {
            const [hours, minutes] = startTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes + apt.estimatedDuration;
            const endHours = Math.floor(totalMinutes / 60) % 24;
            const endMinutes = totalMinutes % 60;
            endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
          }
          
          return {
            _id: apt._id,
            startTime,
            endTime,
            status: apt.status,
            duration: apt.estimatedDuration || apt.services.reduce((total, service) => total + (service.duration || 0), 0),
            customer: apt.customerId ? apt.customerId.name : 'Unknown Customer',
            service: apt.services.map(s => s.serviceId ? s.serviceId.name : 'Service').join(', ')
          };
        })
      };
    });
    
    // Get unassigned appointments (no staff assigned)
    const unassignedAppointments = appointments
      .filter(apt => !apt.staffId)
      .map(apt => {
        // Extract time from appointmentDate if it contains time, otherwise use appointmentTime
        let startTime = apt.appointmentTime;
        if (apt.appointmentDate && apt.appointmentDate.includes('T')) {
          const timePart = apt.appointmentDate.split('T')[1];
          if (timePart) {
            startTime = timePart.substring(0, 5); // Get HH:mm part
          }
        }
        
        // Calculate end time based on duration
        let endTime = 'N/A';
        if (startTime !== 'N/A' && apt.estimatedDuration) {
          const [hours, minutes] = startTime.split(':').map(Number);
          const totalMinutes = hours * 60 + minutes + apt.estimatedDuration;
          const endHours = Math.floor(totalMinutes / 60) % 24;
          const endMinutes = totalMinutes % 60;
          endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
        }
        
        return {
          _id: apt._id,
          startTime,
          endTime,
          status: apt.status,
          duration: apt.estimatedDuration || apt.services.reduce((total, service) => total + (service.duration || 0), 0),
          customer: apt.customerId ? apt.customerId.name : 'Unknown Customer',
          service: apt.services.map(s => s.serviceId ? s.serviceId.name : 'Service').join(', ')
        };
      });
    
    // Add unassigned appointments as a separate "staff" entry
    if (unassignedAppointments.length > 0) {
      staffAppointments.push({
        staff: {
          _id: 'unassigned',
          name: 'Unassigned Appointments',
          position: 'Pending Assignment',
          profilePicture: null,
          workingHours: 'N/A'
        },
        appointments: unassignedAppointments
      });
    }
    
    return successResponse(res, { 
      staffMembers: staffAppointments,
      salonBusinessHours: salon.businessHours // Include salon business hours for reference
    }, 'Salon availability retrieved successfully');
  } catch (error) {
    console.error('Error in getSalonAvailability:', error);
    return errorResponse(res, `Failed to retrieve salon availability: ${error.message}`, 500);
  }
});

// Search services
export const searchServices = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { isActive: true };

  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { tags: { $in: [new RegExp(req.query.search, 'i')] } }
    ];
  }

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = parseInt(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = parseInt(req.query.maxPrice);
  }

  const [services, totalServices] = await Promise.all([
    Service.find(filter)
      .populate('salonId', 'salonName salonAddress rating')
      .skip(skip)
      .limit(limit)
      .sort({ 'rating.average': -1, totalBookings: -1 }),
    Service.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalServices / limit);

  return paginatedResponse(res, services, {
    page,
    limit,
    totalPages,
    totalItems: totalServices
  });
});

// Get customer bookings
export const getBookings = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { customerId };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const [bookings, totalBookings] = await Promise.all([
    Appointment.find(filter)
      .populate('salonId', 'salonName salonAddress contactNumber')
      .populate('staffId', 'name skills')
      .populate('services.serviceId', 'name category')
      .skip(skip)
      .limit(limit)
      .sort({ appointmentDate: -1, appointmentTime: -1 }),
    Appointment.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalBookings / limit);

  return paginatedResponse(res, bookings, {
    page,
    limit,
    totalPages,
    totalItems: totalBookings
  });
});

// Cancel booking
export const cancelBooking = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const { appointmentId } = req.params;
  const { cancellationReason } = req.body;

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    customerId: customerId
  });

  if (!appointment) {
    return notFoundResponse(res, 'Appointment');
  }

  // Check if appointment can be cancelled under salon policy
  const canCancel = await appointment.canBeCancelledUnderPolicy();
  
  if (!canCancel) {
    // Get salon's cancellation policy for error message
    const policy = await CancellationPolicy.findOne({ salonId: appointment.salonId });
    const noticePeriod = policy ? policy.noticePeriod : 24;
    
    return errorResponse(res, `Appointment cannot be cancelled. Cancellation must be made at least ${noticePeriod} hours before appointment time.`, 400);
  }

  // Calculate cancellation fee based on policy
  const cancellationFee = await appointment.calculateCancellationFee();
  appointment.cancellationFee = cancellationFee;
  
  // Set cancellation type based on when it was cancelled
  const [datePart, timePart] = appointment.appointmentDate.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
  const now = new Date();
  
  if (now >= appointmentDateTime) {
    appointment.cancellationType = 'No-Show';
  } else {
    // Check if it's late cancellation
    const policy = await CancellationPolicy.findOne({ salonId: appointment.salonId });
    if (policy && policy.isActive) {
      const noticePeriodMillis = policy.noticePeriod * 60 * 60 * 1000;
      const noticePeriodDateTime = new Date(appointmentDateTime.getTime() - noticePeriodMillis);
      if (now >= noticePeriodDateTime) {
        appointment.cancellationType = 'Late';
      } else {
        appointment.cancellationType = 'Early';
      }
    } else {
      appointment.cancellationType = 'Early';
    }
  }

  appointment.cancellationReason = cancellationReason;
  await appointment.updateStatus('Cancelled', 'Customer');

  return successResponse(res, {
    appointment,
    cancellationFee,
    cancellationType: appointment.cancellationType
  }, 'Appointment cancelled successfully');
});

// Rate and review appointment
export const rateAppointment = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const { appointmentId } = req.params;
  const { rating, feedback } = req.body;

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    customerId: customerId,
    status: 'Completed'
  });

  if (!appointment) {
    return notFoundResponse(res, 'Completed appointment');
  }

  if (appointment.rating.overall) {
    return errorResponse(res, 'This appointment has already been rated', 400);
  }

  appointment.rating = rating;
  appointment.feedback = feedback;
  await appointment.save();

  // Update service ratings
  for (const service of appointment.services) {
    const serviceDoc = await Service.findById(service.serviceId);
    if (serviceDoc && rating.service) {
      await serviceDoc.updateRating(rating.service);
    }
  }

  return successResponse(res, appointment, 'Rating submitted successfully');
});

// @desc    Update customer's favorite salon
// @route   PATCH /api/customers/favorite-salon
// @access  Private
export const updateFavoriteSalon = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const { salonId } = req.body;

  const customer = await Customer.findById(customerId);

  if (!customer) {
    return notFoundResponse(res, 'Customer');
  }

  // If salonId is provided, set it as favorite. If null or empty, clear it.
  customer.favoriteSalon = salonId ? salonId : null;
  await customer.save();

  return successResponse(res, { favoriteSalon: customer.favoriteSalon }, 'Favorite salon updated successfully');
});

// @desc    Get customer's recent salons
// @route   GET /api/customers/recent-salons
// @access  Private
export const getRecentSalons = asyncHandler(async (req, res) => {
  const customerId = req.user.id;

  const recentAppointments = await Appointment.find({ customerId })
    .sort({ appointmentDate: -1 })
    .populate('salonId', 'salonName salonAddress rating profileImage salonImage documents.salonLogo documents.salonImages')
    .limit(20); // Fetch more to ensure we get 3-5 unique salons

  if (!recentAppointments) {
    return successResponse(res, [], 'No recent salons found');
  }

  const uniqueSalons = [];
  const salonIds = new Set();

  for (const appointment of recentAppointments) {
    if (appointment.salonId && !salonIds.has(appointment.salonId._id.toString())) {
      salonIds.add(appointment.salonId._id.toString());
      uniqueSalons.push({
        ...appointment.salonId.toObject(),
        lastVisited: appointment.appointmentDate,
      });
    }
    if (uniqueSalons.length >= 5) {
      break;
    }
  }

  return successResponse(res, uniqueSalons, 'Recent salons retrieved successfully');
});

// Add salon to favorites (multiple favorites support)
export const addFavoriteSalon = asyncHandler(async (req, res) => {
  try {
    const customerId = req.user.id;
    const { salonId } = req.body;

    if (!salonId) {
      return errorResponse(res, 'Salon ID is required', 400);
    }

    // Try multiple approaches to find the customer:
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
      return notFoundResponse(res, 'Customer');
    }

    // Initialize preferredSalons array if it doesn't exist
    if (!customer.preferences) {
      customer.preferences = {};
    }
    if (!customer.preferences.preferredSalons) {
      customer.preferences.preferredSalons = [];
    }

    // Check if salon is already in favorites
    const isAlreadyFavorite = customer.preferences.preferredSalons.some(
      id => id.toString() === salonId
    );

    if (isAlreadyFavorite) {
      return successResponse(res, customer.preferences.preferredSalons, 'Salon is already in favorites');
    }

    // Add salon to favorites
    customer.preferences.preferredSalons.push(salonId);
    await customer.save();

    return successResponse(res, customer.preferences.preferredSalons, 'Salon added to favorites successfully');
  } catch (error) {
    console.error('Error adding favorite salon:', error);
    return errorResponse(res, 'Failed to add salon to favorites', 500);
  }
});

// Remove salon from favorites
export const removeFavoriteSalon = asyncHandler(async (req, res) => {
  try {
    const customerId = req.user.id;
    const { salonId } = req.params;

    if (!salonId) {
      return errorResponse(res, 'Salon ID is required', 400);
    }

    // Try multiple approaches to find the customer:
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
      return notFoundResponse(res, 'Customer');
    }

    // Initialize preferredSalons array if it doesn't exist
    if (!customer.preferences) {
      customer.preferences = {};
    }
    if (!customer.preferences.preferredSalons) {
      customer.preferences.preferredSalons = [];
    }

    // Remove salon from favorites
    customer.preferences.preferredSalons = customer.preferences.preferredSalons.filter(
      id => id.toString() !== salonId
    );
    await customer.save();

    return successResponse(res, customer.preferences.preferredSalons, 'Salon removed from favorites successfully');
  } catch (error) {
    console.error('Error removing favorite salon:', error);
    return errorResponse(res, 'Failed to remove salon from favorites', 500);
  }
});

// Get favorite salons
export const getFavoriteSalons = asyncHandler(async (req, res) => {
  try {
    const customerId = req.user.id;

    // Try multiple approaches to find the customer:
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
      return notFoundResponse(res, 'Customer');
    }

    // Initialize preferredSalons array if it doesn't exist
    if (!customer.preferences) {
      customer.preferences = {};
    }
    if (!customer.preferences.preferredSalons) {
      customer.preferences.preferredSalons = [];
    }

    // Populate salon details
    await customer.populate({
      path: 'preferences.preferredSalons',
      select: 'salonName salonAddress salonContact profileImage salonImage rating documents'
    });

    return successResponse(res, customer.preferences.preferredSalons, 'Favorite salons retrieved successfully');
  } catch (error) {
    console.error('Error fetching favorite salons:', error);
    return errorResponse(res, 'Failed to retrieve favorite salons', 500);
  }
});
