import api from './api';

export const staffService = {
  // Staff dashboard method
  async getDashboardData() {
    try {
      const response = await api.get('/staff/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching staff dashboard data:', error);
      throw error;
    }
  },
  
  // Staff next appointment method
  async getNextAppointment() {
    try {
      const response = await api.get('/staff/next-appointment');
      return response.data;
    } catch (error) {
      console.error('Error fetching next appointment:', error);
      throw error;
    }
  },
  
  // Get salon colleagues method
  async getSalonColleagues() {
    try {
      const response = await api.get('/staff/colleagues');
      return response.data;
    } catch (error) {
      console.error('Error fetching salon colleagues:', error);
      throw error;
    }
  },
  
  // Staff payroll methods
  async getStaffPayrollRecords(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/payroll/staff/records?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching staff payroll records:', error);
      throw error;
    }
  },

  async getStaffPayrollRecordById(recordId) {
    try {
      const response = await api.get(`/payroll/staff/records/${recordId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching staff payroll record:', error);
      throw error;
    }
  },
  
  // Staff report method
  async getStaffReport() {
    try {
      const response = await api.get('/staff/report');
      return response.data;
    } catch (error) {
      console.error('Error fetching staff report:', error);
      throw error;
    }
  },
  
  // Test connection method
  async testConnection() {
    try {
      const response = await api.get('/staff/profile');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error testing connection:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Get appointments method
  async getAppointments(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/staff/appointments?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching staff appointments:', error);
      throw error;
    }
  },
  
  // Get upcoming appointments method
  async getUpcomingAppointments(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/staff/upcoming-appointments?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      throw error;
    }
  },
  
  // Get completed appointments method
  async getCompletedAppointments(params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/staff/completed-appointments?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching completed appointments:', error);
      throw error;
    }
  },
  
  // Setup profile method
  async setup(formData) {
    try {
      const response = await api.post('/staff/setup', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error setting up staff profile:', error);
      throw error;
    }
  },
  
  // Create staff method
  async createStaff(formData) {
    try {
      const response = await api.post('/staff/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  },
  
  // Get appointments by staff ID method
  async getAppointmentsByStaffId(staffId, params = {}) {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/staff/${staffId}/appointments?${queryParams}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments by staff ID:', error);
      throw error;
    }
  }
};

export default staffService;