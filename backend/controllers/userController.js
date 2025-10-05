import User from '../models/User.js';
import { successResponse, errorResponse } from '../utils/responses.js';

// Search for users by name, email, or phone
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return errorResponse(res, 'Search query is required', 400);
    }

    const users = await User.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ],
      type: 'staff', // Only search for staff users
    }).select('name email phone _id'); // Include _id for frontend usage

    successResponse(res, users, 'Users retrieved successfully');
  } catch (error) {
    console.error('Error searching users:', error);
    errorResponse(res, 'Failed to search users', 500);
  }
};