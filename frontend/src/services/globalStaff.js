import { api } from './api';

class GlobalStaffService {
  // Get global staff directory with filters
  async getGlobalStaffDirectory(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      // Add pagination
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      
      // Add search and filters
      if (filters.search) params.append('search', filters.search);
      if (filters.location) params.append('location', filters.location);
      if (filters.salon) params.append('salon', filters.salon);
      if (filters.skills) params.append('skills', filters.skills);
      if (filters.experience !== undefined) params.append('experience', filters.experience);
      
      console.log('🔍 Fetching global staff directory with filters:', filters);
      const response = await api.get(`/salon/staff/global-directory?${params}`);
      
      // Debug profile pictures
      if (response.data?.data?.staff) {
        console.log('📸 Profile picture URLs received:', 
          response.data.data.staff.map(s => ({
            name: s.name,
            profilePicture: s.profilePicture
          }))
        );
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching global staff directory:', error);
      throw error;
    }
  }

  // Get available skills for filtering
  getAvailableSkills() {
    return [
      'Haircut',
      'Hair Styling',
      'Hair coloring',
      'Hair Coloring',
      'Hair Treatment',
      'Facial',
      'Massage',
      'Manicure',
      'Pedicure',
      'Makeup',
      'Eyebrow Threading',
      'Waxing',
      'Skin Care',
      'Nail Art',
      'Bridal Makeup',
      'Hair Extensions',
      'Beard Styling',
      'Hot Shave'
    ];
  }

  // Get experience level options
  getExperienceLevels() {
    return [
      { value: 0, label: 'Entry Level (0-1 years)' },
      { value: 1, label: 'Junior (1-3 years)' },
      { value: 2, label: 'Mid Level (3-5 years)' },
      { value: 3, label: 'Senior (5+ years)' }
    ];
  }

  // Get employment status options
  getEmploymentStatuses() {
    return [
      'Available',
      'Employed',
      'Part-time',
      'Freelance',
      'Contract'
    ];
  }

  // Format staff data for display
  formatStaffData(staff) {
    return {
      ...staff,
      displayName: staff.name || 'Unknown',
      displayLocation: staff.location?.city && staff.location?.state 
        ? `${staff.location.city}, ${staff.location.state}`
        : staff.location?.city || staff.location?.state || 'Location not specified',
      displayExperience: staff.experience?.years 
        ? `${staff.experience.years} year${staff.experience.years !== 1 ? 's' : ''}`
        : 'Experience not specified',
      displaySkills: staff.skills && staff.skills.length > 0 
        ? staff.skills.join(', ')
        : 'Skills not specified',
      displaySalon: staff.salon 
        ? `${staff.salon.name}${staff.salon.location ? ` - ${staff.salon.location}` : ''}`
        : 'Independent/Available',
      joinedDate: staff.joinedDate ? new Date(staff.joinedDate).toLocaleDateString() : 'N/A'
    };
  }

  // Helper method to get status color
  getStatusColor(status) {
    const statusColors = {
      'Available': 'bg-green-100 text-green-800',
      'Employed': 'bg-blue-100 text-blue-800',
      'Part-time': 'bg-yellow-100 text-yellow-800',
      'Freelance': 'bg-purple-100 text-purple-800',
      'Contract': 'bg-orange-100 text-orange-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  // Helper method to get experience level color
  getExperienceLevelColor(years) {
    if (years <= 1) return 'bg-red-100 text-red-800';
    if (years <= 3) return 'bg-yellow-100 text-yellow-800';
    if (years <= 5) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  }

  // Export staff data to CSV
  exportToCSV(staffList, filename = 'global_staff_directory') {
    if (!staffList || staffList.length === 0) {
      throw new Error('No staff data to export');
    }

    const headers = [
      'Name',
      'Email',
      'Phone',
      'Position',
      'Skills',
      'Experience (Years)',
      'Specialization',
      'Status',
      'Location',
      'Current Salon',
      'Joined Date'
    ];

    const csvContent = [
      headers.join(','),
      ...staffList.map(staff => {
        const formattedStaff = this.formatStaffData(staff);
        return [
          formattedStaff.displayName,
          staff.email || 'N/A',
          staff.contactNumber || 'N/A',
          staff.position || 'N/A',
          formattedStaff.displaySkills,
          staff.experience?.years || 0,
          staff.specialization || 'N/A',
          staff.status || 'N/A',
          formattedStaff.displayLocation,
          formattedStaff.displaySalon,
          formattedStaff.joinedDate
        ].map(field => `"${field}"`).join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Validate search filters
  validateFilters(filters) {
    const errors = [];
    
    if (filters.experienceLevel !== undefined) {
      const validLevels = [0, 1, 2, 3];
      if (!validLevels.includes(parseInt(filters.experienceLevel))) {
        errors.push('Invalid experience level');
      }
    }

    if (filters.page && (isNaN(filters.page) || filters.page < 1)) {
      errors.push('Invalid page number');
    }

    if (filters.limit && (isNaN(filters.limit) || filters.limit < 1 || filters.limit > 100)) {
      errors.push('Invalid limit (must be between 1 and 100)');
    }

    return errors;
  }
}

export const globalStaffService = new GlobalStaffService();
export default globalStaffService;
