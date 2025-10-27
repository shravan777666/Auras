import React from 'react';
import { User, Mail, Phone, MapPin, Calendar, Award, CheckCircle, XCircle, Clock } from 'lucide-react';

const StaffDetailsCard = ({ staffDetails }) => {
  if (!Array.isArray(staffDetails) || staffDetails.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <User className="h-12 w-12 mx-auto mb-4" />
          <p>{!Array.isArray(staffDetails) ? 'Error loading staff details.' : 'No staff members found.'}</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmploymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'on-leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <User className="h-6 w-6 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Staff Details</h3>
        <span className="ml-auto text-sm text-gray-500">
          {staffDetails.length} member{staffDetails.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staffDetails.map((staff) => (
          <div key={staff._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            {/* Profile Section */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                {staff.profilePicture ? (
                  <img
                    src={staff.profilePicture.startsWith('http') ? staff.profilePicture : `${import.meta.env.VITE_API_URL || ''}${staff.profilePicture}`}
                    alt={staff.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-indigo-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{staff.name}</h4>
                <p className="text-sm text-gray-600 truncate">{staff.position || 'No position'}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(staff.approvalStatus)}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(staff.approvalStatus)}`}>
                    {staff.approvalStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2 mb-4">
              {staff.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{staff.email}</span>
                </div>
              )}
              {staff.contactNumber && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{staff.contactNumber}</span>
                </div>
              )}
              {staff.address && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="truncate">{staff.address}</span>
                </div>
              )}
            </div>

            {/* Skills */}
            {staff.skills && staff.skills.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Skills</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {staff.skills.slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                  {staff.skills.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{staff.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Status Information */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEmploymentStatusColor(staff.employmentStatus)}`}>
                  {staff.employmentStatus}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>
                  {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Experience */}
            {staff.experience && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Experience:</span> {typeof staff.experience === 'object' ? JSON.stringify(staff.experience) : staff.experience}
                </div>
              </div>
            )}

            {/* Specialization */}
            {staff.specialization && (
              <div className="mt-2">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Specialization:</span> {typeof staff.specialization === 'object' ? JSON.stringify(staff.specialization) : staff.specialization}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {staffDetails.filter(s => s.approvalStatus?.toLowerCase() === 'approved').length}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {staffDetails.filter(s => s.approvalStatus?.toLowerCase() === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {staffDetails.filter(s => s.employmentStatus?.toLowerCase() === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">
              {staffDetails.length}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDetailsCard;

