import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, User, Sparkles, Users, Building, Shield, Check, X } from 'lucide-react'
import GoogleOAuthButton from '../../components/auth/GoogleOAuthButton'

const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'customer'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({
    name: '',
    email: ''
  })
  const [valid, setValid] = useState({
    name: null, // null = not validated, false = invalid, true = valid
    email: null
  })
  const [focusedField, setFocusedField] = useState('')

  const userTypes = [
    { value: 'customer', label: 'Customer', description: 'Book beauty services', icon: User },
    { value: 'salon', label: 'Salon Owner', description: 'Manage your salon business', icon: Building },
    { value: 'staff', label: 'Beauty Professional', description: 'Offer your services', icon: Users },
    { value: 'admin', label: 'Admin', description: 'Platform administration', icon: Shield }
  ]

  // Helper to get dashboard path by role
  const getRedirectPath = (user) => {
    if (!user) return '/login';
    switch (user.type) {
      case 'admin':
        return '/admin/dashboard';
      case 'salon':
        return user.setupCompleted ? '/salon/dashboard' : '/salon/setup';
      case 'staff':
        return user.setupCompleted ? '/staff/dashboard' : '/staff/setup';
      case 'customer':
        return '/customer/dashboard';
      default:
        return '/login';
    }
  };

  // Validation functions
  const validateName = (name) => {
    if (!name) {
      return 'Full name is required';
    }
    
    if (name.length < 2) {
      return 'Must be at least 2 characters';
    }
    
    if (name.length > 50) {
      return 'Maximum 50 characters allowed';
    }
    
    // Only allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[A-Za-z\s\-']+$/;
    if (!nameRegex.test(name)) {
      return 'Only letters, spaces, hyphens, and apostrophes allowed';
    }
    
    return '';
  };

  const validateEmail = (email) => {
    // Check for spaces anywhere in the email (leading, trailing, or middle)
    if (email.includes(' ')) {
      return 'Email should not contain spaces';
    }
    
    // Even if there are no visible spaces, check for other whitespace characters
    if (/\s/.test(email)) {
      return 'Email should not contain spaces';
    }
    
    // Trim leading and trailing spaces before validation (defensive)
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      return 'Email is required';
    }
    
    if (trimmedEmail.length > 255) {
      return 'Email too long';
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address';
    }
    
    // Check if it ends with .com
    if (!trimmedEmail.toLowerCase().endsWith('.com')) {
      return 'Only .com domains are allowed';
    }
    
    return '';
  };

  // Handle input changes with real-time validation
  const handleNameChange = (e) => {
    const name = e.target.value;
    setFormData({ ...formData, name });
    
    // Validate in real-time as user types
    const errorMessage = validateName(name);
    setErrors({ ...errors, name: errorMessage });
    setValid({ ...valid, name: errorMessage ? false : (name ? true : null) });
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setFormData({ ...formData, email });
    
    // Validate in real-time as user types
    const errorMessage = validateEmail(email);
    setErrors({ ...errors, email: errorMessage });
    setValid({ ...valid, email: errorMessage ? false : (email ? true : null) });
  };

  // Check if form is valid
  const isFormValid = () => {
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    return !nameError && !emailError && formData.password && formData.confirmPassword && 
           formData.password === formData.confirmPassword;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    
    setErrors({
      name: nameError,
      email: emailError
    });
    
    setValid({
      name: nameError ? false : (formData.name ? true : null),
      email: emailError ? false : (formData.email ? true : null)
    });

    // If there are validation errors, don't submit
    if (nameError || emailError) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Trim email before submission
    const trimmedEmail = formData.email.trim();

    setLoading(true);

    try {
      console.log('🔍 Registration data being sent:', formData);
      // Submit with trimmed email
      const submissionData = {
        ...formData,
        email: trimmedEmail
      };
      const response = await register(submissionData);
      toast.success('Registration successful! Welcome to Auracare!');

      // Ensure staff are taken to setup flow until completed
      const user = response?.user;
      const redirectPath = user?.type === 'staff'
        ? (user?.setupCompleted ? '/staff/dashboard' : '/staff/setup')
        : getRedirectPath(user);

      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error('Registration error:', error);
      
      // Show specific error message from backend
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex">
      {/* Left side - Background image with overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1597228223025-03226a1479a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
            backgroundBlendMode: 'overlay'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/80 to-pink-700/80" />
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          <div className="mb-8">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm inline-block">
              <Sparkles className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Join Auracare Community</h1>
          <p className="text-xl text-center max-w-md opacity-90">
            Connect with top beauty professionals and salons
          </p>
          <div className="mt-8 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm opacity-80">Salons</div>
            </div>
            <div>
              <div className="text-3xl font-bold">10K+</div>
              <div className="text-sm opacity-80">Happy Clients</div>
            </div>
            <div>
              <div className="text-3xl font-bold">4.9</div>
              <div className="text-sm opacity-80">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center lg:justify-start">
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-3 rounded-full">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Create Account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join our community and start your beauty journey
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                {userTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      formData.userType === type.value
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                        : 'border-gray-300 hover:border-purple-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="userType"
                      value={type.value}
                      checked={formData.userType === type.value}
                      onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                      className="sr-only"
                    />
                    <type.icon className={`h-6 w-6 mb-2 ${
                      formData.userType === type.value ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                    <div className="text-center">
                      <div className={`text-sm font-medium ${
                        formData.userType === type.value ? 'text-purple-900' : 'text-gray-900'
                      }`}>
                        {type.label}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              {/* Name Field with Floating Label */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className={`block w-full pl-10 pr-3 py-4 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 ${
                    focusedField === 'name' || formData.name 
                      ? 'border-purple-500 focus:ring-purple-200 pt-6 pb-2' 
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-100'
                  } ${valid.name === false ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : valid.name === true ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : ''}`}
                  placeholder=" "
                  value={formData.name}
                  onChange={handleNameChange}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField('')}
                />
                <label 
                  htmlFor="name" 
                  className={`absolute left-10 transition-all duration-200 pointer-events-none ${
                    focusedField === 'name' || formData.name
                      ? 'top-2 text-xs text-purple-600'
                      : 'top-1/2 -translate-y-1/2 text-gray-500'
                  }`}
                >
                  Full Name
                </label>
                {valid.name === true && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                )}
                {valid.name === false && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <X className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
              {valid.name === true && !errors.name && (
                <p className="mt-1 text-sm text-green-600">Looks good!</p>
              )}

              {/* Email Field with Floating Label */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`block w-full pl-10 pr-3 py-4 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 ${
                    focusedField === 'email' || formData.email 
                      ? 'border-purple-500 focus:ring-purple-200 pt-6 pb-2' 
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-100'
                  } ${valid.email === false ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : valid.email === true ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : ''}`}
                  placeholder=" "
                  value={formData.email}
                  onChange={handleEmailChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                />
                <label 
                  htmlFor="email" 
                  className={`absolute left-10 transition-all duration-200 pointer-events-none ${
                    focusedField === 'email' || formData.email
                      ? 'top-2 text-xs text-purple-600'
                      : 'top-1/2 -translate-y-1/2 text-gray-500'
                  }`}
                >
                  Email Address
                </label>
                {valid.email === true && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Check className="h-5 w-5 text-green-500" />
                  </div>
                )}
                {valid.email === false && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <X className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
              {valid.email === true && !errors.email && (
                <p className="mt-1 text-sm text-green-600">Valid email format!</p>
              )}

              {/* Password Field with Floating Label */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`block w-full pl-10 pr-10 py-4 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 ${
                    focusedField === 'password' || formData.password 
                      ? 'border-purple-500 focus:ring-purple-200 pt-6 pb-2' 
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-100'
                  }`}
                  placeholder=" "
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                />
                <label 
                  htmlFor="password" 
                  className={`absolute left-10 transition-all duration-200 pointer-events-none ${
                    focusedField === 'password' || formData.password
                      ? 'top-2 text-xs text-purple-600'
                      : 'top-1/2 -translate-y-1/2 text-gray-500'
                  }`}
                >
                  Password
                </label>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>

              {/* Confirm Password Field with Floating Label */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`block w-full pl-10 pr-10 py-4 border rounded-lg focus:ring-2 focus:outline-none transition-all duration-200 ${
                    focusedField === 'confirmPassword' || formData.confirmPassword 
                      ? 'border-purple-500 focus:ring-purple-200 pt-6 pb-2' 
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-100'
                  }`}
                  placeholder=" "
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField('')}
                />
                <label 
                  htmlFor="confirmPassword" 
                  className={`absolute left-10 transition-all duration-200 pointer-events-none ${
                    focusedField === 'confirmPassword' || formData.confirmPassword
                      ? 'top-2 text-xs text-purple-600'
                      : 'top-1/2 -translate-y-1/2 text-gray-500'
                  }`}
                >
                  Confirm Password
                </label>
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Registration */}
            <GoogleOAuthButton 
              role={formData.userType}
              variant="outlined"
              fullWidth={true}
            />

            {/* Sign in link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register