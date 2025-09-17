
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Alert,
} from '@mui/material';
import { adminService } from '../../services/admin';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ApprovedSalons = () => {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApprovedSalons = async () => {
      try {
        setLoading(true);
        // This service call fetches paginated, approved salons
        const response = await adminService.getAllSalons({ page: 1, limit: 50 }); // Fetch up to 50 for this view
        setSalons(response.data || []);
      } catch (err) {
        console.error('Error fetching approved salons:', err);
        setError('Failed to load approved salons. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedSalons();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Approved Salons
      </Typography>

      {salons.length === 0 ? (
        <Typography>No approved salons found.</Typography>
      ) : (
        <Grid container spacing={3}>
          {salons.map((salon) => (
            <Grid item xs={12} sm={6} md={4} key={salon._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {salon.salonName}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    <strong>Owner:</strong> {salon.ownerName}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    <strong>Contact:</strong> {salon.contactNumber || 'N/A'}
                  </Typography>
                  <Box mt={2}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Services:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {salon.services && salon.services.length > 0 ? (
                        salon.services.slice(0, 5).map((service) => (
                          <Chip key={service._id} label={service.name} size="small" />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No services listed.
                        </Typography>
                      )}
                      {salon.services && salon.services.length > 5 && (
                        <Chip label="..." size="small" />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ApprovedSalons;
