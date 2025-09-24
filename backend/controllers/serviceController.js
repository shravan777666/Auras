import Service from '../models/Service.js';
import Salon from '../models/Salon.js';
import Appointment from '../models/Appointment.js';
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';

// Create new service (Salon owners only)
export const createService = asyncHandler(async (req, res) => {
  // Find salon by user email
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(req.user.id);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }
  
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }
  
  const salonId = salon._id;
  const serviceData = {
    ...req.body,
    salonId
  };

  const service = new Service(serviceData);
  await service.save();

  // Add service to salon's services array
  salon.services.push(service._id);
  await salon.save();

  return successResponse(res, service, 'Service created successfully', 201);
});

// Get salon services
export const getSalonServices = asyncHandler(async (req, res) => {
  let salonId;
  
  if (req.user.type === 'salon') {
    // For salon owners, find their salon by email
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user) {
      return notFoundResponse(res, 'User');
    }
    
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }
    
    salonId = salon._id;
  } else {
    // For other user types, use the salonId from params
    salonId = req.params.salonId;
  }
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { salonId };

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

// Get service details
export const getServiceDetails = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;

  const service = await Service.findById(serviceId)
    .populate('salonId', 'salonName salonAddress contactNumber businessHours')
    .populate('availableStaff', 'name skills experience rating');

  if (!service) {
    return notFoundResponse(res, 'Service');
  }

  return successResponse(res, service, 'Service details retrieved successfully');
});

// Update service
export const updateService = asyncHandler(async (req, res) => {
  // Find salon by user email
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(req.user.id);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }
  
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }
  
  const salonId = salon._id;
  const { serviceId } = req.params;
  const updates = req.body;

  const service = await Service.findOne({ _id: serviceId, salonId });

  if (!service) {
    return notFoundResponse(res, 'Service');
  }

  // Remove fields that shouldn't be directly updated
  delete updates.salonId;
  delete updates.totalBookings;
  delete updates.rating;

  Object.assign(service, updates);
  await service.save();

  return successResponse(res, service, 'Service updated successfully');
});

// Delete service
export const deleteService = asyncHandler(async (req, res) => {
  // Find salon by user email
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(req.user.id);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }
  
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }
  
  const salonId = salon._id;
  const { serviceId } = req.params;

  const service = await Service.findOne({ _id: serviceId, salonId });

  if (!service) {
    return notFoundResponse(res, 'Service');
  }

  // Soft delete by setting isActive to false
  service.isActive = false;
  await service.save();

  // Remove from salon services array
  await Salon.findByIdAndUpdate(salonId, {
    $pull: { services: serviceId }
  });

  return successResponse(res, null, 'Service deleted successfully');
});

// Assign staff to service
export const assignStaff = asyncHandler(async (req, res) => {
  // Find salon by user email
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(req.user.id);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }
  
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }
  
  const salonId = salon._id;
  const { serviceId } = req.params;
  const { staffIds } = req.body;

  const service = await Service.findOne({ _id: serviceId, salonId });

  if (!service) {
    return notFoundResponse(res, 'Service');
  }

  // Verify all staff belong to the salon
  const { default: Staff } = await import('../models/Staff.js');
  const staff = await Staff.find({
    _id: { $in: staffIds },
    assignedSalon: salonId,
    isActive: true
  });

  if (staff.length !== staffIds.length) {
    return errorResponse(res, 'Some staff members not found or not assigned to your salon', 400);
  }

  service.availableStaff = staffIds;
  await service.save();

  return successResponse(res, service, 'Staff assigned to service successfully');
});

// Get service categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Service.distinct('category', { isActive: true });

  return successResponse(res, categories, 'Service categories retrieved successfully');
});

// Get popular services
export const getPopularServices = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const services = await Service.find({ isActive: true })
    .populate('salonId', 'salonName salonAddress rating')
    .sort({ totalBookings: -1, 'rating.average': -1 })
    .limit(limit);

  return successResponse(res, services, 'Popular services retrieved successfully');
});

// Search services by location and category
export const searchServices = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const serviceFilter = { isActive: true };
  const salonFilter = { isActive: true, setupCompleted: true };

  // Category filter
  if (req.query.category) {
    serviceFilter.category = req.query.category;
  }

  // Price range filter
  if (req.query.minPrice) {
    serviceFilter.price = { ...serviceFilter.price, $gte: parseInt(req.query.minPrice) };
  }
  if (req.query.maxPrice) {
    serviceFilter.price = { ...serviceFilter.price, $lte: parseInt(req.query.maxPrice) };
  }

  // Location filter
  if (req.query.city) {
    salonFilter['salonAddress.city'] = { $regex: req.query.city, $options: 'i' };
  }

  // Get salons matching location criteria
  const salons = await Salon.find(salonFilter).select('_id');
  const salonIds = salons.map(salon => salon._id);

  serviceFilter.salonId = { $in: salonIds };

  // Text search
  if (req.query.search) {
    serviceFilter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { tags: { $in: [new RegExp(req.query.search, 'i')] } }
    ];
  }

  const [services, totalServices] = await Promise.all([
    Service.find(serviceFilter)
      .populate('salonId', 'salonName salonAddress rating businessHours')
      .skip(skip)
      .limit(limit)
      .sort({ 'rating.average': -1, totalBookings: -1 }),
    Service.countDocuments(serviceFilter)
  ]);

  const totalPages = Math.ceil(totalServices / limit);

  return paginatedResponse(res, services, {
    page,
    limit,
    totalPages,
    totalItems: totalServices
  });
});

// Dynamic catalog based on services that have been booked by customers
export const getServiceCatalog = asyncHandler(async (req, res) => {
  const { category } = req.query;

  // Get unique service IDs from appointments
  const appointments = await Appointment.find({}, 'services.serviceId').populate('services.serviceId');
  const serviceIds = new Set();

  appointments.forEach(appointment => {
    appointment.services.forEach(service => {
      if (service.serviceId && service.serviceId._id) {
        serviceIds.add(service.serviceId._id.toString());
      }
    });
  });

  const uniqueServiceIds = Array.from(serviceIds);

  // Fetch services that have been booked
  let query = { _id: { $in: uniqueServiceIds }, isActive: true };
  if (category) {
    query.category = new RegExp(`^${category}$`, 'i');
  }

  const services = await Service.find(query)
    .select('name category description price duration')
    .sort({ category: 1, name: 1 });

  // Transform to match the expected format
  const catalog = services.map(service => ({
    name: service.name,
    category: service.category,
    description: service.description,
    price: service.price,
    duration: service.duration
  }));

  return successResponse(res, catalog, 'Service catalog retrieved successfully');
});

export default {
  createService,
  getSalonServices,
  getServiceDetails,
  updateService,
  deleteService,
  assignStaff,
  getCategories,
  getPopularServices,
  searchServices,
  getServiceCatalog
};