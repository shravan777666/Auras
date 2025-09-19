
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffService } from '../../services/staff';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const skillOptions = [
  'Haircut','Hair Styling','Hair Color','Hair Treatment',
  'Facial','Makeup','Bridal Makeup','Party Makeup',
  'Manicure','Pedicure','Nail Art','Gel Nails',
  'Massage','Body Treatment','Skin Treatment',
  'Threading','Waxing','Eyebrow Shaping',
  'Hair Extensions','Keratin Treatment','Hair Spa'
];

const positionOptions = [
  'Hair Stylist','Hair Colorist','Makeup Artist','Nail Technician',
  'Esthetician','Massage Therapist','Eyebrow Specialist',
  'Bridal Makeup Artist','Hair Extensions Specialist','Skin Care Specialist','Other'
];

const AddStaff = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [basic, setBasic] = useState({
    name: '',
    email: '',
    password: '',
    contactNumber: '',
    dateOfBirth: '',
    gender: 'Male',
  });

  const [address, setAddress] = useState({
    street: '', city: '', state: '', postalCode: '', country: 'India'
  });

  const [professional, setProfessional] = useState({
    position: '',
    skills: [],
    experience: { years: 0, description: '' },
    specialization: ''
  });

  const [files, setFiles] = useState({
    profilePicture: null,
    governmentId: null
  });

  const handleBasicChange = (e) => setBasic({ ...basic, [e.target.name]: e.target.value });
  const handleAddressChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });
  const handleProfessionalChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('experience.')) {
      const field = name.split('.')[1];
      setProfessional({ ...professional, experience: { ...professional.experience, [field]: field === 'years' ? parseInt(value) || 0 : value } });
    } else {
      setProfessional({ ...professional, [name]: value });
    }
  };
  const toggleSkill = (skill) => {
    const has = professional.skills.includes(skill);
    setProfessional({ ...professional, skills: has ? professional.skills.filter(s => s !== skill) : [...professional.skills, skill] });
  };
  const handleFile = (e, key) => {
    const file = e.target.files?.[0];
    if (file) setFiles({ ...files, [key]: file });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!basic.name || !basic.email || !basic.password) {
      toast.error('Name, Email and Password are required');
      return;
    }
    if (!basic.contactNumber) {
      toast.error('Contact Number is required');
      return;
    }
    if (!files.profilePicture || !files.governmentId) {
      toast.error('Profile Picture and Government ID are required');
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', basic.name);
      fd.append('email', basic.email);
      fd.append('password', basic.password);
      fd.append('contactNumber', basic.contactNumber);
      if (basic.dateOfBirth) fd.append('dateOfBirth', basic.dateOfBirth);
      if (basic.gender) fd.append('gender', basic.gender);
      fd.append('address', JSON.stringify(address));
      fd.append('skills', JSON.stringify(professional.skills));
      fd.append('experience', JSON.stringify(professional.experience));
      if (professional.specialization) fd.append('specialization', professional.specialization);
      if (professional.position) fd.append('position', professional.position);
      if (files.profilePicture) fd.append('profilePicture', files.profilePicture);
      if (files.governmentId) fd.append('governmentId', files.governmentId);

      const response = await staffService.createStaff(fd);
      if (response && response.success) {
        toast.success('Staff member added successfully!');
        navigate('/salon/dashboard');
      } else {
        toast.error(response?.message || 'Failed to add staff.');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Staff Member</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input type="text" id="name" name="name" value={basic.name} onChange={handleBasicChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" id="email" name="email" value={basic.email} onChange={handleBasicChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" id="password" name="password" value={basic.password} onChange={handleBasicChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
          </div>
          <div>
            <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input type="text" id="contactNumber" name="contactNumber" value={basic.contactNumber} onChange={handleBasicChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" required />
          </div>
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
            <input type="date" id="dateOfBirth" name="dateOfBirth" value={basic.dateOfBirth} onChange={handleBasicChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
            <select id="gender" name="gender" value={basic.gender} onChange={handleBasicChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Street</label>
            <input type="text" name="street" value={address.street} onChange={handleAddressChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input type="text" name="city" value={address.city} onChange={handleAddressChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input type="text" name="state" value={address.state} onChange={handleAddressChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Postal Code</label>
            <input type="text" name="postalCode" value={address.postalCode} onChange={handleAddressChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input type="text" name="country" value={address.country} onChange={handleAddressChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <select name="position" value={professional.position} onChange={handleProfessionalChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
              <option value="">Select Position</option>
              {positionOptions.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Skills</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {skillOptions.map(skill => (
                <label key={skill} className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" checked={professional.skills.includes(skill)} onChange={() => toggleSkill(skill)} />
                  <span>{skill}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
              <input type="number" name="experience.years" value={professional.experience.years} onChange={handleProfessionalChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Experience Description</label>
              <input type="text" name="experience.description" value={professional.experience.description} onChange={handleProfessionalChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Specialization</label>
            <input type="text" name="specialization" value={professional.specialization} onChange={handleProfessionalChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
            <input type="file" accept="image/*" onChange={e => handleFile(e, 'profilePicture')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Government ID (Image/PDF)</label>
            <input type="file" accept="image/*,.pdf" onChange={e => handleFile(e, 'governmentId')} />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={() => navigate('/salon/dashboard')} className="mr-2 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Cancel</button>
          <button type="submit" className="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">Add Staff</button>
        </div>
      </form>
    </div>
  );
};

export default AddStaff;
