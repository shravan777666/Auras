import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { productService } from '../../services/product';

const AddProductModal = ({ isOpen, onClose, onProductAdded, onProductUpdated, productToEdit }) => {
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    brand: '',
    description: '',
    price: '',
    discountedPrice: '',
    quantity: '',
    sku: '',
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const isEditMode = Boolean(productToEdit);

  const categories = ['Hair', 'Skin', 'Nails', 'Makeup', 'Fragrance', 'Tools'];

  // Initialize form data when editing or creating new product
  useEffect(() => {
    if (productToEdit) {
      setFormData({
        category: productToEdit.category || '',
        name: productToEdit.name || '',
        brand: productToEdit.brand || '',
        description: productToEdit.description || '',
        price: productToEdit.price || '',
        discountedPrice: productToEdit.discountedPrice || '',
        quantity: productToEdit.quantity || '',
        sku: productToEdit.sku || '',
        image: null
      });
      // Set preview image if product has an image URL
      if (productToEdit.image) {
        setPreviewImage(productToEdit.image);
      }
    } else {
      setFormData({
        category: '',
        name: '',
        brand: '',
        description: '',
        price: '',
        discountedPrice: '',
        quantity: '',
        sku: '',
        image: null
      });
      setPreviewImage(null);
    }
  }, [productToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setPreviewImage(null);
    // Clear the file input
    document.getElementById('product-image').value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validate required fields
      if (!formData.category || !formData.name || !formData.price) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('category', formData.category);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('brand', formData.brand);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', parseFloat(formData.price));
      if (formData.discountedPrice) {
        formDataToSend.append('discountedPrice', parseFloat(formData.discountedPrice));
      }
      formDataToSend.append('quantity', parseInt(formData.quantity) || 0);
      formDataToSend.append('sku', formData.sku);
      formDataToSend.append('isActive', true);
      
      // Append image if it exists
      if (formData.image && formData.image instanceof File) {
        formDataToSend.append('image', formData.image);
      }

      // Call the actual API to create/update the product
      if (isEditMode && productToEdit) {
        // Update existing product
        await productService.updateProduct(productToEdit._id, formDataToSend);
        toast.success('Product updated successfully!');
        onProductUpdated();
      } else {
        // Create new product
        await productService.addProduct(formDataToSend);
        toast.success('Product added successfully!');
        onProductAdded();
      }
      
      onClose();
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred while saving the product';
      toast.error(errorMessage);
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Dropdown */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., Shampoo, Conditioner"
              required
            />
          </div>

          {/* Brand */}
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
              Brand
            </label>
            <input
              type="text"
              name="brand"
              id="brand"
              value={formData.brand}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="e.g., L'Oreal, Garnier"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Brief description of the product..."
            ></textarea>
          </div>

          {/* Price and Discounted Price Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="price"
                id="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="e.g., 1500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label htmlFor="discountedPrice" className="block text-sm font-medium text-gray-700 mb-2">
                Discounted Price (₹)
              </label>
              <input
                type="number"
                name="discountedPrice"
                id="discountedPrice"
                value={formData.discountedPrice}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="e.g., 1200"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Quantity and SKU Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                id="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="e.g., 50"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                SKU
              </label>
              <input
                type="text"
                name="sku"
                id="sku"
                value={formData.sku}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="e.g., PROD-001"
              />
            </div>
          </div>

          {/* Product Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Image
            </label>
            <div className="flex items-start space-x-4">
              {/* Image Preview */}
              {previewImage && (
                <div className="relative">
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* Upload Button */}
              <div className="flex-1">
                <label
                  htmlFor="product-image"
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500 mt-1">Click to upload image</p>
                  </div>
                  <input 
                    id="product-image" 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageChange}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isEditMode ? 'Updating...' : 'Adding...'}</span>
                </div>
              ) : (
                isEditMode ? 'Update Product' : 'Add Product'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;