import Package from '../models/Package.js';
import Service from '../models/Service.js';
import Salon from '../models/Salon.js';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

// Get all packages for a salon
export const getPackages = async (req, res) => {
  try {
    let { salonId } = req.params;
    
    // If no salonId in params and user is a salon owner, get their salon ID
    if (!salonId && req.user && req.user.type === 'salon') {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(req.user.id);
      if (user) {
        const salon = await Salon.findOne({ email: user.email });
        if (salon) {
          salonId = salon._id;
        }
      }
    }
    
    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID is required'
      });
    }
    
    const { page = 1, limit = 20, category, occasionType, isActive, search } = req.query;

    // Build filter object
    const filter = { salonId };
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (occasionType) {
      filter.occasionType = occasionType;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const packages = await Package.find(filter)
      .populate('services.serviceId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Package.countDocuments(filter);

    res.json({
      success: true,
      data: packages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages',
      error: error.message
    });
  }
};

// Get a single package
export const getPackageById = async (req, res) => {
  try {
    const { packageId } = req.params;
    
    const pkg = await Package.findById(packageId)
      .populate('services.serviceId')
      .populate('salonId');

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    res.json({
      success: true,
      data: pkg
    });
  } catch (error) {
    console.error('Error fetching package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch package',
      error: error.message
    });
  }
};

// Create a new package
export const createPackage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { salonId } = req.params;
    const packageData = req.body;

    // Validate that all services exist and belong to the same salon
    const serviceIds = packageData.services.map(s => s.serviceId);
    const services = await Service.find({
      _id: { $in: serviceIds },
      salonId
    });

    if (services.length !== serviceIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Some services not found or do not belong to this salon'
      });
    }

    // Calculate total duration and price using package-specific prices
    let totalDuration = 0;
    let totalPrice = 0;

    packageData.services.forEach(pkgService => {
      const service = services.find(s => s._id.toString() === pkgService.serviceId);
      if (service) {
        const quantity = pkgService.quantity || 1;
        totalDuration += (service.duration || 0) * quantity;
        
        // Use the package-specific price
        const servicePrice = pkgService.price || 0;
        
        totalPrice += servicePrice * quantity;
        pkgService.serviceName = service.name;
      }
    });

    // Apply discount if provided
    let finalPrice = totalPrice;
    if (packageData.discountPercentage && packageData.discountPercentage > 0) {
      finalPrice = totalPrice - (totalPrice * packageData.discountPercentage / 100);
    } else if (packageData.discountedPrice) {
      finalPrice = packageData.discountedPrice;
    }

    const newPackage = new Package({
      ...packageData,
      salonId,
      duration: totalDuration,
      totalPrice,
      discountedPrice: finalPrice
    });

    const savedPackage = await newPackage.save();

    // Populate the saved package with service details
    const populatedPackage = await Package.findById(savedPackage._id)
      .populate('services.serviceId');

    res.status(201).json({
      success: true,
      message: 'Package created successfully',
      data: populatedPackage
    });
  } catch (error) {
    console.error('Error creating package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create package',
      error: error.message
    });
  }
};

// Update a package
export const updatePackage = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { packageId } = req.params;
    const updateData = req.body;

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    // If services are being updated, recalculate totals
    if (updateData.services) {
      const serviceIds = updateData.services.map(s => s.serviceId);
      const services = await Service.find({
        _id: { $in: serviceIds },
        salonId: pkg.salonId
      });

      let totalDuration = 0;
      let totalPrice = 0;

      updateData.services.forEach(pkgService => {
        const service = services.find(s => s._id.toString() === pkgService.serviceId);
        if (service) {
          const quantity = pkgService.quantity || 1;
          totalDuration += (service.duration || 0) * quantity;
          
          // Use the package-specific price
          const servicePrice = pkgService.price || 0;
          
          totalPrice += servicePrice * quantity;
          pkgService.serviceName = service.name;
        }
      });

      // Apply discount if provided
      let finalPrice = totalPrice;
      if (updateData.discountPercentage && updateData.discountPercentage > 0) {
        finalPrice = totalPrice - (totalPrice * updateData.discountPercentage / 100);
      } else if (updateData.discountedPrice) {
        finalPrice = updateData.discountedPrice;
      }

      updateData.duration = totalDuration;
      updateData.totalPrice = totalPrice;
      updateData.discountedPrice = finalPrice;
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      packageId,
      updateData,
      { new: true, runValidators: true }
    ).populate('services.serviceId');

    res.json({
      success: true,
      message: 'Package updated successfully',
      data: updatedPackage
    });
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update package',
      error: error.message
    });
  }
};

// Delete a package
export const deletePackage = async (req, res) => {
  try {
    const { packageId } = req.params;

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    await Package.findByIdAndDelete(packageId);

    res.json({
      success: true,
      message: 'Package deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete package',
      error: error.message
    });
  }
};

// Toggle package active status
export const togglePackageStatus = async (req, res) => {
  try {
    const { packageId } = req.params;

    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Package not found'
      });
    }

    pkg.isActive = !pkg.isActive;
    await pkg.save();

    res.json({
      success: true,
      message: `Package ${pkg.isActive ? 'activated' : 'deactivated'} successfully`,
      data: pkg
    });
  } catch (error) {
    console.error('Error toggling package status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle package status',
      error: error.message
    });
  }
};

// Get packages for customers (public access)
export const getCustomerPackages = async (req, res) => {
  try {
    const { salonId } = req.params;
    
    if (!salonId) {
      return res.status(400).json({
        success: false,
        message: 'Salon ID is required'
      });
    }
    
    // Check if salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }
    
    const { category, occasionType, search } = req.query;

    // Build filter object - only show active packages to customers
    const filter = { 
      salonId,
      isActive: true
    };
    
    if (category) {
      filter.category = category;
    }
    
    if (occasionType) {
      filter.occasionType = occasionType;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const packages = await Package.find(filter)
      .populate('services.serviceId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error('Error fetching customer packages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch packages',
      error: error.message
    });
  }
};

// Get package statistics for a salon
export const getPackageStats = async (req, res) => {
  try {
    const { salonId } = req.params;

    const totalPackages = await Package.countDocuments({ salonId });
    const activePackages = await Package.countDocuments({ salonId, isActive: true });
    const featuredPackages = await Package.countDocuments({ salonId, isFeatured: true });
    
    // Get packages by category
    const packagesByCategory = await Package.aggregate([
      { $match: { salonId: mongoose.Types.ObjectId(salonId) } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Get packages by occasion type
    const packagesByOccasion = await Package.aggregate([
      { $match: { salonId: mongoose.Types.ObjectId(salonId) } },
      { $group: { _id: '$occasionType', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalPackages,
        activePackages,
        featuredPackages,
        packagesByCategory,
        packagesByOccasion
      }
    });
  } catch (error) {
    console.error('Error fetching package stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch package statistics',
      error: error.message
    });
  }
};