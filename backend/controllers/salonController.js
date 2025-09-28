import Salon from '../models/Salon.js';
import Staff from '../models/Staff.js';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import Revenue from '../models/Revenue.js';
import Expense from '../models/Expense.js';
import jwt from 'jsonwebtoken';
import { sendAppointmentConfirmation } from '../utils/email.js';
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';

// Helper function to convert file path to full URL
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5005}`;
  return `${baseUrl}/${filePath.replace(/\\/g, '/')}`;
};

// Helper function to convert documents object with file paths to URLs
const convertDocumentsToUrls = (documents) => {
  if (!documents) return {};
  
  const converted = {};
  
  if (documents.businessLicense) {
    converted.businessLicense = getFileUrl(documents.businessLicense);
  }
  
  if (documents.salonLogo) {
    converted.salonLogo = getFileUrl(documents.salonLogo);
  }
  
  if (documents.salonImages && Array.isArray(documents.salonImages)) {
    converted.salonImages = documents.salonImages.map(imagePath => getFileUrl(imagePath));
  }
  
  return converted;
};

// Helper to sign JWT
const signToken = (id) => {
  // Use 'type' to align with middleware checks (requireSalonOwner expects req.user.type === 'salon')
  return jwt.sign({ id, type: 'salon' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// Salon owner registration
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return errorResponse(res, 'Passwords do not match', 400);
  }

  // Check if user already exists
  const User = (await import('../models/User.js')).default;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return errorResponse(res, 'Email already in use', 400);
  }

  const existingSalon = await Salon.findOne({ email });
  if (existingSalon) {
    return errorResponse(res, 'Email already in use', 400);
  }

  // Create User record first
  const newUser = await User.create({
    name,
    email,
    password,
    type: 'salon',
    setupCompleted: false
  });

  // Create Salon record
  const newSalon = await Salon.create({ 
    ownerId: newUser._id,
    salonName: name,
    ownerName: name, // Add ownerName for admin dashboard
    email, 
    password,
    approvalStatus: 'pending' // Explicitly set pending status
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    success: true,
    message: 'Salon registered successfully',
    token,
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      type: newUser.type,
      setupCompleted: newUser.setupCompleted,
    },
    salon: {
      id: newSalon._id,
      name: newSalon.name,
      email: newSalon.email,
    },
  });
});

// Update additional salon details
export const updateDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { phone, gender, address, experience, salonName, salonAddress, licenseNumber } = req.body;

  const salon = await Salon.findById(id);

  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }

  salon.phone = phone;
  salon.gender = gender;
  salon.address = address;
  salon.experience = experience;
  salon.salonName = salonName;
  salon.salonAddress = salonAddress;
  salon.licenseNumber = licenseNumber;
  salon.setupCompleted = true;

  await salon.save();

  successResponse(res, salon, 'Details updated successfully');
});

// Complete salon setup
export const setupSalon = asyncHandler(async (req, res) => {
  console.log('=== SALON SETUP DEBUG ===');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  console.log('User from token:', req.user);
  
  const userId = req.user.id;
  let {
    salonName,
    salonAddress,
    contactNumber,
    businessHours,
    description,
    services
  } = req.body;

  console.log('Extracted data:', { salonName, contactNumber, description });

  if (!salonName || !contactNumber || !description) {
    console.log('Missing required fields:', { salonName: !!salonName, contactNumber: !!contactNumber, description: !!description });
    return errorResponse(res, 'Missing required fields', 400);
  }

  // Parse JSON strings coming from multipart/form-data
  try {
    if (typeof salonAddress === 'string') {
      salonAddress = JSON.parse(salonAddress);
    }
  } catch (e) {
    console.log('Error parsing salonAddress:', e.message);
    return errorResponse(res, 'Invalid salonAddress format. Must be JSON.', 400);
  }
  try {
    if (typeof businessHours === 'string') {
      businessHours = JSON.parse(businessHours);
    }
  } catch (e) {
    console.log('Error parsing businessHours:', e.message);
    return errorResponse(res, 'Invalid businessHours format. Must be JSON.', 400);
  }

  console.log('Parsed data:', { salonAddress, businessHours });

  // Get user record
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  console.log('User found:', user ? { id: user._id, email: user.email, type: user.type } : 'null');
  
  if (!user || user.type !== 'salon') {
    console.log('Invalid user or user type');
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon profile
  let salon = await Salon.findOne({ email: user.email });
  console.log('Salon found:', salon ? { id: salon._id, email: salon.email } : 'null');
  
  if (!salon) {
    console.log('Salon profile not found for email:', user.email);
    return errorResponse(res, 'Salon profile not found', 404);
  }

  // Handle uploaded files
  const documents = {};
  if (req.files) {
    console.log('Processing uploaded files:', Object.keys(req.files));
    if (req.files.businessLicense && req.files.businessLicense[0]) {
      documents.businessLicense = req.files.businessLicense[0].path;
      console.log('Business license uploaded:', documents.businessLicense);
    }
    if (req.files.salonLogo && req.files.salonLogo[0]) {
      documents.salonLogo = req.files.salonLogo[0].path;
      console.log('Salon logo uploaded:', documents.salonLogo);
    }
    if (req.files.salonImages) {
      documents.salonImages = req.files.salonImages.map(file => file.path);
      console.log('Salon images uploaded:', documents.salonImages);
    }
  } else {
    console.log('No files uploaded');
  }

  try {
    // Update salon information
    salon.salonName = salonName;
    salon.salonAddress = salonAddress;
    salon.contactNumber = contactNumber;
    salon.businessHours = businessHours;
    salon.description = description;
    salon.documents = documents;
    salon.setupCompleted = true;
    // Ensure approval status remains pending after setup
    if (!salon.approvalStatus) {
      salon.approvalStatus = 'pending';
    }

    console.log('Saving salon with data:', {
      salonName: salon.salonName,
      contactNumber: salon.contactNumber,
      description: salon.description,
      setupCompleted: salon.setupCompleted
    });

    await salon.save();
    console.log('Salon saved successfully');

    // Update user setup status
    user.setupCompleted = true;
    await user.save();
    console.log('User setup status updated');

    // Return both salon and updated user info
    const responseData = {
      salon,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        type: user.type,
        setupCompleted: user.setupCompleted,
      }
    };

    console.log('Setup completed successfully');
    return successResponse(res, responseData, 'Salon setup completed successfully');
  } catch (error) {
    console.error('Error during salon setup:', error);
    return errorResponse(res, `Setup failed: ${error.message}`, 500);
  }
});

// Get salon dashboard data
export const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  console.log('getDashboard called for userId:', userId);
  console.log('req.user:', req.user);

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  console.log('User found:', user ? { id: user._id, email: user.email, type: user.type, setupCompleted: user.setupCompleted } : 'null');
  
  if (!user) {
    console.log('User not found with ID:', userId);
    return notFoundResponse(res, 'Salon user');
  }
  
  if (user.type !== 'salon') {
    console.log('User type mismatch. Expected: salon, Found:', user.type);
    return errorResponse(res, 'Access denied: Only salon owners can access dashboard', 403);
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  console.log('Salon found:', salon ? { id: salon._id, email: salon.email, setupCompleted: salon.setupCompleted } : 'null');
  
  if (!salon) {
    console.log('Salon profile not found for email:', user.email);
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  const [
    salonInfo,
    totalStaff,
    totalServices,
    totalAppointments,
    pendingAppointments,
    todayAppointments,
    monthlyRevenue
  ] = await Promise.all([
    Salon.findById(salonId).populate('staff').populate('services').lean(),
    Staff.countDocuments({ assignedSalon: salonId, isActive: true }),
    Service.countDocuments({ salonId, isActive: true }),
    Appointment.countDocuments({ salonId }),
    Appointment.countDocuments({ salonId, status: 'Pending' }),
    Appointment.countDocuments({ 
      salonId, 
      appointmentDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    }),
    Appointment.aggregate([
      { 
        $match: { 
          salonId: salonId,
          status: 'Completed',
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ])
  ]);

  // If salonInfo is not found, it's a critical error.
  if (!salonInfo) {
    return notFoundResponse(res, 'Salon information');
  }

  const revenue = monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0;

  // Ensure a complete object is always returned
  return successResponse(res, {
    salonInfo,
    statistics: {
      totalStaff: totalStaff || 0,
      totalServices: totalServices || 0,
      totalAppointments: totalAppointments || 0,
      pendingAppointments: pendingAppointments || 0,
      todayAppointments: todayAppointments || 0,
      monthlyRevenue: revenue || 0
    }
  }, 'Dashboard data retrieved successfully');
});

// Get salon dashboard data by explicit salonId param, ensuring ownership
export const getDashboardById = asyncHandler(async (req, res) => {
  const paramSalonId = req.params.salonId;
  const userId = req.user.id;

  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Ensure the salon exists and belongs to this user (match by email)
  const salon = await Salon.findById(paramSalonId);
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }
  if (salon.email !== user.email) {
    return errorResponse(res, 'Access denied to this salon dashboard', 403);
  }

  const salonId = salon._id;

  const [
    salonInfo,
    totalStaff,
    totalServices,
    totalAppointments,
    pendingAppointments,
    todayAppointments,
    monthlyRevenue
  ] = await Promise.all([
    Salon.findById(salonId).populate('staff').populate('services').lean(),
    Staff.countDocuments({ assignedSalon: salonId, isActive: true }),
    Service.countDocuments({ salonId, isActive: true }),
    Appointment.countDocuments({ salonId }),
    Appointment.countDocuments({ salonId, status: 'Pending' }),
    Appointment.countDocuments({ 
      salonId, 
      appointmentDate: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      }
    }),
    Appointment.aggregate([
      { 
        $match: { 
          salonId: salonId,
          status: 'Completed',
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$finalAmount' } } }
    ])
  ]);

  if (!salonInfo) {
    return notFoundResponse(res, 'Salon information');
  }

  const revenue = monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0;

  return successResponse(res, {
    salonInfo,
    statistics: {
      totalStaff: totalStaff || 0,
      totalServices: totalServices || 0,
      totalAppointments: totalAppointments || 0,
      pendingAppointments: pendingAppointments || 0,
      todayAppointments: todayAppointments || 0,
      monthlyRevenue: revenue || 0
    }
  }, 'Dashboard data retrieved successfully');
});

// Get salon profile
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email })
    .populate('staff', 'name email skills employmentStatus')
    .populate('services', 'name category price isActive')
    .lean();

  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  // Convert document file paths to full URLs
  if (salon.documents) {
    salon.documents = convertDocumentsToUrls(salon.documents);
  }

  return successResponse(res, salon, 'Salon profile retrieved successfully');
});

export const getSalonStaff = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email and then fetch staff with full details
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const staffDocs = await Staff.find({ assignedSalon: salon._id })
    .populate('user', 'name email')
    .select('name email contactNumber position skills experience specialization dateOfBirth gender address approvalStatus employmentStatus isActive createdAt documents profilePicture profileImageUrl certifications')
    .lean();

  const staff = staffDocs.map(s => {
    const documents = {
      governmentId: s.documents?.governmentId || null,
      certificates: s.documents?.certificates || s.certifications || []
    };
    const profilePicture = s.profilePicture || s.profileImageUrl || null;
    return {
      ...s,
      name: s.name || s.user?.name || 'Unknown',
      email: s.email || s.user?.email || 'Unknown',
      documents: {
        governmentId: documents.governmentId ? getFileUrl(documents.governmentId) : null,
        certificates: Array.isArray(documents.certificates) ? documents.certificates.map(p => getFileUrl(p)) : []
      },
      profilePicture: profilePicture ? getFileUrl(profilePicture) : null
    };
  });

  return successResponse(res, staff, 'Salon staff retrieved successfully');
});

export const addService = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, description, duration, price, category } = req.body;

  // Find the salon of the owner
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }

  // Create new service
  const newService = await Service.create({
    salonId: salon._id,
    name,
    description,
    duration,
    price,
    category,
  });

  // Add service to salon's services array
  salon.services.push(newService._id);
  await salon.save();

  return successResponse(res, newService, 'Service added successfully');
});

// Get salon services (for salon owner)
export const getServices = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Find the salon of the owner
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }

  const filter = { salonId: salon._id };

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.active !== undefined) {
    filter.isActive = req.query.active === 'true';
  }

  const [services, totalServices] = await Promise.all([
    Service.find(filter)
      .populate('availableStaff', 'name skills')
      .skip(skip)
      .limit(limit)
      .sort({ category: 1, name: 1 }),
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

// Update salon profile
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  let updates = req.body;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  let salon = await Salon.findOne({ email: user.email });

  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }

  // Handle file uploads
  if (req.files) {
    // Initialize documents object if it doesn't exist
    if (!salon.documents) {
      salon.documents = {};
    }

    // Handle salon logo
    if (req.files.salonLogo && req.files.salonLogo[0]) {
      salon.documents.salonLogo = req.files.salonLogo[0].path;
    }

    // Handle salon images
    if (req.files.salonImage && req.files.salonImage[0]) {
      // For simplicity, we're treating salonImage as the first image in salonImages array
      if (!salon.documents.salonImages) {
        salon.documents.salonImages = [];
      }
      // Replace the first image or add as first image
      salon.documents.salonImages[0] = req.files.salonImage[0].path;
    }
  }

  // Handle address object if it comes as a stringified JSON
  if (updates.salonAddress && typeof updates.salonAddress === 'string') {
    try {
      updates.salonAddress = JSON.parse(updates.salonAddress);
    } catch (error) {
      return errorResponse(res, 'Invalid address format. Expected a JSON object.', 400);
    }
  }

  // Remove sensitive fields that shouldn't be updated this way
  delete updates.password;
  delete updates.email;
  delete updates._id;
  delete updates.salonLogo; // Remove file fields from updates as they're handled separately
  delete updates.salonImage;

  // Update salon with new data
  Object.keys(updates).forEach(key => {
    salon[key] = updates[key];
  });

  await salon.save();

  // Convert document file paths to full URLs for response
  const salonResponse = salon.toObject();
  if (salonResponse.documents) {
    salonResponse.documents = convertDocumentsToUrls(salonResponse.documents);
  }

  return successResponse(res, salonResponse, 'Profile updated successfully');
});

// Get available staff (not assigned to any salon)
export const getAvailableStaff = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {
    isActive: true,
    employmentStatus: 'Available',
    setupCompleted: true
  };

  if (req.query.skills) {
    const skills = req.query.skills.split(',');
    filter.skills = { $in: skills };
  }

  const [staff, totalStaff] = await Promise.all([
    Staff.find(filter)
      .select('name email skills experience contactNumber profilePicture')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Staff.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalStaff / limit);

  return paginatedResponse(res, staff, {
    page,
    limit,
    totalPages,
    totalItems: totalStaff
  });
});

// Hire staff member
export const hireStaff = asyncHandler(async (req, res) => {
  const salonId = req.user.id;
  const { staffId, salary, joiningDate } = req.body;

  const [salon, staff] = await Promise.all([
    Salon.findById(salonId),
    Staff.findById(staffId)
  ]);

  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }

  if (!staff) {
    return notFoundResponse(res, 'Staff member');
  }

  if (staff.employmentStatus !== 'Available') {
    return errorResponse(res, 'Staff member is not available for hire', 400);
  }

  // Update staff employment details
  staff.assignedSalon = salonId;
  staff.employmentStatus = 'Employed';
  staff.salary = salary;
  staff.joiningDate = joiningDate || new Date();

  await staff.save();

  // Add staff to salon's staff array
  await salon.addStaff(staffId);

  return successResponse(res, staff, 'Staff member hired successfully');
});

// Remove staff member
export const removeStaff = asyncHandler(async (req, res) => {
  const salonId = req.user.id;
  const { staffId } = req.params;

  const [salon, staff] = await Promise.all([
    Salon.findById(salonId),
    Staff.findById(staffId)
  ]);

  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }

  if (!staff) {
    return notFoundResponse(res, 'Staff member');
  }

  if (staff.assignedSalon.toString() !== salonId.toString()) {
    return errorResponse(res, 'This staff member is not assigned to your salon', 403);
  }

  // Update staff employment status
  staff.assignedSalon = null;
  staff.employmentStatus = 'Available';
  staff.salary = undefined;

  await staff.save();

  // Remove staff from salon's staff array
  await salon.removeStaff(staffId);

  return successResponse(res, null, 'Staff member removed successfully');
});

// Get salon appointments
export const getAppointments = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  
  if (!user) {
    return notFoundResponse(res, 'Salon user');
  }
  
  if (user.type !== 'salon') {
    return errorResponse(res, 'Access denied: Only salon owners can access appointments', 403);
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;
  const filter = { salonId };

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.date) {
    const date = new Date(req.query.date);
    filter.appointmentDate = {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999))
    };
  }

  console.log('Fetching appointments with filter:', filter);

  const [appointments, totalAppointments] = await Promise.all([
    Appointment.find(filter)
      .populate('customerId', 'name email')
      .populate('staffId', 'name skills')
      .populate('services.serviceId', 'name price duration')
      .skip(skip)
      .limit(limit)
      .sort({ appointmentDate: -1, appointmentTime: -1 }),
    Appointment.countDocuments(filter)
  ]);

  console.log(`Found ${appointments.length} appointments for salon ${salonId}`);
  console.log('🔧 Appointment IDs:', appointments.map(apt => apt._id));
  
  // Debug: Log the first appointment to see the populated data structure
  if (appointments.length > 0) {
    console.log('Sample appointment data:', JSON.stringify(appointments[0], null, 2));
    console.log('Customer data in first appointment:', appointments[0].customerId);
  }

  const totalPages = Math.ceil(totalAppointments / limit);

  return paginatedResponse(res, appointments, {
    page,
    limit,
    totalPages,
    totalItems: totalAppointments
  });
});

// Get staff availability with appointments
export const getStaffAvailability = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return errorResponse(res, 'Access denied: Only salon owners can access staff availability', 403);
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Get staff assigned to this salon
  const staff = await Staff.find({
    assignedSalon: salonId,
    isActive: true,
    approvalStatus: 'approved'
  })
  .select('name email position skills availability contactNumber profilePicture')
  .sort({ name: 1 });

  // Get appointments for the date range
  let appointmentFilter = {
    salonId: salonId,
    status: { $in: ['Pending', 'Approved', 'In-Progress'] }
  };

  if (startDate && endDate) {
    // Since appointmentDate is stored as string in YYYY-MM-DDTHH:mm format,
    // we need to do string comparison rather than Date comparison
    appointmentFilter.appointmentDate = {
      $gte: startDate + 'T00:00',
      $lte: endDate + 'T23:59'
    };
    
    console.log('🗓️ Date filter applied:', {
      startDate: startDate + 'T00:00',
      endDate: endDate + 'T23:59'
    });
  }

  const appointments = await Appointment.find(appointmentFilter)
    .populate('staffId', 'name position')
    .populate('customerId', 'name email phone')
    .populate('services.serviceId', 'name duration')
    .sort({ appointmentDate: 1, appointmentTime: 1 });

  console.log('🔍 Staff Availability Debug:', {
    salonId,
    appointmentFilter,
    totalAppointments: appointments.length,
    appointmentStatuses: appointments.map(apt => ({ id: apt._id, status: apt.status, staffId: apt.staffId?.name || 'Unassigned' }))
  });

  // Group appointments by staff
  const staffAppointments = staff.map(staffMember => {
    const staffAppts = appointments.filter(apt =>
      apt.staffId && apt.staffId._id.toString() === staffMember._id.toString()
    );
    
    console.log(`👤 Staff ${staffMember.name} appointments:`, {
      staffId: staffMember._id,
      appointmentCount: staffAppts.length,
      appointments: staffAppts.map(apt => ({ id: apt._id, status: apt.status, date: apt.appointmentDate }))
    });

    return {
      staff: {
        _id: staffMember._id,
        name: staffMember.name,
        position: staffMember.position || 'Staff',
        availability: staffMember.availability
      },
      appointments: staffAppts.map(apt => ({
        _id: apt._id,
        date: apt.appointmentDate,
        time: apt.appointmentTime,
        status: apt.status,
        duration: apt.estimatedDuration || apt.services.reduce((total, service) => total + (service.duration || 0), 0),
        customer: apt.customerId ? apt.customerId.name : 'Unknown Customer',
        services: apt.services.map(s => s.serviceName || (s.serviceId ? s.serviceId.name : 'Service')),
        staffName: staffMember.name,
        staffId: staffMember._id
      }))
    };
  });

  // Get unassigned appointments (no staff assigned)
  const unassignedAppointments = appointments.filter(apt => !apt.staffId).map(apt => ({
    _id: apt._id,
    date: apt.appointmentDate,
    time: apt.appointmentTime,
    status: apt.status,
    duration: apt.estimatedDuration || apt.services.reduce((total, service) => total + (service.duration || 0), 0),
    customer: apt.customerId ? apt.customerId.name : 'Unknown Customer',
    services: apt.services.map(s => s.serviceName || (s.serviceId ? s.serviceId.name : 'Service')),
    staffName: 'Unassigned',
    staffId: null
  }));

  // Add unassigned appointments as a separate "staff" entry
  if (unassignedAppointments.length > 0) {
    staffAppointments.push({
      staff: {
        _id: 'unassigned',
        name: 'Unassigned Appointments',
        position: 'Pending Assignment',
        availability: null
      },
      appointments: unassignedAppointments
    });
  }

  return successResponse(res, { staffAppointments }, 'Staff availability data retrieved successfully');
});

// Update appointment status
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  try {
    // req.user.id is the User._id. We need the corresponding Salon._id for filtering appointments.
    const userId = req.user.id;
    const { appointmentId } = req.params;
    const { status, salonNotes } = req.body;

    // Resolve salon profile by authenticated salon owner's user record (email link)
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can update appointment status', 403);
    }
    const salonProfile = await Salon.findOne({ email: user.email });
    if (!salonProfile) {
      return notFoundResponse(res, 'Salon profile');
    }
    const salonId = salonProfile._id;

    console.log('🔧 Update appointment status request:', {
      salonId,
      appointmentId,
      status,
      salonNotes
    });

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      salonId: salonId
    }).populate('customerId').populate('salonId');

    console.log('🔧 Found appointment:', appointment ? 'Yes' : 'No');

    if (!appointment) {
      return notFoundResponse(res, 'Appointment');
    }

    await appointment.updateStatus(status);

    if (salonNotes) {
      appointment.salonNotes = salonNotes;
      await appointment.save();
    }

    if (status === 'Approved') {
      const customer = appointment.customerId;
      const salon = appointment.salonId;

      if (customer && salon) {
        const appointmentDetails = {
          salonName: salon.salonName,
          date: new Date(appointment.appointmentDate).toLocaleDateString(),
          time: appointment.appointmentTime,
          services: appointment.services.map(s => s.serviceName),
          totalAmount: appointment.totalAmount
        };

        await sendAppointmentConfirmation(customer.email, customer.name, appointmentDetails);
      }
    }

    return successResponse(res, appointment, 'Appointment status updated successfully');
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return errorResponse(res, `Failed to update appointment status: ${error.message}`, 500);
  }
});

// Get service categories with revenue breakdown for salon owner
export const getServiceCategories = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Find the salon of the owner
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }

  const salonId = salon._id;
  
  // Get service categories with count and revenue
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

  const categoryData = await Appointment.aggregate([
    {
      $match: {
        salonId: salonId,
        status: 'Completed',
        createdAt: { $gte: startOfMonth, $lt: endOfMonth }
      }
    },
    { $unwind: '$services' },
    {
      $lookup: {
        from: 'services',
        localField: 'services.serviceId',
        foreignField: '_id',
        as: 'serviceDetails'
      }
    },
    { $unwind: { path: '$serviceDetails', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$serviceDetails.category',
        total_revenue: { $sum: '$services.price' },
        service_count: { $sum: 1 },
        services: { $addToSet: '$services.serviceName' }
      }
    },
    { $sort: { total_revenue: -1 } }
  ]);

  if (categoryData.length === 0) {
    return successResponse(res, [], 'No category data available for this salon');
  }

  const totalRevenue = categoryData.reduce((sum, cat) => sum + cat.total_revenue, 0);
  const response = categoryData.map(cat => ({
    category: cat._id || 'Uncategorized',
    total_revenue: cat.total_revenue,
    service_count: cat.service_count,
    services: cat.services,
    percentage: totalRevenue > 0 ? Math.round((cat.total_revenue / totalRevenue) * 100) : 0
  }));

  return successResponse(res, response, 'Service categories retrieved successfully');
});
export const getRevenueByService = asyncHandler(async (req, res) => {
  // Resolve authenticated salon owner -> salon profile
  const userId = req.user?.id;
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return errorResponse(res, 'Access denied: Only salon owners can view revenue', 403);
  }

  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Limit to current month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

  // First try to get data from Revenue collection
  let revenueData = await Revenue.aggregate([
    { $match: { salonId: salonId, date: { $gte: startOfMonth, $lt: endOfMonth } } },
    { $group: { _id: '$service', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } }
  ]);

  // Fallback for legacy records where salonId may be stored as string
  if (revenueData.length === 0) {
    revenueData = await Revenue.aggregate([
      { $match: { salonId: salonId.toString(), date: { $gte: startOfMonth, $lt: endOfMonth } } },
      { $group: { _id: '$service', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
  }

  // If no Revenue records exist, calculate from completed appointments
  if (revenueData.length === 0) {
    console.log('No Revenue records found, calculating from completed appointments...');
    
    const appointmentRevenue = await Appointment.aggregate([
      {
        $match: {
          salonId: salonId,
          status: 'Completed',
          createdAt: { $gte: startOfMonth, $lt: endOfMonth }
        }
      },
      { $unwind: '$services' },
      {
        $group: {
          _id: '$services.serviceName',
          total: { $sum: '$services.price' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    revenueData = appointmentRevenue;
  }

  if (revenueData.length === 0) {
    return successResponse(res, [], 'No revenue data available for this salon');
  }

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.total, 0);
  const response = revenueData.map(item => ({
    service: item._id || 'Unknown Service',
    total_revenue: item.total,
    transaction_count: item.count,
    percentage: totalRevenue > 0 ? Math.round((item.total / totalRevenue) * 100) : 0
  }));

  return successResponse(res, response, 'Revenue data retrieved successfully');
});

// Add expense for salon
export const addExpense = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return errorResponse(res, 'Access denied: Only salon owners can add expenses', 403);
  }

  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const { category, amount, description, date } = req.body;

  const expense = await Expense.create({
    salonId: salon._id,
    category,
    amount,
    description,
    date: date ? new Date(date) : new Date()
  });

  return successResponse(res, expense, 'Expense added successfully');
});

// Get salon expenses
export const getExpenses = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return errorResponse(res, 'Access denied: Only salon owners can view expenses', 403);
  }

  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const filter = { salonId: salon._id };
  
  // Apply category filter if provided
  if (req.query.category) {
    filter.category = req.query.category;
  }
  
  // Apply date range filter if provided
  if (req.query.startDate && req.query.endDate) {
    filter.date = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  const [expenses, totalExpenses] = await Promise.all([
    Expense.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ date: -1 }),
    Expense.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalExpenses / limit);

  return paginatedResponse(res, expenses, {
    page,
    limit,
    totalPages,
    totalItems: totalExpenses
  });
});

// Get expense summary by category
export const getExpenseSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  
  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return errorResponse(res, 'Access denied: Only salon owners can view expense summary', 403);
  }

  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Get expense summary by category
  const expenseSummary = await Expense.aggregate([
    { $match: { salonId: salonId } },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);

  const totalExpenses = expenseSummary.reduce((sum, item) => sum + item.total, 0);
  
  const response = expenseSummary.map(item => ({
    category: item._id,
    total_amount: item.total,
    transaction_count: item.count,
    percentage: totalExpenses > 0 ? Math.round((item.total / totalExpenses) * 100) : 0
  }));

  return successResponse(res, response, 'Expense summary retrieved successfully');
});

// Update expense
export const updateExpense = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { expenseId } = req.params;
  
  // Find user and verify salon owner
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return errorResponse(res, 'Access denied: Only salon owners can update expenses', 403);
  }

  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const { category, amount, description, date } = req.body;

  // Find and update the expense
  const expense = await Expense.findOneAndUpdate(
    { _id: expenseId, salonId: salon._id },
    {
      category,
      amount,
      description,
      date: date ? new Date(date) : new Date(),
      updatedAt: new Date()
    },
    { new: true }
  );

  if (!expense) {
    return notFoundResponse(res, 'Expense');
  }

  return successResponse(res, expense, 'Expense updated successfully');
});

// Delete expense
export const deleteExpense = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { expenseId } = req.params;
  
  // Find user and verify salon owner
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return errorResponse(res, 'Access denied: Only salon owners can delete expenses', 403);
  }

  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  // Find and delete the expense
  const expense = await Expense.findOneAndDelete({ _id: expenseId, salonId: salon._id });

  if (!expense) {
    return notFoundResponse(res, 'Expense');
  }

  return successResponse(res, null, 'Expense deleted successfully');
});

// Get salon locations for map display
export const getSalonLocations = asyncHandler(async (req, res) => {
  const salons = await Salon.find({ isActive: true, setupCompleted: true })
    .select('salonName salonAddress')
    .lean();

  const locations = (salons || []).map((s) => {
    // Normalize address
    let address = '';
    if (typeof s.salonAddress === 'string') {
      address = s.salonAddress;
    } else if (s.salonAddress && typeof s.salonAddress === 'object') {
      const { street, city, state, postalCode, addressLine1, addressLine2 } = s.salonAddress;
      address = [addressLine1 || street, addressLine2, city, state, postalCode].filter(Boolean).join(', ');
    }

    // Try common coordinate shapes inside salonAddress
    const addr = s.salonAddress || {};
    // Accept numbers or numeric strings
    const rawLat = addr.lat ?? addr.latitude ?? addr?.geo?.lat ?? null;
    const rawLng = addr.lng ?? addr.longitude ?? addr?.geo?.lng ?? null;
    const lat = typeof rawLat === 'string' ? Number(rawLat) : rawLat;
    const lng = typeof rawLng === 'string' ? Number(rawLng) : rawLng;

    return {
      name: s.salonName || 'Salon',
      address: address || '',
      lat,
      lng,
    };
  });

  return successResponse(res, locations, 'Salon locations retrieved');
});

export default {
  register,
  updateDetails,
  setupSalon,
  getDashboard,
  getDashboardById,
  getProfile,
  updateProfile,
  getAvailableStaff,
  hireStaff,
  removeStaff,
  getAppointments,
  updateAppointmentStatus,
  getSalonStaff,
  addService,
  getServices,
  getServiceCategories,
  getRevenueByService,
  addExpense,
  getExpenses,
  getExpenseSummary,
  updateExpense,
  deleteExpense,
  getSalonLocations
};