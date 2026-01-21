import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, UserCheck, Mail, Phone, MapPin, Award, FileText } from 'lucide-react';

const WaitingApproval = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="h-12 w-12 text-yellow-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Under Review</h1>
          <p className="text-lg text-gray-600 mb-8">
            Thank you for registering as a freelancer. Your application is currently under review by our admin team.
          </p>
          
          <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Application Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-700">
                <UserCheck className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium">Status:</span>
                <span className="ml-2 font-semibold text-yellow-600">Pending Review</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium">Email:</span>
                <span className="ml-2">freelancer@example.com</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Phone className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium">Phone:</span>
                <span className="ml-2">+91 98765 43210</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <MapPin className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium">Service Location:</span>
                <span className="ml-2">Mumbai, Maharashtra</span>
              </div>
              <div className="flex items-center text-sm text-gray-700">
                <Award className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium">Skills:</span>
                <span className="ml-2">Hair Styling, Makeup, Skincare</span>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Our team typically reviews applications within 24-48 hours. 
              You will receive an email notification once your application has been reviewed.
            </p>
          </div>
          
          <div className="space-y-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Refresh Status
            </button>
            
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <Link to="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingApproval;