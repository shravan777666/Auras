import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { salonService } from '../../services/salon';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ImagePreview from '../../components/common/ImagePreview';
import BackButton from '../../components/common/BackButton';

const EditSalonProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    salonName: '',
    ownerName: '',
    email: '',
    contactNumber: '',
    salonAddress: { street: '', city: '', state: '', postalCode: '', country: '' },
    latitude: '',
    longitude: '',
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
  const [geocoding, setGeocoding] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
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
            latitude: profileData.latitude || '',
            longitude: profileData.longitude || '',
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

  // Handle coordinate changes with validation
  const handleCoordinateChange = (e) => {
    const { name, value } = e.target;
    // Allow only numbers and decimal points for coordinates
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Automatically geocode address when address fields change (only if not in manual mode)
  useEffect(() => {
    if (!manualEntry) {
      const debounceTimer = setTimeout(() => {
        if (formData.salonAddress.street || formData.salonAddress.city || 
            formData.salonAddress.state || formData.salonAddress.postalCode) {
          geocodeAddress();
        }
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(debounceTimer);
    }
  }, [
    formData.salonAddress.street,
    formData.salonAddress.city,
    formData.salonAddress.state,
    formData.salonAddress.postalCode,
    formData.salonAddress.country,
    manualEntry
  ]);

  const geocodeAddress = async () => {
    const addressString = [
      formData.salonAddress.street,
      formData.salonAddress.city,
      formData.salonAddress.state,
      formData.salonAddress.postalCode,
      formData.salonAddress.country
    ].filter(Boolean).join(', ');

    if (!addressString) return;

    setGeocoding(true);
    try {
      // Using Nominatim OpenStreetMap API for geocoding
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}`;
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AuraCares-Salon/1.0'
        }
      });
      
      const data = await response.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        
        // Validate coordinates are within valid ranges
        if (!isNaN(lat) && !isNaN(lng) && 
            lat >= -90 && lat <= 90 && 
            lng >= -180 && lng <= 180) {
          setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
          }));
          toast.success('Location coordinates updated automatically');
        }
      } else {
        // Clear coordinates if address can't be geocoded
        setFormData(prev => ({
          ...prev,
          latitude: '',
          longitude: ''
        }));
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Failed to geocode address');
    } finally {
      setGeocoding(false);
    }
  };

  const toggleManualEntry = () => {
    setManualEntry(!manualEntry);
    // Clear coordinates when switching modes
    if (!manualEntry) {
      setFormData(prev => ({
        ...prev,
        latitude: '',
        longitude: ''
      }));
    }
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
    
    // Validate coordinates if provided
    if (formData.latitude || formData.longitude) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      
      if (isNaN(lat) || lat < -90 || lat > 90) {
        toast.error('Latitude must be a number between -90 and 90');
        setSubmitting(false);
        return;
      }
      
      if (isNaN(lng) || lng < -180 || lng > 180) {
        toast.error('Longitude must be a number between -180 and 180');
        setSubmitting(false);
        return;
      }
    }
    
    try {
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Append text fields
      formDataToSend.append('salonName', formData.salonName);
      formDataToSend.append('ownerName', formData.ownerName);
      formDataToSend.append('contactNumber', formData.contactNumber);
      formDataToSend.append('salonAddress', JSON.stringify(formData.salonAddress));
      formDataToSend.append('latitude', formData.latitude);
      formDataToSend.append('longitude', formData.longitude);
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
        <BackButton fallbackPath="/salon/dashboard" className="mb-4" />
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
            
            {/* Toggle for manual entry */}
            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="manualEntryToggle"
                  checked={manualEntry}
                  onChange={toggleManualEntry}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="manualEntryToggle" className="ml-2 block text-sm text-gray-900">
                  Manually enter coordinates
                </label>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {manualEntry 
                  ? "Enter coordinates manually below" 
                  : "Coordinates will be automatically calculated from your address"}
              </p>
            </div>
            
            {/* Latitude and Longitude Fields */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                  Latitude
                </label>
                <input
                  type="text"
                  name="latitude"
                  id="latitude"
                  value={formData.latitude}
                  onChange={handleCoordinateChange}
                  readOnly={!manualEntry}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    manualEntry ? 'bg-white' : 'bg-gray-100'
                  }`}
                  placeholder={manualEntry ? "Enter latitude (-90 to 90)" : "Automatically calculated"}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Valid range: -90 to 90
                </p>
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                  Longitude
                </label>
                <input
                  type="text"
                  name="longitude"
                  id="longitude"
                  value={formData.longitude}
                  onChange={handleCoordinateChange}
                  readOnly={!manualEntry}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    manualEntry ? 'bg-white' : 'bg-gray-100'
                  }`}
                  placeholder={manualEntry ? "Enter longitude (-180 to 180)" : "Automatically calculated"}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Valid range: -180 to 180
                </p>
              </div>
            </div>
            
            {/* Geocoding status indicator */}
            {!manualEntry && geocoding && (
              <div className="md:col-span-2 text-sm text-blue-600">
                <p>Finding location coordinates...</p>
              </div>
            )}
            
            {/* Manual entry instructions */}
            {manualEntry && (
              <div className="md:col-span-2 bg-blue-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-blue-800">How to find coordinates:</h3>
                <p className="mt-1 text-sm text-blue-700">
                  1. Go to{' '}
                  <a 
                    href="https://www.google.com/maps" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-900"
                  >
                    Google Maps
                  </a>
                  <br />
                  2. Search for your salon location or right-click on the exact location on the map
                  <br />
                  3. Select "What's here?" or copy the coordinates from the URL
                  <br />
                  4. Paste the coordinates in the respective fields above
                </p>
              </div>
            )}
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