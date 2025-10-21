import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BackButton from '../../components/common/BackButton';

const ManageStaff = () => {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const getFileType = (url) => {
    if (!url) return 'unknown';
    const ext = url.split('.').pop().toLowerCase();
    if (['jpg','jpeg','png','gif','bmp','webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'unknown';
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const data = await adminService.getAllStaff({ page, limit });
        setStaff(data);
      } catch (e) {
        console.error('Failed to load staff:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [page, limit]);

  if (loading) return <LoadingSpinner text="Loading staff..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BackButton fallbackPath="/admin/dashboard" className="mr-4" />
          <h1 className="text-2xl font-bold text-gray-800">All Staff</h1>
        </div>
      </div>

      {staff.length === 0 ? (
        <div className="text-center text-gray-500">No staff found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((s) => {
            const profilePicture = s.profilePicture || s.profileImageUrl || null;
            const documents = {
              governmentId: s.documents?.governmentId || s.governmentId || null,
              certificates: Array.isArray(s.documents?.certificates) ? s.documents.certificates : (s.certifications || [])
            };
            return (
            <div key={s._id} className="bg-white rounded-xl border-2 border-gray-100 p-5 shadow-md hover:shadow-lg transition-all">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                  {profilePicture ? (
                    <img src={profilePicture} alt={s.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">👤</span>
                  )}
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-800">{s.name || 'Unknown'}</div>
                  <div className="text-sm text-blue-600">{s.email || 'N/A'}</div>
                  <div className="text-xs text-gray-500 capitalize">{s.role || 'staff'}</div>
                </div>
              </div>

              <div className="space-y-1 text-sm text-gray-700">
                <div><span className="font-medium">Phone:</span> {s.contactNumber || 'N/A'}</div>
                <div><span className="font-medium">Position:</span> {s.position || 'N/A'}</div>
                <div>
                  <span className="font-medium">Experience:</span>{' '}
                  {s.experience?.years ? `${s.experience.years} years` : 'N/A'}
                  {s.experience?.description ? ` - ${s.experience.description}` : ''}
                </div>
                <div>
                  <span className="font-medium">Skills:</span>{' '}
                  {Array.isArray(s.skills) ? s.skills.join(', ') : (s.skills || 'N/A')}
                </div>
                <div>
                  <span className="font-medium">Salon:</span> {s.assignedSalon?.salonName || 'Not assigned'}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Status:</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${s.approvalStatus === 'approved' ? 'bg-green-100 text-green-700' : s.approvalStatus === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {s.approvalStatus || 'pending'}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium text-gray-800 mb-2">Documents</div>
                <div className="grid grid-cols-2 gap-3">
                  {/* Profile */}
                  <div className="flex flex-col items-center">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Profile"
                        className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                        onClick={() => window.open(profilePicture, '_blank')}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-blue-50 rounded-lg flex items-center justify-center">🖼️</div>
                    )}
                    <span className="text-xs text-gray-600 mt-1">Profile</span>
                  </div>

                  {/* Government ID */}
                  <div className="flex flex-col items-center">
                    {documents.governmentId ? (
                      getFileType(documents.governmentId) === 'image' ? (
                        <img
                          src={documents.governmentId}
                          alt="Government ID"
                          className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => window.open(documents.governmentId, '_blank')}
                        />
                      ) : (
                        <div
                          className="w-20 h-20 bg-red-50 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80"
                          onClick={() => window.open(documents.governmentId, '_blank')}
                        >📄</div>
                      )
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">🆔</div>
                    )}
                    <span className="text-xs text-gray-600 mt-1">ID</span>
                  </div>

                  
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => { setSelectedStaff({ ...s, profilePicture, documents }); setShowDocumentModal(true); }}
                    className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    View All Documents
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
      {showDocumentModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Documents - {selectedStaff.name}</h2>
                <p className="text-gray-600 text-sm">Click images to view full size, PDFs open in a new tab</p>
              </div>
              <button
                onClick={() => setShowDocumentModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-semibold"
              >
                ✕
              </button>
            </div>

            {(() => {
              const profilePicture = selectedStaff.profilePicture || selectedStaff.profileImageUrl || null;
              const documents = {
                governmentId: selectedStaff.documents?.governmentId || selectedStaff.governmentId || null,
                certificates: selectedStaff.documents?.certificates || selectedStaff.certifications || []
              };

              return (
                <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profilePicture && (
                <div className="bg-white rounded-xl border-2 border-gray-100 p-4 shadow-md">
                  <h3 className="font-semibold text-gray-800 mb-3 text-center">Profile Picture</h3>
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-80"
                    onClick={() => window.open(profilePicture, '_blank')}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <button
                    onClick={() => window.open(profilePicture, '_blank')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
                  >
                    View Full Size
                  </button>
                </div>
              )}

              {documents?.governmentId && (
                <div className="bg-white rounded-xl border-2 border-gray-100 p-4 shadow-md">
                  <h3 className="font-semibold text-gray-800 mb-3 text-center">Government ID</h3>
                  {getFileType(documents.governmentId) === 'image' ? (
                    <img
                      src={documents.governmentId}
                      alt="Government ID"
                      className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-80"
                      onClick={() => window.open(documents.governmentId, '_blank')}
                    />
                  ) : (
                    <div className="w-full h-48 bg-red-50 rounded-lg flex flex-col items-center justify-center mb-3">
                      <div className="text-6xl mb-2">📄</div>
                      <span className="text-sm text-gray-600 font-medium">PDF Document</span>
                    </div>
                  )}
                  <button
                    onClick={() => window.open(documents.governmentId, '_blank')}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg"
                  >
                    {getFileType(documents.governmentId) === 'image' ? 'View Full Size' : 'Open PDF'}
                  </button>
                </div>
              )}

              {Array.isArray(documents?.certificates) && documents.certificates.map((cert, index) => (
                <div key={index} className="bg-white rounded-xl border-2 border-gray-100 p-4 shadow-md">
                  <h3 className="font-semibold text-gray-800 mb-3 text-center">Certificate {index + 1}</h3>
                  {getFileType(cert) === 'image' ? (
                    <img
                      src={cert}
                      alt={`Certificate ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg mb-3 cursor-pointer hover:opacity-80"
                      onClick={() => window.open(cert, '_blank')}
                    />
                  ) : (
                    <div className="w-full h-48 bg-green-50 rounded-lg flex flex-col items-center justify-center mb-3">
                      <div className="text-6xl mb-2">📄</div>
                      <span className="text-sm text-gray-600 font-medium">PDF Document</span>
                    </div>
                  )}
                  <button
                    onClick={() => window.open(cert, '_blank')}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg"
                  >
                    {getFileType(cert) === 'image' ? 'View Full Size' : 'Open PDF'}
                  </button>
                </div>
              ))}
            </div>

            {!profilePicture && !documents?.governmentId && !(documents?.certificates && documents.certificates.length) && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-8xl mb-4">📄</div>
                <p className="text-gray-500 text-xl font-medium">No documents uploaded</p>
                <p className="text-gray-400 text-sm mt-2">This staff member hasn't uploaded any documents yet</p>
              </div>
            )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStaff;
