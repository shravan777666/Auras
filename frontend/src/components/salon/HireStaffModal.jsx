import React, { useState, useEffect } from 'react';
import { X, UserPlus, Calendar, DollarSign, Percent, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { salonService } from '../../services/salon';

const HireStaffModal = ({ isOpen, onClose, staffMember, onSendOffer }) => {
  const [formData, setFormData] = useState({
    salary: '',
    commissionRate: '',
    startDate: '',
    position: staffMember?.position || '',
    notes: ''
  });
  const [isSending, setIsSending] = useState(false);

  // Update form when staffMember changes
  useEffect(() => {
    if (staffMember) {
      setFormData(prev => ({
        ...prev,
        position: staffMember.position || prev.position
      }));
    }
  }, [staffMember]);

  if (!isOpen || !staffMember) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendOffer = async () => {
    // Basic validation
    if (!formData.salary || !formData.startDate || !formData.position) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Debug log to see the staff member data
    console.log('Staff Member Data:', staffMember);

    // Validate staff ID
    if (!staffMember || (!staffMember.id && !staffMember._id)) {
      toast.error('Invalid staff member data');
      return;
    }

    try {
      setIsSending(true);
      
      // Prepare offer data
      const offerData = {
        staffId: staffMember.id || staffMember._id,
        salary: parseFloat(formData.salary),
        commissionRate: formData.commissionRate ? parseFloat(formData.commissionRate) : null,
        startDate: formData.startDate,
        position: formData.position,
        notes: formData.notes
      };
      
      // Send job offer using the salon service
      await salonService.sendJobOffer(offerData);
      
      toast.success(`Job offer sent to ${staffMember.name}!`);
      onClose();
      
      // Call the parent callback if provided
      onSendOffer && onSendOffer(offerData);
    } catch (error) {
      console.error('Error sending job offer:', error);
      toast.error('Failed to send job offer');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <UserPlus className="h-5 w-5 text-primary-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-800">Hire {staffMember?.name || 'Staff Member'}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Staff Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-700 font-medium">
                  {staffMember?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{staffMember?.name || 'Unknown Staff Member'}</h4>
                <p className="text-sm text-gray-600">{staffMember?.position || 'Position not specified'}</p>
                <p className="text-xs text-gray-500">{staffMember?.email || 'Email not provided'}</p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position/Role <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="e.g., Nail Specialist, Hairstylist"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
              />
            </div>

            {/* Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salary/Compensation (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  placeholder="Enter monthly salary"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                />
              </div>
            </div>

            {/* Commission Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Rate (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  name="commissionRate"
                  value={formData.commissionRate}
                  onChange={handleChange}
                  placeholder="Enter commission percentage"
                  min="0"
                  max="100"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                />
              </div>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Any additional information about this offer..."
                  rows="3"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 mr-3 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSendOffer}
            disabled={isSending}
            className="flex items-center px-6 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <>
                <span className="animate-spin h-4 w-4 mr-2 border-t-2 border-r-2 border-white rounded-full"></span>
                Sending Offer...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Send Offer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HireStaffModal;