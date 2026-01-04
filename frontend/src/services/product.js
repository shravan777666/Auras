import api from './api';

export const productService = {
  async addProduct(productData) {
    // Check if we're sending FormData (for file uploads) or regular object
    if (productData instanceof FormData) {
      // For file uploads, we need to let the browser set the Content-Type with boundary
      const response = await api.post('/product', productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // For regular data, use JSON
      const response = await api.post('/product', productData);
      return response.data;
    }
  },

  async getProducts({ page = 1, limit = 20, category, active } = {}) {
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', limit);
      if (category) params.set('category', category);
      if (active !== undefined) params.set('active', active);
      const response = await api.get(`/product/my/products?${params.toString()}`);
      // Return the full response object, not just response.data
      return response;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  async updateProduct(productId, productData) {
    // Check if we're sending FormData (for file uploads) or regular object
    if (productData instanceof FormData) {
      // For file uploads, we need to let the browser set the Content-Type with boundary
      const response = await api.patch(`/product/${productId}`, productData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // For regular data, use JSON
      const response = await api.patch(`/product/${productId}`, productData);
      return response.data;
    }
  },

  async deleteProduct(productId) {
    const response = await api.delete(`/product/${productId}`);
    return response.data;
  },

  async getProductCategories() {
    const response = await api.get('/product/categories');
    return response.data?.data || [];
  }
};

export default productService;