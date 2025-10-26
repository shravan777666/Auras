import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Sparkles, User } from 'lucide-react';
import GoogleOAuthButton from '../../components/auth/GoogleOAuthButton';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  // Redirects user to the appropriate dashboard based on their role
  const getRedirectPath = (user) => {
    if (!user) return '/login';
    switch (user.type) {
      case 'admin': return '/admin/dashboard';
      case 'salon': return user.setupCompleted ? '/salon/dashboard' : '/salon/setup';
      case 'staff': return user.setupCompleted ? '/staff/dashboard' : '/staff/setup';
      case 'customer': return '/customer/dashboard';
      default: return '/login';
    }
  };

  // Handles form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Don't send userType since backend will determine it automatically
      const data = await login(formData);
      toast.success(`Welcome back, ${data.user.name || 'User'}!`);
      const redirectPath = getRedirectPath(data.user);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please check your credentials.');
      console.error('Login error:', error);
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
            backgroundImage: "url('https://images.unsplash.com/photo-1527049979850-0559a57765c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')",
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
          <h1 className="text-4xl font-bold mb-4">Welcome to Auracare</h1>
          <p className="text-xl text-center max-w-md opacity-90">
            Experience luxury beauty services tailored just for you
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

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center lg:justify-start">
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-3 rounded-full">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign in to Account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back! Please enter your details
            </p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
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
                  }`}
                  placeholder=" "
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  Email address
                </label>
              </div>

              {/* Password Field with Floating Label */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  id="remember-me" 
                  name="remember-me" 
                  type="checkbox" 
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">Remember me</label>
              </div>
              <Link to="/forgot-password" className="text-sm text-purple-600 hover:text-purple-500 font-medium">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
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

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <GoogleOAuthButton 
                role="customer"
                variant="outlined"
                fullWidth={true}
              />
              <button
                type="button"
                className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
              >
                <User className="h-5 w-5 text-gray-500 mr-2" />
                Guest
              </button>
            </div>
          </form>

          {/* Sign up link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-purple-600 hover:text-purple-500">
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;