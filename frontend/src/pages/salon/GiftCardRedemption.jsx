import React from 'react';
import { Box, Container } from '@mui/material';
import GiftCardRedemptionComponent from '../../components/salon/GiftCardRedemption';

const GiftCardRedemption = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <GiftCardRedemptionComponent />
    </Container>
  );
};

export default GiftCardRedemption;
