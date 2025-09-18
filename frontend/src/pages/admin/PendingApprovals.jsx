import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip,
  Avatar,
  CardMedia,
  CardActions,
  Divider,
} from '@mui/material';
import { adminService } from '../../services/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  Building2 as BusinessIcon, 
  User as PersonIcon, 
  Mail as EmailIcon, 
  Phone as PhoneIcon,
  MapPin as LocationIcon,
  Briefcase as WorkIcon,
  Eye as VisibilityIcon
} from 'lucide-react';

const PendingApprovals = () => {
  const [pendingSalons, setPendingSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingSalons();
  }, []);

  const fetchPendingSalons = async () => {
    try {
      setLoading(true);
      console.log('=== FRONTEND: Fetching pending salons ===');
      const response = await adminService.getPendingSalons();
      console.log('=== FRONTEND: API Response ===', response);
      console.log('=== FRONTEND: Response.data ===', response.data);
      console.log('=== FRONTEND: Response.salons ===', response.salons);
      
      const salons = response.data?.salons || response.salons || [];
      console.log('=== FRONTEND: Extracted salons ===', salons);
      console.log('=== FRONTEND: Salons length ===', salons.length);
      
      setPendingSalons(salons);
    } catch (error) {
      console.error('Error fetching pending salons:', error);
      console.error('Error details:', error.response?.data);
      setPendingSalons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (salon) => {
    console.log('=== FRONTEND: Viewing salon details ===');
    console.log('Salon object:', salon);
    console.log('Documents:', salon.documents);
    console.log('Business License URL:', salon.documents?.businessLicense);
    console.log('Salon Images:', salon.documents?.salonImages);
    console.log('Salon Logo:', salon.documents?.salonLogo);
    setSelectedSalon(salon);
    setOpenDialog(true);
  };

  const handleApprove = async (salonId) => {
    try {
      setActionLoading(true);
      await adminService.approveSalon(salonId);
      await fetchPendingSalons();
      setOpenDialog(false);
      
      // Trigger a custom event to notify other components about the approval
      window.dispatchEvent(new CustomEvent('salonApproved', { 
        detail: { salonId, timestamp: Date.now() } 
      }));
    } catch (error) {
      console.error('Error approving salon:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (salonId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      setActionLoading(true);
      await adminService.rejectSalon(salonId, { reason: rejectionReason });
      await fetchPendingSalons();
      setOpenDialog(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting salon:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <Box className="max-w-7xl mx-auto">
        <Box className="mb-8 text-center">
          <Typography 
            variant="h3" 
            className="font-bold text-gray-800 mb-2"
            sx={{ 
              background: 'linear-gradient(45deg, #3B82F6, #8B5CF6)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Pending Salon Approvals
          </Typography>
          <Typography variant="h6" className="text-gray-600">
            Review and approve salon applications
          </Typography>
        </Box>

        {pendingSalons.length === 0 ? (
          <Box className="text-center py-12">
            <BusinessIcon size={64} className="text-gray-400 mb-2 mx-auto" />
            <Typography variant="h5" className="text-gray-500 mb-2">
              No Pending Approvals
            </Typography>
            <Typography className="text-gray-400">
              All salon applications have been reviewed
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {pendingSalons.map((salon) => (
              <Grid item xs={12} sm={6} lg={4} key={salon._id}>
                <Card 
                  className="h-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-2xl overflow-hidden border-0"
                  sx={{
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
                    '&:hover': {
                      boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  {/* Salon Logo Preview */}
                  {salon.documents?.salonLogo && (
                    <Box className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100">
                      <img
                        src={salon.documents.salonLogo}
                        alt={`${salon.salonName} Logo`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <Box className="absolute inset-0 bg-black bg-opacity-20" />
                      <Chip
                        label="PENDING"
                        className="absolute top-4 right-4 bg-orange-500 text-white font-semibold"
                        size="small"
                      />
                    </Box>
                  )}

                  <CardContent className="p-6">
                    <Box className="flex items-center mb-4">
                      <Avatar className="bg-gradient-to-r from-blue-500 to-purple-500 mr-3">
                        <BusinessIcon size={20} />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" className="font-bold text-gray-800">
                          {salon.salonName}
                        </Typography>
                        <Typography variant="body2" className="text-gray-500">
                          Salon Application
                        </Typography>
                      </Box>
                    </Box>

                    <Box className="space-y-3">
                      <Box className="flex items-center">
                        <PersonIcon className="text-gray-400 mr-2" size={16} />
                        <Typography variant="body2" className="text-gray-600">
                          <span className="font-medium">Owner:</span> {salon.ownerName}
                        </Typography>
                      </Box>
                      
                      <Box className="flex items-center">
                        <EmailIcon className="text-gray-400 mr-2" size={16} />
                        <Typography variant="body2" className="text-gray-600 truncate">
                          {salon.email}
                        </Typography>
                      </Box>
                      
                      <Box className="flex items-center">
                        <PhoneIcon className="text-gray-400 mr-2" size={16} />
                        <Typography variant="body2" className="text-gray-600">
                          {salon.contactNumber}
                        </Typography>
                      </Box>

                      {salon.salonAddress && (
                        <Box className="flex items-center">
                          <LocationIcon className="text-gray-400 mr-2" size={16} />
                          <Typography variant="body2" className="text-gray-600 truncate">
                            {typeof salon.salonAddress === 'string' 
                              ? salon.salonAddress 
                              : `${salon.salonAddress.city || ''}, ${salon.salonAddress.state || ''}`.replace(/^,\s*|,\s*$/g, '')
                            }
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {/* Image Count Indicator */}
                    <Box className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <Box className="flex items-center justify-between">
                        <Typography variant="body2" className="text-gray-600 font-medium">
                          Uploaded Documents:
                        </Typography>
                        <Box className="flex space-x-1">
                          {salon.documents?.salonLogo && (
                            <Chip label="Logo" size="small" color="primary" variant="outlined" />
                          )}
                          {salon.documents?.salonImages?.length > 0 && (
                            <Chip 
                              label={`${salon.documents.salonImages.length} Images`} 
                              size="small" 
                              color="secondary" 
                              variant="outlined" 
                            />
                          )}
                          {salon.documents?.businessLicense && (
                            <Chip label="License" size="small" color="success" variant="outlined" />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>

                  <CardActions className="p-6 pt-0">
                    <Button
                      variant="contained"
                      onClick={() => handleViewDetails(salon)}
                      fullWidth
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      startIcon={<VisibilityIcon size={20} />}
                    >
                      View Details & Approve
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Close page container */}
      </Box>

      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setRejectionReason('');
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)'
          }
        }}
      >
        {selectedSalon && (
          <>
            <DialogTitle className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6">
              <Box className="flex items-center">
                <Avatar className="bg-white text-blue-500 mr-3">
                  <BusinessIcon size={24} />
                </Avatar>
                <Box>
                  <Typography variant="h5" className="font-bold text-white">
                    {selectedSalon.salonName} - Application Details
                  </Typography>
                  <Typography variant="body2" className="text-blue-100">
                    Review salon documents and approve application
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            
            <DialogContent className="p-6">
              {/* Basic Information Section */}
              <Box className="mb-8">
                <Typography variant="h6" className="font-bold text-gray-800 mb-4 flex items-center">
                  <PersonIcon className="mr-2 text-blue-500" size={20} />
                  Basic Information
                </Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                    <Box className="space-y-3">
                      <Box className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <PersonIcon className="text-gray-400 mr-3" size={20} />
                        <Box>
                          <Typography variant="body2" className="text-gray-500">Owner Name</Typography>
                          <Typography variant="body1" className="font-medium">{selectedSalon.ownerName}</Typography>
                        </Box>
                      </Box>
                      <Box className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <EmailIcon className="text-gray-400 mr-3" size={20} />
                        <Box>
                          <Typography variant="body2" className="text-gray-500">Email</Typography>
                          <Typography variant="body1" className="font-medium">{selectedSalon.email}</Typography>
                        </Box>
                      </Box>
                      <Box className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <PhoneIcon className="text-gray-400 mr-3" size={20} />
                        <Box>
                          <Typography variant="body2" className="text-gray-500">Contact</Typography>
                          <Typography variant="body1" className="font-medium">{selectedSalon.contactNumber}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box className="space-y-3">
                      <Box className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <LocationIcon className="text-gray-400 mr-3" size={20} />
                        <Box>
                          <Typography variant="body2" className="text-gray-500">Salon Address</Typography>
                          <Typography variant="body1" className="font-medium">
                            {selectedSalon.salonAddress ? (
                              typeof selectedSalon.salonAddress === 'string' 
                                ? selectedSalon.salonAddress 
                                : `${selectedSalon.salonAddress.street || ''}, ${selectedSalon.salonAddress.city || ''}, ${selectedSalon.salonAddress.state || ''} ${selectedSalon.salonAddress.postalCode || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
                            ) : 'Not provided'}
                          </Typography>
                        </Box>
                      </Box>
                      {selectedSalon.businessHours && (
                        <Box className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <WorkIcon className="text-gray-400 mr-3" size={20} />
                          <Box>
                            <Typography variant="body2" className="text-gray-500">Business Hours</Typography>
                            <Typography variant="body1" className="font-medium">
                              {selectedSalon.businessHours.openTime} - {selectedSalon.businessHours.closeTime}
                            </Typography>
                            <Typography variant="body2" className="text-gray-500 text-sm">
                              {selectedSalon.businessHours.workingDays?.join(', ') || 'Not specified'}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>

                {/* Description Section */}
                {selectedSalon.description && (
                  <Box className="mt-6">
                    <Typography variant="h6" className="font-bold text-gray-800 mb-3 flex items-center">
                      <BusinessIcon className="mr-2 text-blue-500" size={20} />
                      Salon Description
                    </Typography>
                    <Box className="p-4 bg-gray-50 rounded-lg">
                      <Typography variant="body1" className="text-gray-700 leading-relaxed">
                        {selectedSalon.description}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              <Divider className="my-6" />

              {/* Documents Section */}
              <Box className="mb-8">
                <Typography variant="h6" className="font-bold text-gray-800 mb-4 flex items-center">
                  <BusinessIcon className="mr-2 text-purple-500" size={20} />
                  Salon Documents & Images
                </Typography>

                {/* Business License */}
                {selectedSalon.documents?.businessLicense ? (
                  <Box className="mb-6">
                    <Typography variant="subtitle1" className="font-medium text-gray-700 mb-3">
                      Business License
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => window.open(selectedSalon.documents.businessLicense, '_blank')}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      View Business License PDF
                    </Button>
                  </Box>
                ) : (
                  <Box className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Typography className="text-yellow-700 font-medium">
                      ⚠️ No business license uploaded
                    </Typography>
                  </Box>
                )}

                {/* Salon Logo */}
                {selectedSalon.documents?.salonLogo && (
                  <Box className="mb-6">
                    <Typography variant="subtitle1" className="font-medium text-gray-700 mb-3">
                      Salon Logo
                    </Typography>
                    <Box className="relative group">
                      <img
                        src={selectedSalon.documents.salonLogo}
                        alt="Salon Logo"
                        className="w-full max-w-md h-64 object-contain bg-white rounded-2xl shadow-lg border-4 border-gray-100 hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <Box 
                        className="hidden w-full max-w-md h-64 bg-gray-100 rounded-2xl shadow-lg border-4 border-gray-200 items-center justify-center"
                      >
                        <Typography color="error" className="text-center">
                          Failed to load salon logo
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )}

                {/* Salon Images Gallery */}
                {selectedSalon.documents?.salonImages && selectedSalon.documents.salonImages.length > 0 ? (
                  <Box className="mb-6">
                    <Typography variant="subtitle1" className="font-medium text-gray-700 mb-3">
                      Salon Images ({selectedSalon.documents.salonImages.length})
                    </Typography>
                    <Grid container spacing={3}>
                      {selectedSalon.documents.salonImages.map((image, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Box className="relative group">
                            <img
                              src={image}
                              alt={`Salon Image ${index + 1}`}
                              className="w-full h-48 object-cover bg-white rounded-2xl shadow-lg border-4 border-gray-100 hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <Box 
                              className="hidden w-full h-48 bg-gray-100 rounded-2xl shadow-lg border-4 border-gray-200 items-center justify-center"
                            >
                              <Typography color="error" className="text-center">
                                Failed to load image {index + 1}
                              </Typography>
                            </Box>
                            <Box className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs font-medium">
                              {index + 1}
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ) : (
                  <Box className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Typography className="text-yellow-700 font-medium">
                      ⚠️ No salon images uploaded
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider className="my-6" />

              {/* Rejection Reason */}
              <Box className="mb-6">
                <Typography variant="h6" className="font-bold text-gray-800 mb-3">
                  Rejection Reason (if rejecting)
                </Typography>
                <TextField
                  label="Please provide a reason for rejection"
                  multiline
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  fullWidth
                  className="bg-white rounded-xl"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': {
                        borderColor: '#3B82F6',
                      },
                    },
                  }}
                />
              </Box>
            </DialogContent>
            
            <DialogActions className="p-6 bg-gray-50">
              <Box className="flex w-full justify-between">
                <Button
                  onClick={() => setOpenDialog(false)}
                  variant="outlined"
                  disabled={actionLoading}
                  className="px-6 py-3 rounded-xl font-semibold"
                >
                  Close
                </Button>
                <Box className="flex space-x-3">
                  <Button
                    onClick={() => handleReject(selectedSalon._id)}
                    variant="contained"
                    color="error"
                    disabled={actionLoading || !rejectionReason.trim()}
                    className="px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Reject Application'}
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedSalon._id)}
                    variant="contained"
                    color="primary"
                    disabled={actionLoading}
                    className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {actionLoading ? <CircularProgress size={24} color="inherit" /> : 'Approve Application'}
                  </Button>
                </Box>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PendingApprovals;
