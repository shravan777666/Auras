import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salonService } from '../../services/salon';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BackButton from '../../components/common/BackButton';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, Briefcase, CalendarDays, MapPin, BadgeCheck, Globe, ArrowRight, RefreshCw, UserPlus, DollarSign } from 'lucide-react';
import SalaryConfigurationModal from '../../components/salon/SalaryConfigurationModal';

const ManageStaff = () => {
  const navigate = useNavigate();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [previousStaffCount, setPreviousStaffCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await salonService.getSalonStaff();
        if (response.success) {
          // Check if a new staff member was added
          if (response.data.length > previousStaffCount && previousStaffCount > 0) {
            toast.success(`New staff member added to your team!`);
          }
          setStaffList(response.data);
          setPreviousStaffCount(response.data.length);
        } else {
          toast.error(response.message || 'Failed to fetch staff list.');
        }
      } catch (err) {
        setError('An error occurred while fetching staff data.');
        toast.error(err.response?.data?.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [refreshTrigger, previousStaffCount]);

  const handleManageSalary = (staff) => {
    setSelectedStaff(staff);
    setIsModalOpen(true);
  };

  const handleSaveSalary = async (staffId, salaryData) => {
    try {
      const response = await salonService.updateStaffSalary(staffId, salaryData);
      if (response.success) {
        toast.success('Salary information updated successfully');
        // Update the staff list with the new salary information
        setStaffList(prev => prev.map(staff => 
          staff._id === staffId ? { ...staff, ...salaryData } : staff
        ));
        setIsModalOpen(false);
      } else {
        toast.error(response.message || 'Failed to update salary information');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'An error occurred while updating salary');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      {/* Header with Global Staff Directory link */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <BackButton fallbackPath="/salon/dashboard" className="mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">Manage Staff</h1>
          <p className="text-gray-600 mt-1">Manage your salon's current staff members</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/salon/staff/new')}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Staff
          </button>
          <button
            onClick={() => setRefreshTrigger(prev => prev + 1)}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => navigate('/salon/global-staff')}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Globe className="h-4 w-4 mr-2" />
            Global Staff Directory
            <ArrowRight className="h-4 w-4 ml-2" />
          </button>
        </div>
      </div>

      {/* Info card about Global Staff Directory */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Globe className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Discover Talent Across the Platform
            </h3>
            <p className="text-sm text-blue-700">
              Browse all staff members registered on AuraCares to find talent for networking, hiring, or business expansion. 
              View their skills, experience, and current employment status while respecting privacy guidelines.
            </p>
          </div>
        </div>
      </div>
      {staffList.length === 0 ? (
        <div className="text-center text-gray-500">No staff members found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((staff) => (
            <div key={staff._id} className="bg-white rounded-lg shadow-md p-6 relative">
              {/* Manage Salary Button */}
              <button
                onClick={() => handleManageSalary(staff)}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                title="Manage Salary"
              >
                <DollarSign className="h-4 w-4" />
              </button>
              
              <div className="flex items-center mb-4">
                {staff.profilePicture ? (
                  <img 
                    src={staff.profilePicture.startsWith('http') ? staff.profilePicture : `${import.meta.env.VITE_API_URL || ''}${staff.profilePicture}`} 
                    alt={staff.name} 
                    className="h-12 w-12 rounded-full object-cover mr-3 border" 
                    onError={(e)=>{e.currentTarget.style.display='none'}} 
                  />
                ) : (
                  <User className="h-8 w-8 text-indigo-600 mr-3" />
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{staff.name}</h2>
                  <p className="text-xs text-gray-500">{staff.position || 'Staff'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 text-gray-700 text-sm">
                <p className="flex items-center"><Mail className="h-4 w-4 mr-2" /> {staff.email}</p>
                {staff.contactNumber && <p className="flex items-center"><Phone className="h-4 w-4 mr-2" /> {staff.contactNumber}</p>}
                {staff.employmentStatus && <p className="flex items-center"><BadgeCheck className="h-4 w-4 mr-2" /> {staff.employmentStatus}</p>}
                {staff.gender && <p className="flex items-center"><User className="h-4 w-4 mr-2" /> {staff.gender}{staff.dateOfBirth ? ` • ${new Date(staff.dateOfBirth).toLocaleDateString()}` : ''}</p>}
                {staff.address && (staff.address.city || staff.address.street) && (
                  <p className="flex items-center"><MapPin className="h-4 w-4 mr-2" />
                    {[staff.address.street, staff.address.city, staff.address.state, staff.address.postalCode].filter(Boolean).join(', ')}
                  </p>
                )}
                {staff.specialization && <p className="flex items-center"><Briefcase className="h-4 w-4 mr-2" /> {staff.specialization}</p>}
              </div>

              {(staff.skills?.length > 0 || staff.experience?.years || staff.experience?.description) && (
                <div className="mt-4 border-t pt-3">
                  {staff.skills?.length > 0 && (
                    <div className="mb-2">
                      <p className="font-medium text-gray-800 text-sm mb-1">Skills</p>
                      <div className="flex flex-wrap gap-2">
                        {staff.skills.map((s) => (
                          <span key={s} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(staff.experience?.years || staff.experience?.description) && (
                    <div className="text-sm text-gray-700">
                      {staff.experience?.years ? <p>Experience: {staff.experience.years} years</p> : null}
                      {staff.experience?.description ? <p>Description: {staff.experience.description}</p> : null}
                    </div>
                  )}
                </div>
              )}

              {staff.documents?.governmentId && (
                <div className="mt-4 border-t pt-3">
                  <p className="font-medium text-gray-800 text-sm mb-2">ID Proof</p>
                  {typeof staff.documents.governmentId === 'string' && staff.documents.governmentId.endsWith('.pdf') ? (
                    <a href={staff.documents.governmentId} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-sm">Open ID PDF</a>
                  ) : (
                    <img 
                      src={staff.documents.governmentId.startsWith('http') ? staff.documents.governmentId : `${import.meta.env.VITE_API_URL || ''}${staff.documents.governmentId}`} 
                      alt="Government ID" 
                      className="w-full max-h-40 object-contain rounded border" 
                      onError={(e)=>{e.currentTarget.style.display='none'}} 
                    />
                  )}
                </div>
              )}
              
              {/* Salary Information */}
              {(staff.baseSalary || staff.salaryType) && (
                <div className="mt-4 border-t pt-3">
                  <p className="font-medium text-gray-800 text-sm mb-1">Salary Information</p>
                  <div className="text-sm text-gray-700">
                    <p>Base: ₹{staff.baseSalary?.toLocaleString() || 'N/A'}</p>
                    <p>Type: {staff.salaryType || 'N/A'}</p>
                    {staff.salaryType === 'Commission' && staff.commissionRate && (
                      <p>Commission: {staff.commissionRate}%</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Salary Configuration Modal */}
      <SalaryConfigurationModal
        staff={selectedStaff}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSalary}
      />
    </div>
  );
};

export default ManageStaff;