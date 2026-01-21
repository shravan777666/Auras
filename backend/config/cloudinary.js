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
const createStorage = (folder, allowedFormats = ['jpg', 'png', 'jpeg', 'gif', 'webp']) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      allowed_formats: allowedFormats,
      resource_type: 'auto', // Automatically detect resource type
      // No transformations to avoid issues with PDF files
    }
  });
};

// Storage configurations for different use cases
// Customer storage - images only
const customerStorage = createStorage('auracare/customers');

// Staff storage - images and PDFs for government ID
const staffStorage = createStorage('auracare/staff', ['jpg', 'png', 'jpeg', 'gif', 'webp', 'pdf']);

// Salon storage - images and PDFs for business license

const salonStorage = createStorage('auracare/salons', ['jpg', 'png', 'jpeg', 'gif', 'webp', 'pdf']);



// Freelancer storage - images and PDFs for profile picture, government ID, and certificates

const freelancerStorage = createStorage('auracare/freelancers', ['jpg', 'png', 'jpeg', 'gif', 'webp', 'pdf']);





// Multer upload configurations

const customerUpload = multer({ storage: customerStorage });

const staffUpload = multer({ storage: staffStorage });

const salonUpload = multer({ storage: salonStorage });

const freelancerUpload = multer({ storage: freelancerStorage });





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

  freelancerUpload,

  deleteImage,

  getImageUrl

};
