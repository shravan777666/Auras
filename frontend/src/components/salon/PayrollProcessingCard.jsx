import React, { useState, useEffect } from 'react';
import { DollarSign, Users, Calendar, Play, FileText, CheckCircle, Plus, X } from 'lucide-react';
import { salonService } from '../../services/salon';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const PayrollProcessingCard = () => {
  const [configurations, setConfigurations] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('');
  const [expandedConfigs, setExpandedConfigs] = useState({});
  const [formData, setFormData] = useState({});
  const [showAddRoleForm, setShowAddRoleForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [showAddStaffConfigForm, setShowAddStaffConfigForm] = useState(false);
  const [staffConfigForm, setStaffConfigForm] = useState({
    staffId: '',
    basicSalaryFixed: 0,
    allowancesFixed: 0,
    employeeEpfRate: 0.12,
    professionalTax: 0,
    leaveThresholdDays: 2,
    productDeductionsMonthly: 0
  });

  // Initialize form data for all configurations
  useEffect(() => {
    const initializeFormData = () => {
      const initialData = {};
      configurations.forEach(config => {
        const key = `${config.jobRole}-${config.experienceLevel}`;
        initialData[key] = {
          basicSalaryFixed: config.basicSalaryFixed || 0,
          allowancesFixed: config.allowancesFixed || 0,
          employeeEpfRate: config.employeeEpfRate || 0.12,
          professionalTax: config.professionalTax || 0,
          leaveThresholdDays: config.leaveThresholdDays || 2,
          productDeductionsMonthly: config.productDeductionsMonthly || 0
        };
      });
      setFormData(initialData);
    };

    if (configurations.length > 0) {
      initializeFormData();
    }
  }, [configurations]);

  // Fetch payroll configurations and staff members
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch payroll configurations
        const configResponse = await salonService.getPayrollConfigurations();
        
        // Fetch staff members
        const staffResponse = await salonService.getSalonStaff();
        
        if (configResponse.success) {
          setConfigurations(configResponse.data);
          
          // Group configurations by job role
          const grouped = {};
          configResponse.data.forEach(config => {
            if (!grouped[config.jobRole]) {
              grouped[config.jobRole] = [];
            }
            grouped[config.jobRole].push(config);
          });
          
          // Set default active tab to first job role
          if (Object.keys(grouped).length > 0 && !activeTab) {
            setActiveTab(Object.keys(grouped)[0]);
          }
        }
        
        if (staffResponse.success) {
          setStaffMembers(staffResponse.data);
        }
      } catch (error) {
        toast.error('Failed to fetch data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle form input changes
  const handleInputChange = (jobRole, experienceLevel, field, value) => {
    const key = `${jobRole}-${experienceLevel}`;
    setFormData(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  // Handle staff config form changes
  const handleStaffConfigChange = (field, value) => {
    setStaffConfigForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save configuration for a specific job role and experience level
  const saveConfiguration = async (jobRole, experienceLevel) => {
    try {
      const key = `${jobRole}-${experienceLevel}`;
      const configData = {
        jobRole,
        experienceLevel,
        ...formData[key]
      };

      const response = await salonService.createOrUpdatePayrollConfig(configData);
      if (response.success) {
        toast.success('Configuration saved successfully');
        
        // Update local state
        setConfigurations(prev => {
          const existingIndex = prev.findIndex(config => 
            config.jobRole === jobRole && config.experienceLevel === experienceLevel
          );
          
          if (existingIndex >= 0) {
            // Update existing configuration
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...configData, ...response.data };
            return updated;
          } else {
            // Add new configuration
            return [...prev, response.data];
          }
        });
      }
    } catch (error) {
      toast.error('Failed to save configuration');
      console.error('Error saving configuration:', error);
    }
  };

  // Save staff-specific configuration
  const saveStaffConfiguration = async () => {
    if (!staffConfigForm.staffId) {
      toast.error('Please select a staff member');
      return;
    }

    try {
      // Get the selected staff member
      const selectedStaff = staffMembers.find(staff => staff._id === staffConfigForm.staffId);
      if (!selectedStaff) {
        toast.error('Selected staff member not found');
        return;
      }

      // Determine experience level based on years of experience
      const experienceYears = selectedStaff.experience?.years || 0;
      const experienceLevel = experienceYears >= 5 ? 'Master' : 
                            experienceYears >= 2 ? 'Senior' : 'Junior';

      // Create configuration data
      const configData = {
        jobRole: selectedStaff.position || 'General Staff',
        experienceLevel,
        basicSalaryFixed: parseFloat(staffConfigForm.basicSalaryFixed) || 0,
        allowancesFixed: parseFloat(staffConfigForm.allowancesFixed) || 0,
        employeeEpfRate: parseFloat(staffConfigForm.employeeEpfRate) || 0.12,
        professionalTax: parseFloat(staffConfigForm.professionalTax) || 0,
        leaveThresholdDays: parseInt(staffConfigForm.leaveThresholdDays) || 2,
        productDeductionsMonthly: parseFloat(staffConfigForm.productDeductionsMonthly) || 0
      };

      const response = await salonService.createOrUpdatePayrollConfig(configData);
      if (response.success) {
        toast.success(`Configuration saved for ${selectedStaff.name}`);
        
        // Update local state
        setConfigurations(prev => {
          // Check if a configuration already exists for this job role and experience level
          const existingIndex = prev.findIndex(config => 
            config.jobRole === configData.jobRole && config.experienceLevel === configData.experienceLevel
          );
          
          if (existingIndex >= 0) {
            // Update existing configuration
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], ...configData, ...response.data };
            return updated;
          } else {
            // Add new configuration
            return [...prev, response.data];
          }
        });
        
        // Reset form
        setStaffConfigForm({
          staffId: '',
          basicSalaryFixed: 0,
          allowancesFixed: 0,
          employeeEpfRate: 0.12,
          professionalTax: 0,
          leaveThresholdDays: 2,
          productDeductionsMonthly: 0
        });
        setShowAddStaffConfigForm(false);
      }
    } catch (error) {
      toast.error('Failed to save staff configuration');
      console.error('Error saving staff configuration:', error);
    }
  };

  // Create configurations for a new job role
  const createNewRoleConfigurations = async () => {
    if (!newRoleName.trim()) {
      toast.error('Please enter a job role name');
      return;
    }

    try {
      // Create configurations for all three experience levels
      const experienceLevels = ['Junior', 'Senior', 'Master'];
      const newConfigs = [];
      
      for (const level of experienceLevels) {
        const configData = {
          jobRole: newRoleName.trim(),
          experienceLevel: level,
          basicSalaryFixed: 0,
          allowancesFixed: 0,
          employeeEpfRate: 0.12,
          professionalTax: 0,
          leaveThresholdDays: 2,
          productDeductionsMonthly: 0
        };

        const response = await salonService.createOrUpdatePayrollConfig(configData);
        if (response.success) {
          newConfigs.push(response.data);
        }
      }
      
      // Update local state
      setConfigurations(prev => [...prev, ...newConfigs]);
      setActiveTab(newRoleName.trim());
      setNewRoleName('');
      setShowAddRoleForm(false);
      toast.success('New job role configurations created successfully');
    } catch (error) {
      toast.error('Failed to create new job role configurations');
      console.error('Error creating new role configurations:', error);
    }
  };

  // Delete a payroll configuration
  const deleteConfiguration = async (configId, jobRole, experienceLevel) => {
    if (!window.confirm(`Are you sure you want to delete the ${experienceLevel} configuration for ${jobRole}?`)) {
      return;
    }

    try {
      await salonService.deletePayrollConfig(configId);
      toast.success('Configuration deleted successfully');
      
      // Update local state
      setConfigurations(prev => 
        prev.filter(config => 
          !(config.jobRole === jobRole && config.experienceLevel === experienceLevel)
        )
      );
      
      // Remove from formData
      const key = `${jobRole}-${experienceLevel}`;
      setFormData(prev => {
        const newData = { ...prev };
        delete newData[key];
        return newData;
      });
    } catch (error) {
      toast.error('Failed to delete configuration');
      console.error('Error deleting configuration:', error);
    }
  };

  // Toggle expanded state for a configuration
  const toggleExpand = (jobRole, experienceLevel) => {
    const key = `${jobRole}-${experienceLevel}`;
    setExpandedConfigs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Process payroll for all staff
  const processPayroll = async () => {
    if (!selectedMonth || !selectedYear) {
      toast.error('Please select a month and year');
      return;
    }

    try {
      setProcessing(true);
      const response = await salonService.processPayrollForAllStaff({
        payrollMonth: selectedMonth,
        payrollYear: selectedYear
      });

      if (response.success) {
        toast.success(`Payroll processed for ${response.data.processedCount} staff members`);
        if (response.data.errors && response.data.errors.length > 0) {
          response.data.errors.forEach(error => toast.error(error));
        }
      }
    } catch (error) {
      toast.error('Failed to process payroll');
      console.error('Error processing payroll:', error);
    } finally {
      setProcessing(false);
    }
  };

  // Group configurations by job role
  const groupedConfigurations = configurations.reduce((acc, config) => {
    if (!acc[config.jobRole]) {
      acc[config.jobRole] = [];
    }
    acc[config.jobRole].push(config);
    return acc;
  }, {});

  // Get unique job roles
  const jobRoles = Object.keys(groupedConfigurations);

  // Get staff members for a specific job role
  const getStaffForRole = (jobRole) => {
    return staffMembers.filter(staff => staff.position === jobRole);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <DollarSign className="h-6 w-6 text-indigo-600 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Payroll Processing</h2>
        </div>
        <button
          onClick={processPayroll}
          disabled={processing}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {processing ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Processing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Process Payroll for All Staff
            </>
          )}
        </button>
      </div>

      {/* Payroll Period Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
              <option key={month} value={month}>
                {new Date(2023, month - 1).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add New Job Role Button */}
      <div className="mb-4">
        <button
          onClick={() => setShowAddRoleForm(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mr-2"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Job Role
        </button>
        <button
          onClick={() => setShowAddStaffConfigForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Users className="h-4 w-4 mr-2" />
          Add Staff Configuration
        </button>
      </div>

      {/* Add Staff Configuration Form */}
      {showAddStaffConfigForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Add Staff Configuration</h3>
            <button
              onClick={() => setShowAddStaffConfigForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Staff Member
              </label>
              <select
                value={staffConfigForm.staffId}
                onChange={(e) => handleStaffConfigChange('staffId', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a staff member</option>
                {staffMembers.map(staff => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name} ({staff.position || 'General Staff'})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Basic Salary (₹)
              </label>
              <input
                type="number"
                value={staffConfigForm.basicSalaryFixed}
                onChange={(e) => handleStaffConfigChange('basicSalaryFixed', parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allowances (₹)
              </label>
              <input
                type="number"
                value={staffConfigForm.allowancesFixed}
                onChange={(e) => handleStaffConfigChange('allowancesFixed', parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                EPF Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={staffConfigForm.employeeEpfRate * 100}
                onChange={(e) => handleStaffConfigChange('employeeEpfRate', (parseFloat(e.target.value) || 0) / 100)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Professional Tax (₹)
              </label>
              <input
                type="number"
                value={staffConfigForm.professionalTax}
                onChange={(e) => handleStaffConfigChange('professionalTax', parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leave Threshold (days)
              </label>
              <input
                type="number"
                value={staffConfigForm.leaveThresholdDays}
                onChange={(e) => handleStaffConfigChange('leaveThresholdDays', parseInt(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Deductions (₹)
              </label>
              <input
                type="number"
                value={staffConfigForm.productDeductionsMonthly}
                onChange={(e) => handleStaffConfigChange('productDeductionsMonthly', parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="md:col-span-2 flex justify-end space-x-2">
              <button
                onClick={() => setShowAddStaffConfigForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveStaffConfiguration}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Job Role Form */}
      {showAddRoleForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Add New Job Role</h3>
            <button
              onClick={() => setShowAddRoleForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Role Name
              </label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g., Hair Stylist, Makeup Artist"
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={createNewRoleConfigurations}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Job Role Tabs */}
      {jobRoles.length > 0 && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {jobRoles.map(role => (
                <button
                  key={role}
                  onClick={() => setActiveTab(role)}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === role
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {role}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Configuration Sections */}
      {jobRoles.length > 0 ? (
        <div className="space-y-4">
          {groupedConfigurations[activeTab]?.map(config => {
            const key = `${config.jobRole}-${config.experienceLevel}`;
            const isExpanded = expandedConfigs[key];
            const formDataKey = formData[key] || {};
            const staffForRole = getStaffForRole(config.jobRole);

            return (
              <div key={key} className="border border-gray-200 rounded-lg">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer bg-gray-50 hover:bg-gray-100"
                  onClick={() => toggleExpand(config.jobRole, config.experienceLevel)}
                >
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-gray-500 mr-2" />
                    <div>
                      <h3 className="font-medium text-gray-900">{config.jobRole} - {config.experienceLevel}</h3>
                      <p className="text-sm text-gray-500">
                        {staffForRole.length > 0 
                          ? `${staffForRole.length} staff member${staffForRole.length > 1 ? 's' : ''}` 
                          : 'No staff assigned'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      ₹{formDataKey.basicSalaryFixed?.toLocaleString() || '0'} Basic Salary
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveConfiguration(config.jobRole, config.experienceLevel);
                      }}
                      className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConfiguration(config._id, config.jobRole, config.experienceLevel);
                      }}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Basic Salary (₹)
                        </label>
                        <input
                          type="number"
                          value={formDataKey.basicSalaryFixed || ''}
                          onChange={(e) => handleInputChange(config.jobRole, config.experienceLevel, 'basicSalaryFixed', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Allowances (₹)
                        </label>
                        <input
                          type="number"
                          value={formDataKey.allowancesFixed || ''}
                          onChange={(e) => handleInputChange(config.jobRole, config.experienceLevel, 'allowancesFixed', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          EPF Rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={(formDataKey.employeeEpfRate * 100) || ''}
                          onChange={(e) => handleInputChange(config.jobRole, config.experienceLevel, 'employeeEpfRate', (parseFloat(e.target.value) || 0) / 100)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Professional Tax (₹)
                        </label>
                        <input
                          type="number"
                          value={formDataKey.professionalTax || ''}
                          onChange={(e) => handleInputChange(config.jobRole, config.experienceLevel, 'professionalTax', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Leave Threshold (days)
                        </label>
                        <input
                          type="number"
                          value={formDataKey.leaveThresholdDays || ''}
                          onChange={(e) => handleInputChange(config.jobRole, config.experienceLevel, 'leaveThresholdDays', parseInt(e.target.value) || 0)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Deductions (₹)
                        </label>
                        <input
                          type="number"
                          value={formDataKey.productDeductionsMonthly || ''}
                          onChange={(e) => handleInputChange(config.jobRole, config.experienceLevel, 'productDeductionsMonthly', parseFloat(e.target.value) || 0)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    
                    {/* Staff Members for this Role */}
                    {staffForRole.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Staff Members with this Role</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {staffForRole.map(staff => (
                            <div key={staff._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium">{staff.name}</span>
                              <span className="text-xs text-gray-500">
                                {staff.experience?.years || 0} years experience
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Configuration Details */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Configuration Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Job Role:</span>
                          <span className="font-medium">{config.jobRole}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Experience Level:</span>
                          <span className="font-medium">{config.experienceLevel}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Created:</span>
                          <span className="font-medium">
                            {new Date(config.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Updated:</span>
                          <span className="font-medium">
                            {new Date(config.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payroll configurations</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating payroll configurations for your staff roles.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowAddRoleForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add First Job Role
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollProcessingCard;