import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="mt-4 text-gray-600">
          You don't have permission to access this page. Only authorized users can view this content.
        </p>
        <div className="mt-8">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;