import Admin from '../models/Admin.js';
import Salon from '../models/Salon.js';
import Staff from '../models/Staff.js';
import Customer from '../models/Customer.js';
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
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

// Get admin dashboard statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
  console.log('=== FETCHING DASHBOARD STATS ===');
  
  try {
    // Use simpler queries with timeouts and error handling
    const statsPromises = [
      Salon.countDocuments({ isActive: true, approvalStatus: 'approved' }).maxTimeMS(5000),
      Staff.countDocuments({ isActive: true }).maxTimeMS(5000),
      Customer.countDocuments({ isActive: true }).maxTimeMS(5000),
      Appointment.countDocuments().maxTimeMS(5000),
      Appointment.countDocuments({ status: { $in: ['Pending', 'Confirmed', 'In-Progress'] } }).maxTimeMS(5000),
      Appointment.countDocuments({ status: 'Completed' }).maxTimeMS(5000)
    ];

    const [
      totalSalons,
      totalStaff,
      totalCustomers,
      totalAppointments,
      activeAppointments,
      completedAppointments
    ] = await Promise.all(statsPromises);

    // Simplified revenue calculation with fallback
    let totalRevenue = 0;
    try {
      const revenueResult = await Appointment.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
      ]).maxTimeMS(3000);
      totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    } catch (revenueError) {
      console.warn('Revenue calculation timeout, using fallback:', revenueError.message);
      totalRevenue = 0;
    }

    console.log('Dashboard stats calculated successfully');

    return successResponse(res, {
      totalSalons: totalSalons || 0,
      totalStaff: totalStaff || 0,
      totalCustomers: totalCustomers || 0,
      totalAppointments: totalAppointments || 0,
      activeAppointments: activeAppointments || 0,
      completedAppointments: completedAppointments || 0,
      totalRevenue: totalRevenue || 0
    }, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    
    // Return fallback data instead of error
    return successResponse(res, {
      totalSalons: 0,
      totalStaff: 0,
      totalCustomers: 0,
      totalAppointments: 0,
      activeAppointments: 0,
      completedAppointments: 0,
      totalRevenue: 0
    }, 'Dashboard statistics retrieved with fallback data');
  }
});

// Get total approved salons count (separate endpoint for real-time updates)
export const getApprovedSalonsCount = asyncHandler(async (req, res) => {
  const count = await Salon.countDocuments({ 
    isActive: true, 
    approvalStatus: 'approved' 
  });

  return successResponse(res, { count }, 'Approved salons count retrieved successfully');
});

// Get all salons with pagination
export const getAllSalons = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { 
    isActive: true,
    approvalStatus: 'approved' // Only show approved salons in manage salons
  };
  if (req.query.search) {
    filter.$or = [
      { salonName: { $regex: req.query.search, $options: 'i' } },
      { ownerName: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  try {
    console.log('=== GET ALL SALONS DEBUG ===');
    console.log('Filter being used:', filter);
    
    // First, let's see all salons regardless of approval status for debugging
    const allSalons = await Salon.find({ isActive: true }).select('salonName email approvalStatus').lean();
    console.log('All active salons:', allSalons.map(s => ({
      salonName: s.salonName,
      email: s.email,
      approvalStatus: s.approvalStatus
    })));
    
    const [salons, totalSalons] = await Promise.all([
      Salon.find(filter)
        .populate('staff', 'name email skills employmentStatus')
        .populate('services', 'name category price duration isActive')
        .select('salonName ownerName email contactNumber address salonAddress businessHours description documents approvalStatus isVerified createdAt staff services')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(), // Use lean() for better performance and to avoid issues
      Salon.countDocuments(filter)
    ]);
    
    console.log('Approved salons found:', salons.length);

    // Ensure ownerName exists for older records
    const salonsWithOwnerName = salons.map(salon => ({
      ...salon,
      ownerName: salon.ownerName || salon.salonName || 'Unknown Owner'
    }));

    const totalPages = Math.ceil(totalSalons / limit);

    return paginatedResponse(res, salonsWithOwnerName, {
      page,
      limit,
      totalPages,
      totalItems: totalSalons
    });
  } catch (error) {
    console.error('Error in getAllSalons:', error);
    return errorResponse(res, `Failed to fetch salons: ${error.message}`, 500);
  }
});

// Get all salons with their details for admin dashboard
export const getAllSalonsDetails = asyncHandler(async (req, res) => {
  try {
    const filter = { 
      isActive: true, 
      approvalStatus: 'approved' 
    };
    
    const totalSalons = await Salon.countDocuments(filter);
    const salons = await Salon.find(filter)
      .populate('services', 'name category price duration') // Populate service details
      .populate('staff', 'name email skills employmentStatus') // Populate staff details
      .select('salonName ownerName email contactNumber salonAddress businessHours description services staff approvalStatus isVerified createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Ensure ownerName exists for older records
    const salonsWithOwnerName = salons.map(salon => ({
      ...salon,
      ownerName: salon.ownerName || salon.salonName || 'Unknown Owner'
    }));

    return successResponse(res, { 
      totalSalons, 
      salons: salonsWithOwnerName 
    }, 'All salon details retrieved successfully');
  } catch (error) {
    console.error('Error in getAllSalonsDetails:', error);
    return errorResponse(res, `Failed to fetch all salon details: ${error.message}`, 500);
  }
});

// Update salon status
export const updateSalonStatus = asyncHandler(async (req, res) => {
  const { salonId } = req.params;
  const { isActive, isVerified } = req.body;

  const salon = await Salon.findById(salonId);
  if (!salon) {
    return errorResponse(res, 'Salon not found', 404);
  }

  if (isActive !== undefined) salon.isActive = isActive;
  if (isVerified !== undefined) salon.isVerified = isVerified;

  await salon.save();

  return successResponse(res, salon, 'Salon status updated successfully');
});

// Delete salon
export const deleteSalon = asyncHandler(async (req, res) => {
  const { salonId } = req.params;

  const salon = await Salon.findById(salonId);
  if (!salon) {
    return errorResponse(res, 'Salon not found', 404);
  }

  // Soft delete by setting isActive to false
  salon.isActive = false;
  await salon.save();

  // Also deactivate associated staff
  await Staff.updateMany(
    { assignedSalon: salonId },
    { isActive: false, employmentStatus: 'Inactive' }
  );

  return successResponse(res, null, 'Salon deleted successfully');
});

// Get all staff with pagination
export const getAllStaff = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { isActive: true };
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { skills: { $in: [new RegExp(req.query.search, 'i')] } }
    ];
  }

  const [staff, totalStaff] = await Promise.all([
    Staff.find(filter)
      .populate('assignedSalon', 'salonName ownerName')
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

// Get pending staff approvals
export const getPendingStaff = asyncHandler(async (req, res) => {
  console.log('=== GETTING PENDING STAFF ===');
  
  try {
    // First, let's see all staff records to debug
    const allStaff = await Staff.find({}).select('name email approvalStatus role isActive').lean();
    console.log('All staff in database:', allStaff);
    
    // Find staff with exact "pending" approval status (case-sensitive)
    const pendingStaff = await Staff.find({
      approvalStatus: 'pending',
      isActive: true
    })
    .populate('assignedSalon', 'salonName ownerName')
    .select('name email contactNumber position skills experience approvalStatus setupCompleted createdAt assignedSalon role')
    .sort({ createdAt: -1 })
    .lean();
    
    console.log('Found pending staff with exact "pending" query:', pendingStaff.length);
    console.log('Pending staff details:', pendingStaff);

    // Set no-cache headers to prevent caching issues
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return successResponse(res, pendingStaff, 'Pending staff retrieved successfully');
  } catch (error) {
    console.error('Error in getPendingStaff:', error);
    return errorResponse(res, `Failed to fetch pending staff: ${error.message}`, 500);
  }
});

// Approve staff member
export const approveStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  console.log('=== APPROVING STAFF ===');
  console.log('Staff ID:', staffId);

  const staff = await Staff.findById(staffId);
  if (!staff) {
    console.log('Staff not found with ID:', staffId);
    return errorResponse(res, 'Staff member not found', 404);
  }

  console.log('Staff before approval:', {
    id: staff._id,
    name: staff.name,
    email: staff.email,
    approvalStatus: staff.approvalStatus,
    isVerified: staff.isVerified
  });

  staff.approvalStatus = 'approved';
  staff.isVerified = true;
  staff.approvedBy = req.user.id;
  staff.approvalDate = new Date();
  await staff.save();

  console.log('Staff after approval:', {
    id: staff._id,
    name: staff.name,
    email: staff.email,
    approvalStatus: staff.approvalStatus,
    isVerified: staff.isVerified
  });

  // You might want to send an email notification here
  // await sendStaffApprovalEmail(staff.email);

  return successResponse(res, staff, 'Staff member approved successfully');
});

// Reject staff member
export const rejectStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return errorResponse(res, 'Rejection reason is required', 400);
  }

  const staff = await Staff.findById(staffId);
  if (!staff) {
    return errorResponse(res, 'Staff member not found', 404);
  }

  staff.approvalStatus = 'rejected';
  staff.rejectionReason = reason;
  await staff.save();

  // You might want to send an email notification here
  // await sendStaffRejectionEmail(staff.email, reason);

  return successResponse(res, staff, 'Staff member rejected successfully');
});

// Get all customers with pagination
export const getAllCustomers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { isActive: true };
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { contactNumber: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const [customers, totalCustomers] = await Promise.all([
    Customer.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Customer.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCustomers / limit);

  return paginatedResponse(res, customers, {
    page,
    limit,
    totalPages,
    totalItems: totalCustomers
  });
});

// Get all appointments with pagination
export const getAllAppointments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
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

  const [appointments, totalAppointments] = await Promise.all([
    Appointment.find(filter)
      .populate('customerId', 'name email contactNumber')
      .populate('salonId', 'salonName ownerName')
      .populate('staffId', 'name skills')
      .populate('services.serviceId', 'name category')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
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

// Get pending salon approvals
export const getPendingSalons = asyncHandler(async (req, res) => {
  console.log('=== GETTING PENDING SALONS ===');
  
  try {
    // First, let's check all salons to debug the issue
    const allSalons = await Salon.find({}).select('salonName email approvalStatus setupCompleted').lean();
    console.log('All salons in database:', allSalons.map(s => ({
      id: s._id,
      salonName: s.salonName,
      email: s.email,
      approvalStatus: s.approvalStatus,
      setupCompleted: s.setupCompleted
    })));
    
    // Find all salons with pending status (case insensitive and handle null/undefined)
    const pendingSalons = await Salon.find({
      $or: [
        { approvalStatus: 'pending' },
        { approvalStatus: 'Pending' },
        { approvalStatus: { $exists: false } },
        { approvalStatus: null }
      ]
    })
    .select('salonName email contactNumber address ownerName licenseNumber experience documents')
    .lean()
    .then(salons => {
      // Ensure documents is always an object with the expected structure
      return salons.map(salon => ({
        ...salon,
        documents: {
          businessLicense: salon.documents?.businessLicense || '',
          salonLogo: salon.documents?.salonLogo || '',
          salonImages: Array.isArray(salon.documents?.salonImages) ? salon.documents.salonImages : []
        }
      }));
    });
    
    console.log('Found pending salons:', pendingSalons.length);
    
    // Ensure ownerName exists for all records and set default approval status
    const salonsWithOwnerName = pendingSalons.map(salon => ({
      ...salon,
      ownerName: salon.ownerName || salon.salonName || 'Unknown Owner',
      approvalStatus: salon.approvalStatus || 'pending',
      documents: convertDocumentsToUrls(salon.documents)
    }));
    
    console.log('Salon details:', salonsWithOwnerName.map(s => ({
      id: s._id,
      salonName: s.salonName,
      ownerName: s.ownerName,
      email: s.email,
      setupCompleted: s.setupCompleted,
      approvalStatus: s.approvalStatus
    })));

    return successResponse(res, { salons: salonsWithOwnerName }, 'Pending salons retrieved successfully');
  } catch (error) {
    console.error('Error in getPendingSalons:', error);
    return errorResponse(res, `Failed to fetch pending salons: ${error.message}`, 500);
  }
});

// Approve salon
export const approveSalon = asyncHandler(async (req, res) => {
  const { salonId } = req.params;

  console.log('=== APPROVING SALON ===');
  console.log('Salon ID:', salonId);

  const salon = await Salon.findById(salonId);
  if (!salon) {
    console.log('Salon not found with ID:', salonId);
    return errorResponse(res, 'Salon not found', 404);
  }

  console.log('Salon before approval:', {
    id: salon._id,
    salonName: salon.salonName,
    email: salon.email,
    approvalStatus: salon.approvalStatus,
    isVerified: salon.isVerified
  });

  salon.approvalStatus = 'approved';
  salon.isVerified = true;
  await salon.save();

  console.log('Salon after approval:', {
    id: salon._id,
    salonName: salon.salonName,
    email: salon.email,
    approvalStatus: salon.approvalStatus,
    isVerified: salon.isVerified
  });

  // You might want to send an email notification here
  // await sendApprovalEmail(salon.email);

  return successResponse(res, salon, 'Salon approved successfully');
});

// Reject salon
export const rejectSalon = asyncHandler(async (req, res) => {
  const { salonId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return errorResponse(res, 'Rejection reason is required', 400);
  }

  const salon = await Salon.findById(salonId);
  if (!salon) {
    return errorResponse(res, 'Salon not found', 404);
  }

  salon.approvalStatus = 'rejected';
  salon.rejectionReason = reason;
  await salon.save();

  // You might want to send an email notification here
  // await sendRejectionEmail(salon.email, reason);

  return successResponse(res, salon, 'Salon rejected successfully');
});

export default {
  getDashboardStats,
  getApprovedSalonsCount,
  getAllSalons,
  getAllSalonsDetails,
  updateSalonStatus,
  deleteSalon,
  getAllStaff,
  getPendingStaff,
  approveStaff,
  rejectStaff,
  getAllCustomers,
  getAllAppointments,
  getPendingSalons,
  approveSalon,
  rejectSalon
};