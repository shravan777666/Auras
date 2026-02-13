import Razorpay from 'razorpay';
import Appointment from '../models/Appointment.js';
import Customer from '../models/Customer.js';
import Revenue from '../models/Revenue.js';
import crypto from 'crypto'; // Import crypto directly
import { 
  successResponse, 
  errorResponse, 
  asyncHandler 
} from '../utils/responses.js';

// Create payment order
export const createPaymentOrder = asyncHandler(async (req, res) => {
  try {
    console.log('=== Create Payment Order Request ===');
    console.log('User:', req.user);
    console.log('Body:', req.body);

    // Validate Razorpay credentials
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials not configured');
      return errorResponse(res, 'Payment gateway not configured. Please contact support.', 500);
    }

    // Initialize Razorpay instance inside the function to ensure env vars are loaded
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const { appointmentId } = req.body;
    
    if (!appointmentId) {
      console.error('Missing appointmentId in request');
      return errorResponse(res, 'Appointment ID is required', 400);
    }

    const userId = req.user?.id;
    
    if (!userId) {
      console.error('Missing user ID in token');
      return errorResponse(res, 'User not authenticated', 401);
    }

    console.log('Finding appointment:', appointmentId);

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('customerId', 'name email')
      .populate('salonId', 'salonName')
      .populate('freelancerId', 'name')
      .populate('services.serviceId', 'name');

    if (!appointment) {
      console.error('Appointment not found:', appointmentId);
      return errorResponse(res, 'Appointment not found', 404);
    }

    console.log('Appointment found:', {
      id: appointment._id,
      customerId: appointment.customerId?._id,
      userId: userId,
      status: appointment.status,
      paymentStatus: appointment.paymentStatus
    });

    // Verify that the appointment belongs to the customer
    if (appointment.customerId._id.toString() !== userId) {
      console.error('Unauthorized access - customer mismatch:', {
        appointmentCustomerId: appointment.customerId._id.toString(),
        requestUserId: userId
      });
      return errorResponse(res, 'Unauthorized access to appointment', 403);
    }

    // Check if appointment is already paid
    if (appointment.status === 'Approved' || appointment.paymentStatus === 'Paid') {
      console.log('Appointment already paid:', {
        status: appointment.status,
        paymentStatus: appointment.paymentStatus
      });
      return errorResponse(res, 'Appointment is already confirmed and paid', 400);
    }

    // Validate finalAmount
    if (!appointment.finalAmount || appointment.finalAmount <= 0) {
      console.error('Invalid appointment amount:', appointment.finalAmount);
      return errorResponse(res, 'Invalid appointment amount', 400);
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(appointment.finalAmount * 100), // Amount in paise
      currency: 'INR',
      receipt: `receipt_order_${appointmentId}`,
      payment_capture: 1
    };

    console.log('Creating Razorpay order with options:', options);

    const order = await razorpay.orders.create(options);

    console.log('Razorpay order created successfully:', order.id);

    return successResponse(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      appointmentId: appointment._id,
      customerName: appointment.customerId.name,
      customerEmail: appointment.customerId.email,
      salonName: appointment.salonId ? appointment.salonId.salonName : (appointment.freelancerId ? appointment.freelancerId.name : 'Service Provider'),
      services: appointment.services.map(s => s.serviceId?.name || s.serviceName || 'Service').join(', '),
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime
    }, 'Payment order created successfully');
  } catch (error) {
    console.error('Error creating payment order:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    // Provide more specific error messages
    if (error.name === 'CastError') {
      return errorResponse(res, 'Invalid appointment ID format', 400);
    }
    
    if (error.message && error.message.includes('Razorpay')) {
      return errorResponse(res, 'Payment gateway error. Please try again later.', 500);
    }
    
    return errorResponse(res, error.message || 'Failed to create payment order', 500);
  }
});

// Verify payment and update appointment status
export const verifyPayment = asyncHandler(async (req, res) => {
  try {
    // Initialize Razorpay instance inside the function to ensure env vars are loaded
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      appointmentId 
    } = req.body;

    console.log('Payment verification request:', {
      razorpay_order_id,
      razorpay_payment_id,
      appointmentId
    });

    // Check if required environment variables are present
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('RAZORPAY_KEY_SECRET is not set in environment variables');
      return errorResponse(res, 'Payment configuration error', 500);
    }

    // Verify payment signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      console.log('Payment signature verification failed:', {
        generated: digest,
        received: razorpay_signature
      });
      return errorResponse(res, 'Payment verification failed', 400);
    }

    console.log('Payment signature verified successfully');

    // Find the appointment and populate required fields
    const appointment = await Appointment.findById(appointmentId)
      .populate('customerId', 'name')
      .populate('salonId', 'ownerId')
      .populate('freelancerId', 'ownerId')
      .populate('services.serviceId', 'name');

    if (!appointment) {
      console.log('Appointment not found:', appointmentId);
      return errorResponse(res, 'Appointment not found', 404);
    }

    console.log('Appointment found:', {
      id: appointment._id,
      customerId: appointment.customerId?._id,
      salonId: appointment.salonId?._id,
      ownerId: appointment.salonId?.ownerId,
      services: appointment.services?.map(s => ({
        serviceId: s.serviceId?._id,
        serviceName: s.serviceId?.name,
        price: s.price
      }))
    });

    // Validate required appointment fields
    if (!appointment.customerId || (!appointment.salonId && !appointment.freelancerId)) {
      console.error('Missing required appointment data:', {
        customerId: !!appointment.customerId,
        salonId: !!appointment.salonId,
        freelancerId: !!appointment.freelancerId,
        ownerId: !!appointment.salonId?.ownerId || !!appointment.freelancerId?.ownerId
      });
      return errorResponse(res, 'Incomplete appointment data', 500);
    }

    // Update payment status to paid but keep appointment status as 'Pending' for manual approval
    appointment.paymentStatus = 'Paid';
    appointment.paymentId = razorpay_payment_id;
    await appointment.save();

    console.log('Appointment updated successfully');

    // Create revenue records for each service
    if (appointment.services && appointment.services.length > 0) {
      for (const service of appointment.services) {
        try {
          // Add safety checks for service data
          if (!service.serviceId || !service.serviceId.name) {
            console.log('Skipping service due to missing data:', service);
            continue;
          }
          
          // Determine if this is a salon or freelancer appointment
          let entityOwner = null;
          let entityId = null;
          
          if (appointment.salonId && appointment.salonId._id) {
            entityOwner = appointment.salonId.ownerId;
            entityId = appointment.salonId._id;
          } else if (appointment.freelancerId) {
            // Handle freelancer appointment
            if (typeof appointment.freelancerId === 'object' && appointment.freelancerId._id) {
              // Already populated
              entityOwner = appointment.freelancerId.ownerId || appointment.freelancerId._id;
              entityId = appointment.freelancerId._id;
            } else if (typeof appointment.freelancerId === 'string') {
              // Not populated, need to fetch freelancer info separately
              const Freelancer = (await import('../models/Freelancer.js')).default;
              const freelancer = await Freelancer.findById(appointment.freelancerId);
              if (freelancer) {
                entityOwner = freelancer.ownerId || freelancer._id;
                entityId = freelancer._id;
              }
            }
          }
          
          if (!entityId) {
            console.log('Skipping revenue record due to missing entity data');
            continue;
          }
          
          if (!entityOwner) {
            console.log('Using fallback owner ID for revenue record');
            // For freelancer, we can use the freelancer's own ID as the owner
            entityOwner = appointment.freelancerId ? appointment.freelancerId._id : (appointment.salonId ? appointment.salonId.ownerId : null);
          }
          
          if (!appointment.customerId || !appointment.customerId._id) {
            console.log('Skipping revenue record due to missing customer data');
            continue;
          }

          const revenueData = {
            service: service.serviceId.name,
            amount: service.price || 0,
            appointmentId: appointment._id,
            ownerId: entityOwner,
            customerId: appointment.customerId._id,
            date: new Date(),
            description: `Payment for ${service.serviceId.name} - Appointment #${appointment._id}`,
            source: 'Appointment Payment'
          };

          // Add the appropriate ID field based on the type of appointment
          if (appointment.salonId && appointment.salonId._id === entityId) {
            revenueData.salonId = entityId;
          } else if (appointment.freelancerId && appointment.freelancerId._id === entityId) {
            revenueData.freelancerId = entityId;
          }

          const revenueRecord = new Revenue(revenueData);
          
          await revenueRecord.save();
          console.log('Revenue record created:', revenueRecord._id);
        } catch (revenueError) {
          console.error('Error creating revenue record:', revenueError);
          // Continue with other services even if one fails
        }
      }
    }

    return successResponse(res, {
      appointmentId: appointment._id,
      paymentId: razorpay_payment_id,
      amount: appointment.finalAmount
    }, 'Payment verified and appointment confirmed successfully');
  } catch (error) {
    console.error('Error verifying payment:', error);
    console.error('Error stack:', error.stack);
    return errorResponse(res, 'Failed to verify payment', 500);
  }
});

// Handle payment failure
export const handlePaymentFailure = asyncHandler(async (req, res) => {
  try {
    const { appointmentId, error } = req.body;

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return errorResponse(res, 'Appointment not found', 404);
    }

    // Update appointment with payment failure info
    appointment.paymentStatus = 'Failed';
    appointment.paymentError = error;
    await appointment.save();

    return successResponse(res, {
      appointmentId: appointment._id
    }, 'Payment failure recorded');
  } catch (error) {
    console.error('Error handling payment failure:', error);
    return errorResponse(res, 'Failed to record payment failure', 500);
  }
});

export default {
  createPaymentOrder,
  verifyPayment,
  handlePaymentFailure
};