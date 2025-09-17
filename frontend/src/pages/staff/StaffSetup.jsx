import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Upload,
  FileText,
  Image,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Users,
  Briefcase
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

  const [availability, setAvailability] = useState({
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    workingHours: {
      startTime: '09:00',
      endTime: '18:00'
    },
    breakTime: {
      startTime: '13:00',
      endTime: '14:00'
    }
  });

  const [files, setFiles] = useState({
    profilePicture: null,
    governmentId: null,
    certificates: []
  });

  const steps = [
    { number: 1, title: 'Personal Information', icon: User },
    { number: 2, title: 'Address Details', icon: MapPin },
    { number: 3, title: 'Professional Info', icon: Briefcase },
    { number: 4, title: 'Availability', icon: Calendar },
    { number: 5, title: 'Documents & Photos', icon: Upload }
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

  const workingDayOptions = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

  // On mount, if coming from registration
  useEffect(() => {
    if (location.state?.fromRegistration) {
      const userInfo = location.state.userInfo;
      toast.success(`Welcome ${userInfo.name}! Let's complete your professional profile.`);
    }
  }, [location.state]);

  // Handlers
  const handlePersonalInfoChange = (e) => {
    setPersonalInfo({ ...personalInfo, [e.target.name]: e.target.value });
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

  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('workingHours.')) {
      const field = name.split('.')[1];
      setAvailability({
        ...availability,
        workingHours: { ...availability.workingHours, [field]: value }
      });
    } else if (name.startsWith('breakTime.')) {
      const field = name.split('.')[1];
      setAvailability({
        ...availability,
        breakTime: { ...availability.breakTime, [field]: value }
      });
    } else {
      setAvailability({ ...availability, [name]: value });
    }
  };

  const handleWorkingDaysChange = (day) => {
    const updatedDays = availability.workingDays.includes(day)
      ? availability.workingDays.filter(d => d !== day)
      : [...availability.workingDays, day];
    setAvailability({ ...availability, workingDays: updatedDays });
  };

  const handleFileChange = (e, fileType) => {
    const file = e.target.files[0];
    if (file) {
      if (fileType === 'certificates') {
        setFiles({ ...files, certificates: [...files.certificates, file] });
      } else {
        setFiles({ ...files, [fileType]: file });
      }
    }
  };

  const removeCertificate = (index) => {
    const updatedCertificates = files.certificates.filter((_, i) => i !== index);
    setFiles({ ...files, certificates: updatedCertificates });
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        return personalInfo.contactNumber && personalInfo.dateOfBirth && personalInfo.gender;
      case 2:
        return address.street && address.city && address.state && address.postalCode;
      case 3:
        return professionalInfo.position && professionalInfo.skills.length > 0;
      case 4:
        return availability.workingDays.length > 0 && availability.workingHours.startTime && availability.workingHours.endTime;
      case 5:
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
    if (!validateStep(5)) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        contactNumber: personalInfo.contactNumber,
        dateOfBirth: personalInfo.dateOfBirth,
        gender: personalInfo.gender,
        address: { ...address },
        skills: [...professionalInfo.skills],
        experience: { ...professionalInfo.experience },
        availability: { ...availability },
        specialization: professionalInfo.specialization,
        position: professionalInfo.position,
      };

      const { staffService } = await import('../../services/staff');
      const response = await staffService.setup(payload);

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
          <div className="space-y-4">
            <input type="text" name="name" placeholder="Full Name"
              value={personalInfo.name} onChange={handlePersonalInfoChange}
              className="w-full border rounded-lg px-4 py-2" />

            <input type="email" name="email" placeholder="Email"
              value={personalInfo.email} onChange={handlePersonalInfoChange}
              className="w-full border rounded-lg px-4 py-2" disabled />

            <input type="text" name="contactNumber" placeholder="Contact Number"
              value={personalInfo.contactNumber} onChange={handlePersonalInfoChange}
              className="w-full border rounded-lg px-4 py-2" />

            <input type="date" name="dateOfBirth"
              value={personalInfo.dateOfBirth} onChange={handlePersonalInfoChange}
              className="w-full border rounded-lg px-4 py-2" />

            <select name="gender" value={personalInfo.gender} onChange={handlePersonalInfoChange}
              className="w-full border rounded-lg px-4 py-2">
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <input type="text" name="street" placeholder="Street"
              value={address.street} onChange={handleAddressChange}
              className="w-full border rounded-lg px-4 py-2" />
            <input type="text" name="city" placeholder="City"
              value={address.city} onChange={handleAddressChange}
              className="w-full border rounded-lg px-4 py-2" />
            <input type="text" name="state" placeholder="State"
              value={address.state} onChange={handleAddressChange}
              className="w-full border rounded-lg px-4 py-2" />
            <input type="text" name="postalCode" placeholder="Postal Code"
              value={address.postalCode} onChange={handleAddressChange}
              className="w-full border rounded-lg px-4 py-2" />
            <input type="text" name="country" placeholder="Country"
              value={address.country} onChange={handleAddressChange}
              className="w-full border rounded-lg px-4 py-2" />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <select name="position" value={professionalInfo.position} onChange={handleProfessionalInfoChange}
              className="w-full border rounded-lg px-4 py-2">
              <option value="">Select Position</option>
              {positionOptions.map(pos => <option key={pos}>{pos}</option>)}
            </select>

            <div>
              <label className="block font-medium mb-2">Skills</label>
              <div className="grid grid-cols-2 gap-2">
                {skillOptions.map(skill => (
                  <label key={skill} className="flex items-center space-x-2">
                    <input type="checkbox"
                      checked={professionalInfo.skills.includes(skill)}
                      onChange={() => handleSkillsChange(skill)} />
                    <span>{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            <input type="number" name="experience.years" placeholder="Years of Experience"
              value={professionalInfo.experience.years} onChange={handleProfessionalInfoChange}
              className="w-full border rounded-lg px-4 py-2" />

            <textarea name="experience.description" placeholder="Experience Description"
              value={professionalInfo.experience.description} onChange={handleProfessionalInfoChange}
              className="w-full border rounded-lg px-4 py-2" />

            <input type="text" name="specialization" placeholder="Specialization"
              value={professionalInfo.specialization} onChange={handleProfessionalInfoChange}
              className="w-full border rounded-lg px-4 py-2" />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <label className="block font-medium">Working Days</label>
            <div className="grid grid-cols-2 gap-2">
              {workingDayOptions.map(day => (
                <label key={day} className="flex items-center space-x-2">
                  <input type="checkbox"
                    checked={availability.workingDays.includes(day)}
                    onChange={() => handleWorkingDaysChange(day)} />
                  <span>{day}</span>
                </label>
              ))}
            </div>

            <div className="flex space-x-4">
              <div>
                <label>Start Time</label>
                <input type="time" name="workingHours.startTime"
                  value={availability.workingHours.startTime}
                  onChange={handleAvailabilityChange}
                  className="border rounded-lg px-2 py-1" />
              </div>
              <div>
                <label>End Time</label>
                <input type="time" name="workingHours.endTime"
                  value={availability.workingHours.endTime}
                  onChange={handleAvailabilityChange}
                  className="border rounded-lg px-2 py-1" />
              </div>
            </div>

            <div className="flex space-x-4">
              <div>
                <label>Break Start</label>
                <input type="time" name="breakTime.startTime"
                  value={availability.breakTime.startTime}
                  onChange={handleAvailabilityChange}
                  className="border rounded-lg px-2 py-1" />
              </div>
              <div>
                <label>Break End</label>
                <input type="time" name="breakTime.endTime"
                  value={availability.breakTime.endTime}
                  onChange={handleAvailabilityChange}
                  className="border rounded-lg px-2 py-1" />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <label>Profile Picture</label>
              <input type="file" accept="image/*"
                onChange={(e) => handleFileChange(e, 'profilePicture')} />
            </div>

            <div>
              <label>Government ID</label>
              <input type="file" accept="image/*,.pdf"
                onChange={(e) => handleFileChange(e, 'governmentId')} />
            </div>

            <div>
              <label>Certificates</label>
              <input type="file" multiple
                onChange={(e) => handleFileChange(e, 'certificates')} />
              <ul className="mt-2 space-y-1">
                {files.certificates.map((file, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    {file.name}
                    <button type="button" onClick={() => removeCertificate(idx)}
                      className="text-red-500 text-sm">Remove</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.number
                    ? 'bg-gradient-to-r from-green-500 to-blue-600 text-white'
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
                    currentStep > step.number ? 'bg-gradient-to-r from-green-500 to-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white shadow rounded-2xl p-6">
          {renderStep()}
        </div>

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

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:opacity-90"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffSetup;
