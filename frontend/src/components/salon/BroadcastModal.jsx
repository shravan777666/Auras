import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  X, 
  Send, 
  Users, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Target,
  Info
} from 'lucide-react';
import { broadcastService } from '../../services/broadcast';

const BroadcastModal = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [targetCountLoading, setTargetCountLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    targetSkill: '',
    category: 'general',
    priority: 'medium'
  });

  // Skills and target data
  const [availableSkills, setAvailableSkills] = useState([]);
  const [targetCount, setTargetCount] = useState(0);
  const [sampleStaff, setSampleStaff] = useState([]);
  
  // Validation
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Load available skills when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableSkills();
      // Reset form when modal opens
      setFormData({
        subject: '',
        message: '',
        targetSkill: '',
        category: 'general',
        priority: 'medium'
      });
      setTargetCount(0);
      setSampleStaff([]);
      setErrors({});
      setShowConfirmation(false);
    }
  }, [isOpen]);

  // Load target count when skill changes
  useEffect(() => {
    if (formData.targetSkill) {
      loadTargetCount(formData.targetSkill);
    } else {
      setTargetCount(0);
      setSampleStaff([]);
    }
  }, [formData.targetSkill]);

  const loadAvailableSkills = async () => {
    try {
      setSkillsLoading(true);
      const response = await broadcastService.getAllSkills();
      if (response.success) {
        setAvailableSkills(response.data.skills || []);
      }
    } catch (error) {
      console.error('Error loading skills:', error);
      toast.error('Failed to load available skills');
    } finally {
      setSkillsLoading(false);
    }
  };

  const loadTargetCount = async (skill) => {
    try {
      setTargetCountLoading(true);
      const response = await broadcastService.getTargetCount(skill);
      if (response.success) {
        setTargetCount(response.data.targetCount || 0);
        // Ensure sampleStaff is always an array and has valid data
        const validSampleStaff = (response.data.sampleStaff || []).filter(staff => 
          staff && typeof staff === 'object' && staff.name
        );
        setSampleStaff(validSampleStaff);
      }
    } catch (error) {
      console.error('Error loading target count:', error);
      setTargetCount(0);
      setSampleStaff([]);
      toast.error('Failed to load target count for selected skill');
    } finally {
      setTargetCountLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const validation = broadcastService.validateBroadcastData(formData);
    
    if (!validation.isValid) {
      const errorObj = {};
      validation.errors.forEach(error => {
        if (error.includes('Subject')) errorObj.subject = error;
        if (error.includes('Message')) errorObj.message = error;
        if (error.includes('skill')) errorObj.targetSkill = error;
      });
      setErrors(errorObj);
      return false;
    }

    if (targetCount === 0) {
      setErrors({ targetSkill: 'No staff members found with this skill' });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmSend = async () => {
    try {
      setLoading(true);
      const response = await broadcastService.sendBroadcast(formData);
      
      if (response.success) {
        toast.success(`Broadcast sent successfully to ${response.data.deliveredCount} staff members!`);
        onSuccess && onSuccess(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error(error.message || 'Failed to send broadcast');
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Send className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Send Broadcast to Staff</h2>
              <p className="text-sm text-gray-600">Send targeted messages to staff based on their skills</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {!showConfirmation ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Skill Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Skill *
                </label>
                <select
                  value={formData.targetSkill}
                  onChange={(e) => handleInputChange('targetSkill', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.targetSkill ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={skillsLoading}
                >
                  <option value="">
                    {skillsLoading ? 'Loading skills...' : 'Select a skill to target'}
                  </option>
                  {availableSkills && availableSkills.length > 0 ? (
                    availableSkills.map((skillData) => (
                      <option key={skillData.skill || skillData} value={skillData.skill || skillData}>
                        {skillData.skill || skillData} ({skillData.staffCount || 0} staff)
                      </option>
                    ))
                  ) : (
                    !skillsLoading && (
                      <option value="" disabled>No skills available</option>
                    )
                  )}
                </select>
                {errors.targetSkill && (
                  <p className="mt-1 text-sm text-red-600">{errors.targetSkill}</p>
                )}
              </div>

              {/* Target Count Display */}
              {formData.targetSkill && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      {targetCountLoading ? (
                        <span className="flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Calculating target count...
                        </span>
                      ) : (
                        `This will reach ${targetCount} staff member${targetCount !== 1 ? 's' : ''}`
                      )}
                    </span>
                  </div>
                  
                  {sampleStaff.length > 0 && (
                    <div className="text-sm text-blue-700">
                      <p className="mb-1">Sample staff members:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {sampleStaff.slice(0, 3).map((staff, index) => {
                          const experienceYears = staff.experience?.years || 
                                                (typeof staff.experience === 'number' ? staff.experience : 0);
                          return (
                            <li key={`staff-${staff._id || index}`}>
                              {staff.name || 'Unknown'} - {staff.position || 'Staff'} ({experienceYears} years exp.)
                            </li>
                          );
                        })}
                        {sampleStaff.length > 3 && (
                          <li key="more-staff">+ {sampleStaff.length - 3} more staff members</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject * <span className="text-gray-500">({formData.subject.length}/200)</span>
                </label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  placeholder="e.g., Freelance Hair Coloring Opportunity Available"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.subject ? 'border-red-300' : 'border-gray-300'
                  }`}
                  maxLength={200}
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message * <span className="text-gray-500">({formData.message.length}/2000)</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Write your detailed message here..."
                  rows={6}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none ${
                    errors.message ? 'border-red-300' : 'border-gray-300'
                  }`}
                  maxLength={2000}
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                )}
              </div>

              {/* Category and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {broadcastService.getAvailableCategories().map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {broadcastService.getAvailablePriorities().map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || targetCount === 0 || !formData.subject || !formData.message || !formData.targetSkill}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Review & Send</span>
                </button>
              </div>
            </form>
          ) : (
            /* Confirmation Screen */
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Broadcast</h3>
                <p className="text-sm text-gray-600">
                  Please review your broadcast before sending
                </p>
              </div>

              {/* Broadcast Preview */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">To:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {targetCount} staff member{targetCount !== 1 ? 's' : ''} with "{formData.targetSkill}" skill
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Subject:</span>
                  <span className="ml-2 text-sm text-gray-900">{formData.subject}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Category:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {broadcastService.getCategoryDisplayName(formData.category)}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Priority:</span>
                  <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    broadcastService.getPriorityColor(formData.priority)
                  }`}>
                    {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Message:</span>
                  <div className="mt-1 text-sm text-gray-900 bg-white p-3 rounded border">
                    {formData.message}
                  </div>
                </div>
              </div>

              {/* Confirmation Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  disabled={loading}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleConfirmSend}
                  disabled={loading}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Send Broadcast</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BroadcastModal;
