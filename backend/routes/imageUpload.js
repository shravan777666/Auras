import express from 'express';
import { customerUpload, staffUpload, salonUpload } from '../config/cloudinary.js';
import { requireCustomer, requireStaff, requireSalonOwner } from '../middleware/roleAuth.js';
import { 
  updateCustomerProfileImage,
  updateStaffProfileImage,
  updateSalonImage
} from '../controllers/imageController.js';

const router = express.Router();

// Customer profile image upload
router.post('/customer/profile', 
  requireCustomer, 
  customerUpload.single('profileImage'), 
  updateCustomerProfileImage
);

// Staff profile image upload
router.post('/staff/profile', 
  requireStaff, 
  staffUpload.single('profileImage'), 
  updateStaffProfileImage
);

// Salon image upload
router.post('/salon/image', 
  requireSalonOwner, 
  salonUpload.single('salonImage'), 
  updateSalonImage
);

// Generic image upload endpoint
router.post('/upload', 
  (req, res) => {
    // This endpoint can be used for general image uploads
    // It requires authentication headers to be set by the client
    res.status(400).json({
      success: false,
      message: 'Please use specific endpoints: /customer/profile, /staff/profile, or /salon/image'
    });
  }
);

export default router;