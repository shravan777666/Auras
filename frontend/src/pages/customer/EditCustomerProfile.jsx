import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { customerService } from '../../services/customer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BackButton from '../../components/common/BackButton';
import ImageUpload from '../../components/common/ImageUpload';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, Calendar, MapPin, X } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5011/api';

const EditCustomerProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    gender: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
  });
  const [profilePictureUrl, setProfilePictureUrl] = useState(null);
  const [errors, setErrors] = useState({});

  const fetchProfile = useCallback(async () => {
    try {
      const response = await customerService.getProfile();
      if (response.success) {
        const { data } = response;
        setFormData({
          name: data.name || '',
          email: data.email || '',
          contactNumber: data.contactNumber || '',
          gender: data.gender || '',
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
          address: data.address || { street: '', city: '', state: '', postalCode: '', country: '' },
        });
        const pic = data.profilePic || data.profilePicture;
        if (pic) {
          // Backend already provides full URLs, use them directly
          setProfilePictureUrl(pic);
        } else {
          setProfilePictureUrl(null);
        }
      } else {
        toast.error(response.message || 'Could not fetch profile data.');
      }
    } catch (error) {
      toast.error('An error occurred while fetching your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));
  };

  const handleImageUpload = (imageData) => {
    setProfilePictureUrl(imageData.url);
  };

  const handleImageDelete = () => {
    setProfilePictureUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const data = new FormData();
    console.log('[EditCustomerProfile] Building FormData');
    data.append('name', formData.name);
    data.append('contactNumber', formData.contactNumber);
    if (formData.gender) {
        data.append('gender', formData.gender);
    }
    if (formData.dateOfBirth) {
        data.append('dateOfBirth', formData.dateOfBirth);
    }
    data.append('address', JSON.stringify(formData.address));

    try {
      console.log('[EditCustomerProfile] Sending updateProfile request');
      const response = await customerService.updateProfile(data);
      console.log('[EditCustomerProfile] Response', response);
      if (response.success) {
        toast.success('Profile updated successfully!');
        const updatedPic = response.data?.profilePic || response.data?.profilePicture;
        if (updatedPic) {
          // Backend already provides full URLs, use them directly
          setProfilePictureUrl(updatedPic);
        }
        updateUser(response.data); // Update user in auth context
        navigate('/customer/dashboard');
      } else {
        toast.error(response.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('[EditCustomerProfile] Error', error);
      const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Your Profile..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <BackButton fallbackPath="/customer/dashboard" />
            <h1 className="text-2xl font-bold text-gray-800">Edit Your Profile</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {/* Profile Picture Section */}
          <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
            <ImageUpload
              onImageUpload={handleImageUpload}
              onImageDelete={handleImageDelete}
              currentImageUrl={profilePictureUrl}
              uploadType="customer"
              maxSize={2 * 1024 * 1024} // 2MB
              allowedTypes={['image/jpeg', 'image/png']}
            />
            <div className="flex flex-col items-center sm:items-start">
              <p className="text-xs text-gray-500">JPG or PNG format, max size 2MB.</p>
            </div>
          </div>

          {/* Personal Information Section */}
          <div className="border-t border-gray-200 pt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="group">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow" />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="email" id="email" name="email" value={formData.email} disabled className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed" />
              </div>
            </div>

            {/* Contact Number */}
            <div className="group">
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow" />
              </div>
            </div>

            {/* Gender */}
            <div className="group">
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow">
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Date of Birth */}
            <div className="group">
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow" />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Address Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <input type="text" id="street" name="street" value={formData.address.street || ''} onChange={handleAddressChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow" />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input type="text" id="city" name="city" value={formData.address.city || ''} onChange={handleAddressChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow" />
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input type="text" id="state" name="state" value={formData.address.state || ''} onChange={handleAddressChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow" />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input type="text" id="postalCode" name="postalCode" value={formData.address.postalCode || ''} onChange={handleAddressChange} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow" />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="text" id="country" name="country" value={formData.address.country || ''} onChange={handleAddressChange} className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow" />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditCustomerProfile;