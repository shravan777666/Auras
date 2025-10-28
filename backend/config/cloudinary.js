import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dzbjcacnn',
  api_key: process.env.CLOUDINARY_API_KEY || '876578995275917',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'X5ELAMbkjO6-VOEMcAgc_0CNsfw',
});

// Create storage engine for different types of uploads
const createStorage = (folder) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
      transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
  });
};

// Storage configurations for different use cases
const customerStorage = createStorage('auracare/customers');
const staffStorage = createStorage('auracare/staff');
const salonStorage = createStorage('auracare/salons');

// Multer upload configurations
const customerUpload = multer({ storage: customerStorage });
const staffUpload = multer({ storage: staffStorage });
const salonUpload = multer({ storage: salonStorage });

// Helper function to delete an image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Helper function to get image URL from public ID
const getImageUrl = (publicId) => {
  return cloudinary.url(publicId);
};

export {
  cloudinary,
  customerUpload,
  staffUpload,
  salonUpload,
  deleteImage,
  getImageUrl
};