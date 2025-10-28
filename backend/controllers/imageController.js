import Customer from '../models/Customer.js';
import Staff from '../models/Staff.js';
import Salon from '../models/Salon.js';
import { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';
import { updateProfileImage, deleteProfileImage } from '../utils/imageUtils.js';

/**
 * Update customer profile image
 */
export const updateCustomerProfileImage = asyncHandler(async (req, res) => {
  try {
    const customerId = req.user.id;
    
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    // For Cloudinary, the URL is in req.file.path or req.file.secure_url
    const imageUrl = req.file.secure_url || req.file.path || req.file.url;
    
    // Update customer profile image
    const updatedCustomer = await updateProfileImage(Customer, customerId, imageUrl, req.file.filename);
    
    return successResponse(res, {
      profilePic: imageUrl,
      profilePicture: imageUrl
    }, 'Profile image updated successfully');
  } catch (error) {
    console.error('Error updating customer profile image:', error);
    return errorResponse(res, 'Error updating profile image', 500);
  }
});

/**
 * Update staff profile image
 */
export const updateStaffProfileImage = asyncHandler(async (req, res) => {
  try {
    const staffId = req.user.id;
    
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    // For Cloudinary, the URL is in req.file.path or req.file.secure_url
    const imageUrl = req.file.secure_url || req.file.path || req.file.url;
    
    // Update staff profile image
    const updatedStaff = await updateProfileImage(Staff, staffId, imageUrl, req.file.filename);
    
    return successResponse(res, {
      profilePicture: imageUrl
    }, 'Profile image updated successfully');
  } catch (error) {
    console.error('Error updating staff profile image:', error);
    return errorResponse(res, 'Error updating profile image', 500);
  }
});

/**
 * Update salon image
 */
export const updateSalonImage = asyncHandler(async (req, res) => {
  try {
    const salonId = req.user.id; // This would need to be adjusted based on your auth setup
    
    if (!req.file) {
      return errorResponse(res, 'No file uploaded', 400);
    }

    // For Cloudinary, the URL is in req.file.path or req.file.secure_url
    const imageUrl = req.file.secure_url || req.file.path || req.file.url;
    
    // Update salon image
    const updatedSalon = await updateProfileImage(Salon, salonId, imageUrl, req.file.filename);
    
    return successResponse(res, {
      salonImage: imageUrl
    }, 'Salon image updated successfully');
  } catch (error) {
    console.error('Error updating salon image:', error);
    return errorResponse(res, 'Error updating salon image', 500);
  }
});

/**
 * Delete customer profile image
 */
export const deleteCustomerProfileImage = asyncHandler(async (req, res) => {
  try {
    const customerId = req.user.id;
    
    // Delete customer profile image
    await deleteProfileImage(Customer, customerId);
    
    return successResponse(res, null, 'Profile image deleted successfully');
  } catch (error) {
    console.error('Error deleting customer profile image:', error);
    return errorResponse(res, 'Error deleting profile image', 500);
  }
});

/**
 * Delete staff profile image
 */
export const deleteStaffProfileImage = asyncHandler(async (req, res) => {
  try {
    const staffId = req.user.id;
    
    // Delete staff profile image
    await deleteProfileImage(Staff, staffId);
    
    return successResponse(res, null, 'Profile image deleted successfully');
  } catch (error) {
    console.error('Error deleting staff profile image:', error);
    return errorResponse(res, 'Error deleting profile image', 500);
  }
});

/**
 * Delete salon image
 */
export const deleteSalonImage = asyncHandler(async (req, res) => {
  try {
    const salonId = req.user.id; // This would need to be adjusted based on your auth setup
    
    // Delete salon image
    await deleteProfileImage(Salon, salonId);
    
    return successResponse(res, null, 'Salon image deleted successfully');
  } catch (error) {
    console.error('Error deleting salon image:', error);
    return errorResponse(res, 'Error deleting salon image', 500);
  }
});

export default {
  updateCustomerProfileImage,
  updateStaffProfileImage,
  updateSalonImage,
  deleteCustomerProfileImage,
  deleteStaffProfileImage,
  deleteSalonImage
};