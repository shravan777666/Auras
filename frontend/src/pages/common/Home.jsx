import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Star,
  Scissors,
  Paintbrush,
  Sparkles,
  Heart,
  CheckCircle,
  Shield,
  Users,
} from 'lucide-react';

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const heroImages = [
    'https://cdn.pixabay.com/photo/2020/05/24/02/00/barber-shop-5212059_1280.jpg',
    'https://images.unsplash.com/photo-1580618672591-2c8d41d9b0b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
    'https://cdn.pixabay.com/photo/2022/01/24/20/01/salon-6964527_1280.jpg',
    'https://images.unsplash.com/photo-1560066984-138dadb4c5f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [heroImages.length]);

  const featuredSalons = [
    {
      name: 'Modern Cuts',
      location: 'New York, NY',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1521590832167-7ce6b839fe7f?q=80&w=2187&auto=format&fit=crop',
    },
    {
      name: 'The Style Room',
      location: 'Los Angeles, CA',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=2070&auto=format&fit=crop',
    },
    {
      name: 'Beauty Bliss',
      location: 'Chicago, IL',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1596788048228-dc0f06d2c5c7?q=80&w=2235&auto=format&fit=crop',
    },
    {
        name: 'Glamour Lounge',
        location: 'Houston, TX',
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1580615642422-ba2797b67a9b?q=80&w=2070&auto=format&fit=crop',
    },
    {
        name: 'Elegance Studio',
        location: 'Phoenix, AZ',
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1556760544-4421763def42?q=80&w=2070&auto=format&fit=crop',
    },
  ];

  const topServices = [
    { name: 'Haircuts', icon: Scissors },
    { name: 'Coloring', icon: Paintbrush },
    { name: 'Manicures', icon: Sparkles },
    { name: 'Pedicures', icon: Heart },
  ];

  const whyChooseUs = [
    {
      icon: CheckCircle,
      title: 'Easy Booking',
      description: 'Book appointments in just a few taps.',
    },
    {
      icon: Shield,
      title: 'Verified Salons',
      description: 'We partner with only the best, trusted salons.',
    },
    {
      icon: Users,
      title: 'Expert Stylists',
      description: 'Access a community of top-rated beauty professionals.',
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
                <Sparkles className="h-8 w-8 text-pink-500" />
                <span className="text-2xl font-bold text-gray-800">AuraCares</span>
            </div>
            <div className="flex-1 max-w-md mx-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for salons, services..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Always show Sign In and Sign Up buttons */}
              <Link to="/login" className="text-gray-600 hover:text-pink-500 font-medium transition-colors">
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-all shadow-md hover:shadow-lg"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-[60vh] flex items-center justify-center text-white overflow-hidden">
          {heroImages.map((src, index) => (
            <img
              key={src}
              src={src}
              alt="Salon background"
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div className="absolute inset-0 bg-black/50 z-10"></div>
          <div className="relative z-20 text-center p-4">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">Find & Book Your Next Salon Appointment</h1>
            <p className="text-lg md:text-xl max-w-3xl mx-auto mb-8 text-gray-200">
              Discover the best salons and stylists in your area.
            </p>
            <Link
              to="/register"
              className="px-10 py-4 rounded-full bg-pink-500 text-white font-bold text-lg hover:bg-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Book Now
            </Link>
          </div>
        </section>

        {/* Featured Salons Section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Featured Salons</h2>
            <div className="flex space-x-8 pb-4 -mx-4 px-4 overflow-x-auto">
              {featuredSalons.map((salon, index) => (
                <div key={index} className="flex-shrink-0 w-80">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                    <img src={salon.image} alt={salon.name} className="h-48 w-full object-cover" />
                    <div className="p-5">
                      <h3 className="text-xl font-semibold text-gray-900">{salon.name}</h3>
                      <div className="flex items-center text-gray-600 mt-2">
                        <MapPin className="h-5 w-5 mr-2 text-gray-400" />
                        <span>{salon.location}</span>
                      </div>
                      <div className="flex items-center mt-3">
                        <Star className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="text-gray-800 font-bold ml-2">{salon.rating}</span>
                        <span className="text-gray-500 ml-2">(50+ reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Services Section */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Our Top Services</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {topServices.map((service, index) => (
                <div key={index} className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl hover:bg-pink-100/50 hover:shadow-lg transition-all transform hover:-translate-y-1">
                  <div className="bg-pink-500/10 p-4 rounded-full mb-4">
                    <service.icon className="h-8 w-8 text-pink-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{service.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">Why Choose AuraCares?</h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">We provide a seamless and delightful experience for all your beauty needs.</p>
                </div>
                <div className="mt-12 grid md:grid-cols-3 gap-x-8 gap-y-10">
                    {whyChooseUs.map((feature) => (
                        <div key={feature.title} className="text-center">
                            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-pink-100/50 mx-auto mb-4">
                                <feature.icon className="h-8 w-8 text-pink-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                            <p className="mt-2 text-gray-600">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-4 mb-4">
                    <Sparkles className="h-8 w-8 text-pink-500" />
                    <span className="text-2xl font-bold">AuraCares</span>
                </div>
                <p className="text-gray-400">The best way to find and book beauty appointments.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">&copy; 2025 AuraCares. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;