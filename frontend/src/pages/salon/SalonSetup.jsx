import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Upload, 
  FileText,
  Image,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Info,
  Check,
  X
} from 'lucide-react';

const SalonSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data states
  const [basicInfo, setBasicInfo] = useState({
    salonName: '',
    description: '',
    contactNumber: ''
  });

  // Validation states
  const [contactNumberError, setContactNumberError] = useState('');
  const [contactNumberValid, setContactNumberValid] = useState(null);

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  const [businessHours, setBusinessHours] = useState({
    openTime: '09:00',
    closeTime: '20:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  });

  const [files, setFiles] = useState({
    logo: null,
    license: null,
    images: []
  });

  const steps = [
    { number: 1, title: 'Basic Information', icon: Store },
    { number: 2, title: 'Address & Contact', icon: MapPin },
    { number: 3, title: 'Business Hours', icon: Clock },
    { number: 4, title: 'Documents & Images', icon: Upload }
  ];

  const workingDayOptions = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Check if coming from registration
  useEffect(() => {
    if (location.state?.fromRegistration) {
      const userInfo = location.state.userInfo;
      toast.success(`Welcome ${userInfo.name}! Let's set up your salon.`);
    }
  }, [location.state]);

  // Contact number validation function
  const validateContactNumber = (number) => {
    // Remove all spaces and special characters for validation
    const cleanNumber = number.replace(/\D/g, '');
    
    // Check if empty
    if (!number.trim()) {
      return 'Contact number is required';
    }
    
    // Check for spaces at beginning or end
    if (number !== number.trim()) {
      return 'Contact number should not contain leading or trailing spaces';
    }
    
    // Check if contains only numbers
    if (!/^\d+$/.test(number)) {
      return 'Please enter a valid phone number (numbers only)';
    }
    
    // Check length
    if (cleanNumber.length !== 10) {
      return 'Contact number must be exactly 10 digits';
    }
    
    // Check for common fake numbers
    const fakeNumbers = [
      '1234567890',
      '0000000000',
      '1111111111',
      '2222222222',
      '3333333333',
      '4444444444',
      '5555555555',
      '6666666666',
      '7777777777',
      '8888888888',
      '9999999999'
    ];
    
    if (fakeNumbers.includes(cleanNumber)) {
      return 'Please enter a valid phone number';
    }
    
    return ''; // Valid
  };

  // Handle contact number change with real-time validation
  const handleContactNumberChange = (e) => {
    let value = e.target.value;
    
    // Allow only numbers
    value = value.replace(/\D/g, '');
    
    // Limit to 10 digits
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    
    setBasicInfo({ ...basicInfo, contactNumber: value });
    
    // Validate in real-time
    const errorMessage = validateContactNumber(value);
    setContactNumberError(errorMessage);
    setContactNumberValid(errorMessage ? false : (value ? true : null));
  };

  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactNumber') {
      handleContactNumberChange(e);
    } else {
      setBasicInfo({ ...basicInfo, [name]: value });
    }
  };

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleBusinessHoursChange = (e) => {
    setBusinessHours({ ...businessHours, [e.target.name]: e.target.value });
  };

  const handleWorkingDaysChange = (day) => {
    const updatedDays = businessHours.workingDays.includes(day)
      ? businessHours.workingDays.filter(d => d !== day)
      : [...businessHours.workingDays, day];
    setBusinessHours({ ...businessHours, workingDays: updatedDays });
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      if (fileType === 'images') {
        setFiles({ ...files, images: [...files.images, file] });
      } else {
        setFiles({ ...files, [fileType]: file });
      }
    }
  };

  const removeImage = (index) => {
    const updatedImages = files.images.filter((_, i) => i !== index);
    setFiles({ ...files, images: updatedImages });
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        const contactValid = !validateContactNumber(basicInfo.contactNumber);
        return basicInfo.salonName && contactValid && basicInfo.description;
      case 2:
        return address.street && address.city && address.state && address.postalCode;
      case 3:
        return businessHours.openTime && businessHours.closeTime && businessHours.workingDays.length > 0;
      case 4:
        return files.logo && files.license;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // Append basic salon data
      formData.append('salonName', basicInfo.salonName);
      formData.append('description', basicInfo.description);
      formData.append('contactNumber', basicInfo.contactNumber);
      formData.append('salonAddress', JSON.stringify(address));
      formData.append('businessHours', JSON.stringify(businessHours));

      // Append files (match backend field names expected by multer)
      if (files.logo) formData.append('salonLogo', files.logo);
      if (files.license) formData.append('businessLicense', files.license);
      files.images.forEach((image) => {
        formData.append('salonImages', image);
      });

      // Make API call to complete salon setup via service (handles token and errors)
      const data = await (await import('../../services/salon')).salonService.setup(formData);

      // Update user context with the updated user info from backend
      if (data && data.user) {
        updateUser(data.user);
      } else {
        // Fallback to manual update if backend doesn't return user info
        const updatedUser = { ...user, setupCompleted: true };
        updateUser(updatedUser);
      }

      toast.success('Salon setup completed successfully! Awaiting admin approval.');
      navigate('/salon/waiting-approval', { replace: true, state: { fromSetup: true } });
    } catch (error) {
      toast.error(error.message);
      console.error('Salon setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Salon Setup</h1>
          <p className="text-gray-600">Let's get your salon ready to welcome customers</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.number 
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-full h-1 mx-4 ${
                    currentStep > step.number ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-pink-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Store className="h-12 w-12 text-pink-600 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-gray-900">Tell us about your salon</h2>
                <p className="text-gray-600">Basic information about your business</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salon Name *
                  </label>
                  <input
                    type="text"
                    name="salonName"
                    value={basicInfo.salonName}
                    onChange={handleBasicInfoChange}
                    className="form-input w-full"
                    placeholder="Enter your salon name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="contactNumber"
                      value={basicInfo.contactNumber}
                      onChange={handleBasicInfoChange}
                      className={`form-input w-full pl-10 ${
                        contactNumberValid === false 
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                          : contactNumberValid === true 
                            ? 'border-green-500 focus:ring-green-500 focus:border-green-500' 
                            : ''
                      }`}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      required
                    />
                  </div>
                  {contactNumberValid === true && (
                    <div className="flex items-center mt-1">
                      <Check className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm text-green-600">Valid contact number</span>
                    </div>
                  )}
                  {contactNumberError && (
                    <p className="mt-1 text-sm text-red-600">{contactNumberError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="form-input w-full pl-10 bg-gray-50"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This is your registered email</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={basicInfo.description}
                    onChange={handleBasicInfoChange}
                    rows={4}
                    className="form-textarea w-full"
                    placeholder="Describe your salon, services, and what makes you special..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be shown to customers</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address & Contact */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <MapPin className="h-12 w-12 text-pink-600 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-gray-900">Where are you located?</h2>
                <p className="text-gray-600">Your salon's physical address</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={address.street}
                    onChange={handleAddressChange}
                    className="form-input w-full"
                    placeholder="Building name, street name, area"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleAddressChange}
                    className="form-input w-full"
                    placeholder="Enter city name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleAddressChange}
                    className="form-input w-full"
                    placeholder="Enter state name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={address.postalCode}
                    onChange={handleAddressChange}
                    className="form-input w-full"
                    placeholder="6-digit PIN code"
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={address.country}
                    onChange={handleAddressChange}
                    className="form-input w-full"
                    placeholder="Country"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mt-1 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Address Verification</p>
                    <p className="text-xs text-blue-700 mt-1">
                      This address will be used for customer navigation and delivery services. Please ensure it's accurate.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Business Hours */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Clock className="h-12 w-12 text-pink-600 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-gray-900">When are you open?</h2>
                <p className="text-gray-600">Set your business hours and working days</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Time *
                  </label>
                  <input
                    type="time"
                    name="openTime"
                    value={businessHours.openTime}
                    onChange={handleBusinessHoursChange}
                    className="form-input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closing Time *
                  </label>
                  <input
                    type="time"
                    name="closeTime"
                    value={businessHours.closeTime}
                    onChange={handleBusinessHoursChange}
                    className="form-input w-full"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Working Days * (Select at least one)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {workingDayOptions.map((day) => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={businessHours.workingDays.includes(day)}
                          onChange={() => handleWorkingDaysChange(day)}
                          className="form-checkbox text-pink-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-pink-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-pink-600 mt-1 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-pink-900">Business Hours Preview</p>
                    <p className="text-xs text-pink-700 mt-1">
                      Open: {businessHours.openTime} - {businessHours.closeTime}
                    </p>
                    <p className="text-xs text-pink-700">
                      Days: {businessHours.workingDays.join(', ') || 'None selected'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents & Images */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Upload className="h-12 w-12 text-pink-600 mx-auto mb-2" />
                <h2 className="text-2xl font-bold text-gray-900">Upload documents & images</h2>
                <p className="text-gray-600">Help customers find and trust your salon</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salon Logo * (PNG/JPG up to 2MB)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-500 transition-colors">
                    <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => handleFileChange(e, 'logo')}
                      className="sr-only"
                      id="logo-upload"
                      required
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <span className="text-pink-600 font-medium">Click to upload</span>
                      <span className="text-gray-500"> or drag and drop</span>
                    </label>
                    {files.logo && (
                      <p className="text-sm text-green-600 mt-2">✓ {files.logo.name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business License * (PDF up to 5MB)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-500 transition-colors">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleFileChange(e, 'license')}
                      className="sr-only"
                      id="license-upload"
                      required
                    />
                    <label htmlFor="license-upload" className="cursor-pointer">
                      <span className="text-pink-600 font-medium">Click to upload</span>
                      <span className="text-gray-500"> PDF only</span>
                    </label>
                    {files.license && (
                      <p className="text-sm text-green-600 mt-2">✓ {files.license.name}</p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salon Images (Optional - up to 5 images)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-pink-500 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleFileChange(e, 'images')}
                      className="sr-only"
                      id="images-upload"
                    />
                    <label htmlFor="images-upload" className="cursor-pointer">
                      <span className="text-pink-600 font-medium">Click to upload</span>
                      <span className="text-gray-500"> salon photos</span>
                    </label>
                    {files.images.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {files.images.map((image, index) => (
                          <div key={index} className="relative bg-gray-100 p-2 rounded">
                            <span className="text-xs text-gray-600">{image.name}</span>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center space-x-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !validateStep(4)}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Complete Setup'}
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalonSetup;