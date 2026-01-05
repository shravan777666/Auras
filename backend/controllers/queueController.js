import Queue from '../models/Queue.js';
import Salon from '../models/Salon.js';
import User from '../models/User.js';
import Service from '../models/Service.js';

// Generate a unique token number
const generateTokenNumber = async (salonId) => {
  const salon = await Salon.findById(salonId);
  const prefix = salon?.salonName?.substring(0, 3).toUpperCase() || 'Q';
  
  // Find the highest token number for this salon today
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const lastToken = await Queue.findOne({
    salonId,
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  }).sort({ tokenNumber: -1 });

  let tokenNumber;
  if (lastToken) {
    const lastNumber = parseInt(lastToken.tokenNumber.replace(prefix, ''));
    tokenNumber = `${prefix}${(lastNumber + 1).toString().padStart(3, '0')}`;
  } else {
    tokenNumber = `${prefix}001`;
  }

  return tokenNumber;
};

// Join the queue
export const joinQueue = async (req, res) => {
  try {
    const { customerId, serviceId } = req.body;
    const salonId = req.user.id; // Assuming salon owner is making the request

    // Validate salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found'
      });
    }

    // Validate customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Validate service exists (optional)
    let service = null;
    if (serviceId) {
      service = await Service.findById(serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }
    }

    // Calculate queue position (number of people waiting ahead)
    const waitingCount = await Queue.countDocuments({
      salonId,
      status: 'waiting'
    });

    // Generate unique token number
    const tokenNumber = await generateTokenNumber(salonId);

    // Create queue entry
    const queueEntry = new Queue({
      salonId,
      tokenNumber,
      customerId,
      serviceId: serviceId || undefined,
      queuePosition: waitingCount + 1,
      status: 'waiting'
    });

    await queueEntry.save();

    // Update queue positions for all waiting customers
    await Queue.updateMany(
      { 
        salonId, 
        status: 'waiting',
        _id: { $ne: queueEntry._id }
      },
      { 
        $inc: { queuePosition: 1 } 
      }
    );

    res.status(201).json({
      success: true,
      data: queueEntry,
      message: 'Successfully joined the queue'
    });
  } catch (error) {
    console.error('Error joining queue:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while joining queue',
      error: error.message
    });
  }
};

// Get current queue status for a salon
export const getQueueStatus = async (req, res) => {
  try {
    // Find salon by user email (for salon owners)
    const User = (await import('../models/User.js')).default;
    const Salon = (await import('../models/Salon.js')).default;
    
    const user = await User.findById(req.user.id);
    if (!user || user.type !== 'salon') {
      return res.status(404).json({
        success: false,
        message: 'Salon owner account required'
      });
    }
    
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon profile not found'
      });
    }
    
    const salonId = salon._id;

    // Get current in-service token
    const currentService = await Queue.findOne({
      salonId,
      status: 'in-service'
    }).populate('customerId', 'name email phone');

    // Get next 5 tokens in queue (including those who have arrived)
    const upcomingTokens = await Queue.find({
      salonId,
      status: { $in: ['waiting', 'arrived'] }
    })
    .sort({ queuePosition: 1 })
    .limit(5)
    .populate('customerId', 'name email phone');

    // Get total waiting count (including those who have arrived)
    const totalWaiting = await Queue.countDocuments({
      salonId,
      status: { $in: ['waiting', 'arrived'] }
    });

    // Get recent completed tokens (last 10 minutes)
    const completedTokens = await Queue.find({
      salonId,
      status: 'completed',
      completedAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
    })
    .sort({ completedAt: -1 })
    .limit(3)
    .populate('customerId', 'name email phone');

    res.status(200).json({
      success: true,
      data: {
        currentService,
        upcomingTokens,
        totalWaiting,
        completedTokens
      }
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching queue status',
      error: error.message
    });
  }
};

// Get all queue entries for a salon
export const getQueue = async (req, res) => {
  try {
    const salonId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { salonId };
    if (status) {
      filter.status = status;
    }

    const queue = await Queue.find(filter)
      .populate('customerId', 'name email phone')
      .populate('serviceId', 'name price duration')
      .populate('staffId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Queue.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: queue,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error getting queue:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching queue',
      error: error.message
    });
  }
};

// Update queue status (next, skip, complete)
export const updateQueueStatus = async (req, res) => {
  try {
    const { tokenNumber, action, staffId } = req.body;
    const salonId = req.user.id;

    // Find the queue entry by token number and salon ID
    const queueEntry = await Queue.findOne({
      tokenNumber,
      salonId
    });

    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found'
      });
    }

    switch (action) {
      case 'next':
        // Complete the current service if exists
        await Queue.updateOne(
          { salonId, status: 'in-service' },
          { 
            $set: { 
              status: 'completed',
              completedAt: new Date()
            } 
          }
        );

        // Update the target queue entry to in-service
        queueEntry.status = 'in-service';
        queueEntry.servedAt = new Date();
        if (staffId) {
          queueEntry.staffId = staffId;
        }
        await queueEntry.save();

        // Update queue positions for remaining waiting customers
        await Queue.updateMany(
          { 
            salonId, 
            status: { $in: ['waiting', 'arrived'] },
            queuePosition: { $gt: queueEntry.queuePosition }
          },
          { 
            $inc: { queuePosition: -1 } 
          }
        );

        break;

      case 'skip':
        // Remove the token from the queue by marking as cancelled
        queueEntry.status = 'cancelled';
        await queueEntry.save();

        // Update queue positions for remaining waiting customers
        await Queue.updateMany(
          { 
            salonId, 
            status: { $in: ['waiting', 'arrived'] },
            queuePosition: { $gt: queueEntry.queuePosition }
          },
          { 
            $inc: { queuePosition: -1 } 
          }
        );

        break;

      case 'complete':
        // Complete the service
        queueEntry.status = 'completed';
        queueEntry.completedAt = new Date();
        await queueEntry.save();

        // Update queue positions for remaining waiting customers
        await Queue.updateMany(
          { 
            salonId, 
            status: { $in: ['waiting', 'arrived'] },
            queuePosition: { $gt: queueEntry.queuePosition }
          },
          { 
            $inc: { queuePosition: -1 } 
          }
        );

        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use next, skip, or complete'
        });
    }

    res.status(200).json({
      success: true,
      data: queueEntry,
      message: `Queue entry ${action}ed successfully`
    });
  } catch (error) {
    console.error('Error updating queue status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating queue status',
      error: error.message
    });
  }
};

// Get queue by token number (for customer view)
export const getQueueByToken = async (req, res) => {
  try {
    const { tokenNumber } = req.params;

    const queueEntry = await Queue.findOne({
      tokenNumber
    })
    .populate('customerId', 'name email phone')
    .populate('serviceId', 'name price duration')
    .populate('staffId', 'name email phone')
    .populate('salonId', 'salonName address');

    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue token not found'
      });
    }

    res.status(200).json({
      success: true,
      data: queueEntry
    });
  } catch (error) {
    console.error('Error getting queue by token:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching queue entry',
      error: error.message
    });
  }
};

// Get queue status for customer view
export const getQueueStatusForCustomer = async (req, res) => {
  try {
    const { tokenNumber } = req.params;

    const queueEntry = await Queue.findOne({
      tokenNumber
    })
    .populate('customerId', 'name email phone')
    .populate('serviceId', 'name price duration')
    .populate('staffId', 'name email phone')
    .populate('salonId', 'salonName address');

    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue token not found'
      });
    }

    // Get current in-service token
    const currentService = await Queue.findOne({
      salonId: queueEntry.salonId,
      status: 'in-service'
    });

    // Calculate estimated wait time based on current position
    const estimatedWaitTime = queueEntry.queuePosition * 15; // Assuming 15 mins per customer

    res.status(200).json({
      success: true,
      data: {
        ...queueEntry.toObject(),
        estimatedWaitTime,
        currentServiceToken: currentService ? currentService.tokenNumber : null
      }
    });
  } catch (error) {
    console.error('Error getting customer queue status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching queue status',
      error: error.message
    });
  }
};

// Check-in via QR code
export const checkInViaQR = async (req, res) => {
  try {
    const { tokenNumber } = req.body;

    // Find the queue entry by token number
    const queueEntry = await Queue.findOne({
      tokenNumber
    })
    .populate('salonId', 'salonName');

    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue token not found'
      });
    }

    // Check if already checked in, in service or completed
    if (queueEntry.status === 'in-service' || queueEntry.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Already checked in or service completed'
      });
    }

    // If the customer is just arriving (not yet in service), we can set status to 'arrived'
    // This allows the salon to know the customer is present but doesn't immediately start service
    if (queueEntry.status === 'waiting') {
      queueEntry.status = 'arrived'; // New status for customers who have arrived but not yet in service
      queueEntry.arrivedAt = new Date();
      await queueEntry.save();
    }

    res.status(200).json({
      success: true,
      data: queueEntry,
      message: 'Successfully checked in via QR'
    });
  } catch (error) {
    console.error('Error checking in via QR:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while checking in',
      error: error.message
    });
  }
};

// Get queue status for a specific salon (public endpoint for customer view)
export const getSalonQueueStatus = async (req, res) => {
  try {
    const { salonId } = req.params;

    // Get current in-service token
    const currentService = await Queue.findOne({
      salonId,
      status: 'in-service'
    }).populate('customerId', 'name');

    // Get next 3 tokens in queue (including those who have arrived)
    const upcomingTokens = await Queue.find({
      salonId,
      status: { $in: ['waiting', 'arrived'] }
    })
    .sort({ queuePosition: 1 })
    .limit(3)
    .populate('customerId', 'name');

    // Get total waiting count (including those who have arrived)
    const totalWaiting = await Queue.countDocuments({
      salonId,
      status: { $in: ['waiting', 'arrived'] }
    });

    res.status(200).json({
      success: true,
      data: {
        currentService,
        upcomingTokens,
        totalWaiting
      }
    });
  } catch (error) {
    console.error('Error getting salon queue status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching salon queue status',
      error: error.message
    });
  }
};