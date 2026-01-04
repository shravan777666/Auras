import Product from '../models/Product.js';
import Salon from '../models/Salon.js';
import { 
  successResponse, 
  errorResponse, 
  paginatedResponse,
  notFoundResponse,
  asyncHandler 
} from '../utils/responses.js';

// Create new product (Salon owners only)
export const createProduct = asyncHandler(async (req, res) => {
  // Find salon by user email
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(req.user.id);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }
  
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }
  
  const salonId = salon._id;
  const productData = {
    ...req.body,
    salonId
  };

  // Handle image upload if present
  if (req.file) {
    productData.image = req.file.path; // Cloudinary URL
  }

  const product = new Product(productData);
  await product.save();

  // Add product to salon's products array (if needed)
  // salon.products.push(product._id);
  // await salon.save();

  return successResponse(res, product, 'Product created successfully', 201);
});

// Get salon products
export const getSalonProducts = asyncHandler(async (req, res) => {
  let salonId;
  
  if (req.user.type === 'salon') {
    // For salon owners, find their salon by email
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user.id);
    if (!user) {
      return notFoundResponse(res, 'User');
    }
    
    const salon = await Salon.findOne({ email: user.email });
    if (!salon) {
      return notFoundResponse(res, 'Salon profile');
    }
    
    salonId = salon._id;
  } else {
    // For other user types, use the salonId from params
    salonId = req.params.salonId;
  }
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = { salonId };

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.active !== undefined) {
    filter.isActive = req.query.active === 'true';
  }

  const [products, totalProducts] = await Promise.all([
    Product.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ category: 1, name: 1 }),
    Product.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalProducts / limit);

  return paginatedResponse(res, products, {
    page,
    limit,
    totalPages,
    totalItems: totalProducts
  });
});

// Get product details
export const getProductDetails = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await Product.findById(productId)
    .populate('salonId', 'salonName salonAddress contactNumber');

  if (!product) {
    return notFoundResponse(res, 'Product');
  }

  return successResponse(res, product, 'Product details retrieved successfully');
});

// Update product
export const updateProduct = asyncHandler(async (req, res) => {
  // Find salon by user email
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(req.user.id);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }
  
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }
  
  const salonId = salon._id;
  const { productId } = req.params;
  const updates = req.body;

  const product = await Product.findOne({ _id: productId, salonId });

  if (!product) {
    return notFoundResponse(res, 'Product');
  }

  // Remove fields that shouldn't be directly updated
  delete updates.salonId;
  delete updates.totalSales;
  delete updates.rating;

  // Handle image upload if present
  if (req.file) {
    updates.image = req.file.path; // Cloudinary URL
  }

  Object.assign(product, updates);
  await product.save();

  return successResponse(res, product, 'Product updated successfully');
});

// Delete product
export const deleteProduct = asyncHandler(async (req, res) => {
  // Find salon by user email
  const User = (await import('../models/User.js')).default;
  const user = await User.findById(req.user.id);
  if (!user || user.type !== 'salon') {
    return notFoundResponse(res, 'Salon user');
  }
  
  const salon = await Salon.findOne({ email: user.email });
  if (!salon) {
    return notFoundResponse(res, 'Salon profile');
  }
  
  const salonId = salon._id;
  const { productId } = req.params;

  const product = await Product.findOneAndDelete({ _id: productId, salonId });

  if (!product) {
    return notFoundResponse(res, 'Product');
  }

  return successResponse(res, product, 'Product deleted successfully');
});

// Get product categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  return successResponse(res, categories, 'Categories retrieved successfully');
});