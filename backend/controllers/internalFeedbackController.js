import InternalStaffFeedback from '../models/InternalStaffFeedback.js';
import Staff from '../models/Staff.js';
import Salon from '../models/Salon.js';

// @desc    Submit internal staff feedback
// @route   POST /api/internal-feedback
// @access  Private (Staff)
export const submitInternalFeedback = async (req, res) => {
  try {
    const { type, subject, content, isAnonymous } = req.body;
    const staffMemberId = req.user.id; // Assuming req.user.id is the staff's user ID
    
    // Find the staff to get the salonId
    const staff = await Staff.findOne({ user: staffMemberId });
    if (!staff) {
      return res.status(404).json({ message: 'Staff not found' });
    }

    const newFeedback = new InternalStaffFeedback({
      staffMemberId: staff._id,
      salonId: staff.assignedSalon,
      type,
      subject,
      content,
      isAnonymous,
    });

    await newFeedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback: newFeedback });
  } catch (error) {
    console.error('Error submitting internal feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get internal staff feedback for a salon
// @route   GET /api/internal-feedback/salon/:salonId
// @access  Private (Manager/Owner)
export const getInternalFeedbackForSalon = async (req, res) => {
  try {
    const { salonId } = req.params;
    const { type, status, page = 1, limit = 10 } = req.query;

    // Check if user is authorized (Manager/Owner of the salon)
    // This logic depends on your auth middleware, assuming it adds user roles and salon ownership info
    // For example: if (req.user.role !== 'owner' && req.user.salonId.toString() !== salonId) { ... }
    
    const query = { salonId };
    if (type) query.type = type;
    if (status) query.status = status;

    const feedback = await InternalStaffFeedback.find(query)
      .populate({
        path: 'staffMemberId',
        select: 'name', // Select fields to populate, 'name' is an example
        // Conditionally populate based on isAnonymous
        transform: (doc, id) => doc.isAnonymous ? { name: 'Anonymous' } : doc,
      })
      .sort({ dateSubmitted: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await InternalStaffFeedback.countDocuments(query);

    res.json({
      feedback,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error('Error fetching internal feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update internal feedback status
// @route   PATCH /api/internal-feedback/:id/status
// @access  Private (Manager/Owner)
export const updateInternalFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const feedback = await InternalStaffFeedback.findById(id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    // Authorization check: ensure user is manager/owner of the feedback's salon
    // e.g., if (req.user.salonId.toString() !== feedback.salonId.toString()) { ... }

    feedback.status = status;
    await feedback.save();

    res.json({ message: 'Feedback status updated successfully', feedback });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
