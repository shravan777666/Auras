import Staff from '../models/Staff.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import Salon from '../models/Salon.js';
import jwt from 'jsonwebtoken';
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';

// Helper function to calculate real performance data for staff
const getStaffPerformanceData = async (staffId, completedAppointments) => {
  try {
    // Get completed appointments for this staff with service details
    const serviceStats = await Appointment.aggregate([
      {
        $match: {
          staffId: staffId,
          status: 'Completed',
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // Current month
          }
        }
      },
      { $unwind: '$services' },
      {
        $group: {
          _id: '$services.serviceName',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$services.price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Transform aggregated data into services object
    const services = {};
    serviceStats.forEach(stat => {
      const serviceName = stat._id || 'Unknown Service';
      services[serviceName] = stat.count;
    });

    // Calculate average client rating from reviews
    const Review = (await import('../models/Review.js')).default;
    const ratingData = await Review.aggregate([
      {
        $lookup: {
          from: 'appointments',
          localField: 'appointmentId',
          foreignField: '_id',
          as: 'appointment'
        }
      },
      {
        $match: {
          'appointment.staffId': staffId
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const clientRating = ratingData.length > 0 ? Math.round(ratingData[0].averageRating * 10) / 10 : 0;

    // If no services data available, provide a default structure
    if (Object.keys(services).length === 0 && completedAppointments > 0) {
      services['General Service'] = completedAppointments;
    }

    return {
      services,
      clientRating
    };
  } catch (error) {
    console.error('Error calculating staff performance data:', error);
    // Return default structure on error
    return {
      services: {},
      clientRating: 0
    };
  }
};

// Helper to sign JWT. Accepts either a user object or an id.
const signToken = (userOrId) => {
  const id = userOrId && userOrId._id ? userOrId._id.toString() : userOrId;
  // Try to include useful public claims so other middleware can read them
  const payload = {
    id,
    type: 'staff',
    setupCompleted: userOrId && userOrId.setupCompleted ? !!userOrId.setupCompleted : false,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Staff registration
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password || !confirmPassword) {
    return errorResponse(res, 'Name, email and passwords are required', 400);
  }

  if (password !== confirmPassword) {
    return errorResponse(res, 'Passwords do not match', 400);
  }

  // Check existing auth user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return errorResponse(res, 'Email already in use', 400);
  }

  // Prevent duplicate staff/profile records
  const existingStaffProfile = await Staff.findOne({ email });
  if (existingStaffProfile) {
    return errorResponse(res, 'A staff profile with this email already exists', 400);
  }

  // Create central User for authentication (this hashes password in User pre-save)
  const user = await User.create({ name, email, password, type: 'staff', setupCompleted: false });

  // Create staff profile linked to user
  const staffProfile = await Staff.create({ name, email, user: user._id });

  // Sign a token using the newly created user (pass the user object so payload has required claims)
  const token = signToken(user);

  const safeUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    type: user.type,
    setupCompleted: user.setupCompleted,
  };

  return successResponse(res, { token, user: safeUser }, 'Staff registered successfully', 201);
});

export const createStaff = asyncHandler(async (req, res) => {
  const salonOwnerId = req.user.id;
  const {
    name,
    email,
    password,
    contactNumber,
    skills,
    experience,
    availability,
    specialization,
    dateOfBirth,
    gender,
    address,
    position
  } = req.body;

  if (!name || !email || !password) {
    return errorResponse(res, 'Name, email and password are required', 400);
  }

  const salon = await Salon.findOne({ ownerId: salonOwnerId });
  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return errorResponse(res, 'Email already in use', 400);
  }

  const newUser = await User.create({
    name,
    email,
    password,
    type: 'staff',
    setupCompleted: true,
  });

  const parseIfString = (val) => {
    if (!val) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return val; }
    }
    return val;
  };

  const parsedSkills = parseIfString(skills) || [];
  const parsedExperience = parseIfString(experience) || {};
  const parsedAvailability = parseIfString(availability) || undefined;
  const parsedAddress = parseIfString(address) || {};

  const documents = {};
  if (req.files) {
    if (req.files.profilePicture && req.files.profilePicture[0]) {
      documents.profilePicture = req.files.profilePicture[0].path;
    }
    if (req.files.governmentId && req.files.governmentId[0]) {
      documents.governmentId = req.files.governmentId[0].path;
    }
  }

  const newStaff = await Staff.create({
    name,
    email,
    user: newUser._id,
    assignedSalon: salon._id,
    employmentStatus: 'Employed',
    contactNumber,
    skills: Array.isArray(parsedSkills) ? parsedSkills : [],
    experience: parsedExperience,
    availability: parsedAvailability,
    specialization,
    dateOfBirth,
    gender,
    address: parsedAddress,
    position,
    profilePicture: documents.profilePicture,
    documents: { governmentId: documents.governmentId },
    setupCompleted: true,
  });

  salon.staff.push(newStaff._id);
  await salon.save();

  const responseData = {
    ...newStaff.toObject(),
    documents: convertDocumentsToUrls(newStaff.documents, req),
    profilePicture: newStaff.profilePicture ? getFileUrl(newStaff.profilePicture, req) : null,
  };

  successResponse(res, responseData, 'Staff created and assigned to your salon successfully');
});

// Helper function to convert file path to full URL
const getFileUrl = (filePath, req) => {
  if (!filePath) return null;
  
  // Normalize path separators
  const normalizedPath = String(filePath).replace(/\\/g, '/');
  
  // Get base URL from environment or use default
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5005}`;
  
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
  
  if (documents.governmentId) {
    converted.governmentId = getFileUrl(documents.governmentId, req);
  }
  
  if (documents.certificates && Array.isArray(documents.certificates)) {
    converted.certificates = documents.certificates.map(certPath => getFileUrl(certPath, req));
  }
  
  return converted;
};

// Complete staff profile setup
export const setupProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    contactNumber,
    skills,
    experience,
    availability,
    specialization,
    dateOfBirth,
    gender,
    address,
    position
  } = req.body;
  
  // Find staff record by user reference
  let staff = await Staff.findOne({ user: userId });
  
  // If no staff profile exists, create one (this handles cases where registration didn't create a profile)
  if (!staff) {
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Create staff profile linked to user
    staff = await Staff.create({ 
      name: user.name, 
      email: user.email, 
      user: user._id 
    });
  }

  // If some fields were sent as JSON strings (FormData), try to parse them
  const parseIfString = (val) => {
    if (!val) return val;
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (e) {
        return val;
      }
    }
    return val;
  };

  const parsedSkills = parseIfString(skills) || staff.skills;
  const parsedExperience = parseIfString(experience) || staff.experience;
  const parsedAvailability = parseIfString(availability) || staff.availability;
  const parsedAddress = parseIfString(address) || staff.address;

  // Handle uploaded files
  const documents = {};
  if (req.files) {
    console.log('Processing uploaded staff files:', Object.keys(req.files));
    if (req.files.profilePicture && req.files.profilePicture[0]) {
      staff.profilePicture = req.files.profilePicture[0].path;
      console.log('Profile picture uploaded:', staff.profilePicture);
    }
    if (req.files.governmentId && req.files.governmentId[0]) {
      documents.governmentId = req.files.governmentId[0].path;
      console.log('Government ID uploaded:', documents.governmentId);
    }
    // Certificates removed per requirements
  } else {
    console.log('No files uploaded for staff');
  }

  // Update staff information
  staff.contactNumber = contactNumber || staff.contactNumber;
  staff.skills = Array.isArray(parsedSkills) ? parsedSkills : staff.skills;
  staff.experience = parsedExperience;
  staff.availability = parsedAvailability;
  staff.specialization = specialization || staff.specialization;
  staff.dateOfBirth = dateOfBirth || staff.dateOfBirth;
  staff.gender = gender || staff.gender;
  staff.address = parsedAddress;
  staff.position = position || staff.position;
  staff.documents = documents;
  staff.setupCompleted = true;

  await staff.save();

  // Update User's setupCompleted flag
  // Update User's setupCompleted flag
  const updatedUser = await User.findByIdAndUpdate(userId, { setupCompleted: true }, { new: true });

  // Re-sign token with updated setupCompleted status
  const token = signToken(updatedUser);

  const responseMessage = staff.approvalStatus === 'pending' 
    ? 'Profile setup completed successfully. Your application is now pending admin approval.'
    : 'Profile setup completed successfully';
    
  const responseData = {
    ...staff.toObject(),
    documents: convertDocumentsToUrls(staff.documents, req),
    profilePicture: staff.profilePicture ? getFileUrl(staff.profilePicture, req) : null,
    message: staff.approvalStatus === 'pending' 
      ? 'Please wait for admin approval before accessing the dashboard.'
      : undefined,
    token: token, // Include the new token in the response
  };

  return successResponse(res, responseData, responseMessage);
});

// Get staff dashboard
export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  console.log('=== STAFF DASHBOARD DEBUG ===');
  console.log('User ID from token:', userId);
  console.log('User object from token:', req.user);

  let staffInfo = await Staff.findOne({ user: userId });
  console.log('Staff found by user ID:', staffInfo ? {
    id: staffInfo._id,
    name: staffInfo.name,
    email: staffInfo.email,
    approvalStatus: staffInfo.approvalStatus,
    setupCompleted: staffInfo.setupCompleted
  } : 'NOT FOUND');
  
  // If no staff profile exists, create one
  if (!staffInfo) {
    const user = await User.findById(userId);
    console.log('Creating staff profile for user:', user ? user.email : 'USER NOT FOUND');
    if (!user) {
      console.log('ERROR: User not found with ID:', userId);
      return errorResponse(res, 'User not found', 404);
    }
    
    staffInfo = await Staff.create({ 
      name: user.name, 
      email: user.email, 
      user: user._id 
    });
    console.log('Created new staff profile');
  }

  // Check staff approval status
  if (staffInfo.approvalStatus !== 'approved') {
    const message = staffInfo.approvalStatus === 'pending'
      ? 'Your staff application is still pending admin approval. Please wait for approval to access the dashboard.'
      : staffInfo.approvalStatus === 'rejected'
      ? `Your staff application has been rejected. Reason: ${staffInfo.rejectionReason || 'No reason provided'}`
      : 'Your staff application is not approved for dashboard access.';
    
    console.log('APPROVAL STATUS ERROR:', staffInfo.approvalStatus, message);
    return errorResponse(res, message, 403);
  }

  console.log('Staff approval check passed, fetching dashboard data...');

  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  const todayEnd = new Date(today.setHours(23, 59, 59, 999));

  const [
    totalAppointments,
    todayAppointmentsCount,
    upcomingAppointments,
    completedAppointments,
    assignedSalon,
    todayAppointments,
    upcomingClients
  ] = await Promise.all([
    Appointment.countDocuments({ staffId: staffInfo._id }),
    Appointment.countDocuments({ 
      staffId: staffInfo._id, 
      appointmentDate: {
        $gte: todayStart,
        $lt: todayEnd
      }
    }),
    Appointment.countDocuments({ 
      staffId: staffInfo._id,
      status: { $in: ['Pending', 'Confirmed'] },
      appointmentDate: { $gte: new Date() }
    }),
    Appointment.countDocuments({ staffId: staffInfo._id, status: 'Completed' }),
    staffInfo.assignedSalon ? Salon.findById(staffInfo.assignedSalon).select('salonName ownerName') : null,
    // Get today's appointments with details
    Appointment.find({
      staffId: staffInfo._id,
      appointmentDate: {
        $gte: todayStart,
        $lt: todayEnd
      },
      status: { $in: ['Pending', 'Confirmed', 'In-Progress'] }
    })
    .populate('customerId', 'name')
    .populate('services.serviceId', 'name')
    .sort({ appointmentTime: 1 })
    .limit(10),
    // Get upcoming clients
    Appointment.find({
      staffId: staffInfo._id,
      status: { $in: ['Pending', 'Confirmed'] },
      appointmentDate: { $gte: new Date() }
    })
    .populate('customerId', 'name')
    .sort({ appointmentDate: 1, appointmentTime: 1 })
    .limit(5)
  ]);

  console.log('Dashboard data fetched successfully');

  // Format today's appointments for the frontend
  const formattedTodayAppointments = todayAppointments.map(apt => ({
    clientName: apt.customerId?.name || 'Unknown Client',
    service: apt.services?.[0]?.serviceId?.name || 'General Service',
    time: apt.appointmentTime || 'TBD'
  }));

  // Format upcoming clients
  const formattedUpcomingClients = upcomingClients.map(apt => ({
    name: apt.customerId?.name || 'Unknown Client',
    preferences: apt.customerNotes || 'No specific preferences'
  }));

  // Real performance data based on actual appointment data
  const performance = await getStaffPerformanceData(staffInfo._id, completedAppointments);

  console.log('Returning dashboard response');
  return successResponse(res, {
    staffInfo,
    assignedSalon,
    statistics: {
      totalAppointments,
      todayAppointments: todayAppointmentsCount,
      upcomingAppointments,
      completedAppointments
    },
    todayAppointments: formattedTodayAppointments,
    upcomingClients: formattedUpcomingClients,
    performance
  }, 'Dashboard data retrieved successfully');
});

// Get staff profile
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  let staff = await Staff.findOne({ user: userId })
    .populate('assignedSalon', 'salonName ownerName contactNumber');

  // If no staff profile exists, create one
  if (!staff) {
    const user = await User.findById(userId);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    staff = await Staff.create({ 
      name: user.name, 
      email: user.email, 
      user: user._id 
    });
    
    // Re-fetch with population
    staff = await Staff.findById(staff._id)
      .populate('assignedSalon', 'salonName ownerName contactNumber');
  }

  return successResponse(res, staff, 'Profile retrieved successfully');
});



// Update availability
export const updateAvailability = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { availability } = req.body;

  const staff = await Staff.findOne({ user: userId });
  if (!staff) {
    return notFoundResponse(res, 'Staff profile');
  }

  staff.availability = availability;
  await staff.save();

  return successResponse(res, staff.availability, 'Availability updated successfully');
});



// Get staff appointments
export const getAppointments = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  console.log('👤 Staff appointments request for userId:', userId);
  console.log('📋 Query parameters:', req.query);

  // First find the staff record to get the staff ID
  const staff = await Staff.findOne({ user: userId });
  if (!staff) {
    console.log('❌ Staff profile not found for userId:', userId);
    return notFoundResponse(res, 'Staff profile');
  }

  console.log('✅ Found staff profile:', { 
    staffId: staff._id, 
    name: staff.name, 
    email: staff.email,
    assignedSalon: staff.assignedSalon,
    approvalStatus: staff.approvalStatus
  });

  // Check if staff is approved
  if (staff.approvalStatus !== 'approved') {
    console.log('❌ Staff not approved:', staff.approvalStatus);
    return errorResponse(res, 'Staff profile not approved for appointment access', 403);
  }

  const filter = { staffId: staff._id };
  console.log('🔍 Base appointment filter:', filter);

  if (req.query.status) {
    filter.status = req.query.status;
    console.log('📊 Added status filter:', req.query.status);
  }

  // Support both single date and date range queries
  if (req.query.date) {
    // Single date filter (backward compatibility)
    const date = new Date(req.query.date);
    filter.appointmentDate = {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    };
    console.log('📅 Single date filter:', { date: req.query.date, filter: filter.appointmentDate });
  } else if (req.query.startDate && req.query.endDate) {
    // Date range filter (for calendar views)
    const start = new Date(req.query.startDate);
    const end = new Date(req.query.endDate);
    filter.appointmentDate = {
      $gte: new Date(start.setHours(0, 0, 0, 0)),
      $lte: new Date(end.setHours(23, 59, 59, 999))
    };
    console.log('📅 Date range filter:', { 
      startDate: req.query.startDate, 
      endDate: req.query.endDate, 
      filter: filter.appointmentDate 
    });
  }

  console.log('📅 Final filter with date range:', JSON.stringify(filter, null, 2));

  // Debug: Check if there are any appointments for this staff at all
  const totalAppointmentsForStaff = await Appointment.countDocuments({ staffId: staff._id });
  console.log('🔍 Total appointments for staff (any date):', totalAppointmentsForStaff);

  const [appointments, totalAppointments] = await Promise.all([
    Appointment.find(filter)
      .populate('customerId', 'name email')
      .populate('salonId', 'salonName')
      .populate('services.serviceId', 'name price duration')
      .skip(skip)
      .limit(limit)
      .sort({ appointmentDate: 1, appointmentTime: 1 }),
    Appointment.countDocuments(filter)
  ]);

  console.log('📊 Found appointments:', appointments.length, 'total:', totalAppointments);
  console.log('📅 Appointment details:', appointments.map(apt => ({
    id: apt._id,
    customer: apt.customerId?.name,
    date: apt.appointmentDate,
    time: apt.appointmentTime,
    status: apt.status,
    staffId: apt.staffId
  })));

  // Debug: If no appointments found, check for potential issues
  if (appointments.length === 0) {
    console.log('🔍 Debugging: No appointments found. Checking potential issues...');
    
    // Check if there are appointments with different staff ID formats
    const allAppointmentsForStaff = await Appointment.find({ 
      $or: [
        { staffId: staff._id },
        { staffId: staff._id.toString() },
        { 'staffId.$oid': staff._id.toString() }
      ]
    }).limit(5);
    
    console.log('🔍 Alternative staff ID queries found:', allAppointmentsForStaff.length);
    
    // Check if there are any appointments in the date range without staff filter
    if (filter.appointmentDate) {
      const appointmentsInDateRange = await Appointment.find(filter.appointmentDate).limit(5);
      console.log('🔍 Appointments in date range (any staff):', appointmentsInDateRange.length);
    }
  }

  const totalPages = Math.ceil(totalAppointments / limit);

  return paginatedResponse(res, appointments, {
    page,
    limit,
    totalPages,
    totalItems: totalAppointments
  });
});

// Update appointment status
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { appointmentId } = req.params;
  const { status, staffNotes } = req.body;

  // First find the staff record to get the staff ID
  const staff = await Staff.findOne({ user: userId });
  if (!staff) {
    return notFoundResponse(res, 'Staff profile');
  }

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    staffId: staff._id
  });

  if (!appointment) {
    return notFoundResponse(res, 'Appointment');
  }

  await appointment.updateStatus(status, 'Staff');

  if (staffNotes) {
    appointment.staffNotes = staffNotes;
    await appointment.save();
  }

  return successResponse(res, appointment, 'Appointment status updated successfully');
});

// Get today's schedule
export const getTodaySchedule = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today = new Date();

  // First find the staff record to get the staff ID
  const staff = await Staff.findOne({ user: userId });
  if (!staff) {
    return notFoundResponse(res, 'Staff profile');
  }

  const appointments = await Appointment.find({
    staffId: staff._id,
    appointmentDate: {
      $gte: new Date(today.setHours(0, 0, 0, 0)),
      $lt: new Date(today.setHours(23, 59, 59, 999))
    },
    status: { $in: ['Confirmed', 'In-Progress', 'Pending'] }
  })
  .populate('customerId', 'name email')
  .populate('services.serviceId', 'name duration')
  .sort({ appointmentTime: 1 });

  return successResponse(res, appointments, "Today's schedule retrieved successfully");
});

// Get staff by ID (for admins/salon owners)
export const getStaffById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const staff = await Staff.findById(id)
    .populate('assignedSalon', 'salonName ownerName contactNumber')
    .populate('user', 'name email');

  if (!staff) {
    return notFoundResponse(res, 'Staff');
  }

  const responseData = {
    ...staff.toObject(),
    documents: convertDocumentsToUrls(staff.documents, req),
    profilePicture: staff.profilePicture ? getFileUrl(staff.profilePicture, req) : null,
  };

  return successResponse(res, responseData, 'Staff retrieved successfully');
});

// Get appointments for a staff member by staff ID (for salon owners)
export const getAppointmentsByStaffId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, page = 1, limit = 20 } = req.query;

  const filter = { staffId: id };
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    filter.appointmentDate = {
      $gte: new Date(start.setHours(0, 0, 0, 0)),
      $lte: new Date(end.setHours(23, 59, 59, 999))
    };
  }

  const numericLimit = Math.min(parseInt(limit) || 20, 100);
  const numericPage = Math.max(parseInt(page) || 1, 1);
  const skip = (numericPage - 1) * numericLimit;

  const [appointments, totalAppointments] = await Promise.all([
    Appointment.find(filter)
      .populate('customerId', 'name email')
      .populate('services.serviceId', 'name duration')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(numericLimit),
    Appointment.countDocuments(filter)
  ]);

  // Map to a lightweight structure suitable for calendar grids
  const mapped = appointments.map((apt) => ({
    id: apt._id,
    date: apt.appointmentDate,
    time: apt.appointmentTime,
    status: apt.status,
    customer: apt.customerId?.name || 'Client',
    service: apt.services?.[0]?.serviceId?.name || apt.services?.[0]?.serviceName || 'Service',
    duration: apt.services?.[0]?.duration || apt.estimatedDuration || 0,
  }));

  return paginatedResponse(res, mapped, {
    page: numericPage,
    limit: numericLimit,
    totalPages: Math.ceil(totalAppointments / numericLimit),
    totalItems: totalAppointments
  });
});

// Update staff by ID (for admins/salon owners)
export const updateStaffById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const staff = await Staff.findById(id);
  if (!staff) {
    return notFoundResponse(res, 'Staff');
  }

  // Handle file uploads if any
  if (req.files && req.files.profilePicture && req.files.profilePicture[0]) {
    updateData.profilePicture = req.files.profilePicture[0].path;
  }

  // Parse JSON strings if needed (for FormData)
  const parseIfString = (val) => {
    if (!val) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return val; }
    }
    return val;
  };

  if (updateData.skills) updateData.skills = parseIfString(updateData.skills);
  if (updateData.experience) updateData.experience = parseIfString(updateData.experience);
  if (updateData.availability) updateData.availability = parseIfString(updateData.availability);
  if (updateData.address) updateData.address = parseIfString(updateData.address);

  // Update staff
  Object.assign(staff, updateData);
  await staff.save();

  const responseData = {
    ...staff.toObject(),
    documents: convertDocumentsToUrls(staff.documents, req),
    profilePicture: staff.profilePicture ? getFileUrl(staff.profilePicture, req) : null,
  };

  return successResponse(res, responseData, 'Staff updated successfully');
});

// Update logged-in staff's profile
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updateData = req.body;

  const staff = await Staff.findOne({ user: userId });
  if (!staff) {
    return notFoundResponse(res, 'Staff profile');
  }

  // Handle file uploads if any
  if (req.files && req.files.profilePicture && req.files.profilePicture[0]) {
    updateData.profilePicture = req.files.profilePicture[0].path;
  }

  // Parse JSON strings if needed (for FormData)
  const parseIfString = (val) => {
    if (!val) return val;
    if (typeof val === 'string') {
      try { return JSON.parse(val); } catch (e) { return val; }
    }
    return val;
  };

  if (updateData.skills) updateData.skills = parseIfString(updateData.skills);
  if (updateData.experience) updateData.experience = parseIfString(updateData.experience);
  if (updateData.availability) updateData.availability = parseIfString(updateData.availability);
  if (updateData.address) updateData.address = parseIfString(updateData.address);

  // Update staff
  Object.assign(staff, updateData);
  await staff.save();

  const responseData = {
    ...staff.toObject(),
    documents: convertDocumentsToUrls(staff.documents, req),
    profilePicture: staff.profilePicture ? getFileUrl(staff.profilePicture, req) : null,
  };

  return successResponse(res, responseData, 'Profile updated successfully');
});

// Get upcoming appointments for staff
export const getUpcomingAppointments = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // First find the staff record to get the staff ID
  const staff = await Staff.findOne({ user: userId });
  if (!staff) {
    return notFoundResponse(res, 'Staff profile');
  }

  const filter = {
    staffId: staff._id,
    status: { $in: ['Pending', 'Confirmed'] },
    appointmentDate: { $gte: new Date() }
  };

  const [appointments, totalAppointments] = await Promise.all([
    Appointment.find(filter)
      .populate('customerId', 'name email')
      .populate('salonId', 'salonName')
      .populate('services.serviceId', 'name price duration')
      .skip(skip)
      .limit(limit)
      .sort({ appointmentDate: 1, appointmentTime: 1 }),
    Appointment.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalAppointments / limit);

  return paginatedResponse(res, appointments, {
    page,
    limit,
    totalPages,
    totalItems: totalAppointments
  });
});

// Get completed appointments for staff
export const getCompletedAppointments = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // First find the staff record to get the staff ID
  const staff = await Staff.findOne({ user: userId });
  if (!staff) {
    return notFoundResponse(res, 'Staff profile');
  }

  const filter = {
    staffId: staff._id,
    status: 'Completed'
  };

  // Add date filtering if provided
  if (req.query.startDate && req.query.endDate) {
    filter.appointmentDate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  const [appointments, totalAppointments] = await Promise.all([
    Appointment.find(filter)
      .populate('customerId', 'name email')
      .populate('salonId', 'salonName')
      .populate('services.serviceId', 'name price duration')
      .skip(skip)
      .limit(limit)
      .sort({ appointmentDate: -1, appointmentTime: -1 }),
    Appointment.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalAppointments / limit);

  return paginatedResponse(res, appointments, {
    page,
    limit,
    totalPages,
    totalItems: totalAppointments
  });
});

export const getStaffReport = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const staff = await Staff.findOne({ user: userId });
  if (!staff) {
    return notFoundResponse(res, 'Staff profile');
  }

  const completedAppointments = await Appointment.find({
    staffId: staff._id,
    status: 'Completed'
  });

  const totalRevenue = completedAppointments.reduce((acc, appointment) => acc + appointment.totalAmount, 0);
  const totalAppointments = completedAppointments.length;

  const customerIds = completedAppointments.map(appointment => appointment.customerId);
  const uniqueCustomerIds = [...new Set(customerIds)];
  const newCustomers = uniqueCustomerIds.length;

  return successResponse(res, {
    totalRevenue,
    totalAppointments,
    newCustomers
  }, 'Staff report retrieved successfully');
});

export default {
  register,
  createStaff,
  setupProfile,
  getDashboard,
  getProfile,
  updateProfile,
  updateAvailability,
  getAppointments,
  updateAppointmentStatus,
  getTodaySchedule,
  getUpcomingAppointments,
  getCompletedAppointments,
  getStaffById,
  updateStaffById,
  getStaffReport
};