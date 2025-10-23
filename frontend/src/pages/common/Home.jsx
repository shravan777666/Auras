import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  ChevronLeft,
  ChevronRight,
  Play,
  Calendar,
  Award,
  TrendingUp
} from 'lucide-react';

const Home = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/explore-salons?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const heroImages = [
    {
      url: 'https://cdn.pixabay.com/photo/2020/05/24/02/00/barber-shop-5212059_1280.jpg',
      title: 'Premium Haircuts',
      subtitle: 'Expert stylists for the perfect look'
    },
    {
      url: 'https://images.unsplash.com/photo-1580618672591-2c8d41d9b0b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
      title: 'Luxury Spa Treatments',
      subtitle: 'Relax and rejuvenate with our premium services'
    },
    {
      url: 'https://cdn.pixabay.com/photo/2022/01/24/20/01/salon-6964527_1280.jpg',
      title: 'Nail Artistry',
      subtitle: 'Beautiful designs for every occasion'
    },
    {
      url: 'https://images.unsplash.com/photo-1560066984-138dadb4c5f7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80',
      title: 'Makeover Magic',
      subtitle: 'Transform your look with our experts'
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 7000);

    return () => clearInterval(timer);
  }, [heroImages.length]);

  const nextSlide = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? heroImages.length - 1 : prevIndex - 1
    );
  };

  const featuredSalons = [
    {
      id: '1',
      name: 'Modern Cuts',
      location: 'New York, NY',
      rating: 4.8,
      image: 'https://cdn.pixabay.com/photo/2020/05/24/02/00/barber-shop-5212059_1280.jpg',
      services: ['Haircuts', 'Beard Trims', 'Coloring'],
      price: 'Starting at $25'
    },
    {
      id: '2',
      name: 'The Style Room',
      location: 'Los Angeles, CA',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=2070&auto=format&fit=crop',
      services: ['Coloring', 'Styling', 'Treatments'],
      price: 'Starting at $40'
    },
    {
      id: '3',
      name: 'Beauty Bliss',
      location: 'Chicago, IL',
      rating: 4.7,
      image: 'https://cdn.pixabay.com/photo/2020/05/24/02/00/barber-shop-5212059_1280.jpg',
      services: ['Manicures', 'Pedicures', 'Waxing'],
      price: 'Starting at $30'
    },
    {
      id: '4',
      name: 'Glamour Lounge',
      location: 'Houston, TX',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?q=80&w=2070&auto=format&fit=crop',
      services: ['Makeup', 'Facials', 'Massages'],
      price: 'Starting at $50'
    },
  ];

  const topServices = [
    { name: 'Haircuts', icon: Scissors, color: 'bg-amber-100 text-amber-600' },
    { name: 'Coloring', icon: Paintbrush, color: 'bg-purple-100 text-purple-600' },
    { name: 'Manicures', icon: Sparkles, color: 'bg-pink-100 text-pink-600' },
    { name: 'Pedicures', icon: Heart, color: 'bg-rose-100 text-rose-600' },
    { name: 'Facials', icon: Award, color: 'bg-blue-100 text-blue-600' },
    { name: 'Massages', icon: TrendingUp, color: 'bg-green-100 text-green-600' },
  ];

  const whyChooseUs = [
    {
      icon: CheckCircle,
      title: 'Easy Booking',
      description: 'Book appointments in just a few taps.',
      color: 'text-green-500'
    },
    {
      icon: Shield,
      title: 'Verified Salons',
      description: 'We partner with only the best, trusted salons.',
      color: 'text-blue-500'
    },
    {
      icon: Users,
      title: 'Expert Stylists',
      description: 'Access a community of top-rated beauty professionals.',
      color: 'text-purple-500'
    },
    {
      icon: Calendar,
      title: 'Flexible Scheduling',
      description: 'Find available slots that fit your busy schedule.',
      color: 'text-amber-500'
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      text: 'The best salon booking experience I\'ve ever had. So easy and convenient!',
      rating: 5,
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg'
    },
    {
      name: 'Michael Chen',
      text: 'Found an amazing stylist through AuraCares. My haircut exceeded expectations!',
      rating: 5,
      avatar: 'https://randomuser.me/api/portraits/men/44.jpg'
    },
    {
      name: 'Emma Rodriguez',
      text: 'The facial treatment I booked was incredible. Will definitely use again!',
      rating: 4,
      avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Sparkles className="h-8 w-8 text-pink-500" />
                <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                AuraCares
              </span>
            </div>
            <div className="flex-1 max-w-md mx-4">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for salons, services..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full bg-gray-100 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all shadow-sm hover:shadow-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-pink-500 font-medium transition-colors">
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section with Carousel */}
        <section className="relative h-[70vh] flex items-center justify-center text-white overflow-hidden">
          {heroImages.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.url}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30"></div>
            </div>
          ))}
          
          {/* Carousel Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all z-20"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all z-20"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
          
          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`h-3 w-3 rounded-full transition-all ${
                  index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
          
          <div className="relative z-20 text-center p-4 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight animate-fade-in">
              {heroImages[currentImageIndex].title}
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-200 animate-fade-in-delay">
              {heroImages[currentImageIndex].subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/customer/book-appointment"
                className="px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center"
              >
                <Calendar className="mr-2 h-5 w-5" />
                Book Now
              </Link>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-8 py-4 rounded-full bg-white/20 backdrop-blur-sm text-white font-bold text-lg hover:bg-white/30 transition-all flex items-center border border-white/30"
              >
                <Play className={`mr-2 h-5 w-5 ${isPlaying ? 'fill-current' : ''}`} />
                {isPlaying ? 'Pause' : 'Watch Demo'}
              </button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold">500+</div>
                <div className="text-pink-100">Salons</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold">10K+</div>
                <div className="text-pink-100">Happy Customers</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold">50+</div>
                <div className="text-pink-100">Services</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold">4.8</div>
                <div className="text-pink-100">Average Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Salons Section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Featured Salons</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Discover our handpicked selection of top-rated salons with exceptional services
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredSalons.map((salon) => (
                <div key={salon.id} className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition-all duration-300 hover:shadow-xl">
                  <div className="relative">
                    <img src={salon.image} alt={salon.name} className="h-48 w-full object-cover" />
                    <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center shadow-md">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm font-bold">{salon.rating}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900">{salon.name}</h3>
                    <div className="flex items-center text-gray-600 mt-2">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-sm">{salon.location}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {salon.services.map((service, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {service}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-lg font-bold text-pink-600">{salon.price}</span>
                      <Link
                        to={`/customer/salon/${salon.id}`}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium hover:from-pink-600 hover:to-purple-700 transition-all"
                      >
                        View Salon
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                to="/customer/explore-salons"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Explore All Salons
              </Link>
            </div>
          </div>
        </section>

        {/* Top Services Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Top Services</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Discover the most popular beauty services offered by our partner salons
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {topServices.map((service, index) => (
                <Link 
                  key={index} 
                  to={`/customer/explore-salons?service=${encodeURIComponent(service.name.toLowerCase())}`}
                  className="flex flex-col items-center p-6 bg-white rounded-2xl hover:shadow-lg transition-all transform hover:-translate-y-1 border border-gray-100 group"
                >
                  <div className={`${service.color} p-4 rounded-full mb-4 group-hover:scale-110 transition-transform`}>
                    <service.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">{service.name}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 sm:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">What Our Customers Say</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Don't just take our word for it - hear from our satisfied customers
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < testimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="h-10 w-10 rounded-full mr-3"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Why Choose AuraCares?</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                We provide a seamless and delightful experience for all your beauty needs
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {whyChooseUs.map((feature, index) => (
                <div 
                  key={index} 
                  className="text-center bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all transform hover:-translate-y-1"
                >
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 mx-auto mb-4">
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 bg-gradient-to-r from-pink-500 to-purple-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Look?
            </h2>
            <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust AuraCares for their beauty needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/customer/book-appointment"
                className="px-8 py-4 rounded-full bg-white text-pink-600 font-bold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Book Your Appointment
              </Link>
              <Link
                to="/register"
                className="px-8 py-4 rounded-full bg-transparent border-2 border-white text-white font-bold text-lg hover:bg-white/10 transition-all"
              >
                Create Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-4 mb-4">
                <Sparkles className="h-8 w-8 text-pink-500" />
                <span className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  AuraCares
                </span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                The best way to find and book beauty appointments. Discover top-rated salons 
                and expert stylists in your area.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Sign In</Link></li>
                <li><Link to="/customer/book-appointment" className="text-gray-400 hover:text-white transition-colors">Book Appointment</Link></li>
                <li><Link to="/customer/explore-salons" className="text-gray-400 hover:text-white transition-colors">Explore Salons</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">&copy; 2025 AuraCares. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;