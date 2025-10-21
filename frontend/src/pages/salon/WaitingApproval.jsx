import React from 'react';
import BackButton from '../../components/common/BackButton';
import { Clock, Mail, Phone, Info, CheckCircle } from 'lucide-react';

const WaitingApproval = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-200">
        <BackButton fallbackPath="/salon/dashboard" className="mb-4" />
        <div className="text-center">
          <Clock className="mx-auto h-16 w-16 text-yellow-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Your Salon is Under Review
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Thank you for completing your salon setup!
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Your application is currently being reviewed by our administration team.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-yellow-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You will receive an email notification once your salon has been approved or if further information is required.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900">What to expect next:</h3>
            <ul className="mt-4 space-y-3 text-gray-600 text-sm">
              <li className="flex items-start">
                <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Our team will carefully review your submitted details and documents.</span>
              </li>
              <li className="flex items-start">
                <Clock className="flex-shrink-0 h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <span>This process typically takes 24-48 hours.</span>
              </li>
              <li className="flex items-start">
                <Mail className="flex-shrink-0 h-5 w-5 text-purple-500 mr-2 mt-0.5" />
                <span>You'll be notified via email about the status of your application.</span>
              </li>
            </ul>
          </div>

          <div className="text-center text-sm text-gray-500 mt-6">
            <p>In the meantime, if you have any questions, please contact support.</p>
            <p className="mt-1 flex items-center justify-center">
              <Phone className="h-4 w-4 mr-1" />
              <span>+91 98765 43210</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitingApproval;