import React, { useState, useEffect } from 'react';
import { X, DollarSign } from 'lucide-react';

const SalaryConfigurationModal = ({ staff, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    baseSalary: '',
    salaryType: 'Monthly',
    commissionRate: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (staff && isOpen) {
      setFormData({
        baseSalary: staff.baseSalary || '',
        salaryType: staff.salaryType || 'Monthly',
        commissionRate: staff.commissionRate || ''
      });
    }
  }, [staff, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.baseSalary) {
      newErrors.baseSalary = 'Base salary is required';
    } else if (isNaN(formData.baseSalary) || parseFloat(formData.baseSalary) <= 0) {
      newErrors.baseSalary = 'Base salary must be a positive number';
    }
    
    if (!formData.salaryType) {
      newErrors.salaryType = 'Salary type is required';
    }
    
    if (formData.salaryType === 'Commission' && (!formData.commissionRate || isNaN(formData.commissionRate))) {
      newErrors.commissionRate = 'Commission rate is required for Commission type';
    } else if (formData.commissionRate && (parseFloat(formData.commissionRate) < 0 || parseFloat(formData.commissionRate) > 100)) {
      newErrors.commissionRate = 'Commission rate must be between 0 and 100';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const data = {
        baseSalary: parseFloat(formData.baseSalary),
        salaryType: formData.salaryType,
        ...(formData.salaryType === 'Commission' && { commissionRate: parseFloat(formData.commissionRate) })
      };
      
      onSave(staff._id, data);
    }
  };

  if (!isOpen || !staff) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-indigo-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Configuring Salary for {staff.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4">
          {staff.profilePicture ? (
            <img 
              src={staff.profilePicture.startsWith('http') ? staff.profilePicture : `${import.meta.env.VITE_API_URL || ''}${staff.profilePicture}`} 
              alt={staff.name} 
              className="h-16 w-16 rounded-full object-cover mx-auto mb-4 border"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-indigo-600 font-semibold text-lg">
                {staff.name.charAt(0)}
              </span>
            </div>
          )}
          
          {staff.baseSalary && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <h4 className="text-sm font-medium text-blue-900 mb-1">Current Salary Details</h4>
              <div className="text-sm text-blue-700">
                <p>Base Salary: ₹{staff.baseSalary.toLocaleString()}</p>
                <p>Type: {staff.salaryType}</p>
                {staff.salaryType === 'Commission' && staff.commissionRate && (
                  <p>Commission Rate: {staff.commissionRate}%</p>
                )}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary Type
                </label>
                <select
                  name="salaryType"
                  value={formData.salaryType}
                  onChange={handleChange}
                  className={`w-full rounded-md border ${errors.salaryType ? 'border-red-300' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Commission">Commission</option>
                </select>
                {errors.salaryType && (
                  <p className="mt-1 text-sm text-red-600">{errors.salaryType}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Base Salary
                </label>
                <input
                  type="number"
                  name="baseSalary"
                  value={formData.baseSalary}
                  onChange={handleChange}
                  className={`w-full rounded-md border ${errors.baseSalary ? 'border-red-300' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Enter base salary"
                />
                {errors.baseSalary && (
                  <p className="mt-1 text-sm text-red-600">{errors.baseSalary}</p>
                )}
              </div>
              
              {formData.salaryType === 'Commission' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    name="commissionRate"
                    value={formData.commissionRate}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    step="0.1"
                    className={`w-full rounded-md border ${errors.commissionRate ? 'border-red-300' : 'border-gray-300'} px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder="Enter commission rate"
                  />
                  {errors.commissionRate && (
                    <p className="mt-1 text-sm text-red-600">{errors.commissionRate}</p>
                  )}
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SalaryConfigurationModal;