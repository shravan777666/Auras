import Freelancer from '../models/Freelancer.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { successResponse, errorResponse } from '../utils/responses.js';
import mongoose from 'mongoose';

// Get freelancer dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    // Find the freelancer profile based on the authenticated user
    const freelancer = await Freelancer.findOne({ user: req.user.id }).populate('user');
    
    if (!freelancer) {
      return errorResponse(res, 'Freelancer profile not found', 404);
    }

    // Calculate stats
    const totalAppointments = await Appointment.countDocuments({
      freelancer: freelancer._id
    });

    const completedAppointments = await Appointment.countDocuments({
      freelancer: freelancer._id,
      status: 'completed'
    });

    const pendingAppointments = await Appointment.countDocuments({
      freelancer: freelancer._id,
      status: { $in: ['confirmed', 'pending'] }
    });

    // Calculate earnings (sum of completed appointments)
    const earningsResult = await Appointment.aggregate([
      {
        $match: {
          freelancer: freelancer._id,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$totalAmount' }
        }
      }
    ]);

    const earnings = earningsResult.length > 0 ? earningsResult[0].totalEarnings : 0;

    // Calculate average rating
    const ratingResult = await Appointment.aggregate([
      {
        $match: {
          freelancer: freelancer._id,
          status: 'completed',
          rating: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const rating = ratingResult.length > 0 ? parseFloat(ratingResult[0].avgRating.toFixed(1)) : 0;
    const reviews = ratingResult.length > 0 ? ratingResult[0].totalReviews : 0;

    const stats = {
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      earnings,
      rating,
      reviews
    };

    return successResponse(res, stats, 'Dashboard stats retrieved successfully');
  } catch (error) {
    console.error('Error fetching freelancer dashboard stats:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

// Helper to get the server base URL from the current request
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
  return `http://localhost:${process.env.PORT || 5000}`;
};

// Helper function to convert file path to full URL
const getFileUrl = (filePath, req) => {
  if (!filePath) return null;

  // If the path is already a full URL (Cloudinary, etc.), return it as-is
  if (String(filePath).startsWith('http://') || String(filePath).startsWith('https://')) {
    return filePath;
  }

  // Normalize path separators (convert Windows backslashes to forward slashes)
  let normalizedPath = String(filePath).replace(/\\/g, '/');

  // Remove any "backend/" prefix if it exists to prevent double prefixing
  if (normalizedPath.startsWith('backend/')) {
    normalizedPath = normalizedPath.substring(7); // Remove "backend/" prefix
  }

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
  
  // For salon documents
  if (documents.businessLicense) {
    converted.businessLicense = getFileUrl(documents.businessLicense, req);
  }
  
  if (documents.salonLogo) {
    converted.salonLogo = getFileUrl(documents.salonLogo, req);
  }
  
  if (documents.salonImages && Array.isArray(documents.salonImages)) {
    converted.salonImages = documents.salonImages.map(imagePath => getFileUrl(imagePath, req));
  }
  
  // For staff and freelancer documents
  if (documents.governmentId) {
    converted.governmentId = getFileUrl(documents.governmentId, req);
  }
  
  if (documents.certificates && Array.isArray(documents.certificates)) {
    converted.certificates = documents.certificates.map(certPath => getFileUrl(certPath, req));
  }
  
  // For freelancer profile picture
  if (documents.profilePicture) {
    converted.profilePicture = getFileUrl(documents.profilePicture, req);
  }
  
  return converted;
};

// Get freelancer profile
export const getProfile = async (req, res) => {
  try {
    const freelancer = await Freelancer.findOne({ user: req.user.id })
      .populate('user', 'name email phone');

    if (!freelancer) {
      return errorResponse(res, 'Freelancer profile not found', 404);
    }

    // Convert document paths to URLs
    const documentsWithUrls = convertDocumentsToUrls(freelancer.documents, req);
    
    // Combine freelancer and user data
    const profileData = {
      _id: freelancer._id,
      name: freelancer.name || freelancer.user?.name,
      email: freelancer.email || freelancer.user?.email,
      phone: freelancer.phone || freelancer.user?.phone,
      serviceLocation: freelancer.serviceLocation,
      address: freelancer.address,
      location: freelancer.location,
      experience: freelancer.yearsOfExperience,
      skills: freelancer.skills,
      profilePicture: freelancer.profilePicture ? getFileUrl(freelancer.profilePicture, req) : null,
      documents: documentsWithUrls,
      isActive: freelancer.isActive,
      setupCompleted: freelancer.setupCompleted,
      approvalStatus: freelancer.approvalStatus,
      isVerified: freelancer.isVerified,
      createdAt: freelancer.createdAt,
      updatedAt: freelancer.updatedAt
    };

    return successResponse(res, profileData, 'Profile retrieved successfully');
  } catch (error) {
    console.error('Error fetching freelancer profile:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

// Update freelancer profile
export const updateProfile = async (req, res) => {
  try {
    const freelancer = await Freelancer.findOne({ user: req.user.id });

    if (!freelancer) {
      return errorResponse(res, 'Freelancer profile not found', 404);
    }

    const allowedUpdates = [
      'name', 'email', 'phone', 'serviceLocation', 
      'address', 'location', 'yearsOfExperience', 'skills'
    ];
    
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    // Initialize documents if it doesn't exist
    if (!freelancer.documents) {
        freelancer.documents = {};
    }
    
    // Handle file uploads
    if (req.files) {
        if (req.files.profilePicture) {
            updates.profilePicture = req.files.profilePicture[0].path;
        }
        if (req.files.governmentId) {
            freelancer.documents.governmentId = req.files.governmentId[0].path;
        }
        if (req.files.certificates) {
            freelancer.documents.certificates = req.files.certificates.map(file => file.path);
        }
    }


    // Update freelancer profile
    // Handle structured address if provided
    if (req.body.addressLine1 !== undefined || req.body.addressLine2 !== undefined || req.body.city !== undefined || req.body.state !== undefined || req.body.postalCode !== undefined) {
      updates.address = {
        addressLine1: req.body.addressLine1 ?? freelancer.address?.addressLine1 ?? '',
        addressLine2: req.body.addressLine2 ?? freelancer.address?.addressLine2 ?? '',
        city: req.body.city ?? freelancer.address?.city ?? '',
        state: req.body.state ?? freelancer.address?.state ?? '',
        postalCode: req.body.postalCode ?? freelancer.address?.postalCode ?? '',
        country: req.body.country ?? freelancer.address?.country ?? 'India',
        fullAddress: req.body.fullAddress ?? `${req.body.addressLine1 ?? ''} ${req.body.addressLine2 ?? ''} ${req.body.city ?? ''} ${req.body.state ?? ''} ${req.body.postalCode ?? ''}`.trim()
      };
    }
    
    // Handle location coordinates if provided
    if (req.body.latitude !== undefined && req.body.longitude !== undefined && req.body.latitude !== '' && req.body.longitude !== '') {
      updates.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
        address: req.body.fullAddress ?? `${req.body.addressLine1 ?? ''} ${req.body.addressLine2 ?? ''} ${req.body.city ?? ''} ${req.body.state ?? ''} ${req.body.postalCode ?? ''}`.trim(),
        formattedAddress: req.body.fullAddress ?? `${req.body.addressLine1 ?? ''} ${req.body.addressLine2 ?? ''} ${req.body.city ?? ''} ${req.body.state ?? ''} ${req.body.postalCode ?? ''}`.trim()
      };
    }
    
    // Handle yearsOfExperience separately to ensure it's properly converted to a number
    if (req.body.yearsOfExperience !== undefined) {
      updates.yearsOfExperience = parseInt(req.body.yearsOfExperience) || 0;
    }
    
    Object.assign(freelancer, updates);
    
    // Mark setup as completed when freelancer updates their profile for the first time
    if (!freelancer.setupCompleted) {
      freelancer.setupCompleted = true;
      freelancer.approvalStatus = 'pending'; // Set to pending for admin approval
    }
    
    await freelancer.save();

    // Also update the associated user record if needed
    if (req.body.name || req.body.email || req.body.phone) {
      await User.findByIdAndUpdate(
        req.user.id,
        {
          ...(req.body.name && { name: req.body.name }),
          ...(req.body.email && { email: req.body.email }),
          ...(req.body.phone && { phone: req.body.phone }),
          setupCompleted: freelancer.setupCompleted
        },
        { new: true }
      );
    }

    // Convert document paths to URLs for response
    const documentsWithUrls = convertDocumentsToUrls(freelancer.documents, req);
    const profileWithUrls = {
      ...freelancer.toObject(),
      profilePicture: freelancer.profilePicture ? getFileUrl(freelancer.profilePicture, req) : null,
      documents: documentsWithUrls
    };

    return successResponse(res, profileWithUrls, 'Profile updated successfully');
  } catch (error) {
    console.error('Error updating freelancer profile:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

// Get recent appointments
export const getRecentAppointments = async (req, res) => {
  try {
    const freelancer = await Freelancer.findOne({ user: req.user.id });

    if (!freelancer) {
      return errorResponse(res, 'Freelancer profile not found', 404);
    }

    // Get recent appointments (last 10 appointments ordered by date)
    const recentAppointments = await Appointment.find({
      freelancer: freelancer._id
    })
    .populate('customer', 'name email phone')
    .populate('service', 'name price duration')
    .sort({ createdAt: -1 })
    .limit(5);

    // Format the appointments data
    const formattedAppointments = recentAppointments.map(appointment => ({
      id: appointment._id,
      customer: appointment.customer?.name || 'Unknown Customer',
      service: appointment.service?.name || 'Unknown Service',
      date: appointment.date,
      time: appointment.startTime,
      status: appointment.status,
      amount: appointment.totalAmount || 0,
      rating: appointment.rating,
      createdAt: appointment.createdAt
    }));

    return successResponse(res, formattedAppointments, 'Recent appointments retrieved successfully');
  } catch (error) {
    console.error('Error fetching recent appointments:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

// Get all appointments with pagination
export const getAppointments = async (req, res) => {
  try {
    const freelancer = await Freelancer.findOne({ user: req.user.id });

    if (!freelancer) {
      return errorResponse(res, 'Freelancer profile not found', 404);
    }

    const { page = 1, limit = 10, status } = req.query;

    const filter = { freelancer: freelancer._id };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const appointments = await Appointment.find(filter)
      .populate('customer', 'name email phone')
      .populate('service', 'name price duration')
      .sort({ date: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Appointment.countDocuments(filter);

    const formattedAppointments = appointments.map(appointment => ({
      id: appointment._id,
      customer: appointment.customer?.name || 'Unknown Customer',
      service: appointment.service?.name || 'Unknown Service',
      date: appointment.date,
      time: appointment.startTime,
      status: appointment.status,
      amount: appointment.totalAmount || 0,
      rating: appointment.rating,
      createdAt: appointment.createdAt
    }));

    const result = {
      appointments: formattedAppointments,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      totalAppointments: total
    };

    return successResponse(res, result, 'Appointments retrieved successfully');
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

// Get freelancer schedule/availability
export const getSchedule = async (req, res) => {
  try {
    const freelancer = await Freelancer.findOne({ user: req.user.id });

    if (!freelancer) {
      return errorResponse(res, 'Freelancer profile not found', 404);
    }

    // Return availability status and schedule information
    const scheduleData = {
      availabilityStatus: freelancer.isActive ? 'available' : 'unavailable',
      isActive: freelancer.isActive,
      profile: {
        name: freelancer.name,
        serviceLocation: freelancer.serviceLocation,
        skills: freelancer.skills
      }
    };

    return successResponse(res, scheduleData, 'Schedule retrieved successfully');
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

// Update freelancer schedule/availability
export const updateSchedule = async (req, res) => {
  try {
    const freelancer = await Freelancer.findOne({ user: req.user.id });

    if (!freelancer) {
      return errorResponse(res, 'Freelancer profile not found', 404);
    }

    const { isActive, schedule } = req.body;

    if (isActive !== undefined) {
      freelancer.isActive = isActive;
    }

    await freelancer.save();

    const updatedScheduleData = {
      availabilityStatus: freelancer.isActive ? 'available' : 'unavailable',
      isActive: freelancer.isActive
    };

    return successResponse(res, updatedScheduleData, 'Schedule updated successfully');
  } catch (error) {
    console.error('Error updating schedule:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

// Update availability status specifically
export const updateAvailability = async (req, res) => {
  try {
    const freelancer = await Freelancer.findOne({ user: req.user.id });

    if (!freelancer) {
      return errorResponse(res, 'Freelancer profile not found', 404);
    }

    const { status } = req.body;

    if (!status) {
      return errorResponse(res, 'Status is required', 400);
    }

    if (!['available', 'unavailable'].includes(status)) {
      return errorResponse(res, 'Invalid status. Must be "available" or "unavailable"', 400);
    }

    freelancer.isActive = status === 'available';
    await freelancer.save();

    const updatedData = {
      availabilityStatus: status,
      isActive: freelancer.isActive
    };

    return successResponse(res, updatedData, 'Availability updated successfully');
  } catch (error) {
    console.error('Error updating availability:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

// Get freelancer details by ID
export const getFreelancerById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'Invalid freelancer ID', 400);
    }

    // Find the freelancer by ID
    const freelancer = await Freelancer.findById(id)
      .populate('user', 'name email phone');

    if (!freelancer) {
      return errorResponse(res, 'Freelancer not found', 404);
    }

    // Check if freelancer is approved
    if (freelancer.approvalStatus !== 'APPROVED' && freelancer.approvalStatus !== 'approved') {
      return errorResponse(res, 'Freelancer is not approved', 404);
    }

    // Convert document paths to URLs
    const documentsWithUrls = convertDocumentsToUrls(freelancer.documents, req);
    
    // Get average rating for the freelancer
    const ratingResult = await Appointment.aggregate([
      {
        $match: {
          freelancer: freelancer._id,
          status: 'completed',
          rating: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const averageRating = ratingResult.length > 0 ? parseFloat(ratingResult[0].avgRating.toFixed(1)) : 0;
    
    // Convert freelancer skills to services structure
    const skillToServiceMap = {
      'Hair Styling': { category: 'Hair', type: 'Styling' },
      'Hair Cutting': { category: 'Hair', type: 'Cutting' },
      'Hair Coloring': { category: 'Hair', type: 'Coloring' },
      'Hair Treatment': { category: 'Hair', type: 'Treatment' },
      'Skincare': { category: 'Face', type: 'Skincare' },
      'Facial': { category: 'Face', type: 'Facial' },
      'Makeup': { category: 'Face', type: 'Makeup' },
      'Massage': { category: 'Body', type: 'Massage' },
      'Body Treatment': { category: 'Body', type: 'Treatment' },
      'Manicure': { category: 'Nails', type: 'Manicure' },
      'Pedicure': { category: 'Nails', type: 'Pedicure' },
      'Eyebrow': { category: 'Eyebrow', type: 'Threading' },
      'Waxing': { category: 'Body', type: 'Waxing' },
      'Spa': { category: 'Spa', type: 'Treatment' }
    };
    
    // Convert skills array to services array
    const freelancerServices = freelancer.skills.map((skill, index) => {
      const serviceInfo = skillToServiceMap[skill] || { category: 'General', type: 'Service' };
      return {
        _id: `skill_${freelancer._id}_${index}`,
        name: skill,
        category: serviceInfo.category,
        description: `Professional ${skill} service provided by ${freelancer.name || freelancer.user?.name}`,
        price: 500 + (index * 100), // Base price of 500 with incremental increases
        type: serviceInfo.type,
        discountedPrice: 450 + (index * 90), // 10% discount on base price
        duration: 30 + (index * 15), // Base duration of 30 mins with increments
        availableStaff: [freelancer._id],
        tags: [skill.toLowerCase().replace(' ', '-')],
        totalBookings: 0,
        rating: { average: 0, count: 0 },
        isActive: true,
        createdAt: freelancer.createdAt,
        updatedAt: freelancer.updatedAt
      };
    });
    
    // Combine freelancer and user data
    const freelancerData = {
      _id: freelancer._id,
      name: freelancer.name || freelancer.user?.name,
      email: freelancer.email || freelancer.user?.email,
      phone: freelancer.phone || freelancer.user?.phone,
      serviceLocation: freelancer.serviceLocation,
      address: freelancer.address,
      location: freelancer.location,
      yearsOfExperience: freelancer.yearsOfExperience,
      skills: freelancer.skills,
      specialties: freelancer.skills, // Using skills as specialties
      services: freelancerServices, // Include freelancer's services
      profilePic: freelancer.profilePicture ? getFileUrl(freelancer.profilePicture, req) : null,
      profilePicture: freelancer.profilePicture ? getFileUrl(freelancer.profilePicture, req) : null,
      documents: documentsWithUrls,
      isActive: freelancer.isActive,
      status: freelancer.approvalStatus, // Using approvalStatus as status
      approvalStatus: freelancer.approvalStatus,
      averageRating: averageRating,
      isVerified: freelancer.isVerified,
      createdAt: freelancer.createdAt,
      updatedAt: freelancer.updatedAt
    };

    return successResponse(res, freelancerData, 'Freelancer details retrieved successfully');
  } catch (error) {
    console.error('Error fetching freelancer details:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
}

// Get freelancer services
export const getFreelancerServices = async (req, res) => {
  try {
    // Get the user ID from the token payload
    // The token payload contains id field (from signToken function)
    const userId = req.user.id;
    
    const freelancer = await Freelancer.findOne({ user: userId })
      .populate('user', 'name email phone')
      .lean();
    
    if (!freelancer) {
      return errorResponse(res, 'Freelancer not found', 404);
    }
    
    // Convert freelancer skills to services structure
    const skillToServiceMap = {
      'Hair Styling': { category: 'Hair', type: 'Styling' },
      'Hair Cutting': { category: 'Hair', type: 'Cutting' },
      'Hair Coloring': { category: 'Hair', type: 'Coloring' },
      'Hair Treatment': { category: 'Hair', type: 'Treatment' },
      'Skincare': { category: 'Face', type: 'Skincare' },
      'Facial': { category: 'Face', type: 'Facial' },
      'Makeup': { category: 'Face', type: 'Makeup' },
      'Massage': { category: 'Body', type: 'Massage' },
      'Body Treatment': { category: 'Body', type: 'Treatment' },
      'Manicure': { category: 'Nails', type: 'Manicure' },
      'Pedicure': { category: 'Nails', type: 'Pedicure' },
      'Eyebrow': { category: 'Eyebrow', type: 'Threading' },
      'Waxing': { category: 'Body', type: 'Waxing' },
      'Spa': { category: 'Spa', type: 'Treatment' }
    };
    
    // Convert skills array to services array
    const freelancerServices = freelancer.skills.map((skill, index) => {
      const serviceInfo = skillToServiceMap[skill] || { category: 'General', type: 'Service' };
      return {
        _id: `skill_${freelancer._id}_${index}`,
        name: skill,
        category: serviceInfo.category,
        description: `Professional ${skill} service provided by ${freelancer.name || freelancer.user?.name}`,
        price: 500 + (index * 100), // Base price of 500 with incremental increases
        type: serviceInfo.type,
        discountedPrice: 450 + (index * 90), // 10% discount on base price
        duration: 30 + (index * 15), // Base duration of 30 mins with increments
        availableStaff: [freelancer._id],
        tags: [skill.toLowerCase().replace(' ', '-')],
        totalBookings: 0,
        rating: { average: 0, count: 0 },
        isActive: true,
        createdAt: freelancer.createdAt,
        updatedAt: freelancer.updatedAt
      };
    });
    
    return successResponse(res, freelancerServices, 'Freelancer services retrieved successfully');
  } catch (error) {
    console.error('Error fetching freelancer services:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

// Add a new service for freelancer
export const addFreelancerService = async (req, res) => {
  try {
    // Get the user ID from the token payload
    // The token payload contains id field (from signToken function)
    const userId = req.user.id;
    
    const freelancer = await Freelancer.findOne({ user: userId });
    
    if (!freelancer) {
      return errorResponse(res, 'Freelancer not found', 404);
    }
    
    const { name, category, description, price, type, duration } = req.body;
    
    // Validate required fields
    if (!name || !category || !price) {
      return errorResponse(res, 'Name, category, and price are required', 400);
    }
    
    // Add the new service name to the freelancer's skills array
    if (!freelancer.skills.includes(name)) {
      freelancer.skills.push(name);
    }
    
    await freelancer.save();
    
    // Return success response
    return successResponse(res, { name, category, description, price, type, duration }, 'Service added successfully');
  } catch (error) {
    console.error('Error adding freelancer service:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

// Update a freelancer service
export const updateFreelancerService = async (req, res) => {
  try {
    // Get the user ID from the token payload
    // The token payload contains id field (from signToken function)
    const userId = req.user.id;
    
    const { id } = req.params;
    const { name, category, description, price, type, duration, isActive } = req.body;
    
    const freelancer = await Freelancer.findOne({ user: userId });
    
    if (!freelancer) {
      return errorResponse(res, 'Freelancer not found', 404);
    }
    
    // Find the skill to update by matching the name
    const skillIndex = freelancer.skills.findIndex(skill => 
      skill.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(skill.toLowerCase())
    );
    
    if (skillIndex === -1) {
      return errorResponse(res, 'Service not found', 404);
    }
    
    // Update the skill name in the skills array
    freelancer.skills[skillIndex] = name;
    
    await freelancer.save();
    
    // Return success response
    return successResponse(res, { _id: id, name, category, description, price, type, duration, isActive }, 'Service updated successfully');
  } catch (error) {
    console.error('Error updating freelancer service:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

// Delete a freelancer service
export const deleteFreelancerService = async (req, res) => {
  try {
    // Get the user ID from the token payload
    // The token payload contains id field (from signToken function)
    const userId = req.user.id;
    
    const { id } = req.params;
    
    const freelancer = await Freelancer.findOne({ user: userId });
    
    if (!freelancer) {
      return errorResponse(res, 'Freelancer not found', 404);
    }
    
    // For the delete functionality, we'll find a skill that matches the ID pattern
    // Since we're using temporary IDs like 'skill_freelancerId_index', we'll extract the index
    const idParts = id.split('_');
    if (idParts.length >= 3 && idParts[0] === 'skill') {
      const skillIndex = parseInt(idParts[2]);
      if (!isNaN(skillIndex) && skillIndex >= 0 && skillIndex < freelancer.skills.length) {
        freelancer.skills.splice(skillIndex, 1);
      }
    }
    
    await freelancer.save();
    
    // Return success response
    return successResponse(res, { _id: id }, 'Service deleted successfully');
  } catch (error) {
    console.error('Error deleting freelancer service:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};

// Get all approved freelancers
export const getApprovedFreelancers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    // Build filter for approved freelancers only
    const filter = {
      approvalStatus: { $regex: /^approved$/i }  // Case insensitive match for 'APPROVED'
    };
    
    // Add search functionality if search term is provided
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
        { serviceLocation: { $regex: search, $options: 'i' } }
      ];
    }

    // Query approved freelancers
    const freelancers = await Freelancer.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    // Get total count
    const total = await Freelancer.countDocuments(filter);

    // Format the response with URLs
    const formattedFreelancers = freelancers.map(freelancer => {
      // Convert document paths to URLs
      const documentsWithUrls = convertDocumentsToUrls(freelancer.documents, req);
      
      // Convert freelancer skills to services structure
      const skillToServiceMap = {
        'Hair Styling': { category: 'Hair', type: 'Styling' },
        'Hair Cutting': { category: 'Hair', type: 'Cutting' },
        'Hair Coloring': { category: 'Hair', type: 'Coloring' },
        'Hair Treatment': { category: 'Hair', type: 'Treatment' },
        'Skincare': { category: 'Face', type: 'Skincare' },
        'Facial': { category: 'Face', type: 'Facial' },
        'Makeup': { category: 'Face', type: 'Makeup' },
        'Massage': { category: 'Body', type: 'Massage' },
        'Body Treatment': { category: 'Body', type: 'Treatment' },
        'Manicure': { category: 'Nails', type: 'Manicure' },
        'Pedicure': { category: 'Nails', type: 'Pedicure' },
        'Eyebrow': { category: 'Eyebrow', type: 'Threading' },
        'Waxing': { category: 'Body', type: 'Waxing' },
        'Spa': { category: 'Spa', type: 'Treatment' }
      };
      
      // Convert skills array to services array
      const freelancerServices = freelancer.skills.map((skill, index) => {
        const serviceInfo = skillToServiceMap[skill] || { category: 'General', type: 'Service' };
        return {
          _id: `skill_${freelancer._id}_${index}`,
          name: skill,
          category: serviceInfo.category,
          description: `Professional ${skill} service provided by ${freelancer.name || freelancer.user?.name}`,
          price: 500 + (index * 100), // Base price of 500 with incremental increases
          type: serviceInfo.type,
          discountedPrice: 450 + (index * 90), // 10% discount on base price
          duration: 30 + (index * 15), // Base duration of 30 mins with increments
          availableStaff: [freelancer._id],
          tags: [skill.toLowerCase().replace(' ', '-')],
          totalBookings: 0,
          rating: { average: 0, count: 0 },
          isActive: true,
          createdAt: freelancer.createdAt,
          updatedAt: freelancer.updatedAt
        };
      });
      
      return {
        _id: freelancer._id,
        name: freelancer.name || freelancer.user?.name,
        email: freelancer.email || freelancer.user?.email,
        phone: freelancer.phone || freelancer.user?.phone,
        serviceLocation: freelancer.serviceLocation,
        address: freelancer.address,
        location: freelancer.location,
        yearsOfExperience: freelancer.yearsOfExperience,
        skills: freelancer.skills,
        specialties: freelancer.skills, // Using skills as specialties
        services: freelancerServices, // Include converted services
        profilePic: freelancer.profilePicture ? getFileUrl(freelancer.profilePicture, req) : null,
        profilePicture: freelancer.profilePicture ? getFileUrl(freelancer.profilePicture, req) : null,
        documents: documentsWithUrls,
        isActive: freelancer.isActive,
        status: freelancer.approvalStatus, // Using approvalStatus as status
        approvalStatus: freelancer.approvalStatus,
        averageRating: freelancer.averageRating || 0, // Assuming this field exists or default to 0
        isVerified: freelancer.isVerified,
        createdAt: freelancer.createdAt,
        updatedAt: freelancer.updatedAt
      };
    });

    const result = {
      success: true,
      data: formattedFreelancers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching approved freelancers:', error);
    return errorResponse(res, 'Internal server error', 500);
  }
};
