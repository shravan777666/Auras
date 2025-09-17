import React from 'react'
import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Sparkles } from 'lucide-react'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-4 rounded-full">
            <Sparkles className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* 404 Text */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold gradient-text">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mt-4 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn btn-primary inline-flex items-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="btn btn-outline inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-gray-500">
          If you believe this is an error, please{' '}
          <Link to="/contact" className="text-primary-600 hover:text-primary-500">
            contact our support team
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFound