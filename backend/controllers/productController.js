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

  // Handle ingredients array if it comes as a stringified JSON
  if (productData.ingredients && typeof productData.ingredients === 'string') {
    try {
      productData.ingredients = JSON.parse(productData.ingredients);
      // Ensure ingredients is an array of strings
      if (!Array.isArray(productData.ingredients)) {
        productData.ingredients = [];
      }
      // Trim and filter out empty strings
      productData.ingredients = productData.ingredients.map(ingredient => {
        if (typeof ingredient === 'string') {
          return ingredient.trim();
        }
        return '';
      }).filter(ingredient => ingredient !== '');
    } catch (error) {
      console.warn('[productController.createProduct] Invalid ingredients format, setting to empty array');
      productData.ingredients = [];
    }
  }

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

  // Handle ingredients array if it comes as a stringified JSON
  if (updates.ingredients && typeof updates.ingredients === 'string') {
    try {
      updates.ingredients = JSON.parse(updates.ingredients);
      // Ensure ingredients is an array of strings
      if (!Array.isArray(updates.ingredients)) {
        updates.ingredients = [];
      }
      // Trim and filter out empty strings
      updates.ingredients = updates.ingredients.map(ingredient => {
        if (typeof ingredient === 'string') {
          return ingredient.trim();
        }
        return '';
      }).filter(ingredient => ingredient !== '');
    } catch (error) {
      console.warn('[productController.updateProduct] Invalid ingredients format, setting to empty array');
      updates.ingredients = [];
    }
  }

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

// Get recommended products based on service and salon
export const getRecommendedProducts = asyncHandler(async (req, res) => {
  const { serviceId, salonId } = req.params;
  
  // Validate input parameters
  if (!serviceId || !salonId) {
    return errorResponse(res, 'Service ID and Salon ID are required', 400);
  }
  
  try {
    // First, get the service to understand its category/type
    const Service = (await import('../models/Service.js')).default;
    const service = await Service.findById(serviceId);
    
    if (!service) {
      return notFoundResponse(res, 'Service');
    }
    
    // Find products from the same salon that are related to the service
    // This could be based on category, keywords, or other logic
    const filter = { salonId, isActive: { $ne: false } }; // Only active products
    
    // Define category mappings for better recommendations
    const serviceCategoryMap = {
      'hair': ['hair', 'shampoo', 'conditioner', 'hair care', 'scalp'],
      'facial': ['facial', 'skin care', 'face', 'cleanser', 'moisturizer', 'serum'],
      'massage': ['massage', 'oil', 'aromatherapy', 'body'],
      'manicure': ['nail', 'hand', 'polish', 'cuticle'],
      'pedicure': ['nail', 'foot', 'polish', 'cuticle'],
      'makeup': ['makeup', 'cosmetics', 'foundation', 'lipstick', 'eyeshadow'],
      'waxing': ['wax', 'hair removal', 'depilatory', 'sensitive skin'],
      'spa': ['spa', 'wellness', 'aromatherapy', 'body', 'oil', 'salt']
    };
    
    // If service has a category, try to match products with related categories
    if (service.category) {
      const serviceCategory = service.category.toLowerCase();
      const relatedCategories = serviceCategoryMap[serviceCategory] || [serviceCategory];
      
      // Create a regex to match related categories
      const categoryRegex = new RegExp(relatedCategories.join('|'), 'i');
      filter.category = categoryRegex;
    } else {
      // If no specific category match, just get products from the salon
      // without category filtering
    }
    
    // Get products from the salon
    const products = await Product.find(filter)
      .limit(5) // Limit to 5 recommended products
      .sort({ totalSales: -1, rating: -1 }); // Sort by popularity and rating
    
    return successResponse(res, products, 'Recommended products retrieved successfully');
  } catch (error) {
    console.error('Error fetching recommended products:', error);
    return errorResponse(res, 'Error fetching recommended products', 500);
  }
});