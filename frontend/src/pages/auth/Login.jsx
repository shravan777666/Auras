import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';
import GoogleOAuthButton from '../../components/auth/GoogleOAuthButton';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-3 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Welcome to Auracare</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account to continue</p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input pl-10"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="form-input pl-10 pr-10"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" className="form-checkbox" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">Remember me</label>
            </div>
            <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-500">Forgot your password?</Link>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-base">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300" /></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with</span></div>
          </div>

          {/* Google Login - Pass default role as customer for now */}
          <GoogleOAuthButton 
            role="customer"
            variant="outlined"
            fullWidth={true}
          />
        </form>

        {/* Sign up link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">Sign up now</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;