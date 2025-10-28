import { deleteImage, getImageUrl } from '../config/cloudinary.js';

/**
 * Update profile image for a user
 * @param {Object} model - Mongoose model (Customer, Staff, or Salon)
 * @param {String} userId - User ID
 * @param {String} imageUrl - New image URL from Cloudinary
 * @param {String} imagePublicId - Public ID of the new image
 * @returns {Object} Updated user object
 */
export const updateProfileImage = async (model, userId, imageUrl, imagePublicId) => {
  try {
    // Find the user
    const user = await model.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If user already has a profile image, delete the old one from Cloudinary
    if (user.profilePic || user.profilePicture) {
      const oldPublicId = extractPublicId(user.profilePic || user.profilePicture);
      if (oldPublicId) {
        await deleteImage(oldPublicId);
      }
    }

    // Update the user with the new image
    user.profilePic = imageUrl;
    user.profilePicture = imageUrl;
    
    await user.save();
    
    return user;
  } catch (error) {
    console.error('Error updating profile image:', error);
    throw error;
  }
};

/**
 * Delete profile image for a user
 * @param {Object} model - Mongoose model (Customer, Staff, or Salon)
 * @param {String} userId - User ID
 * @returns {Object} Updated user object
 */
export const deleteProfileImage = async (model, userId) => {
  try {
    // Find the user
    const user = await model.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // If user has a profile image, delete it from Cloudinary
    if (user.profilePic || user.profilePicture) {
      const publicId = extractPublicId(user.profilePic || user.profilePicture);
      if (publicId) {
        await deleteImage(publicId);
      }
      
      // Remove the image reference from the user
      user.profilePic = null;
      user.profilePicture = null;
      
      await user.save();
    }
    
    return user;
  } catch (error) {
    console.error('Error deleting profile image:', error);
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {String} url - Cloudinary image URL
 * @returns {String|null} Public ID or null if not found
 */
export const extractPublicId = (url) => {
  if (!url) return null;
  
  // Match Cloudinary URL pattern and extract public ID
  const match = url.match(/\/([^\/]+)\/([^\/]+)\.(jpg|jpeg|png|gif|webp)/i);
  if (match) {
    return `${match[1]}/${match[2]}`;
  }
  
  // Alternative pattern for Cloudinary URLs
  const altMatch = url.match(/image\/upload\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)/i);
  if (altMatch) {
    return altMatch[1];
  }
  
  return null;
};

/**
 * Validate image URL
 * @param {String} url - Image URL to validate
 * @returns {Boolean} True if valid, false otherwise
 */
export const isValidImageUrl = (url) => {
  if (!url) return false;
  
  // Check if it's a Cloudinary URL
  return url.includes('cloudinary.com') || url.startsWith('http');
};

export default {
  updateProfileImage,
  deleteProfileImage,
  extractPublicId,
  isValidImageUrl
};