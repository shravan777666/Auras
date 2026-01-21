import api from './api';

class PackageService {
  // Get all packages for a salon (customer accessible)
  async getCustomerPackages(salonId, params = {}) {
    try {
      const response = await api.get(`/packages/customer/${salonId}/packages`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get all packages for a salon
  async getPackages(salonId, params = {}) {
    try {
      const response = await api.get(`/salon/${salonId}/packages`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get packages for the authenticated salon owner
  async getMyPackages(params = {}) {
    try {
      const response = await api.get('/salon/my-packages', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get a single package
  async getPackage(packageId) {
    try {
      const response = await api.get(`/salon/packages/${packageId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Create a new package
  async createPackage(salonId, packageData) {
    try {
      const response = await api.post(`/salon/${salonId}/packages`, packageData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Update a package
  async updatePackage(packageId, packageData) {
    try {
      const response = await api.put(`/salon/packages/${packageId}`, packageData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Delete a package
  async deletePackage(packageId) {
    try {
      const response = await api.delete(`/salon/packages/${packageId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Toggle package active status
  async togglePackageStatus(packageId) {
    try {
      const response = await api.patch(`/salon/packages/${packageId}/toggle-status`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Get package statistics
  async getPackageStats(salonId) {
    try {
      const response = await api.get(`/salon/${salonId}/packages/stats`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new PackageService();