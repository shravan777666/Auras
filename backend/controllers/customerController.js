import Customer from '../models/Customer.js';
import Salon from '../models/Salon.js';
import Service from '../models/Service.js';
import Appointment from '../models/Appointment.js';
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';

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

  const customer = await Customer.findById(customerId)
    .populate('preferences.preferredSalons', 'salonName ownerName');

  if (!customer) {
    return notFoundResponse(res, 'Customer profile');
  }

  return successResponse(res, customer, 'Profile retrieved successfully');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const customerId = req.user.id;
  const updates = req.body;

  // Handle address object if it comes as a stringified JSON
  if (updates.address && typeof updates.address === 'string') {
    try {
      updates.address = JSON.parse(updates.address);
    } catch (error) {
      return errorResponse(res, 'Invalid address format. Expected a JSON object.', 400);
    }
  }

  // If a new profile picture is uploaded, add its path to the updates
  if (req.file) {
    // Normalize path to use forward slashes for consistency
    updates.profilePicture = req.file.path.replace(/\\/g, '/');
  }

  // Remove sensitive or immutable fields from the update payload
  delete updates.password; // Password should be updated via a separate, dedicated endpoint
  delete updates.email; // Disallow email changes for now to avoid account ownership issues
  delete updates.totalBookings;
  delete updates.loyaltyPoints;

  const customer = await Customer.findByIdAndUpdate(
    customerId,
    { $set: updates }, // Use $set to prevent replacing the whole document
    { new: true, runValidators: true, context: 'query' }
  );

  if (!customer) {
    return notFoundResponse(res, 'Customer profile');
  }

  return successResponse(res, customer, 'Profile updated successfully');
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
      .select('salonName salonAddress contactNumber description businessHours rating documents services')
      .skip(skip)
      .limit(limit)
      .sort({ 'rating.average': -1, createdAt: -1 }),
    Salon.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalSalons / limit);

  return paginatedResponse(res, salons, {
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
      select: 'name skills experience rating profilePicture availability'
    });

  if (!salon) {
    return notFoundResponse(res, 'Salon');
  }

  return successResponse(res, salon, 'Salon details retrieved successfully');
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

  if (!appointment.canBeCancelled()) {
    return errorResponse(res, 'Appointment cannot be cancelled. Cancellation allowed only 2 hours before appointment time.', 400);
  }

  appointment.cancellationReason = cancellationReason;
  await appointment.updateStatus('Cancelled', 'Customer');

  return successResponse(res, appointment, 'Appointment cancelled successfully');
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

export default {
  getDashboard,
  getProfile,
  updateProfile,
  browseSalons,
  getSalonDetails,
  searchServices,
  getBookings,
  cancelBooking,
  rateAppointment
};