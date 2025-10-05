import StaffInvitation from '../models/StaffInvitation.js';
import Staff from '../models/Staff.js';
import Salon from '../models/Salon.js';
import User from '../models/User.js';
import { errorResponse } from '../utils/responses.js';

// @desc    Create a staff invitation
// @route   POST /api/staff-invitations
// @access  Private (Salon Owner)
const createInvitation = async (req, res) => {
  try {
    const { staffUserId, position, startDate, commission } = req.body;
    
    // Get salon from authenticated user
    const salon = await Salon.findOne({ ownerId: req.user.id });
    if (!salon) {
      return errorResponse(res, 'Salon not found', 404);
    }

    // Check if user exists and is a staff member
    const staffUser = await User.findById(staffUserId);
    if (!staffUser || staffUser.type !== 'staff') {
      return errorResponse(res, 'Staff user not found', 404);
    }

    // Check if staff member is already part of a salon
    const existingStaff = await Staff.findOne({ user: staffUserId });
    if (existingStaff && existingStaff.assignedSalon) {
      return errorResponse(res, 'Staff member is already part of a salon', 400);
    }

    // Check if invitation already exists
    const existingInvitation = await StaffInvitation.findOne({
      salon: salon._id,
      staffUser: staffUserId,
      status: 'pending'
    });
    
    if (existingInvitation) {
      return errorResponse(res, 'Invitation already sent to this staff member', 400);
    }

    // Create new invitation
    const invitation = new StaffInvitation({
      salon: salon._id,
      staffUser: staffUserId,
      position,
      startDate,
      commission: commission || 0,
    });

    await invitation.save();

    // Populate salon info for response
    await invitation.populate('salon', 'salonName');

    res.status(201).json({
      success: true,
      data: invitation,
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 'Failed to send invitation', 500);
  }
};

// @desc    Get pending invitations for a staff member
// @route   GET /api/staff-invitations
// @access  Private (Staff)
const getPendingInvitations = async (req, res) => {
  try {
    const invitations = await StaffInvitation.find({ staffUser: req.user.id, status: 'pending' }).populate('salon', 'name');
    res.json(invitations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Accept a staff invitation
// @route   POST /api/staff-invitations/:id/accept
// @access  Private (Staff)
const acceptInvitation = async (req, res) => {
  try {
    const invitation = await StaffInvitation.findById(req.params.id);

    if (!invitation || invitation.staffUser.toString() !== req.user.id) {
      return errorResponse(res, 'Invitation not found', 404);
    }

    if (invitation.status !== 'pending') {
      return errorResponse(res, 'Invitation has already been responded to', 400);
    }

    // Find existing staff profile or create new one
    let staff = await Staff.findOne({ user: invitation.staffUser });
    
    if (!staff) {
      // Get user details
      const user = await User.findById(invitation.staffUser);
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }
      
      // Create new staff profile with user data
      staff = new Staff({
        user: invitation.staffUser,
        name: user.name,
        email: user.email,
        // Copy existing user data
        contactNumber: user.phone || '',
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        address: user.address || {},
        skills: user.skills || [],
        experience: user.experience || {},
        specialization: user.specialization,
        profilePicture: user.profilePicture,
        documents: user.documents || {}
      });
    }
    
    // Update staff with salon-specific details
    staff.assignedSalon = invitation.salon;
    staff.position = invitation.position;
    staff.startDate = invitation.startDate;
    staff.commission = invitation.commission;
    staff.employmentStatus = 'Employed';
    staff.approvalStatus = 'approved';
    staff.setupCompleted = true;
    
    await staff.save();

    // Add staff to salon
    const salon = await Salon.findById(invitation.salon);
    if (salon && !salon.staff.includes(staff._id)) {
      salon.staff.push(staff._id);
      await salon.save();
    }

    // Update invitation status
    invitation.status = 'accepted';
    await invitation.save();

    res.json({ 
      success: true,
      message: 'Invitation accepted successfully. You are now part of the salon team.' 
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 'Failed to accept invitation', 500);
  }
};

// @desc    Decline a staff invitation
// @route   POST /api/staff-invitations/:id/decline
// @access  Private (Staff)
const declineInvitation = async (req, res) => {
  try {
    const invitation = await StaffInvitation.findById(req.params.id);

    if (!invitation || invitation.staffUser.toString() !== req.user.id) {
      return errorResponse(res, 'Invitation not found', 404);
    }

    if (invitation.status !== 'pending') {
      return errorResponse(res, 'Invitation has already been responded to', 400);
    }

    // Update invitation status
    invitation.status = 'declined';
    await invitation.save();

    res.json({ 
      success: true,
      message: 'Invitation declined successfully' 
    });
  } catch (error) {
    console.error(error);
    errorResponse(res, 'Failed to decline invitation', 500);
  }
};

export { createInvitation, getPendingInvitations, acceptInvitation, declineInvitation };
