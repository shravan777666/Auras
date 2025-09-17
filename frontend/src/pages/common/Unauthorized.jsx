import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';

const Unauthorized = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
      }}
    >
      <Typography variant="h1" component="h1" gutterBottom>
        403
      </Typography>
      <Typography variant="h4" component="h2" gutterBottom>
        Unauthorized
      </Typography>
      <Typography variant="body1" gutterBottom>
        You do not have permission to access this page.
      </Typography>
      <Button component={Link} to="/" variant="contained" color="primary" sx={{ mt: 2 }}>
        Go to Homepage
      </Button>
    </Box>
  );
};

export default Unauthorized;
