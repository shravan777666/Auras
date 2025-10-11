import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  User,
  Phone,
  MapPin,
  Upload,
  FileText,
  Image,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Users,
  Briefcase,
  Calendar,
  Map,
  Award,
  CreditCard,
  Check,
  X
} from 'lucide-react';

const StaffSetup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data states
  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    contactNumber: '',
    dateOfBirth: '',
    gender: 'Male'
  });

  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });

  const [professionalInfo, setProfessionalInfo] = useState({
    position: '',
    skills: [],
    experience: {
      years: 0,
      description: ''
    },
    specialization: ''
  });

  // Validation states
  const [contactNumberError, setContactNumberError] = useState('');
  const [contactNumberValid, setContactNumberValid] = useState(null);

  // Availability step has been removed per requirements

  const [files, setFiles] = useState({
    profilePicture: null,
    governmentId: null
  });

  const steps = [
    { number: 1, title: 'Personal Information', icon: User },
    { number: 2, title: 'Address Details', icon: MapPin },
    { number: 3, title: 'Professional Info', icon: Briefcase },
    { number: 4, title: 'Documents & Photos', icon: Upload }
  ];

  const positionOptions = [
    'Hair Stylist','Hair Colorist','Makeup Artist','Nail Technician',
    'Esthetician','Massage Therapist','Eyebrow Specialist',
    'Bridal Makeup Artist','Hair Extensions Specialist','Skin Care Specialist','Other'
  ];

  const skillOptions = [
    'Haircut','Hair Styling','Hair Color','Hair Treatment',
    'Facial','Makeup','Bridal Makeup','Party Makeup',
    'Manicure','Pedicure','Nail Art','Gel Nails',
    'Massage','Body Treatment','Skin Treatment',
    'Threading','Waxing','Eyebrow Shaping',
    'Hair Extensions','Keratin Treatment','Hair Spa'
  ];

  // Removed working day options since availability step is no longer used

  // On mount, if coming from registration
  useEffect(() => {
    if (location.state?.fromRegistration) {
      const userInfo = location.state.userInfo;
      toast.success(`Welcome ${userInfo.name}! Let's complete your professional profile.`);
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
    
    setPersonalInfo({ ...personalInfo, contactNumber: value });
    
    // Validate in real-time
    const errorMessage = validateContactNumber(value);
    setContactNumberError(errorMessage);
    setContactNumberValid(errorMessage ? false : (value ? true : null));
  };

  // Handlers
  const handlePersonalInfoChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactNumber') {
      handleContactNumberChange(e);
    } else {
      setPersonalInfo({ ...personalInfo, [name]: value });
    }
  };

  const handleAddressChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleProfessionalInfoChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('experience.')) {
      const field = name.split('.')[1];
      setProfessionalInfo({
        ...professionalInfo,
        experience: { ...professionalInfo.experience, [field]: field === 'years' ? parseInt(value) || 0 : value }
      });
    } else {
      setProfessionalInfo({ ...professionalInfo, [name]: value });
    }
  };

  const handleSkillsChange = (skill) => {
    const updatedSkills = professionalInfo.skills.includes(skill)
      ? professionalInfo.skills.filter(s => s !== skill)
      : [...professionalInfo.skills, skill];
    setProfessionalInfo({ ...professionalInfo, skills: updatedSkills });
  };

  // Removed availability handlers

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [fileType]: file });
    }
  };
  

  const validateStep = (step) => {
    switch (step) {
      case 1:
        const contactValid = !validateContactNumber(personalInfo.contactNumber);
        return contactValid && personalInfo.dateOfBirth && personalInfo.gender;
      case 2:
        return address.street && address.city && address.state && address.postalCode;
      case 3:
        return professionalInfo.position && professionalInfo.skills.length > 0;
      case 4:
        return files.profilePicture && files.governmentId;
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

  // ✅ UPDATED handleSubmit
  const handleSubmit = async () => {
    if (!validateStep(4)) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);

    try {
      // Create FormData to handle file uploads
      const formData = new FormData();
      
      // Add text fields
      formData.append('contactNumber', personalInfo.contactNumber);
      formData.append('dateOfBirth', personalInfo.dateOfBirth);
      formData.append('gender', personalInfo.gender);
      formData.append('address', JSON.stringify({ ...address }));
      formData.append('skills', JSON.stringify([...professionalInfo.skills]));
      formData.append('experience', JSON.stringify({ ...professionalInfo.experience }));
      formData.append('specialization', professionalInfo.specialization);
      formData.append('position', professionalInfo.position);

      // Add files
      if (files.profilePicture) {
        formData.append('profilePicture', files.profilePicture);
      }
      if (files.governmentId) {
        formData.append('governmentId', files.governmentId);
      }
      // Certificates removed per requirements

      const { staffService } = await import('../../services/staff');
      const response = await staffService.setup(formData);

      if (response && response.data) {
        if (response.data.token) {
          localStorage.setItem('auracare_token', response.data.token);
        }
        if (response.data.user) {
          updateUser(response.data.user);
        }
      }

      toast.success('Professional profile setup completed successfully!');
      
      // Check if staff needs approval before accessing dashboard
      if (response.data.approvalStatus === 'pending') {
        navigate('/staff/waiting-approval');
      } else {
        navigate('/staff/dashboard');
      }
    } catch (error) {
      toast.error(error.message);
      console.error('Staff setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Step UI rendering ---
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* User Info Card */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {personalInfo.name ? personalInfo.name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">{personalInfo.name || 'Staff Member'}</h3>
                  <p className="text-gray-600">{personalInfo.email || 'No email provided'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  Contact Number *
                </label>
                <input 
                  type="tel" 
                  name="contactNumber" 
                  value={personalInfo.contactNumber} 
                  onChange={handlePersonalInfoChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-blue-500 transition ${
                    contactNumberValid === false 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : contactNumberValid === true 
                        ? 'border-green-500 focus:ring-green-500 focus:border-green-500' 
                        : 'border-gray-300'
                  }`} 
                  placeholder="Enter your 10-digit mobile number"
                  maxLength={10}
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  Date of Birth *
                </label>
                <input 
                  type="date" 
                  name="dateOfBirth"
                  value={personalInfo.dateOfBirth} 
                  onChange={handlePersonalInfoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select 
                  name="gender" 
                  value={personalInfo.gender} 
                  onChange={handlePersonalInfoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Map className="h-4 w-4 mr-2 text-gray-500" />
                  Street Address *
                </label>
                <input 
                  type="text" 
                  name="street" 
                  value={address.street} 
                  onChange={handleAddressChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  placeholder="Enter street address"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  placeholder="Enter city"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  placeholder="Enter state"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  placeholder="Enter postal code"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-gray-50" 
                  disabled
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                  Position *
                </label>
                <select 
                  name="position" 
                  value={professionalInfo.position} 
                  onChange={handleProfessionalInfoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">Select Position</option>
                  {positionOptions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Award className="h-4 w-4 mr-2 text-gray-500" />
                  Years of Experience *
                </label>
                <input 
                  type="number" 
                  name="experience.years" 
                  value={professionalInfo.experience.years} 
                  onChange={handleProfessionalInfoChange}
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                  placeholder="Enter years of experience"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {skillOptions.map(skill => (
                  <label 
                    key={skill} 
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
                      professionalInfo.skills.includes(skill)
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input 
                      type="checkbox"
                      checked={professionalInfo.skills.includes(skill)}
                      onChange={() => handleSkillsChange(skill)}
                      className="sr-only"
                    />
                    <span className="ml-2 text-sm">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Experience Description
              </label>
              <textarea 
                name="experience.description" 
                value={professionalInfo.experience.description} 
                onChange={handleProfessionalInfoChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                placeholder="Describe your professional experience"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specialization
              </label>
              <input 
                type="text" 
                name="specialization" 
                value={professionalInfo.specialization} 
                onChange={handleProfessionalInfoChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
                placeholder="Enter your specialization"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Required Documents
              </h3>
              <p className="text-gray-600 text-sm">
                Please upload clear images or PDFs of the required documents for verification.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition">
                <div className="flex flex-col items-center justify-center">
                  <Image className="h-12 w-12 text-gray-400 mb-3" />
                  <h4 className="font-medium text-gray-900 mb-1">Profile Picture *</h4>
                  <p className="text-sm text-gray-500 mb-4">Upload a clear photo of yourself</p>
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                    Choose File
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'profilePicture')}
                      className="hidden"
                    />
                  </label>
                  {files.profilePicture && (
                    <p className="mt-2 text-sm text-green-600">
                      {files.profilePicture.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition">
                <div className="flex flex-col items-center justify-center">
                  <CreditCard className="h-12 w-12 text-gray-400 mb-3" />
                  <h4 className="font-medium text-gray-900 mb-1">Government ID *</h4>
                  <p className="text-sm text-gray-500 mb-4">Upload ID proof (Passport, Driver's License, etc.)</p>
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition">
                    Choose File
                    <input 
                      type="file" 
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'governmentId')}
                      className="hidden"
                    />
                  </label>
                  {files.governmentId && (
                    <p className="mt-2 text-sm text-green-600">
                      {files.governmentId.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Professional Profile Setup</h1>
          <p className="text-gray-600">Complete your profile to start offering your services</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 -z-10">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
            </div>
            
            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-col items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 ${
                  currentStep >= step.number
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className={`mt-2 text-xs font-medium text-center px-2 ${
                  currentStep === step.number ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {steps.find(step => step.number === currentStep)?.title}
            </h2>
            <p className="text-gray-600 mt-1">
              Step {currentStep} of {steps.length}
            </p>
          </div>
          
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:opacity-90 shadow-md transition"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:opacity-90 shadow-md disabled:opacity-50 transition flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Complete Setup'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffSetup;