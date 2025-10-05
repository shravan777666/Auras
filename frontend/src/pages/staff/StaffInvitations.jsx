import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { staffInvitationService } from '../../services/staffInvitation';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { UserPlus, Calendar, DollarSign, Check, X } from 'lucide-react';

const StaffInvitations = () => {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const data = await staffInvitationService.getPendingInvitations();
      setInvitations(data);
    } catch (error) {
      toast.error('Error fetching invitations: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId) => {
    setResponding(invitationId);
    try {
      await staffInvitationService.acceptInvitation(invitationId);
      toast.success('Invitation accepted successfully!');
      // Refresh the list
      fetchInvitations();
      // Redirect to staff dashboard after a short delay
      setTimeout(() => {
        navigate('/staff/dashboard');
      }, 2000);
    } catch (error) {
      toast.error('Error accepting invitation: ' + (error.response?.data?.message || error.message));
    } finally {
      setResponding(null);
    }
  };

  const handleDecline = async (invitationId) => {
    setResponding(invitationId);
    try {
      await staffInvitationService.declineInvitation(invitationId);
      toast.success('Invitation declined');
      // Refresh the list
      fetchInvitations();
    } catch (error) {
      toast.error('Error declining invitation: ' + (error.response?.data?.message || error.message));
    } finally {
      setResponding(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Staff Invitations</h1>
      
      {invitations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Invitations</h3>
          <p className="text-gray-500">
            You don't have any pending invitations at this time.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invitations.map((invitation) => (
            <div key={invitation._id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{invitation.salon?.name || 'Salon'}</h3>
                    <p className="text-sm text-gray-500">Invitation</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Position:</span>
                    <span className="ml-2 font-medium">{invitation.position}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Start Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(invitation.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {invitation.commission > 0 && (
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Commission:</span>
                      <span className="ml-2 font-medium">{invitation.commission}%</span>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAccept(invitation._id)}
                    disabled={responding === invitation._id}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {responding === invitation._id ? (
                      <LoadingSpinner className="h-4 w-4" />
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDecline(invitation._id)}
                    disabled={responding === invitation._id}
                    className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {responding === invitation._id ? (
                      <LoadingSpinner className="h-4 w-4" />
                    ) : (
                      <>
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffInvitations;