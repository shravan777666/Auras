import Salon from '../models/Salon.js';
import Staff from '../models/Staff.js';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import Revenue from '../models/Revenue.js';
import Expense from '../models/Expense.js';
import StaffNotification from '../models/StaffNotification.js';
import jwt from 'jsonwebtoken';
import { sendAppointmentConfirmation } from '../utils/email.js';
import { 
  successResponse, 
  paginatedResponse,
  notFoundResponse,
  errorResponse,
  asyncHandler 
} from '../utils/responses.js';

// Helper function to convert file path to full URL
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  const baseUrl = process.env.BASE_URL || 'http://localhost:' + (process.env.PORT || 5002);
  return baseUrl + '/' + filePath.replace(/\\/g, '/');
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
    .select('name email contactNumber position skills experience specialization dateOfBirth gender address approvalStatus employmentStatus isActive createdAt documents profilePicture profileImageUrl certifications baseSalary salaryType commissionRate')
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

// Get global staff directory for salon owners (all staff on platform)
export const getGlobalStaffDirectory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, search, location, salon, skills, experience } = req.query;

  // Verify salon owner access
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return errorResponse(res, 'Access denied: Only salon owners can view global staff directory', 403);
  }

  // Build filter query
  let filter = { 
    approvalStatus: 'approved',
    isActive: true 
  };

  // Search by name, skills, or specialization
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { skills: { $in: [new RegExp(search, 'i')] } },
      { specialization: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by location/city
  if (location) {
    filter['address.city'] = { $regex: location, $options: 'i' };
  }

  // Filter by specific salon
  if (salon) {
    filter.assignedSalon = salon;
  }

  // Filter by skills
  if (skills) {
    const skillsArray = skills.split(',').map(s => s.trim());
    filter.skills = { $in: skillsArray };
  }

  // Filter by experience level
  if (experience) {
    const expLevel = parseInt(experience);
    if (expLevel === 0) {
      filter['experience.years'] = { $lte: 1 };
    } else if (expLevel === 1) {
      filter['experience.years'] = { $gte: 1, $lte: 3 };
    } else if (expLevel === 2) {
      filter['experience.years'] = { $gte: 3, $lte: 5 };
    } else if (expLevel === 3) {
      filter['experience.years'] = { $gt: 5 };
    }
  }

  try {
    // Get total count for pagination
    const totalStaff = await Staff.countDocuments(filter);

    // Fetch staff with pagination and populate salon info
    const staffDocs = await Staff.find(filter)
      .populate('assignedSalon', 'name address phone email')
      .select('name email contactNumber position skills experience specialization gender address approvalStatus employmentStatus isActive createdAt profilePicture assignedSalon')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Format staff data for global directory (privacy-filtered)
    const globalStaff = staffDocs.map(staff => ({
      _id: staff._id,
      name: staff.name,
      email: staff.email,
      contactNumber: staff.contactNumber,
      position: staff.position,
      skills: staff.skills || [],
      experience: {
        years: staff.experience?.years || 0,
        description: staff.experience?.description || ''
      },
      specialization: staff.specialization,
      profilePicture: staff.profilePicture ? getFileUrl(staff.profilePicture) : null,
      status: staff.employmentStatus || 'Available',
      location: {
        city: staff.address?.city || '',
        state: staff.address?.state || ''
      },
      salon: staff.assignedSalon ? {
        _id: staff.assignedSalon._id,
        name: staff.assignedSalon.name,
        location: `${staff.assignedSalon.address?.city || ''}, ${staff.assignedSalon.address?.state || ''}`.replace(/^, |, $/, ''),
        phone: staff.assignedSalon.phone
      } : null,
      joinedDate: staff.createdAt
    }));

    return successResponse(res, {
      staff: globalStaff,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalStaff,
        pages: Math.ceil(totalStaff / parseInt(limit))
      }
    }, 'Global staff directory retrieved successfully');

  } catch (error) {
    console.error('Error fetching global staff directory:', error);
    return errorResponse(res, 'Failed to retrieve global staff directory', 500);
  }
});

// Mark staff attendance for a specific date
export const markStaffAttendance = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { staffId } = req.params;
    const { date, status = 'Present', checkInTime, checkOutTime, notes } = req.body;

    // Get user record to find salon
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return notFoundResponse(res, 'Salon user');
    }

    // Find salon by email
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    // Verify that the staff member belongs to this salon
    const staff = await Staff.findOne({ _id: staffId, assignedSalon: salon._id });
    if (!staff) {
      return errorResponse(res, 'Staff member not found or not assigned to your salon', 404);
    }

    // Import Attendance model
    const Attendance = (await import('../models/Attendance.js')).default;

    // Create or update attendance record
    const attendanceRecord = await Attendance.findOneAndUpdate(
      { staffId, date },
      {
        staffId,
        salonId: salon._id,
        date,
        status,
        checkInTime,
        checkOutTime,
        notes,
        createdBy: userId
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Return success response
    return successResponse(res, attendanceRecord, 'Attendance marked successfully');
  } catch (error) {
    console.error('Error marking staff attendance:', error);
    return errorResponse(res, `Failed to mark attendance: ${error.message}`, 500);
  }
});

// Add shift for staff member
export const addStaffShift = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { staffId } = req.params;
    const { date, startTime, endTime, notes } = req.body;

    // Get user record to find salon
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return notFoundResponse(res, 'Salon user');
    }

    // Find salon by email
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    // Verify that the staff member belongs to this salon
    const staff = await Staff.findOne({ _id: staffId, assignedSalon: salon._id });
    if (!staff) {
      return errorResponse(res, 'Staff member not found or not assigned to your salon', 404);
    }

    // Import Appointment model
    const Appointment = (await import('../models/Appointment.js')).default;

    // Use a fixed dummy customer ID for staff shifts
    const DUMMY_CUSTOMER_ID = '000000000000000000000000';

    // Create a shift/block in the appointments collection
    const shiftRecord = await Appointment.create({
      salonId: salon._id,
      customerId: DUMMY_CUSTOMER_ID,
      staffId: staff._id,
      appointmentDate: date + 'T' + (startTime || '09:00'), // Ensure date and time are combined
      appointmentTime: startTime || '09:00',
      estimatedDuration: startTime && endTime ? 
        // Calculate duration in minutes
        ((parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1])) - 
         (parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]))) : 
        60, // Default to 1 hour if not specified
      status: 'STAFF_BLOCKED',
      customerNotes: notes || 'Staff shift/block',
      isFirstVisit: false,
      source: 'Salon'
    });

    // Return success response
    return successResponse(res, shiftRecord, 'Shift added successfully');
  } catch (error) {
    console.error('Error adding staff shift:', error);
    return errorResponse(res, `Failed to add shift: ${error.message}`, 500);
  }
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

  // By default, only show active services unless specifically requesting inactive ones
  if (req.query.active !== undefined) {
    filter.isActive = req.query.active === 'true';
  } else {
    filter.isActive = true;
  }

  if (req.query.category) {
    filter.category = req.query.category;
  }

  // Handle low bookings filter
  if (req.query.filter === 'low_bookings') {
    filter.totalBookings = { $lt: 5 }; // Services with less than 5 bookings
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
    // Format the date to match the appointmentDate format (YYYY-MM-DDTHH:mm)
    const dateStr = req.query.date; // This should be in YYYY-MM-DD format
    filter.appointmentDate = {
      $gte: dateStr + 'T00:00',
      $lt: dateStr + 'T23:59'
    };
    console.log('🔧 Appointment list date filter applied:', filter);
  }

  console.log('🔧 Fetching appointments with filter:', filter);

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

  console.log('🔧 Found ' + appointments.length + ' appointments for salon ' + salonId);
  console.log('🔧 Appointment IDs:', appointments.map(apt => apt._id));
  
  // Debug: Log the first appointment to see the populated data structure
  if (appointments.length > 0) {
    console.log('🔧 Sample appointment data:', JSON.stringify(appointments[0], null, 2));
    console.log('🔧 Customer data in first appointment:', appointments[0].customerId);
  }

  const totalPages = Math.ceil(totalAppointments / limit);

  return paginatedResponse(res, appointments, {
    page,
    limit,
    totalPages,
    totalItems: totalAppointments
  });
});

// Get appointment counts by status
export const getAppointmentCounts = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    
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
    const { date } = req.query;

    console.log('🔧 Appointment counts request:', { userId, salonId, date });

    const filter = { salonId: salonId };

    if (date) {
      // Format the date to match the appointmentDate format (YYYY-MM-DDTHH:mm)
      const dateStr = date; // This should be in YYYY-MM-DD format from the frontend
      filter.appointmentDate = {
        $gte: dateStr + 'T00:00',
        $lt: dateStr + 'T23:59'
      };
      console.log('🔧 Date filter applied:', filter);
    }
    
    // Debug: Check how many appointments exist for this salon
    const totalAppointments = await Appointment.countDocuments({ salonId: salonId });
    console.log('🔧 Total appointments for salon:', totalAppointments);
    
    // Debug: Check how many appointments match our filter
    const filteredAppointmentsCount = await Appointment.countDocuments(filter);
    console.log('🔧 Filtered appointments count:', filteredAppointmentsCount);
    
    // Use aggregation to get counts for all statuses in one query
    const countsResult = await Appointment.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('🔧 Aggregation result:', countsResult);
    
    // Transform the result into a more usable format
    const counts = {
      total: 0,
      Pending: 0,
      Approved: 0,
      'In-Progress': 0,
      Completed: 0,
      Cancelled: 0
    };
    
    // Calculate total and populate status counts
    countsResult.forEach(item => {
      counts.total += item.count;
      // Map the status to our expected keys
      if (item._id === 'In-Progress') {
        counts['In-Progress'] = item.count;
      } else {
        counts[item._id] = item.count;
      }
    });
    
    console.log('🔧 Final counts result:', counts);
    
    successResponse(res, counts, 'Appointment counts retrieved successfully');
  } catch (error) {
    console.error('Error fetching appointment counts:', error);
    errorResponse(res, 'Failed to fetch appointment counts', 500);
  }
});

// Get staff availability with appointments
export const getStaffAvailability = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  try {
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
      status: { $in: ['Pending', 'Approved', 'In-Progress', 'STAFF_BLOCKED'] } // Include STAFF_BLOCKED
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
      .populate('customerId', 'name email phone profilePic')
      .populate('services.serviceId', 'name duration')
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    // Get attendance records for the date range
    let attendanceFilter = {
      salonId: salonId
    };

    if (startDate && endDate) {
      attendanceFilter.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Import Attendance model
    const Attendance = (await import('../models/Attendance.js')).default;
    const attendanceRecords = await Attendance.find(attendanceFilter)
      .populate('staffId', 'name')
      .sort({ date: 1 });

    console.log('🔍 Staff Availability Debug:', {
      salonId,
      appointmentFilter,
      totalAppointments: appointments.length,
      totalAttendanceRecords: attendanceRecords.length,
      appointmentStatuses: appointments.map(apt => ({ id: apt._id, status: apt.status, staffId: apt.staffId?.name || 'Unassigned' }))
    });

    // Group appointments by staff
    const staffAppointments = staff.map(staffMember => {
      const staffAppts = appointments.filter(apt =>
        apt.staffId && apt.staffId._id && staffMember._id && 
        apt.staffId._id.toString() === staffMember._id.toString()
      );
      
      // Get attendance records for this staff member
      const staffAttendance = attendanceRecords.filter(record => 
        record.staffId && record.staffId._id && staffMember._id &&
        record.staffId._id.toString() === staffMember._id.toString()
      );

      console.log('👤 Staff ' + staffMember.name + ' appointments:', {
        staffId: staffMember._id,
        appointmentCount: staffAppts.length,
        attendanceCount: staffAttendance.length,
        appointments: staffAppts.map(apt => ({ id: apt._id, status: apt.status, date: apt.appointmentDate })),
        attendance: staffAttendance.map(record => ({ date: record.date, status: record.status }))
      });

      return {
        staff: {
          _id: staffMember._id,
          name: staffMember.name,
          position: staffMember.position || 'Staff',
          availability: staffMember.availability
        },
        appointments: staffAppts.map(apt => {
          // Extract time from appointmentDate if it contains time, otherwise use appointmentTime
          let timeToDisplay = apt.appointmentTime;
          if (apt.appointmentDate && apt.appointmentDate.includes('T')) {
            const timePart = apt.appointmentDate.split('T')[1];
            if (timePart) {
              timeToDisplay = timePart.substring(0, 5); // Get HH:mm part
            }
          }
          
          return {
            _id: apt._id,
            date: apt.appointmentDate,
            time: timeToDisplay,
            status: apt.status,
            duration: apt.estimatedDuration || apt.services.reduce((total, service) => total + (service.duration || 0), 0),
            customer: apt.customerId ? apt.customerId.name : 'Unknown Customer',
            customerEmail: apt.customerId ? apt.customerId.email : null,
            customerPhone: apt.customerId ? apt.customerId.phone : null,
            customerProfilePic: apt.customerId && apt.customerId.profilePic ? getFileUrl(apt.customerId.profilePic) : null,
            services: apt.services.map(s => s.serviceName || (s.serviceId ? s.serviceId.name : 'Service')),
            staffName: staffMember.name,
            staffId: staffMember._id
          };
        }),
        attendance: staffAttendance.map(record => ({
          date: record.date,
          status: record.status,
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          notes: record.notes
        }))
      };
    });

    // Get unassigned appointments (no staff assigned)
    const unassignedAppointments = appointments.filter(apt => !apt.staffId).map(apt => {
      // Extract time from appointmentDate if it contains time, otherwise use appointmentTime
      let timeToDisplay = apt.appointmentTime;
      if (apt.appointmentDate && apt.appointmentDate.includes('T')) {
        const timePart = apt.appointmentDate.split('T')[1];
        if (timePart) {
          timeToDisplay = timePart.substring(0, 5); // Get HH:mm part
        }
      }
      
      return {
        _id: apt._id,
        date: apt.appointmentDate,
        time: timeToDisplay,
        status: apt.status,
        duration: apt.estimatedDuration || apt.services.reduce((total, service) => total + (service.duration || 0), 0),
        customer: apt.customerId ? apt.customerId.name : 'Unknown Customer',
        customerEmail: apt.customerId ? apt.customerId.email : null,
        customerPhone: apt.customerId ? apt.customerId.phone : null,
        customerProfilePic: apt.customerId && apt.customerId.profilePic ? getFileUrl(apt.customerId.profilePic) : null,
        services: apt.services.map(s => s.serviceName || (s.serviceId ? s.serviceId.name : 'Service')),
        staffName: 'Unassigned',
        staffId: null
      };
    });

    // Add unassigned appointments as a separate "staff" entry
    if (unassignedAppointments.length > 0) {
      staffAppointments.push({
        staff: {
          _id: 'unassigned',
          name: 'Unassigned Appointments',
          position: 'Pending Assignment',
          availability: null
        },
        appointments: unassignedAppointments,
        attendance: [] // No attendance for unassigned appointments
      });
    }

    return successResponse(res, { staffAppointments }, 'Staff availability data retrieved successfully');
  } catch (error) {
    console.error('Error in getStaffAvailability:', error);
    return errorResponse(res, `Failed to retrieve staff availability: ${error.message}`, 500);
  }
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

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Get all services for this salon with their categories
  const services = await Service.find({ salonId, isActive: true });

  // Get completed appointments for revenue calculation
  const completedAppointments = await Appointment.find({
    salonId,
    status: 'Completed'
  }).populate('services.serviceId', 'category');

  // Calculate revenue by category
  const categoryRevenue = {};
  const categoryBookings = {};

  // Initialize categories from services
  services.forEach(service => {
    const category = service.category || 'Uncategorized';
    if (!categoryRevenue[category]) {
      categoryRevenue[category] = 0;
      categoryBookings[category] = 0;
    }
  });

  // Calculate revenue from completed appointments
  completedAppointments.forEach(appointment => {
    appointment.services.forEach(service => {
      const serviceId = service.serviceId;
      const category = serviceId?.category || 'Uncategorized';
      const revenue = service.price || 0;
      
      if (!categoryRevenue[category]) {
        categoryRevenue[category] = 0;
        categoryBookings[category] = 0;
      }
      
      categoryRevenue[category] += revenue;
      categoryBookings[category] += 1;
    });
  });

  // Format response
  const categories = Object.keys(categoryRevenue).map(category => ({
    name: category,
    revenue: categoryRevenue[category],
    bookings: categoryBookings[category],
    averageRevenue: categoryBookings[category] > 0 ? 
      (categoryRevenue[category] / categoryBookings[category]).toFixed(2) : '0.00'
  }));

  return successResponse(res, categories, 'Service categories retrieved successfully');
});

// Get revenue by service for salon owner
export const getRevenueByService = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Build date filter
  const dateFilter = { salonId, status: 'Completed' };
  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Get completed appointments with service details
  const appointments = await Appointment.find(dateFilter)
    .populate('services.serviceId', 'name category price');

  // Calculate revenue by service
  const serviceRevenue = {};

  appointments.forEach(appointment => {
    appointment.services.forEach(service => {
      const serviceId = service.serviceId?._id?.toString() || 'unknown';
      const serviceName = service.serviceId?.name || 'Unknown Service';
      const serviceCategory = service.serviceId?.category || 'Uncategorized';
      const revenue = service.price || 0;
      const bookings = 1;

      if (!serviceRevenue[serviceId]) {
        serviceRevenue[serviceId] = {
          name: serviceName,
          category: serviceCategory,
          revenue: 0,
          bookings: 0
        };
      }

      serviceRevenue[serviceId].revenue += revenue;
      serviceRevenue[serviceId].bookings += bookings;
    });
  });

  // Convert to array and sort by revenue
  const services = Object.values(serviceRevenue)
    .sort((a, b) => b.revenue - a.revenue);

  return successResponse(res, services, 'Revenue by service retrieved successfully');
});

// Add expense
export const addExpense = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { amount, category, description, date } = req.body;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Create new expense
  const newExpense = await Expense.create({
    salonId,
    amount,
    category,
    description,
    date: date || new Date()
  });

  return successResponse(res, newExpense, 'Expense added successfully');
});

// Get expenses
// Updated to include staff salary expense records
export const getExpenses = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, category, startDate, endDate } = req.query;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build filter
  const filter = { salonId };
  if (category) {
    filter.category = category;
  }
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const [expenses, totalExpenses] = await Promise.all([
    Expense.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip),
    Expense.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalExpenses / limit);

  // Calculate monthly expenses for comparison
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  
  // Previous month dates for comparison
  const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfPreviousMonth = startOfMonth;

  // Get current month's expenses
  const currentMonthExpensesResult = await Expense.aggregate([
    {
      $match: { 
        salonId: salonId, 
        date: { $gte: startOfMonth, $lt: endOfMonth } 
      } 
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  // Get previous month's expenses for comparison
  const previousMonthExpensesResult = await Expense.aggregate([
    {
      $match: { 
        salonId: salonId, 
        date: { $gte: startOfPreviousMonth, $lt: endOfPreviousMonth } 
      } 
    },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const currentMonthExpenses = currentMonthExpensesResult.length > 0 ? currentMonthExpensesResult[0].total : 0;
  const previousMonthExpenses = previousMonthExpensesResult.length > 0 ? previousMonthExpensesResult[0].total : 0;

  // Calculate percentage change for monthly expenses
  let monthlyExpensesChange = 0;
  let monthlyExpensesChangeStatus = "N/A";
  if (previousMonthExpenses > 0) {
    monthlyExpensesChange = ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100;
    monthlyExpensesChangeStatus = monthlyExpensesChange >= 0 ? "negative" : "positive"; // Expenses increase is negative
  } else if (previousMonthExpenses === 0 && currentMonthExpenses > 0) {
    monthlyExpensesChange = "N/A"; // No previous data to compare
    monthlyExpensesChangeStatus = "negative";
  }

  // Get 12-month historical trend data for total expenses
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const expenseTrendData = await Expense.aggregate([
    {
      $match: { 
        salonId: salonId, 
        date: { $gte: twelveMonthsAgo } 
      } 
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" }
        },
        total: { $sum: '$amount' }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);

  // Format trend data for sparkline
  const expenseTrend = expenseTrendData.map(item => item.total);

  // Get total expenses
  const totalExpensesResult = await Expense.aggregate([
    { $match: { salonId: salonId } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  
  const totalExpensesAmount = totalExpensesResult.length > 0 ? totalExpensesResult[0].total : 0;

  return successResponse(res, {
    expenses,
    currentMonthExpenses,
    previousMonthExpenses,
    monthlyExpensesChange,
    monthlyExpensesChangeStatus,
    expenseTrend,
    totalExpenses: totalExpensesAmount,
    pagination: {
      page,
      limit,
      totalPages,
      totalItems: totalExpenses
    }
  }, 'Expenses retrieved successfully');
});

// Get expense summary
export const getExpenseSummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Build date filter
  const dateFilter = { salonId };
  if (startDate && endDate) {
    dateFilter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  // Get expenses grouped by category
  const expenseSummary = await Expense.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: '$category',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        category: '$_id',
        totalAmount: 1,
        count: 1,
        _id: 0
      }
    }
  ]);

  // Calculate total expenses
  const totalExpenses = expenseSummary.reduce((total, category) => total + category.totalAmount, 0);

  return successResponse(res, {
    summary: expenseSummary,
    total: totalExpenses
  }, 'Expense summary retrieved successfully');
});

// Update expense
export const updateExpense = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { expenseId } = req.params;
  const { amount, category, description, date } = req.body;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Find and update expense
  const expense = await Expense.findOneAndUpdate(
    { _id: expenseId, salonId },
    { amount, category, description, date },
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

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Find and delete expense
  const expense = await Expense.findOneAndDelete({
    _id: expenseId,
    salonId
  });

  if (!expense) {
    return notFoundResponse(res, 'Expense');
  }

  return successResponse(res, null, 'Expense deleted successfully');
});

// Get salon locations (for multi-location salons) - PUBLIC VERSION
export const getSalonLocationsPublic = asyncHandler(async (req, res) => {
  try {
    // Get all active salons with completed setup
    const salons = await Salon.find({ 
      isActive: true, 
      setupCompleted: true,
      approvalStatus: 'approved'
    })
    .select('salonName salonAddress contactNumber')
    .lean();

    // Format locations for the map
    const locations = (salons || []).map((salon) => {
      // Handle different address formats
      let address = '';
      if (typeof salon.salonAddress === 'string') {
        address = salon.salonAddress;
      } else if (salon.salonAddress && typeof salon.salonAddress === 'object') {
        address = [
          salon.salonAddress.street,
          salon.salonAddress.city,
          salon.salonAddress.state,
          salon.salonAddress.postalCode
        ].filter(Boolean).join(', ');
      }

      return {
        _id: salon._id,
        name: salon.salonName,
        address: address,
        phone: salon.contactNumber
      };
    });

    return successResponse(res, locations, 'Salon locations retrieved successfully');
  } catch (error) {
    console.error('Error fetching salon locations:', error);
    return errorResponse(res, 'Failed to fetch salon locations', 500);
  }
});

// Get salon locations (for multi-location salons) - AUTHENTICATED VERSION
export const getSalonLocations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  // For now, return the main salon location
  // In the future, this could return multiple locations if the salon has branches
  const locations = [{
    _id: salon._id,
    name: salon.salonName,
    address: salon.salonAddress,
    phone: salon.contactNumber
  }];

  return successResponse(res, locations, 'Salon locations retrieved successfully');
});

// Get notifications for salon owner
export const getSalonNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, unreadOnly = false } = req.query;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Build filter
  const filter = { recipientId: salonId, recipientType: 'salon' };
  if (unreadOnly === 'true') {
    filter.isRead = false;
  }

  const [notifications, totalNotifications] = await Promise.all([
    StaffNotification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit)),
    StaffNotification.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalNotifications / limit);

  return paginatedResponse(res, notifications, {
    page,
    limit,
    totalPages,
    totalItems: totalNotifications
  });
});

// Mark notification as read
export const markSalonNotificationAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { notificationId } = req.params;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Find and update notification
  const notification = await StaffNotification.findOneAndUpdate(
    { _id: notificationId, recipientId: salonId, recipientType: 'salon' },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return notFoundResponse(res, 'Notification');
  }

  return successResponse(res, notification, 'Notification marked as read');
});

// Send reply to staff member
export const sendReplyToStaff = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { notificationId, message } = req.body;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Find the original notification
  const originalNotification = await StaffNotification.findById(notificationId);
  if (!originalNotification) {
    return notFoundResponse(res, 'Notification');
  }

  // Create reply notification
  const replyNotification = await StaffNotification.create({
    senderId: salonId,
    senderType: 'salon',
    senderName: salon.salonName,
    recipientId: originalNotification.senderId,
    recipientType: originalNotification.senderType,
    type: 'direct_message',
    title: 'Reply from ' + salon.salonName,
    message: message,
    relatedId: originalNotification._id,
    relatedType: 'staff_notification'
  });

  return successResponse(res, replyNotification, 'Reply sent successfully');
});

// Send job offer to staff member
export const sendJobOffer = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { staffId, message, salary, startDate } = req.body;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Verify staff member exists
  const staff = await Staff.findById(staffId);
  if (!staff) {
    return notFoundResponse(res, 'Staff member');
  }

  // Create job offer notification
  const jobOffer = await StaffNotification.create({
    senderId: salonId,
    senderType: 'salon',
    senderName: salon.salonName,
    recipientId: staffId,
    recipientType: 'staff',
    type: 'job_offer',
    title: 'Job Offer from ' + salon.salonName,
    message: message || 'We would like to offer you a position at our salon.',
    additionalData: {
      salary: salary,
      startDate: startDate,
      salonName: salon.salonName
    }
  });

  return successResponse(res, jobOffer, 'Job offer sent successfully');
});

// Reject staff application
export const rejectStaffApplication = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { notificationId, rejectionReason } = req.body;

  // Get user record to find salon
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(userId);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }

  // Find salon by email
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }

  const salonId = salon._id;

  // Find the application notification
  const notification = await StaffNotification.findById(notificationId);
  if (!notification) {
    return notFoundResponse(res, 'Notification');
  }

  // Update notification status
  notification.status = 'rejected';
  notification.rejectedAt = new Date();
  notification.rejectedBy = {
    salonId: salon._id,
    salonName: salon.salonName
  };

  await notification.save();

  console.log('❌ Staff application rejected by ' + salon.salonName + ' for ' + notification.senderName);

  successResponse(res, {
    notificationId: notification._id,
    message: 'Application marked as unsuitable'
  }, 'Application marked as unsuitable');
});

// Delete staff attendance record
export const deleteAttendance = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { staffId, attendanceId } = req.params;

    // Get user record to find salon
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return notFoundResponse(res, 'Salon user');
    }

    // Find salon by email
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    // Verify that the staff member belongs to this salon
    const staff = await Staff.findOne({ _id: staffId, assignedSalon: salon._id });
    if (!staff) {
      return errorResponse(res, 'Staff member not found or not assigned to your salon', 404);
    }

    // Import Attendance model
    const Attendance = (await import('../models/Attendance.js')).default;

    // Find and delete the attendance record
    const attendanceRecord = await Attendance.findOneAndDelete({
      _id: attendanceId,
      staffId: staffId,
      salonId: salon._id,
    });

    if (!attendanceRecord) {
      return notFoundResponse(res, 'Attendance record');
    }

    // Return success response
    return successResponse(res, null, 'Attendance record deleted successfully');
  } catch (error) {
    console.error('Error deleting staff attendance:', error);
    return errorResponse(res, `Failed to delete attendance: ${error.message}`, 500);
  }
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
  getGlobalStaffDirectory,
  addService,
  getServices,
  getServiceCategories,
  getRevenueByService,
  addExpense,
  getExpenses,
  getExpenseSummary,
  updateExpense,
  deleteExpense,
  getSalonLocations,
  getSalonNotifications,
  markSalonNotificationAsRead,
  sendReplyToStaff,
  sendJobOffer,
  rejectStaffApplication,
  deleteAttendance,
  getAppointmentCounts,
  getStaffAvailability,
  markStaffAttendance,
  addStaffShift
};