import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  Pagination,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Modal,
  CardMedia,
  IconButton
} from '@mui/material';
import { adminService } from '../../services/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BackButton from '../../components/common/BackButton';

const ManageSalons = () => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Utility function to get file type
  const getFileType = (filename) => {
    if (!filename) return 'unknown';
    const extension = filename.toLowerCase().split('.').pop();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    }
    return 'unknown';
  };

  // Document Card Component
  const DocumentCard = ({ document, label }) => {
    const fileType = getFileType(document);
    const [imageError, setImageError] = useState(false);

    const handleImageClick = () => {
      setSelectedImage(document);
      setImageModalOpen(true);
    };

    const handleImageError = () => {
      setImageError(true);
    };

    if (fileType === 'image') {
      return (
        <Card sx={{ maxWidth: 200, cursor: 'pointer' }} onClick={handleImageClick}>
          <CardContent sx={{ p: 1 }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {label}
            </Typography>
            {imageError ? (
              <Box
                sx={{
                  height: 120,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: 1
                }}
              >
                <Box textAlign="center">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'grey.300',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      color: 'grey.600',
                      mx: 'auto'
                    }}
                  >
                    📷
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Image not available
                  </Typography>
                </Box>
              </Box>
            ) : (
              <CardMedia
                component="img"
                sx={{
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 1
                }}
                image={document.startsWith('http') ? document : `${import.meta.env.VITE_API_URL || ''}${document}`}
                alt={label}
                onError={handleImageError}
              />
            )}
          </CardContent>
        </Card>
      );
    } else if (fileType === 'pdf') {
      return (
        <Card sx={{ maxWidth: 200 }}>
          <CardContent sx={{ p: 1, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {label}
            </Typography>
            <Box
              sx={{
                height: 120,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px dashed #ccc'
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: 'white',
                  mb: 1,
                  mx: 'auto'
                }}
              >
                📄
              </Box>
              <Button
                size="small"
                variant="outlined"
                onClick={() => window.open(document, '_blank')}
              >
                View PDF
              </Button>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card sx={{ maxWidth: 200 }}>
        <CardContent sx={{ p: 1, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {label}
          </Typography>
          <Box
            sx={{
              height: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'grey.100',
              borderRadius: 1
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Unknown file type
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    fetchSalons();
  }, [page, search]);

  const fetchSalons = async () => {
    try {
      setLoading(true);
      console.log('=== MANAGE SALONS: Fetching approved salons ===');
      const response = await adminService.getAllSalons({ page, search, limit: 10 });
      console.log('=== MANAGE SALONS: API Response ===', response);
      console.log('=== MANAGE SALONS: Response.data ===', response.data);
      
      // Fix data parsing - the API returns paginated response with data.data structure
      const salonsData = response.data?.data || response.data || [];
      const metaData = response.data?.meta || response.meta || {};
      
      console.log('=== MANAGE SALONS: Extracted salons ===', salonsData);
      console.log('=== MANAGE SALONS: Meta data ===', metaData);
      
      setSalons(salonsData);
      setTotalPages(metaData.totalPages || 1);
    } catch (error) {
      console.error('Error fetching salons:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (salonId, isActive) => {
    try {
      await adminService.updateSalonStatus(salonId, { isActive: !isActive });
      fetchSalons();
    } catch (error) {
      console.error('Error updating salon status:', error);
    }
  };

  const handleDeleteSalon = async (salonId) => {
    if (window.confirm('Are you sure you want to delete this salon?')) {
      try {
        await adminService.deleteSalon(salonId);
        fetchSalons();
      } catch (error) {
        console.error('Error deleting salon:', error);
      }
    }
  };

  const handleViewDetails = (salon) => {
    setSelectedSalon(salon);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedSalon(null);
    setOpenDialog(false);
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
    setImageModalOpen(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" mb={2}>
        <BackButton fallbackPath="/admin/dashboard" />
        <Typography variant="h4" gutterBottom ml={2}>
          Manage Salons
        </Typography>
      </Box>

      <Box mb={3}>
        <TextField
          label="Search Salons"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
      </Box>

      {salons.length === 0 ? (
        <Typography>No approved salons found.</Typography>
      ) : (
        <Grid container spacing={3}>
          {salons.map((salon) => (
            <Grid item xs={12} md={6} lg={4} key={salon._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {salon.salonName}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    <strong>Owner:</strong> {salon.ownerName}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    <strong>Email:</strong> {salon.email}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    <strong>Contact:</strong> {salon.contactNumber || 'N/A'}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    <strong>Staff:</strong> {salon.staff?.length || 0} members
                  </Typography>
                  
                  <Box mt={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Services:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {salon.services && salon.services.length > 0 ? (
                        salon.services.slice(0, 3).map((service) => (
                          <Chip 
                            key={service._id} 
                            label={service.name} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No services listed
                        </Typography>
                      )}
                      {salon.services && salon.services.length > 3 && (
                        <Chip label={`+${salon.services.length - 3} more`} size="small" />
                      )}
                    </Box>
                  </Box>

                  <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Chip 
                      label={salon.isActive ? "Active" : "Inactive"} 
                      color={salon.isActive ? "success" : "default"}
                      size="small"
                    />
                    <Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewDetails(salon)}
                        sx={{ mr: 1 }}
                      >
                        View Details
                      </Button>
                      <Switch
                        checked={salon.isActive}
                        onChange={() => handleStatusChange(salon._id, salon.isActive)}
                        size="small"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box mt={2} display="flex" justifyContent="center">
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
        />
      </Box>

      {/* Salon Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedSalon && (
          <>
            <DialogTitle>{selectedSalon.salonName} - Details</DialogTitle>
            <DialogContent>
              <Box mb={3}>
                <Typography variant="h6">Basic Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography><strong>Owner Name:</strong> {selectedSalon.ownerName}</Typography>
                    <Typography><strong>Email:</strong> {selectedSalon.email}</Typography>
                    <Typography><strong>Contact:</strong> {selectedSalon.contactNumber || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>Status:</strong> {selectedSalon.approvalStatus}</Typography>
                    <Typography><strong>Verified:</strong> {selectedSalon.isVerified ? 'Yes' : 'No'}</Typography>
                    <Typography><strong>Active:</strong> {selectedSalon.isActive ? 'Yes' : 'No'}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {selectedSalon.salonAddress && (
                <Box mb={3}>
                  <Typography variant="h6">Address</Typography>
                  <Typography>
                    {typeof selectedSalon.salonAddress === 'string' 
                      ? selectedSalon.salonAddress 
                      : `${selectedSalon.salonAddress.street}, ${selectedSalon.salonAddress.city}, ${selectedSalon.salonAddress.state} ${selectedSalon.salonAddress.postalCode}`
                    }
                  </Typography>
                </Box>
              )}

              {selectedSalon.businessHours && (
                <Box mb={3}>
                  <Typography variant="h6">Business Hours</Typography>
                  <Typography>
                    {selectedSalon.businessHours.openTime} - {selectedSalon.businessHours.closeTime}
                  </Typography>
                  <Typography>
                    Working Days: {selectedSalon.businessHours.workingDays?.join(', ') || 'Not specified'}
                  </Typography>
                </Box>
              )}

              {selectedSalon.description && (
                <Box mb={3}>
                  <Typography variant="h6">Description</Typography>
                  <Typography>{selectedSalon.description}</Typography>
                </Box>
              )}

              <Box mb={3}>
                <Typography variant="h6">Staff ({selectedSalon.staff?.length || 0})</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {selectedSalon.staff && selectedSalon.staff.length > 0 ? (
                    selectedSalon.staff.map((staff) => (
                      <Chip 
                        key={staff._id} 
                        label={`${staff.name} (${staff.employmentStatus})`} 
                        size="small" 
                        color="secondary"
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No staff assigned
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box mb={3}>
                <Typography variant="h6">Services ({selectedSalon.services?.length || 0})</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {selectedSalon.services && selectedSalon.services.length > 0 ? (
                    selectedSalon.services.map((service) => (
                      <Chip 
                        key={service._id} 
                        label={`${service.name} - ₹${service.price}`} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No services listed
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Documents Section */}
              {selectedSalon.documents && Object.keys(selectedSalon.documents).length > 0 && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>Documents & Images</Typography>
                  <Grid container spacing={2}>
                    {selectedSalon.documents.businessLicense && (
                      <Grid item>
                        <DocumentCard 
                          document={selectedSalon.documents.businessLicense} 
                          label="Business License"
                        />
                      </Grid>
                    )}
                    {selectedSalon.documents.salonImages && selectedSalon.documents.salonImages.length > 0 && 
                      selectedSalon.documents.salonImages.map((image, index) => (
                        <Grid item key={index}>
                          <DocumentCard 
                            document={image} 
                            label={`Salon Image ${index + 1}`}
                          />
                        </Grid>
                      ))
                    }
                    {selectedSalon.documents.salonLogo && (
                      <Grid item>
                        <DocumentCard 
                          document={selectedSalon.documents.salonLogo} 
                          label="Salon Logo"
                        />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} color="inherit">
                Close
              </Button>
              <Button
                onClick={() => handleDeleteSalon(selectedSalon._id)}
                color="error"
                variant="contained"
              >
                Delete Salon
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Full Screen Image Modal */}
      <Modal
        open={imageModalOpen}
        onClose={handleCloseImageModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Box
          sx={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            bgcolor: 'background.paper',
            boxShadow: 24,
            borderRadius: 2,
            outline: 'none'
          }}
        >
          <IconButton
            onClick={handleCloseImageModal}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              zIndex: 1,
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: 'grey.800',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: 'white'
              }}
            >
              ×
            </Box>
          </IconButton>
          {selectedImage && (
            <img
              src={selectedImage.startsWith('http') ? selectedImage : `${import.meta.env.VITE_API_URL || ''}${selectedImage}`}
              alt="Full size view"
              style={{
                maxWidth: '100%',
                maxHeight: '90vh',
                objectFit: 'contain',
                display: 'block'
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default ManageSalons;