import SalonSettings from '../models/SalonSettings.js';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';

// Get salon settings
export const getSalonSettings = asyncHandler(async (req, res) => {
  try {
    const { salonId } = req.params;
    
    // For salon owners, get their own settings
    let settings;
    if (req.user.type === 'salon') {
      // Find salon by user email
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(req.user.id);
      if (!user || user.type !== 'salon') {
        return errorResponse(res, 'Access denied', 403);
      }
      
      const Salon = (await import('../models/Salon.js')).default;
      const salon = await Salon.findOne({ email: user.email });
      if (!salon) {
        return notFoundResponse(res, 'Salon profile');
      }
      
      settings = await SalonSettings.findOne({ salonId: salon._id });
    } else if (req.user.type === 'admin') {
      // Admin can get any salon's settings
      settings = await SalonSettings.findOne({ salonId });
    } else {
      return errorResponse(res, 'Access denied', 403);
    }
    
    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = {
        salonId: req.user.type === 'admin' ? salonId : salon._id,
        adminCommissionRate: 0.15,
        dynamicAddonDiscount: 0.20,
        minGapForOffer: 30,
        maxGapForOffer: 120
      };
      
      settings = new SalonSettings(defaultSettings);
      await settings.save();
    }
    
    return successResponse(res, settings, 'Salon settings retrieved successfully');
  } catch (error) {
    console.error('Error getting salon settings:', error);
    return errorResponse(res, 'Failed to retrieve salon settings', 500);
  }
});

// Update salon settings
export const updateSalonSettings = asyncHandler(async (req, res) => {
  try {
    const { salonId } = req.params;
    const updates = req.body;
    
    // Validate that user has permission to update settings
    if (req.user.type === 'salon') {
      // Salon owners can only update their own settings
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(req.user.id);
      if (!user || user.type !== 'salon') {
        return errorResponse(res, 'Access denied', 403);
      }
      
      const Salon = (await import('../models/Salon.js')).default;
      const salon = await Salon.findOne({ email: user.email });
      if (!salon) {
        return notFoundResponse(res, 'Salon profile');
      }
      
      if (salon._id.toString() !== salonId) {
        return errorResponse(res, 'Access denied', 403);
      }
    } else if (req.user.type !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }
    
    // Remove fields that shouldn't be updated
    delete updates.salonId;
    delete updates.lastUpdated;
    delete updates.createdAt;
    delete updates.updatedAt;
    
    // Update or create settings
    let settings = await SalonSettings.findOne({ salonId });
    
    if (!settings) {
      // Create new settings if they don't exist
      settings = new SalonSettings({
        salonId,
        ...updates
      });
    } else {
      // Update existing settings
      Object.assign(settings, updates);
    }
    
    settings.lastUpdated = new Date();
    await settings.save();
    
    return successResponse(res, settings, 'Salon settings updated successfully');
  } catch (error) {
    console.error('Error updating salon settings:', error);
    return errorResponse(res, 'Failed to update salon settings', 500);
  }
});

// Get all salon settings (admin only)
export const getAllSalonSettings = asyncHandler(async (req, res) => {
  try {
    if (req.user.type !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const [settings, totalSettings] = await Promise.all([
      SalonSettings.find()
        .populate('salonId', 'salonName email')
        .skip(skip)
        .limit(limit)
        .sort({ lastUpdated: -1 }),
      SalonSettings.countDocuments()
    ]);
    
    const totalPages = Math.ceil(totalSettings / limit);
    
    return successResponse(res, {
      settings,
      page,
      limit,
      totalPages,
      totalSettings
    }, 'All salon settings retrieved successfully');
  } catch (error) {
    console.error('Error getting all salon settings:', error);
    return errorResponse(res, 'Failed to retrieve salon settings', 500);
  }
});

export default {
  getSalonSettings,
  updateSalonSettings,
  getAllSalonSettings
};