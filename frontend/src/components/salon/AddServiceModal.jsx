
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { salonService } from '../../services/salon';

const AddServiceModal = ({ isOpen, onClose, onServiceAdded }) => {
  const [formData, setFormData] = useState({
    category: '',
    name: '',
    description: '',
    duration: '',
    price: '',
  });
  const [loading, setLoading] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const res = await salonService.getServiceCatalog();
        if (res?.success && Array.isArray(res.data)) {
          setCatalog(res.data);
        }
      } catch (e) {
        // Fallback silently
      }
    })();
  }, [isOpen]);

  // When category changes, filter available services and reset selection
  useEffect(() => {
    if (!formData.category) {
      setFilteredServices([]);
      setFormData(prev => ({ ...prev, name: '', price: '' }));
      return;
    }
    const subset = catalog.filter(s => s.category === formData.category);
    setFilteredServices(subset);
    setFormData(prev => ({ ...prev, name: '', price: subset[0]?.price || '' }));
  }, [formData.category, catalog]);

  const handleSelectService = (e) => {
    const name = e.target.value;
    const selected = filteredServices.find(s => s.name === name);
    setFormData(prev => ({
      ...prev,
      name,
      // Description stays free-text; keep whatever the user typed
      price: selected ? selected.price : prev.price,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await salonService.addService(formData);
      if (response.success) {
        toast.success('Service added successfully!');
        onServiceAdded(); // Callback to refresh services in dashboard
        onClose(); // Close the modal
        setFormData({ name: '', description: '', duration: '', price: '', category: '' }); // Reset form
      } else {
        toast.error(response.message || 'Failed to add service.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Add New Service</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
            {catalog.length > 0 ? (
              <select
                name="category"
                id="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select a category</option>
                {[...new Set(catalog.map(s => s.category))].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="category"
                id="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            )}
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Service Name</label>
            {filteredServices.length > 0 ? (
              <select
                name="name"
                id="name"
                value={formData.name}
                onChange={handleSelectService}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              >
                <option value="">Select a service</option>
                {filteredServices.map(s => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            )}
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              id="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              
            ></textarea>
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
            <input
              type="number"
              name="duration"
              id="duration"
              value={formData.duration}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (₹)</label>
            <input
              type="number"
              name="price"
              id="price"
              value={formData.price}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
              
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServiceModal;
