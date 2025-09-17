
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salonService } from '../../services/salon';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EditSalonProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    salonName: '',
    ownerName: '',
    contactNumber: '',
    salonAddress: { street: '', city: '', state: '', postalCode: '' },
    description: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await salonService.getProfile();
        if (response.success) {
          const { salonName, ownerName, contactNumber, salonAddress, description } = response.data;
          setFormData({
            salonName: salonName || '',
            ownerName: ownerName || '',
            contactNumber: contactNumber || '',
            salonAddress: salonAddress || { street: '', city: '', state: '', postalCode: '' },
            description: description || '',
          });
        }
      } catch (error) {
        toast.error('Failed to fetch profile data.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await salonService.updateProfile(formData);
      if (response.success) {
        toast.success('Profile updated successfully!');
        navigate('/salon/dashboard');
      } else {
        toast.error(response.message || 'Failed to update profile.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Salon Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="salonName" className="block text-sm font-medium text-gray-700">Salon Name</label>
          <input
            type="text"
            name="salonName"
            id="salonName"
            value={formData.salonName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="ownerName" className="block text-sm font-medium text-gray-700">Owner Name</label>
          <input
            type="text"
            name="ownerName"
            id="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Salon Address</label>
          <div className="space-y-2 mt-1">
            <input
              type="text"
              name="street"
              placeholder="Street"
              value={formData.salonAddress.street}
              onChange={handleAddressChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.salonAddress.city}
              onChange={handleAddressChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <input
              type="text"
              name="state"
              placeholder="State"
              value={formData.salonAddress.state}
              onChange={handleAddressChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <input
              type="text"
              name="postalCode"
              placeholder="Postal Code"
              value={formData.salonAddress.postalCode}
              onChange={handleAddressChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
        <div>
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
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/salon/dashboard')}
            className="mr-2 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditSalonProfile;
