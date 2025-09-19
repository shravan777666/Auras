import Salon from '../models/Salon.js';
import Staff from '../models/Staff.js';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import jwt from 'jsonwebtoken';
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
    .populate('services', 'name category price isActive');

  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
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

// Update salon profile
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updates = req.body;

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

  // Remove sensitive fields that shouldn't be updated this way
  delete updates.password;
  delete updates.email;
  delete updates._id;

  salon = await Salon.findByIdAndUpdate(
    salon._id,
    { ...updates },
    { new: true, runValidators: true }
  );

  return successResponse(res, salon, 'Profile updated successfully');
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

// Update appointment status
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const salonId = req.user.id;
  const { appointmentId } = req.params;
  const { status, salonNotes } = req.body;

  const appointment = await Appointment.findOne({
    _id: appointmentId,
    salonId: salonId
  });

  if (!appointment) {
    return notFoundResponse(res, 'Appointment');
  }

  await appointment.updateStatus(status);

  if (salonNotes) {
    appointment.salonNotes = salonNotes;
    await appointment.save();
  }

  return successResponse(res, appointment, 'Appointment status updated successfully');
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
  addService
};