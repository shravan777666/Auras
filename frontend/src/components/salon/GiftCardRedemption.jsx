import React, { useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  CircularProgress,
  Divider,
  Grid,
  Chip,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import { 
  CardGiftcard as GiftCardIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Search as SearchIcon,
  Redeem as RedeemIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import giftCardService from '../../services/giftCardService';

const GiftCardRedemption = () => {
  const [code, setCode] = useState('');
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redemptionAmount, setRedemptionAmount] = useState('');
  const [redemptionNotes, setRedemptionNotes] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('Please enter a gift card code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setVerificationData(null);

    try {
      const response = await giftCardService.verifyGiftCardByCode(code.trim());
      
      if (response.success) {
        setVerificationData(response.data);
        setSuccess(response.message);
        // Set default redemption amount to full balance
        setRedemptionAmount(response.data.balance.toString());
      } else {
        setError(response.message || 'Failed to verify gift card');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify gift card');
      setVerificationData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!verificationData) {
      setError('Please verify a gift card first');
      return;
    }

    const amount = parseFloat(redemptionAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid redemption amount');
      return;
    }

    if (amount > verificationData.balance) {
      setError(`Amount exceeds available balance of ₹${verificationData.balance}`);
      return;
    }

    setRedeeming(true);
    setError('');
    setSuccess('');

    try {
      const response = await giftCardService.redeemGiftCardByCode(
        code.trim(),
        amount,
        redemptionNotes.trim() || null
      );

      if (response.success) {
        setSuccess(response.message);
        // Update verification data with new balance
        setVerificationData({
          ...verificationData,
          balance: response.data.remainingBalance,
          status: response.data.status,
          isRedeemed: response.data.isFullyRedeemed,
          redemptionCount: response.data.redemptionCount
        });
        
        // Clear redemption form if fully redeemed
        if (response.data.isFullyRedeemed) {
          setTimeout(() => {
            handleReset();
          }, 3000);
        } else {
          // Update amount to remaining balance
          setRedemptionAmount(response.data.remainingBalance.toString());
          setRedemptionNotes('');
        }
      } else {
        setError(response.message || 'Failed to redeem gift card');
      }
    } catch (err) {
      setError(err.message || 'Failed to redeem gift card');
    } finally {
      setRedeeming(false);
    }
  };

  const handleReset = () => {
    setCode('');
    setVerificationData(null);
    setError('');
    setSuccess('');
    setRedemptionAmount('');
    setRedemptionNotes('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusChip = (status, isValid) => {
    if (isValid) {
      return <Chip label="Valid" color="success" size="small" icon={<CheckCircleIcon />} />;
    } else if (status === 'EXPIRED') {
      return <Chip label="Expired" color="error" size="small" icon={<ErrorIcon />} />;
    } else if (status === 'REDEEMED') {
      return <Chip label="Fully Redeemed" color="default" size="small" />;
    } else {
      return <Chip label="Invalid" color="warning" size="small" />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <GiftCardIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Typography variant="h5" component="h2">
              Gift Card Verification & Redemption
            </Typography>
          </Box>

          {/* Search Section */}
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
              Enter Gift Card Code
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <TextField
                fullWidth
                placeholder="e.g., AURA-1A2B3C"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleVerify();
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: code && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setCode('')}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Button
                variant="contained"
                onClick={handleVerify}
                disabled={loading || !code.trim()}
                startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                sx={{ minWidth: 120 }}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </Box>
          </Paper>

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* Verification Results */}
          {verificationData && (
            <>
              <Divider sx={{ my: 3 }} />
              
              <Paper elevation={2} sx={{ p: 3, mb: 3, borderLeft: 4, borderColor: verificationData.isValid ? 'success.main' : 'error.main' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    {verificationData.name}
                  </Typography>
                  {getStatusChip(verificationData.status, verificationData.isValid)}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Code
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {verificationData.code}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Original Amount
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      ₹{verificationData.amount.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Current Balance
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600, 
                        color: verificationData.balance > 0 ? 'success.main' : 'error.main'
                      }}
                    >
                      ₹{verificationData.balance.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Expiry Date
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600,
                        color: verificationData.isExpired ? 'error.main' : 'inherit'
                      }}
                    >
                      {formatDate(verificationData.expiryDate)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Usage Type
                    </Typography>
                    <Typography variant="body2">
                      {verificationData.usageType.replace(/_/g, ' ')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="caption" color="text.secondary">
                      Times Used
                    </Typography>
                    <Typography variant="body2">
                      {verificationData.redemptionCount}
                    </Typography>
                  </Grid>
                  {verificationData.recipientEmail && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Recipient
                      </Typography>
                      <Typography variant="body2">
                        {verificationData.recipientEmail}
                      </Typography>
                    </Grid>
                  )}
                  {verificationData.personalMessage && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Personal Message
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                        "{verificationData.personalMessage}"
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Paper>

              {/* Redemption Section */}
              {verificationData.isValid && verificationData.balance > 0 && (
                <Paper elevation={0} sx={{ p: 3, bgcolor: 'primary.50', border: 1, borderColor: 'primary.main' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <RedeemIcon sx={{ mr: 1 }} />
                    Redeem Gift Card
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Redemption Amount"
                        type="number"
                        value={redemptionAmount}
                        onChange={(e) => setRedemptionAmount(e.target.value)}
                        disabled={redeeming}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        inputProps={{
                          min: 0.01,
                          max: verificationData.balance,
                          step: 0.01
                        }}
                        helperText={`Max: ₹${verificationData.balance.toFixed(2)}`}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Notes (Optional)"
                        value={redemptionNotes}
                        onChange={(e) => setRedemptionNotes(e.target.value)}
                        disabled={redeeming}
                        placeholder="Service details, appointment ID, etc."
                        inputProps={{ maxLength: 500 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <Button
                          variant="outlined"
                          onClick={handleReset}
                          disabled={redeeming}
                        >
                          Reset
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleRedeem}
                          disabled={redeeming || !redemptionAmount}
                          startIcon={redeeming ? <CircularProgress size={20} /> : <RedeemIcon />}
                        >
                          {redeeming ? 'Redeeming...' : 'Redeem'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {!verificationData.isValid && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  This gift card cannot be redeemed. 
                  {verificationData.isExpired && ' It has expired.'}
                  {verificationData.balance <= 0 && ' It has no remaining balance.'}
                  {verificationData.status === 'INACTIVE' && ' It is currently inactive.'}
                </Alert>
              )}
            </>
          )}

          {/* Help Text */}
          {!verificationData && !loading && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                💡 <strong>How to use:</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 3, mt: 1 }}>
                1. Enter the gift card code provided by the customer<br />
                2. Click "Verify" to check the card's validity and balance<br />
                3. Enter the redemption amount (or use full balance)<br />
                4. Add optional notes for record keeping<br />
                5. Click "Redeem" to complete the transaction
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default GiftCardRedemption;
