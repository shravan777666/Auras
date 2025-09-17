import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Sparkles, 
  Calendar, 
  Users, 
  Star, 
  ArrowRight,
  CheckCircle,
  Shield,
  Clock,
  Heart
} from 'lucide-react'

const Home = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Book appointments with your favorite salons in just a few clicks'
    },
    {
      icon: Users,
      title: 'Expert Staff',
      description: 'Connect with skilled professionals for all your beauty needs'
    },
    {
      icon: Star,
      title: 'Quality Service',
      description: 'Rated 4.9/5 by thousands of satisfied customers'
    },
    {
      icon: Shield,
      title: 'Secure & Safe',
      description: 'Your data and payments are protected with enterprise-grade security'
    }
  ]

  const benefits = [
    'Real-time appointment booking',
    'Verified salon professionals',
    'Flexible cancellation policy',
    'Secure payment processing',
    'Customer reviews and ratings',
    '24/7 customer support'
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold gradient-text">Auracare</span>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <Link 
                  to="/register" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Get Started
                </Link>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="inline-flex items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/register" 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Beauty,{' '}
              <span className="gradient-text">Our Priority</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Connect with the best beauty professionals in your area. Book appointments, 
              manage your salon business, or find your next career opportunity - all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user && (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/about" className="btn btn-outline btn-lg">
                    Learn More
                  </Link>
                </>
              )}
              {user && (
                <Link to="/dashboard" className="btn btn-primary btn-lg">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Auracare?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're revolutionizing the beauty industry with our comprehensive management platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Everything you need to succeed in the beauty industry
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Whether you're a customer looking for beauty services, a salon owner managing 
                your business, or a professional seeking opportunities, Auracare has you covered.
              </p>

              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-success-600 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center">
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Join Thousands of Happy Users
                </h3>
                <p className="text-gray-600 mb-6">
                  Over 10,000+ appointments booked, 500+ salons registered, and 1,000+ professionals connected.
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary-600">10K+</div>
                    <div className="text-sm text-gray-500">Appointments</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-600">500+</div>
                    <div className="text-sm text-gray-500">Salons</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary-600">1K+</div>
                    <div className="text-sm text-gray-500">Professionals</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to transform your beauty experience?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers, salon owners, and beauty professionals 
            who trust Auracare for their beauty needs.
          </p>

          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg">
                Start Free Today
              </Link>
              <Link to="/contact" className="btn border-white text-white hover:bg-white/10 btn-lg">
                Contact Sales
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">Auracare</span>
              </div>
              <p className="text-gray-400 mb-4">
                The complete beauty parlor management system that connects customers, 
                salon owners, and beauty professionals in one seamless platform.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link to="/about" className="block text-gray-400 hover:text-white">About Us</Link>
                <Link to="/contact" className="block text-gray-400 hover:text-white">Contact</Link>
                <Link to="/login" className="block text-gray-400 hover:text-white">Sign In</Link>
                <Link to="/register" className="block text-gray-400 hover:text-white">Sign Up</Link>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white">Help Center</a>
                <a href="#" className="block text-gray-400 hover:text-white">Privacy Policy</a>
                <a href="#" className="block text-gray-400 hover:text-white">Terms of Service</a>
                <a href="#" className="block text-gray-400 hover:text-white">Support</a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Auracare Beauty Parlor Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home