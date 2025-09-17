
import React, { useState, useEffect } from 'react';
import { salonService } from '../../services/salon';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, Briefcase, CalendarDays, MapPin } from 'lucide-react';

const ManageStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await salonService.getSalonStaff();
        if (response.success) {
          setStaffList(response.data);
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
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Staff</h1>
      {staffList.length === 0 ? (
        <div className="text-center text-gray-500">No staff members found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffList.map((staff) => (
            <div key={staff._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <User className="h-8 w-8 text-indigo-600 mr-3" />
                <h2 className="text-xl font-semibold text-gray-800">{staff.name}</h2>
              </div>
              <div className="space-y-2 text-gray-600">
                <p className="flex items-center"><Mail className="h-4 w-4 mr-2" /> {staff.email}</p>
                {staff.contactNumber && <p className="flex items-center"><Phone className="h-4 w-4 mr-2" /> {staff.contactNumber}</p>}
                {staff.position && <p className="flex items-center"><Briefcase className="h-4 w-4 mr-2" /> {staff.position}</p>}
                {staff.employmentStatus && <p className="flex items-center"><CalendarDays className="h-4 w-4 mr-2" /> Status: {staff.employmentStatus}</p>}
                {staff.address && staff.address.city && (
                  <p className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> {staff.address.city}, {staff.address.state}</p>
                )}
                {staff.skills && staff.skills.length > 0 && (
                  <p className="text-sm">Skills: {staff.skills.join(', ')}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageStaff;
