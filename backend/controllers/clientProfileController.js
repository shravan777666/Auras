import { successResponse, errorResponse, notFoundResponse } from '../utils/responses.js';
import ClientProfile from '../models/ClientProfile.js';
import Message from '../models/Message.js';
import Customer from '../models/Customer.js';
import Salon from '../models/Salon.js';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';

// Get or create client profile
export const getClientProfile = async (req, res) => {
  try {
    const { customerId } = req.params;
    const userId = req.user.id;

    // Get salon from authenticated user
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can access client profiles', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return notFoundResponse(res, 'Customer');
    }

    // Get or create client profile
    let profile = await ClientProfile.getOrCreateProfile(customerId, salon._id, userId);

    // Sync with latest appointment data
    await ClientProfile.syncWithAppointments(customerId, salon._id);
    
    // Refresh profile after sync
    profile = await ClientProfile.findOne({ customerId, salonId: salon._id })
      .populate('customerId', 'name email phone')
      .populate('salonId', 'salonName')
      .populate('internalNotes.generalNotes.addedBy', 'name');

    // Get unread message count
    const unreadCount = await Message.getUnreadCount(salon._id, customerId);

    return successResponse(res, {
      profile,
      unreadMessageCount: unreadCount
    }, 'Client profile retrieved successfully');

  } catch (error) {
    console.error('Error getting client profile:', error);
    return errorResponse(res, 'Failed to retrieve client profile', 500);
  }
};

// Update client profile internal notes
export const updateInternalNotes = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { allergies, personalPreferences, rebookingStatus, generalNote } = req.body;
    const userId = req.user.id;

    // Get salon from authenticated user
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can update client profiles', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    // Find client profile
    const profile = await ClientProfile.findOne({ customerId, salonId: salon._id });
    if (!profile) {
      return notFoundResponse(res, 'Client profile');
    }

    // Update different sections as provided
    if (allergies !== undefined) {
      profile.internalNotes.allergies = allergies;
    }

    if (personalPreferences !== undefined) {
      profile.internalNotes.personalPreferences = personalPreferences;
    }

    if (rebookingStatus !== undefined) {
      profile.internalNotes.rebookingStatus = rebookingStatus;
    }

    // Add general note if provided
    if (generalNote && generalNote.trim()) {
      await profile.addInternalNote(
        generalNote.trim(),
        req.body.noteCategory || 'general',
        userId
      );
    }

    profile.lastUpdatedBy = userId;
    await profile.save();

    // Return updated profile
    const updatedProfile = await ClientProfile.findById(profile._id)
      .populate('customerId', 'name email phone')
      .populate('internalNotes.generalNotes.addedBy', 'name');

    return successResponse(res, updatedProfile, 'Client profile updated successfully');

  } catch (error) {
    console.error('Error updating client profile:', error);
    return errorResponse(res, 'Failed to update client profile', 500);
  }
};

// Get conversation messages
export const getConversation = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    // Get salon from authenticated user
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can access conversations', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    const skip = (page - 1) * limit;
    
    // Get conversation messages
    const messages = await Message.getConversation(salon._id, customerId, {
      limit: parseInt(limit),
      skip: parseInt(skip)
    });

    // Mark messages as read (from customer)
    await Message.markConversationAsRead(salon._id, customerId, userId);

    // Get total message count for pagination
    const conversationId = Message.createConversationId(salon._id, customerId);
    const totalMessages = await Message.countDocuments({ conversationId });
    const totalPages = Math.ceil(totalMessages / limit);

    return successResponse(res, {
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        totalMessages
      }
    }, 'Conversation retrieved successfully');

  } catch (error) {
    console.error('Error getting conversation:', error);
    return errorResponse(res, 'Failed to retrieve conversation', 500);
  }
};

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { content, messageType = 'text', replyTo } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return errorResponse(res, 'Message content is required', 400);
    }

    // Get salon from authenticated user
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can send messages', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return notFoundResponse(res, 'Customer');
    }

    // Send message
    const message = await Message.sendMessage({
      salonId: salon._id,
      customerId,
      senderId: userId,
      senderType: 'salon',
      senderName: user.name || salon.salonName,
      content: content.trim(),
      messageType,
      replyTo
    });

    return successResponse(res, message, 'Message sent successfully');

  } catch (error) {
    console.error('Error sending message:', error);
    return errorResponse(res, 'Failed to send message', 500);
  }
};

// Get all client profiles for a salon (for messaging dashboard)
export const getClientProfiles = async (req, res) => {
  try {
    const { search, sortBy = 'lastMessage', page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    // Get salon from authenticated user
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can access client profiles', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    const skip = (page - 1) * limit;
    let query = { salonId: salon._id };

    // Add search functionality
    if (search && search.trim()) {
      const customers = await Customer.find({
        $or: [
          { name: { $regex: search.trim(), $options: 'i' } },
          { email: { $regex: search.trim(), $options: 'i' } }
        ]
      }).select('_id');
      
      const customerIds = customers.map(c => c._id);
      query.customerId = { $in: customerIds };
    }

    // Determine sort order
    let sortOrder = {};
    switch (sortBy) {
      case 'lastMessage':
        sortOrder = { 'messagingStatus.lastMessageAt': -1 };
        break;
      case 'lastVisit':
        sortOrder = { 'serviceInfo.lastVisit.date': -1 };
        break;
      case 'totalSpent':
        sortOrder = { 'serviceInfo.totalSpent': -1 };
        break;
      case 'name':
        // Will sort by customer name after population
        break;
      default:
        sortOrder = { 'messagingStatus.lastMessageAt': -1 };
    }

    // Get client profiles
    let profiles = await ClientProfile.find(query)
      .populate('customerId', 'name email phone')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOrder);

    // Sort by customer name if requested
    if (sortBy === 'name') {
      profiles.sort((a, b) => {
        const nameA = a.customerId?.name || '';
        const nameB = b.customerId?.name || '';
        return nameA.localeCompare(nameB);
      });
    }

    // Get unread message counts for each profile
    const profilesWithUnread = await Promise.all(
      profiles.map(async (profile) => {
        const unreadCount = await Message.getUnreadCount(salon._id, profile.customerId._id);
        return {
          ...profile.toObject(),
          unreadMessageCount: unreadCount
        };
      })
    );

    // Get total count for pagination
    const totalProfiles = await ClientProfile.countDocuments(query);
    const totalPages = Math.ceil(totalProfiles / limit);

    return successResponse(res, {
      profiles: profilesWithUnread,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        totalProfiles
      }
    }, 'Client profiles retrieved successfully');

  } catch (error) {
    console.error('Error getting client profiles:', error);
    return errorResponse(res, 'Failed to retrieve client profiles', 500);
  }
};

// Update preferred services
export const updatePreferredServices = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { preferredServices } = req.body;
    const userId = req.user.id;

    // Get salon from authenticated user
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can update preferred services', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    // Find and update client profile
    const profile = await ClientProfile.findOneAndUpdate(
      { customerId, salonId: salon._id },
      { 
        'serviceInfo.preferredServices': preferredServices,
        lastUpdatedBy: userId
      },
      { new: true }
    ).populate('customerId', 'name email phone');

    if (!profile) {
      return notFoundResponse(res, 'Client profile');
    }

    return successResponse(res, profile, 'Preferred services updated successfully');

  } catch (error) {
    console.error('Error updating preferred services:', error);
    return errorResponse(res, 'Failed to update preferred services', 500);
  }
};

// Delete internal note
export const deleteInternalNote = async (req, res) => {
  try {
    const { customerId, noteId } = req.params;
    const userId = req.user.id;

    // Get salon from authenticated user
    const user = await User.findById(userId);
    if (!user || user.type !== 'salon') {
      return errorResponse(res, 'Access denied: Only salon owners can delete notes', 403);
    }

    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }

    // Find client profile and remove note
    const profile = await ClientProfile.findOne({ customerId, salonId: salon._id });
    if (!profile) {
      return notFoundResponse(res, 'Client profile');
    }

    // Remove the note
    profile.internalNotes.generalNotes = profile.internalNotes.generalNotes.filter(
      note => note._id.toString() !== noteId
    );

    profile.lastUpdatedBy = userId;
    await profile.save();

    return successResponse(res, profile, 'Internal note deleted successfully');

  } catch (error) {
    console.error('Error deleting internal note:', error);
    return errorResponse(res, 'Failed to delete internal note', 500);
  }
};

export default {
  getClientProfile,
  updateInternalNotes,
  getConversation,
  sendMessage,
  getClientProfiles,
  updatePreferredServices,
  deleteInternalNote
};
