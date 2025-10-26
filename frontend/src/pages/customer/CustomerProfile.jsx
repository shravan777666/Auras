import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Phone, Calendar, MapPin, Award } from 'lucide-react';

const CustomerProfile = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-8">
            <div className="flex flex-col md:flex-row items-center">
              <div className="flex-shrink-0">
                <div className="bg-white p-1 rounded-full">
                  <div className="bg-gray-200 border-2 border-dashed rounded-full w-24 h-24 flex items-center justify-center">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="mt-6 md:mt-0 md:ml-6 text-center md:text-left">
                <h1 className="text-2xl font-bold text-white">{user?.name || 'Customer'}</h1>
                <p className="text-primary-100 mt-1">{user?.email || 'customer@example.com'}</p>
                <p className="text-primary-100 mt-1">Member since {user?.createdAt ? new Date(user.createdAt).getFullYear() : '2025'}</p>
              </div>
              <div className="mt-6 md:mt-0 md:ml-auto">
                <Link
                  to="/customer/edit-profile"
                  className="inline-flex items-center px-4 py-2 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Edit Profile
                </Link>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Profile Info */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Full Name</p>
                        <p className="text-base text-gray-900">{user?.name || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Email Address</p>
                        <p className="text-base text-gray-900">{user?.email || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Phone Number</p>
                        <p className="text-base text-gray-900">{user?.contactNumber || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                        <p className="text-base text-gray-900">
                          {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Address</p>
                        <p className="text-base text-gray-900">
                          {user?.address ? `${user.address.street || ''}, ${user.address.city || ''}, ${user.address.state || ''} ${user.address.postalCode || ''}` : 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Loyalty Points */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <Award className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Loyalty Points</p>
                      <p className="text-xl font-bold text-primary-600">38</p>
                    </div>
                  </div>
                  <button className="mt-4 w-full py-2 text-sm font-medium text-primary-600 hover:text-primary-700">
                    View Rewards
                  </button>
                </div>

                {/* Account Settings */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Account Settings</h3>
                  <ul className="space-y-3">
                    <li>
                      <Link to="/customer/edit-profile" className="flex items-center text-gray-700 hover:text-primary-600">
                        <User className="h-4 w-4 mr-3" />
                        <span>Personal Information</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/profile/security" className="flex items-center text-gray-700 hover:text-primary-600">
                        <svg className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Security Settings</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/profile/notifications" className="flex items-center text-gray-700 hover:text-primary-600">
                        <svg className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <span>Notification Preferences</span>
                      </Link>
                    </li>
                    <li>
                      <Link to="/profile/payment" className="flex items-center text-gray-700 hover:text-primary-600">
                        <svg className="h-4 w-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span>Payment Methods</span>
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;