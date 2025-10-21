import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { globalStaffService } from '../../services/globalStaff';
import BroadcastModal from '../../components/salon/BroadcastModal';
import BackButton from '../../components/common/BackButton';
import { 
  Search, 
  Filter, 
  Download, 
  MapPin, 
  Briefcase, 
  Clock, 
  Star,
  Building2,
  Phone,
  Mail,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Users,
  Send,
  MessageSquare
} from 'lucide-react';

const GlobalStaffDirectory = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    skills: '',
    experienceLevel: '',
    employmentStatus: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  // Load staff directory
  const loadStaffDirectory = async (page = 1, newFilters = filters) => {
    try {
      setSearchLoading(true);
      setError(null);

      const params = {
        page,
        limit: 20,
        ...newFilters
      };

      console.log('🔄 Loading staff with params:', params);
      const response = await globalStaffService.getGlobalStaffDirectory(params);
      
      if (response.success) {
        console.log('✅ Staff data loaded:', response.data);
        setStaffList(response.data.staff || []);
        setPagination(response.data.pagination || {});
        
        // Debug profile pictures
        const staffWithPhotos = response.data.staff?.filter(s => s.profilePicture) || [];
        console.log(`📸 ${staffWithPhotos.length} staff members have profile pictures:`, 
          staffWithPhotos.map(s => ({ name: s.name, url: s.profilePicture }))
        );
      } else {
        setError('Failed to load staff directory');
      }
    } catch (err) {
      console.error('Error loading staff:', err);
      setError(err.response?.data?.message || 'Failed to load staff directory');
    } finally {
      setSearchLoading(false);
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadStaffDirectory();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    loadStaffDirectory(1, filters);
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      location: '',
      skills: '',
      experienceLevel: '',
      employmentStatus: ''
    };
    setFilters(clearedFilters);
    loadStaffDirectory(1, clearedFilters);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadStaffDirectory(newPage, filters);
    }
  };

  // Export to CSV
  const handleExport = () => {
    try {
      globalStaffService.exportToCSV(staffList, 'global_staff_directory');
      toast.success('Staff directory exported successfully!');
    } catch (error) {
      toast.error('Failed to export staff directory');
    }
  };

  // Refresh data
  const handleRefresh = () => {
    loadStaffDirectory(pagination.page, filters);
  };

  // Handle broadcast success
  const handleBroadcastSuccess = (broadcastData) => {
    console.log('✅ Broadcast sent successfully:', broadcastData);
    // Optionally refresh the directory or show additional success info
  };

  // Render staff card
  const renderStaffCard = (staff) => {
    const formattedStaff = globalStaffService.formatStaffData(staff);
    
    return (
      <div key={staff._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6">
        {/* Header with profile picture and basic info */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="flex-shrink-0 relative">
            {staff.profilePicture ? (
              <>
                <img 
                  src={staff.profilePicture} 
                  alt={staff.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    console.log('❌ Profile picture failed to load:', staff.profilePicture);
                    e.target.style.display = 'none';
                    const fallback = e.target.nextElementSibling;
                    if (fallback) {
                      fallback.style.display = 'flex';
                    }
                  }}
                  onLoad={() => {
                    console.log('✅ Profile picture loaded successfully:', staff.profilePicture);
                  }}
                />
                <div 
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 items-center justify-center text-white font-semibold text-lg hidden"
                >
                  {staff.name ? staff.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </>
            ) : (
              <div 
                className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-lg"
              >
                {staff.name ? staff.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {formattedStaff.displayName}
            </h3>
            <p className="text-sm text-gray-600 mb-1">{staff.position || 'Staff Member'}</p>
            
            {/* Status badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${globalStaffService.getStatusColor(staff.status)}`}>
              {staff.status || 'Available'}
            </span>
          </div>
        </div>

        {/* Contact information */}
        <div className="space-y-2 mb-4">
          {staff.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2 text-gray-400" />
              <span className="truncate">{staff.email}</span>
            </div>
          )}
          {staff.contactNumber && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2 text-gray-400" />
              <span>{staff.contactNumber}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
            <span>{formattedStaff.displayLocation}</span>
          </div>
        </div>

        {/* Current salon information */}
        {staff.salon && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center text-sm font-medium text-blue-900 mb-1">
              <Building2 className="h-4 w-4 mr-2" />
              Currently at {staff.salon.name}
            </div>
            <p className="text-xs text-blue-700">{staff.salon.location}</p>
            {staff.salon.phone && (
              <p className="text-xs text-blue-700">{staff.salon.phone}</p>
            )}
          </div>
        )}

        {/* Skills and experience */}
        <div className="space-y-3">
          {/* Skills */}
          {staff.skills && staff.skills.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                <Star className="h-4 w-4 mr-1" />
                Skills
              </h4>
              <div className="flex flex-wrap gap-1">
                {staff.skills.slice(0, 6).map((skill, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-primary-100 text-primary-700 border border-primary-200"
                  >
                    {skill}
                  </span>
                ))}
                {staff.skills.length > 6 && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                    +{staff.skills.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Experience and specialization */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              <span>{formattedStaff.displayExperience}</span>
            </div>
            {staff.specialization && (
              <div className="flex items-center text-gray-600">
                <Briefcase className="h-4 w-4 mr-1" />
                <span className="truncate max-w-32">{staff.specialization}</span>
              </div>
            )}
          </div>

          {/* Experience description */}
          {staff.experience?.description && (
            <p className="text-sm text-gray-600 italic">
              "{staff.experience.description}"
            </p>
          )}
        </div>

        {/* Footer with join date */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Joined platform: {formattedStaff.joinedDate}
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading global staff directory...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <BackButton fallbackPath="/salon/dashboard" className="mb-2" />
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Staff Directory</h1>
              <p className="text-gray-600">Browse all staff members registered on the AuraCares platform</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowBroadcastModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Broadcast to Staff
              </button>
              <button
                onClick={handleRefresh}
                disabled={searchLoading}
                className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${searchLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExport}
                disabled={staffList.length === 0}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {/* Search bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, skills, or specialization..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </form>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Location filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="City or State"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Skills filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                  <select
                    value={filters.skills}
                    onChange={(e) => handleFilterChange('skills', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Skills</option>
                    {globalStaffService.getAvailableSkills().map(skill => (
                      <option key={skill} value={skill}>{skill}</option>
                    ))}
                  </select>
                </div>

                {/* Experience level filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                  <select
                    value={filters.experienceLevel}
                    onChange={(e) => handleFilterChange('experienceLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Levels</option>
                    {globalStaffService.getExperienceLevels().map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                {/* Employment status filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.employmentStatus}
                    onChange={(e) => handleFilterChange('employmentStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Statuses</option>
                    {globalStaffService.getEmploymentStatuses().map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results summary */}
        {!error && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center text-gray-600">
              <Users className="h-5 w-5 mr-2" />
              <span>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} staff members
              </span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => loadStaffDirectory()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Staff grid */}
        {!error && (
          <>
            {staffList.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Found</h3>
                <p className="text-gray-600 mb-4">
                  {Object.values(filters).some(f => f) 
                    ? "No staff members match your current filters. Try adjusting your search criteria."
                    : "No staff members are currently registered in the global directory."
                  }
                </p>
                {Object.values(filters).some(f => f) && (
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {staffList.map(renderStaffCard)}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border p-4">
                <div className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="flex items-center px-3 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Broadcast Modal */}
        <BroadcastModal
          isOpen={showBroadcastModal}
          onClose={() => setShowBroadcastModal(false)}
          onSuccess={handleBroadcastSuccess}
        />
      </div>
    </div>
  );
};

export default GlobalStaffDirectory;
