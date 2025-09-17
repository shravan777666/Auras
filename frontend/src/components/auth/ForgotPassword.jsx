import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Mail, Shield, User, Building } from 'lucide-react';

const ForgotPassword = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [formData, setFormData] = useState({
    email: '',
    userType: 'customer',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const userTypes = [
    { value: 'customer', label: 'Customer', icon: User },
    { value: 'staff', label: 'Staff', icon: Shield },
    { value: 'salon', label: 'Salon Owner', icon: Building },
    { value: 'admin', label: 'Admin', icon: Shield }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.userType) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/forgot-password/request-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          userType: formData.userType
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('OTP sent to your email successfully!');
        setStep(2);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Error requesting OTP:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!formData.otp) {
      toast.error('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/forgot-password/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          userType: formData.userType,
          otp: formData.otp
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('OTP verified successfully!');
        setStep(3);
      } else {
        toast.error(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/forgot-password/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          userType: formData.userType,
          otp: formData.otp,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Password reset successfully! You can now login with your new password.');
        // Reset form and go back to login
        setFormData({
          email: '',
          userType: 'customer',
          otp: '',
          newPassword: '',
          confirmPassword: ''
        });
        setStep(1);
        onBackToLogin();
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((stepNum) => (
        <React.Fragment key={stepNum}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= stepNum 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-600'
          }`}>
            {stepNum}
          </div>
          {stepNum < 3 && (
            <div className={`w-12 h-1 mx-2 ${
              step > stepNum ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderEmailStep = () => (
    <form onSubmit={handleRequestOTP} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your email address"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Account Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {userTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <label
                key={type.value}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.userType === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="userType"
                  value={type.value}
                  checked={formData.userType === type.value}
                  onChange={handleInputChange}
                  className="sr-only"
                />
                <IconComponent className="w-5 h-5 mr-2 text-gray-600" />
                <span className="text-sm font-medium">{type.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Sending OTP...' : 'Send OTP'}
      </button>
    </form>
  );

  const renderOTPStep = () => (
    <form onSubmit={handleVerifyOTP} className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          We've sent a 6-digit OTP to <strong>{formData.email}</strong>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter OTP
        </label>
        <input
          type="text"
          name="otp"
          value={formData.otp}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest"
          placeholder="000000"
          maxLength="6"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Verifying...' : 'Verify OTP'}
      </button>

      <button
        type="button"
        onClick={() => setStep(1)}
        className="w-full text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
      >
        Back to Email
      </button>
    </form>
  );

  const renderPasswordStep = () => (
    <form onSubmit={handleResetPassword} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          New Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter new password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Confirm new password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Resetting Password...' : 'Reset Password'}
      </button>

      <button
        type="button"
        onClick={() => setStep(2)}
        className="w-full text-blue-600 py-2 px-4 rounded-lg hover:bg-blue-50 transition-colors"
      >
        Back to OTP
      </button>
    </form>
  );

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Reset Your Password';
      case 2: return 'Verify OTP';
      case 3: return 'Set New Password';
      default: return 'Reset Password';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{getStepTitle()}</h2>
          <p className="text-gray-600">
            {step === 1 && 'Enter your email to receive an OTP'}
            {step === 2 && 'Check your email for the verification code'}
            {step === 3 && 'Create a new secure password'}
          </p>
        </div>

        {renderStepIndicator()}

        {step === 1 && renderEmailStep()}
        {step === 2 && renderOTPStep()}
        {step === 3 && renderPasswordStep()}

        <div className="mt-6 text-center">
          <button
            onClick={onBackToLogin}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
