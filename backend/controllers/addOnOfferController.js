import AddOnOffer from '../models/AddOnOffer.js';
import Salon from '../models/Salon.js';
import User from '../models/User.js';
import AddonSales from '../models/AddonSales.js';
import Appointment from '../models/Appointment.js';

// Create a new add-on offer
export const createAddOnOffer = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      serviceName,
      basePrice,
      discountType,
      discountValue,
      startDate,
      endDate,
      isActive,
      description,
      termsAndConditions
    } = req.body;

    // Get user record
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only salon owners can create offers'
      });
    }

    // Find salon by email
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon profile not found'
      });
    }

    const salonId = salon._id;

    // Validate required fields
    if (!serviceName || !basePrice || !discountType || discountValue === undefined || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate discount value
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Percentage discount must be between 0 and 100'
      });
    }

    if (discountType === 'fixed' && discountValue > basePrice) {
      return res.status(400).json({
        success: false,
        message: 'Fixed discount cannot exceed base price'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Calculate discounted price
    const base = parseFloat(basePrice);
    const discount = parseFloat(discountValue);
    let discountedPrice;
    
    if (discountType === 'percentage') {
      discountedPrice = base - (base * discount / 100);
    } else {
      discountedPrice = base - discount;
    }

    // Create add-on offer
    const addOnOffer = new AddOnOffer({
      salonId,
      serviceName,
      basePrice,
      discountType,
      discountValue,
      discountedPrice,
      startDate: start,
      endDate: end,
      isActive: isActive !== undefined ? isActive : true,
      description,
      termsAndConditions
    });

    await addOnOffer.save();

    res.status(201).json({
      success: true,
      message: 'Add-on offer created successfully',
      data: addOnOffer
    });
  } catch (error) {
    console.error('Error creating add-on offer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create add-on offer'
    });
  }
};

// Get all add-on offers for a salon
export const getAddOnOffers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isActive, isValid } = req.query;

    // Get user record
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only salon owners can view offers'
      });
    }

    // Find salon by email
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon profile not found'
      });
    }

    const salonId = salon._id;

    // Build query
    const query = { salonId };
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Fetch offers
    let offers = await AddOnOffer.find(query).sort({ createdAt: -1 });

    // Filter by validity if requested
    if (isValid === 'true') {
      const now = new Date();
      offers = offers.filter(offer => 
        offer.isActive && offer.startDate <= now && offer.endDate >= now
      );
    }

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers
    });
  } catch (error) {
    console.error('Error fetching add-on offers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch add-on offers'
    });
  }
};

// Get a single add-on offer by ID
export const getAddOnOfferById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get user record
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only salon owners can view offers'
      });
    }

    // Find salon by email
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon profile not found'
      });
    }

    const salonId = salon._id;

    const offer = await AddOnOffer.findOne({ _id: id, salonId });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Add-on offer not found'
      });
    }

    res.status(200).json({
      success: true,
      data: offer
    });
  } catch (error) {
    console.error('Error fetching add-on offer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch add-on offer'
    });
  }
};

// Update an add-on offer
export const updateAddOnOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    // Get user record
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only salon owners can update offers'
      });
    }

    // Find salon by email
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon profile not found'
      });
    }

    const salonId = salon._id;

    // Find offer
    const offer = await AddOnOffer.findOne({ _id: id, salonId });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Add-on offer not found'
      });
    }

    // Validate discount if being updated
    if (updates.discountType || updates.discountValue !== undefined || updates.basePrice) {
      const discountType = updates.discountType || offer.discountType;
      const discountValue = updates.discountValue !== undefined ? updates.discountValue : offer.discountValue;
      const basePrice = updates.basePrice || offer.basePrice;

      if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
        return res.status(400).json({
          success: false,
          message: 'Percentage discount must be between 0 and 100'
        });
      }

      if (discountType === 'fixed' && discountValue > basePrice) {
        return res.status(400).json({
          success: false,
          message: 'Fixed discount cannot exceed base price'
        });
      }
    }

    // Validate dates if being updated
    if (updates.startDate || updates.endDate) {
      const startDate = updates.startDate ? new Date(updates.startDate) : offer.startDate;
      const endDate = updates.endDate ? new Date(updates.endDate) : offer.endDate;

      if (endDate <= startDate) {
        return res.status(400).json({
          success: false,
          message: 'End date must be after start date'
        });
      }
    }

    // Recalculate discounted price if pricing fields are updated
    if (updates.basePrice !== undefined || updates.discountType !== undefined || updates.discountValue !== undefined) {
      const basePrice = parseFloat(updates.basePrice !== undefined ? updates.basePrice : offer.basePrice);
      const discountType = updates.discountType || offer.discountType;
      const discountValue = parseFloat(updates.discountValue !== undefined ? updates.discountValue : offer.discountValue);
      
      if (discountType === 'percentage') {
        updates.discountedPrice = basePrice - (basePrice * discountValue / 100);
      } else {
        updates.discountedPrice = basePrice - discountValue;
      }
    }

    // Update offer
    Object.keys(updates).forEach(key => {
      if (key !== 'salonId') { // Prevent changing salonId
        offer[key] = updates[key];
      }
    });

    await offer.save();

    res.status(200).json({
      success: true,
      message: 'Add-on offer updated successfully',
      data: offer
    });
  } catch (error) {
    console.error('Error updating add-on offer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update add-on offer'
    });
  }
};

// Toggle add-on offer active status
export const toggleAddOnOfferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get user record
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only salon owners can toggle offers'
      });
    }

    // Find salon by email
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon profile not found'
      });
    }

    const salonId = salon._id;

    const offer = await AddOnOffer.findOne({ _id: id, salonId });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Add-on offer not found'
      });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    res.status(200).json({
      success: true,
      message: `Add-on offer ${offer.isActive ? 'activated' : 'deactivated'} successfully`,
      data: offer
    });
  } catch (error) {
    console.error('Error toggling add-on offer status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to toggle add-on offer status'
    });
  }
};

// Delete an add-on offer
export const deleteAddOnOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get user record
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only salon owners can delete offers'
      });
    }

    // Find salon by email
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon profile not found'
      });
    }

    const salonId = salon._id;

    const offer = await AddOnOffer.findOneAndDelete({ _id: id, salonId });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Add-on offer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Add-on offer deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting add-on offer:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete add-on offer'
    });
  }
};

// Get active offers for customers (public endpoint)
export const getActiveOffersForCustomers = async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID is required'
      });
    }

    // Get current date without time for comparison
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    console.log('=== Fetching Active Offers ===');
    console.log('Salon ID:', salonId);
    console.log('Current Date/Time:', now);
    console.log('Today (start of day):', today);
    
    // First, get all offers for this salon to debug
    const allOffers = await AddOnOffer.find({ salonId });
    console.log('Total offers for salon:', allOffers.length);
    
    if (allOffers.length > 0) {
      console.log('All offers:', allOffers.map(o => ({
        serviceName: o.serviceName,
        isActive: o.isActive,
        startDate: o.startDate,
        endDate: o.endDate,
        startDateObj: new Date(o.startDate),
        endDateObj: new Date(o.endDate)
      })));
    }
    
    // Get only active offers with valid dates
    const offers = await AddOnOffer.find({
      salonId,
      isActive: true,
      $expr: {
        $and: [
          { $lte: ['$startDate', now] },
          { $gte: ['$endDate', today] }
        ]
      }
    }).sort({ createdAt: -1 });

    console.log('Active offers matching criteria:', offers.length);
    console.log('=== End Fetch ===');

    res.status(200).json({
      success: true,
      count: offers.length,
      data: offers
    });
  } catch (error) {
    console.error('Error fetching active offers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch active offers'
    });
  }
};

// Create addon sales records after payment success
export const createAddonSalesRecords = async (req, res) => {
  try {
    const { appointmentId, selectedOffers } = req.body;

    if (!appointmentId || !selectedOffers || !Array.isArray(selectedOffers) || selectedOffers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID and selected offers are required'
      });
    }

    // Fetch appointment details
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Admin commission rate (can be configured)
    const ADMIN_COMMISSION_RATE = 0.10; // 10%

    const salesRecords = [];

    for (const offerData of selectedOffers) {
      // Fetch the offer to get current details
      const offer = await AddOnOffer.findById(offerData.offerId || offerData._id);
      if (!offer) {
        console.warn(`Offer ${offerData.offerId || offerData._id} not found, skipping`);
        continue;
      }

      // Generate unique sale ID
      const saleId = `ADDON-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Calculate commission and earnings
      const adminCommission = offer.discountedPrice * ADMIN_COMMISSION_RATE;
      const salonEarning = offer.discountedPrice - adminCommission;

      // Create addon sale record
      const addonSale = new AddonSales({
        saleId,
        salonId: appointment.salonId,
        staffId: appointment.staffId || appointment.salonId, // Use staffId if available, otherwise salonId
        serviceName: offer.serviceName,
        basePrice: offer.basePrice,
        discountedPrice: offer.discountedPrice,
        adminCommissionAmount: adminCommission,
        salonEarning: salonEarning,
        customerId: appointment.customerId,
        appointmentId: appointment._id
      });

      await addonSale.save();
      salesRecords.push(addonSale);
    }

    res.status(201).json({
      success: true,
      message: `Created ${salesRecords.length} addon sales record(s)`,
      data: salesRecords
    });
  } catch (error) {
    console.error('Error creating addon sales records:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create addon sales records'
    });
  }
};
