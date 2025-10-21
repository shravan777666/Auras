import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/user';
import { staffInvitationService } from '../../services/staffInvitation';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BackButton from '../../components/common/BackButton';
import { Search, User, Mail, Phone, Plus, UserPlus } from 'lucide-react';

const positionOptions = [
  'Hair Stylist', 'Hair Colorist', 'Makeup Artist', 'Nail Technician',
  'Esthetician', 'Massage Therapist', 'Eyebrow Specialist',
  'Bridal Makeup Artist', 'Hair Extensions Specialist', 'Skin Care Specialist', 'Other'
];

const SearchInviteStaff = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteData, setInviteData] = useState({
    position: '',
    startDate: '',
    commission: ''
  });

  // Check if user is a salon owner
  useEffect(() => {
    if (user && user.type !== 'salon') {
      toast.error('Access denied. Only salon owners can invite staff.');
      navigate('/unauthorized');
    }
  }, [user, navigate]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setSearchLoading(true);
    try {
      const results = await userService.searchUsers(searchTerm);
      setSearchResults(results.data || []);
    } catch (error) {
      console.error('Search error:', error);
      if (error.response?.status === 403) {
        toast.error('Access denied. Only salon owners can search for staff.');
        navigate('/unauthorized');
      } else {
        toast.error('Error searching users: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInvite = (user) => {
    setSelectedUser(user);
    setShowInviteModal(true);
    // Reset form data
    setInviteData({
      position: '',
      startDate: '',
      commission: ''
    });
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    
    if (!inviteData.position || !inviteData.startDate) {
      toast.error('Position and start date are required');
      return;
    }

    setLoading(true);
    try {
      // Create the invitation
      const invitationData = {
        staffUserId: selectedUser._id,
        position: inviteData.position,
        startDate: inviteData.startDate,
      };
      
      // Only add commission if it's provided
      if (inviteData.commission) {
        invitationData.commission = inviteData.commission;
      }
      
      await staffInvitationService.createInvitation(invitationData);
      
      toast.success(`Invitation sent to ${selectedUser.name}. They will receive a notification to accept or decline.`);
      setShowInviteModal(false);
      // Reset search
      setSearchTerm('');
      setSearchResults([]);
    } catch (error) {
      toast.error('Error sending invitation: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInviteChange = (e) => {
    const { name, value } = e.target;
    setInviteData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Don't render if user is not a salon owner
  if (user && user.type !== 'salon') {
    return null;
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <BackButton fallbackPath="/salon/staff" />
        <h1 className="text-2xl font-bold">Search & Invite Staff</h1>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Find Registered Staff</h2>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={searchLoading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
          >
            {searchLoading ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </button>
        </form>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h3 className="text-md font-medium text-gray-900 mb-4">Search Results</h3>
          <div className="space-y-4">
            {searchResults.map((user) => (
              <div key={user._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">{user.name}</h4>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Mail className="h-4 w-4 mr-1" />
                      {user.email}
                    </div>
                    {user.phone && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Phone className="h-4 w-4 mr-1" />
                        {user.phone}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleInvite(user)}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Invite to Join
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Registration Option */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Can't find the staff member?</h3>
        <p className="text-sm text-gray-600 mb-4">
          If the staff member is not registered in our system, you can manually register them.
        </p>
        <button
          onClick={() => navigate('/salon/staff/add')}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Manually Register a Brand New Staff Member
        </button>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invite {selectedUser?.name}</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide the following details for {selectedUser?.name} to join your team.
              </p>
              
              <form onSubmit={handleInviteSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                    <select
                      name="position"
                      value={inviteData.position}
                      onChange={handleInviteChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      <option value="">Select Position</option>
                      {positionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={inviteData.startDate}
                      onChange={handleInviteChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission (%)</label>
                    <input
                      type="number"
                      name="commission"
                      value={inviteData.commission}
                      onChange={handleInviteChange}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchInviteStaff;