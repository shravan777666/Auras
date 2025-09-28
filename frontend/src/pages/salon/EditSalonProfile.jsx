import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { salonService } from '../../services/salon';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ImagePreview from '../../components/common/ImagePreview';

const EditSalonProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    salonName: '',
    ownerName: '',
    email: '',
    contactNumber: '',
    salonAddress: { street: '', city: '', state: '', postalCode: '', country: '' },
    description: '',
    salonImage: null,
    salonLogo: null
  });
  const [previewImages, setPreviewImages] = useState({
    salonImage: null,
    salonLogo: null
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
    title: ''
  });
  const salonImageRef = useRef(null);
  const salonLogoRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await salonService.getProfile();
        if (response.success) {
          const profileData = response.data;
          setFormData({
            salonName: profileData.salonName || '',
            ownerName: profileData.ownerName || '',
            email: profileData.email || '',
            contactNumber: profileData.contactNumber || '',
            salonAddress: {
              street: profileData.salonAddress?.street || '',
              city: profileData.salonAddress?.city || '',
              state: profileData.salonAddress?.state || '',
              postalCode: profileData.salonAddress?.postalCode || '',
              country: profileData.salonAddress?.country || ''
            },
            description: profileData.description || '',
            salonImage: profileData.documents?.salonImages?.[0] || null,
            salonLogo: profileData.documents?.salonLogo || null
          });
          
          // Set preview images if they exist
          setPreviewImages({
            salonImage: profileData.documents?.salonImages?.[0] || null,
            salonLogo: profileData.documents?.salonLogo || null
          });
        }
      } catch (error) {
        toast.error('Failed to fetch profile data.');
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      salonAddress: { ...prev.salonAddress, [name]: value },
    }));
  };

  const handleImageChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, [fieldName]: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages((prev) => ({ ...prev, [fieldName]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (fieldName) => {
    setFormData((prev) => ({ ...prev, [fieldName]: null }));
    setPreviewImages((prev) => ({ ...prev, [fieldName]: null }));
    if (fieldName === 'salonImage') {
      salonImageRef.current.value = '';
    } else if (fieldName === 'salonLogo') {
      salonLogoRef.current.value = '';
    }
  };

  const openImagePreview = (imageType) => {
    const images = [];
    let currentIndex = 0;
    let title = '';

    if (imageType === 'logo' && previewImages.salonLogo) {
      images.push(previewImages.salonLogo);
      title = 'Salon Logo';
    } else if (imageType === 'image' && previewImages.salonImage) {
      images.push(previewImages.salonImage);
      title = 'Salon Image';
    } else if (imageType === 'all') {
      // Show all available images
      if (previewImages.salonLogo) {
        images.push(previewImages.salonLogo);
      }
      if (previewImages.salonImage) {
        images.push(previewImages.salonImage);
      }
      title = 'Salon Images';
    }

    if (images.length > 0) {
      setImagePreview({
        isOpen: true,
        images,
        currentIndex,
        title
      });
    }
  };

  const closeImagePreview = () => {
    setImagePreview({
      isOpen: false,
      images: [],
      currentIndex: 0,
      title: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('salonName', formData.salonName);
      formDataToSend.append('ownerName', formData.ownerName);
      formDataToSend.append('contactNumber', formData.contactNumber);
      formDataToSend.append('salonAddress', JSON.stringify(formData.salonAddress));
      formDataToSend.append('description', formData.description);
      
      // Append files if they exist
      if (formData.salonImage && formData.salonImage instanceof File) {
        formDataToSend.append('salonImage', formData.salonImage);
      }
      if (formData.salonLogo && formData.salonLogo instanceof File) {
        formDataToSend.append('salonLogo', formData.salonLogo);
      }
      
      const response = await salonService.updateProfile(formDataToSend);
      if (response.success) {
        toast.success('Profile updated successfully!');
        navigate('/salon/dashboard');
      } else {
        toast.error(response.message || 'Failed to update profile.');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'An error occurred while updating profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Salon Profile</h1>
        <p className="text-gray-600 mt-1">Update your salon information and images</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Owner Information */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Owner Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">Owner Name</label>
              <input
                type="text"
                name="ownerName"
                id="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled
              />
              <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
            </div>
            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">Contact Number</label>
              <input
                type="text"
                name="contactNumber"
                id="contactNumber"
                value={formData.contactNumber}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Salon Information */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Salon Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="salonName" className="block text-sm font-medium text-gray-700">Salon Name</label>
              <input
                type="text"
                name="salonName"
                id="salonName"
                value={formData.salonName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                id="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Salon Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="street" className="block text-sm font-medium text-gray-700">Street Address</label>
              <input
                type="text"
                name="street"
                id="street"
                value={formData.salonAddress.street}
                onChange={handleAddressChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
              <input
                type="text"
                name="city"
                id="city"
                value={formData.salonAddress.city}
                onChange={handleAddressChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
              <input
                type="text"
                name="state"
                id="state"
                value={formData.salonAddress.state}
                onChange={handleAddressChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">Postal Code</label>
              <input
                type="text"
                name="postalCode"
                id="postalCode"
                value={formData.salonAddress.postalCode}
                onChange={handleAddressChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                name="country"
                id="country"
                value={formData.salonAddress.country}
                onChange={handleAddressChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Images</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Salon Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salon Logo</label>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {previewImages.salonLogo ? (
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => openImagePreview('logo')}
                    >
                      <img 
                        src={previewImages.salonLogo} 
                        alt="Salon Logo Preview" 
                        className="h-16 w-16 rounded-md object-cover border transition-all group-hover:opacity-80"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-md transition-all flex items-center justify-center">
                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to preview
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-200 border-2 border-dashed rounded-md w-16 h-16 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">Logo</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={salonLogoRef}
                    onChange={(e) => handleImageChange(e, 'salonLogo')}
                    accept="image/*"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                  {previewImages.salonLogo && (
                    <button
                      type="button"
                      onClick={() => removeImage('salonLogo')}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Salon Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salon Image</label>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  {previewImages.salonImage ? (
                    <div 
                      className="relative group cursor-pointer"
                      onClick={() => openImagePreview('image')}
                    >
                      <img 
                        src={previewImages.salonImage} 
                        alt="Salon Image Preview" 
                        className="h-16 w-16 rounded-md object-cover border transition-all group-hover:opacity-80"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-md transition-all flex items-center justify-center">
                        <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to preview
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-200 border-2 border-dashed rounded-md w-16 h-16 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">Image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={salonImageRef}
                    onChange={(e) => handleImageChange(e, 'salonImage')}
                    accept="image/*"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100"
                  />
                  {previewImages.salonImage && (
                    <button
                      type="button"
                      onClick={() => removeImage('salonImage')}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* View All Images Button */}
          {(previewImages.salonLogo || previewImages.salonImage) && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => openImagePreview('all')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View All Images
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/salon/dashboard')}
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Image Preview Modal */}
      <ImagePreview
        isOpen={imagePreview.isOpen}
        onClose={closeImagePreview}
        images={imagePreview.images}
        currentIndex={imagePreview.currentIndex}
        title={imagePreview.title}
      />
    </div>
  );
};

export default EditSalonProfile;