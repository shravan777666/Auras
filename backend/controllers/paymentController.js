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

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create payment order
export const createPaymentOrder = asyncHandler(async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const userId = req.user.id;

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate('customerId', 'name email')
      .populate('salonId', 'salonName')
      .populate('services.serviceId', 'name');

    if (!appointment) {
      return errorResponse(res, 'Appointment not found', 404);
    }

    // Verify that the appointment belongs to the customer
    if (appointment.customerId._id.toString() !== userId) {
      return errorResponse(res, 'Unauthorized access to appointment', 403);
    }

    // Check if appointment is already paid
    if (appointment.status === 'Confirmed') {
      return errorResponse(res, 'Appointment is already confirmed and paid', 400);
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(appointment.finalAmount * 100), // Amount in paise
      currency: 'INR',
      receipt: `receipt_order_${appointmentId}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);

    return successResponse(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      appointmentId: appointment._id,
      customerName: appointment.customerId.name,
      customerEmail: appointment.customerId.email,
      salonName: appointment.salonId.salonName,
      services: appointment.services.map(s => s.serviceId.name).join(', '),
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime
    }, 'Payment order created successfully');
  } catch (error) {
    console.error('Error creating payment order:', error);
    return errorResponse(res, 'Failed to create payment order', 500);
  }
});

// Verify payment and update appointment status
export const verifyPayment = asyncHandler(async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      appointmentId 
    } = req.body;

    // Verify payment signature
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest('hex');

    if (digest !== razorpay_signature) {
      return errorResponse(res, 'Payment verification failed', 400);
    }

    // Find the appointment and populate required fields
    const appointment = await Appointment.findById(appointmentId)
      .populate('customerId', 'name')
      .populate('salonId', 'ownerId')
      .populate('services.serviceId', 'name');

    if (!appointment) {
      return errorResponse(res, 'Appointment not found', 404);
    }

    // Update appointment status to confirmed and payment status to paid
    appointment.status = 'Confirmed';
    appointment.paymentStatus = 'Paid';
    appointment.paymentId = razorpay_payment_id;
    await appointment.save();

    // Create revenue records for each service
    for (const service of appointment.services) {
      const revenueRecord = new Revenue({
        service: service.serviceId.name,
        amount: service.price,
        appointmentId: appointment._id,
        salonId: appointment.salonId._id,
        ownerId: appointment.salonId.ownerId,
        customerId: appointment.customerId._id,
        date: new Date(),
        description: `Payment for ${service.serviceId.name} - Appointment #${appointment._id}`,
        source: 'Appointment Payment'
      });
      await revenueRecord.save();
    }

    return successResponse(res, {
      appointmentId: appointment._id,
      paymentId: razorpay_payment_id,
      amount: appointment.finalAmount
    }, 'Payment verified and appointment confirmed successfully');
  } catch (error) {
    console.error('Error verifying payment:', error);
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