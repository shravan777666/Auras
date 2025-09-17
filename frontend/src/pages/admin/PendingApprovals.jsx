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
} from '@mui/material';
import { adminService } from '../../services/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Pending Salon Approvals
      </Typography>

      {pendingSalons.length === 0 ? (
        <Typography>No pending approvals</Typography>
      ) : (
        <Grid container spacing={3}>
          {pendingSalons.map((salon) => (
            <Grid item xs={12} md={6} lg={4} key={salon._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6">{salon.salonName}</Typography>
                  <Typography color="textSecondary">Owner: {salon.ownerName}</Typography>
                  <Typography color="textSecondary">Email: {salon.email}</Typography>
                  <Typography color="textSecondary">Contact: {salon.contactNumber}</Typography>
                  <Box mt={2}>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => handleViewDetails(salon)}
                      fullWidth
                    >
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setRejectionReason('');
        }}
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
                    <Typography><strong>Contact:</strong> {selectedSalon.contactNumber}</Typography>
                    <Typography><strong>Address:</strong> {selectedSalon.address}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography><strong>License Number:</strong> {selectedSalon.licenseNumber}</Typography>
                    <Typography><strong>Experience:</strong> {selectedSalon.experience} years</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Box mb={3}>
                <Typography variant="h6">Documents</Typography>
                <Grid container spacing={2}>
                  {selectedSalon.documents?.businessLicense ? (
                    <Grid item xs={12}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => window.open(selectedSalon.documents.businessLicense, '_blank')}
                      >
                        View Business License
                      </Button>
                    </Grid>
                  ) : (
                    <Grid item xs={12}>
                      <Typography color="textSecondary">No business license uploaded</Typography>
                    </Grid>
                  )}
                  
                  {selectedSalon.documents?.salonLogo && (
                    <Grid item xs={6} md={4}>
                      <Typography variant="subtitle2" gutterBottom>
                        Salon Logo:
                      </Typography>
                      <img
                        src={selectedSalon.documents.salonLogo}
                        alt="Salon Logo"
                        style={{ width: '100%', height: 'auto', maxHeight: '150px', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <Typography 
                        color="error" 
                        variant="caption" 
                        style={{ display: 'none' }}
                      >
                        Failed to load image
                      </Typography>
                    </Grid>
                  )}
                  
                  {selectedSalon.documents?.salonImages && selectedSalon.documents.salonImages.length > 0 ? (
                    selectedSalon.documents.salonImages.map((image, index) => (
                      <Grid item xs={6} md={4} key={index}>
                        <Typography variant="subtitle2" gutterBottom>
                          Salon Image {index + 1}:
                        </Typography>
                        <img
                          src={image}
                          alt={`Salon Image ${index + 1}`}
                          style={{ width: '100%', height: 'auto', maxHeight: '150px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <Typography 
                          color="error" 
                          variant="caption" 
                          style={{ display: 'none' }}
                        >
                          Failed to load image
                        </Typography>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Typography color="textSecondary">No salon images uploaded</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Box mb={3}>
                <TextField
                  label="Rejection Reason"
                  multiline
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  fullWidth
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setOpenDialog(false)}
                color="inherit"
                disabled={actionLoading}
              >
                Close
              </Button>
              <Button
                onClick={() => handleReject(selectedSalon._id)}
                color="error"
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Reject'}
              </Button>
              <Button
                onClick={() => handleApprove(selectedSalon._id)}
                color="primary"
                variant="contained"
                disabled={actionLoading}
              >
                {actionLoading ? <CircularProgress size={24} /> : 'Approve'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PendingApprovals;
