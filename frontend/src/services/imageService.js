import api from './api';

class ImageService {
  /**
   * Upload customer profile image
   * @param {File} file - The image file to upload
   * @returns {Promise} - Promise that resolves with the upload response
   */
  async uploadCustomerProfileImage(file) {
    const formData = new FormData();
    formData.append('profileImage', file);
    
    try {
      const response = await api.post('/image-upload/customer/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading customer profile image:', error);
      throw error;
    }
  }

  /**
   * Upload staff profile image
   * @param {File} file - The image file to upload
   * @returns {Promise} - Promise that resolves with the upload response
   */
  async uploadStaffProfileImage(file) {
    const formData = new FormData();
    formData.append('profileImage', file);
    
    try {
      const response = await api.post('/image-upload/staff/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading staff profile image:', error);
      throw error;
    }
  }

  /**
   * Upload salon image
   * @param {File} file - The image file to upload
   * @returns {Promise} - Promise that resolves with the upload response
   */
  async uploadSalonImage(file) {
    const formData = new FormData();
    formData.append('salonImage', file);
    
    try {
      const response = await api.post('/image-upload/salon/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading salon image:', error);
      throw error;
    }
  }

  /**
   * Delete customer profile image
   * @returns {Promise} - Promise that resolves with the delete response
   */
  async deleteCustomerProfileImage() {
    try {
      const response = await api.delete('/customer/profile-image');
      return response.data;
    } catch (error) {
      console.error('Error deleting customer profile image:', error);
      throw error;
    }
  }

  /**
   * Delete staff profile image
   * @returns {Promise} - Promise that resolves with the delete response
   */
  async deleteStaffProfileImage() {
    try {
      const response = await api.delete('/staff/profile-image');
      return response.data;
    } catch (error) {
      console.error('Error deleting staff profile image:', error);
      throw error;
    }
  }

  /**
   * Delete salon image
   * @returns {Promise} - Promise that resolves with the delete response
   */
  async deleteSalonImage() {
    try {
      const response = await api.delete('/salon/image');
      return response.data;
    } catch (error) {
      console.error('Error deleting salon image:', error);
      throw error;
    }
  }
}

export default new ImageService();