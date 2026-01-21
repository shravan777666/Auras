import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import freelancerService from '../../services/freelancerService';
import toast from 'react-hot-toast';

const FreelancerSetup = () => {
  const { user, loading, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    serviceLocation: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    fullAddress: '',
    latitude: '',
    longitude: '',
    yearsOfExperience: '',
    skills: [],
    profilePicture: null,
    governmentId: null,
    certificates: []
  });
  const [initialLoading, setInitialLoading] = useState(true);

  // Load existing profile data when component mounts
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profileData = await freelancerService.getProfile();
        if (profileData.data) {
          setFormData(prev => ({
            ...prev,
            name: profileData.data.name || user?.name || '',
            phone: profileData.data.phone || '',
            serviceLocation: profileData.data.serviceLocation || '',
            addressLine1: profileData.data.address?.addressLine1 || '',
            addressLine2: profileData.data.address?.addressLine2 || '',
            city: profileData.data.address?.city || '',
            state: profileData.data.address?.state || '',
            postalCode: profileData.data.address?.postalCode || '',
            country: profileData.data.address?.country || 'India',
            fullAddress: profileData.data.address?.fullAddress || '',
            latitude: profileData.data.location?.coordinates ? profileData.data.location.coordinates[1] : '',
            longitude: profileData.data.location?.coordinates ? profileData.data.location.coordinates[0] : '',
            yearsOfExperience: profileData.data.experience || '',
            skills: profileData.data.skills || []
          }));
        }
      } catch (error) {
        console.error('Error loading freelancer profile:', error);
        // Continue with default form data if profile load fails
        setFormData(prev => ({
          ...prev,
          name: user?.name || ''
        }));
      } finally {
        setInitialLoading(false);
      }
    };

    if (!loading) {
      loadProfileData();
    }
  }, [loading, user]);

  if (loading || initialLoading) {
    return <LoadingSpinner text="Loading profile data..." />;
  }

  // Redirect to waiting approval page only if freelancer has completed setup but is still pending approval
  if (user?.approvalStatus === 'pending' && user?.setupCompleted && !initialLoading) {
    return <Navigate to="/freelancer/waiting-approval" replace />;
  }

  // Allow access to setup page even if setup is completed (for editing profile)
  // if (user?.setupCompleted) {
  //   return <Navigate to="/freelancer/dashboard" replace />;
  // }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        skills: checked 
          ? [...prev.skills, value]
          : prev.skills.filter(skill => value !== skill)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleGetCoordinates = () => {
    // Instructions for the user to get coordinates from Google Maps
    alert('To get coordinates:\n1. Open Google Maps\n2. Right-click on your location\n3. Select What s here (or copy coordinates)\n4. Copy the coordinates shown at the bottom');
    window.open('https://maps.google.com', '_blank');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      
      // Append all form data fields
      formDataToSend.append('name', formData.name);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('serviceLocation', formData.serviceLocation);
      formDataToSend.append('addressLine1', formData.addressLine1);
      formDataToSend.append('addressLine2', formData.addressLine2);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('postalCode', formData.postalCode);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('fullAddress', `${formData.addressLine1} ${formData.addressLine2} ${formData.city} ${formData.state} ${formData.postalCode}`.trim());
      if(formData.latitude) formDataToSend.append('latitude', formData.latitude);
      if(formData.longitude) formDataToSend.append('longitude', formData.longitude);
      formDataToSend.append('yearsOfExperience', formData.yearsOfExperience || 0);
      
      // Append skills array
      if (formData.skills && formData.skills.length > 0) {
        formData.skills.forEach(skill => formDataToSend.append('skills[]', skill));
      }

      // Append files
      if (formData.profilePicture) {
        formDataToSend.append('profilePicture', formData.profilePicture);
      }
      if (formData.governmentId) {
        formDataToSend.append('governmentId', formData.governmentId);
      }
      if (formData.certificates && formData.certificates.length > 0) {
        formData.certificates.forEach(file => formDataToSend.append('certificates', file));
      }

      // Update freelancer profile
      const response = await freelancerService.updateProfile(formDataToSend);
      
      toast.success('Profile updated successfully!');
      
      // Update user context to reflect setup completion
      updateUser({
        setupCompleted: true,
        approvalStatus: 'pending'
      });
      
      // Redirect to waiting approval page since freelancer needs admin approval
      setTimeout(() => {
        navigate('/freelancer/waiting-approval', { replace: true });
      }, 1000);
    } catch (error) {
      console.error('Error updating freelancer profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const skillsOptions = [
    'Hair Styling', 'Makeup', 'Skincare', 'Nails', 'Massage', 
    'Waxing', 'Eyebrow', 'Lashes', 'Bridal', 'Threading'
  ];

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Freelancer Profile</h1>
            <p className="text-gray-600">Step 1 of 2: Basic Information</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            // Validate required address fields
            if (!formData.addressLine1 || !formData.city || !formData.state || !formData.postalCode) {
              toast.error('Please fill in all required address fields (Address Line 1, City, State, and PIN Code)');
              return;
            }
            setStep(2);
          }} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Location
              </label>
              <input
                type="text"
                name="serviceLocation"
                value={formData.serviceLocation}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your service location"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
              </label>
              <input
                type="number"
                name="yearsOfExperience"
                value={formData.yearsOfExperience}
                onChange={handleInputChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter years of experience"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="House/Building name and number"
                required
              />
              <p className="mt-1 text-sm text-gray-500">Enter your house or building name/number</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Street, area, or landmark (optional)"
              />
              <p className="mt-1 text-sm text-gray-500">Enter street, area, or landmark (optional)</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter state"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code (PIN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter PIN code"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">Enter your 6-digit postal code</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Country"
                  readOnly
                />
                <p className="mt-1 text-sm text-gray-500">Default: India</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude
                </label>
                <input
                  type="text"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 12.345678"
                />
                <p className="mt-1 text-sm text-gray-500">Find coordinates in Google Maps</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude
                </label>
                <input
                  type="text"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 77.123456"
                />
                <p className="mt-1 text-sm text-gray-500">Find coordinates in Google Maps</p>
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={handleGetCoordinates}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                Help: Get Coordinates from Google Maps
              </button>
            </div>

            <div className="flex justify-between">
              <div></div>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue to Step 2
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Freelancer Profile</h1>
            <p className="text-gray-600">Step 2 of 2: Skills & Documents</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Skills
              </label>
              <div className="grid grid-cols-2 gap-3">
                {skillsOptions.map((skill, index) => (
                  <label key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      name="skills"
                      value={skill}
                      onChange={handleInputChange}
                      checked={formData.skills.includes(skill)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Government ID
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setFormData(prev => ({ ...prev, governmentId: e.target.files[0] }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Certificates (optional)
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={(e) => setFormData(prev => ({ ...prev, certificates: Array.from(e.target.files) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData(prev => ({ ...prev, profilePicture: e.target.files[0] }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Back to Step 1
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Complete Setup
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
};

export default FreelancerSetup;