import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, Users, Award, TrendingUp, ChevronRight } from 'lucide-react';

const About = () => {
  const values = [
    {
      icon: Heart,
      title: 'Passion for Beauty',
      description: 'We believe beauty is more than appearance—it\'s about confidence, self-expression, and feeling your best.'
    },
    {
      icon: Users,
      title: 'Community First',
      description: 'Building connections between talented professionals and clients who deserve exceptional service.'
    },
    {
      icon: Award,
      title: 'Quality Excellence',
      description: 'We partner only with verified salons and stylists who meet our high standards for service and hygiene.'
    },
    {
      icon: TrendingUp,
      title: 'Innovation',
      description: 'Constantly evolving to bring you the latest in beauty technology and booking convenience.'
    }
  ];

  const team = [
    // {
    //   name: 'Shravan',
    //   role: 'Founder & CEO',
    //   bio: 'MCA PURSUING',
    //   image: 'http://localhost:5013/uploads/staff/profilePicture-1760969220265.jpg'
    // },
    {
      name: 'Shravan',
      role: 'Founder & CEO',
      bio: 'MCA PURSUING',
      image: 'http://localhost:5013/uploads/staff/profilePicture-1760969220265.jpg'
    }
    // {
    //   name: 'Emma Rodriguez',
    //   role: 'Head of Partnerships',
    //   bio: 'Former salon owner who understands both sides of the industry and builds strong relationships with our partners.',
    //   image: 'https://randomuser.me/api/portraits/women/68.jpg'
    // }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-pink-500 to-purple-600 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Sparkles className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About AuraCares</h1>
          <p className="text-xl max-w-3xl mx-auto mb-8 text-pink-100">
            Revolutionizing the beauty industry with seamless booking experiences and connecting clients with top-rated professionals.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              At AuraCares, we're on a mission to transform the beauty booking experience by connecting discerning clients 
              with exceptional beauty professionals, making premium services accessible, convenient, and reliable for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">The AuraCares Story</h3>
              <p className="text-gray-600 mb-4">
                Founded in 2020, AuraCares emerged from a simple yet powerful idea: booking beauty appointments 
                should be as effortless as booking a ride or ordering food.
              </p>
              <p className="text-gray-600 mb-4">
                Our founder, Sarah Johnson, experienced firsthand the frustration of calling multiple salons, 
                only to find they were fully booked or had changed their pricing. She envisioned a platform that 
                would eliminate these inefficiencies while ensuring clients always receive the quality service they deserve.
              </p>
              <p className="text-gray-600 mb-6">
                Today, AuraCares connects thousands of clients with verified beauty professionals across the country, 
                maintaining our commitment to excellence, convenience, and community.
              </p>
              <Link 
                to="/customer/book-appointment" 
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-full hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                Book Your Appointment
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-96 flex items-center justify-center">
              <img 
                src="/uploads/images/salonImages-1758260261304.jpg" 
                alt="AuraCares Salon" 
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  // Fallback to a placeholder image if the main image fails to load
                  e.target.src = 'https://via.placeholder.com/800x600/FF69B4/FFFFFF?text=AuraCares+Salon';
                  e.target.onerror = null;
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              These principles guide everything we do at AuraCares
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 flex items-center justify-center mb-4">
                  <value.icon className="h-6 w-6 text-pink-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The passionate people behind AuraCares
            </p>
          </div>

          <div className="flex justify-center">
            <div className="grid grid-cols-1 gap-8 max-w-md">
              {team.map((member, index) => (
                <div key={index} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="h-48 bg-gradient-to-r from-pink-400 to-purple-500 flex items-center justify-center">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="h-32 w-32 rounded-full object-cover border-4 border-white"
                      onError={(e) => {
                        // Fallback to a placeholder image if the main image fails to load
                        e.target.src = 'https://via.placeholder.com/128x128/FF69B4/FFFFFF?text=Team+Member';
                        e.target.onerror = null;
                      }}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                    <p className="text-pink-600 mb-3">{member.role}</p>
                    <p className="text-gray-600">{member.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Experience AuraCares?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-pink-100">
            Join thousands of satisfied customers who trust AuraCares for their beauty needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="px-8 py-4 bg-white text-pink-600 font-bold rounded-full hover:bg-gray-100 transition-all shadow-lg"
            >
              Create Account
            </Link>
            <Link 
              to="/customer/book-appointment" 
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-all"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;