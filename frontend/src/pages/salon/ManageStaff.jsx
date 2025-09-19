
import React, { useState, useEffect } from 'react';
import { salonService } from '../../services/salon';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { User, Mail, Phone, Briefcase, CalendarDays, MapPin, BadgeCheck } from 'lucide-react';

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
                {staff.profilePicture ? (
                  <img src={staff.profilePicture} alt={staff.name} className="h-12 w-12 rounded-full object-cover mr-3 border" onError={(e)=>{e.currentTarget.style.display='none'}} />
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
                    <img src={staff.documents.governmentId} alt="Government ID" className="w-full max-h-40 object-contain rounded border" onError={(e)=>{e.currentTarget.style.display='none'}} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageStaff;
