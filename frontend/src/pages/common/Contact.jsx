import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Facebook, 
  Instagram, 
  Twitter, 
  Send,
  User,
  MailIcon,
  MessageSquare,
  Sparkles
} from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    // Simulate form submission
    try {
      // In a real application, you would send the form data to your backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      setSubmitError('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: 'Our Location',
      content: 'Amal Jyothi College Of Engineering Autonomous, Kanjirapally, Kottayam, Kerala',
      type: 'address'
    },
    {
      icon: Phone,
      title: 'Phone Number',
      content: '+91 94472 90939',
      type: 'phone'
    },
    {
      icon: Mail,
      title: 'Email Address',
      content: 'shravanachu7@gmail.com',
      type: 'email'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      content: 'Monday - Friday: 9:00 AM - 6:00 PM\nSaturday: 10:00 AM - 4:00 PM\nSunday: Closed',
      type: 'hours'
    }
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
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl max-w-3xl mx-auto mb-8 text-pink-100">
            Have questions or feedback? We'd love to hear from you. Reach out to our team and we'll get back to you as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
              
              {submitSuccess && (
                <div className="mb-6 p-4 bg-green-50 text-green-800 rounded-lg">
                  Thank you for your message! We'll get back to you soon.
                </div>
              )}
              
              {submitError && (
                <div className="mb-6 p-4 bg-red-50 text-red-800 rounded-lg">
                  {submitError}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MailIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="How can we help you?"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="Your message here..."
                    ></textarea>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
            
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in touch</h2>
              <p className="text-gray-600 mb-8">
                We're here to help and answer any questions you might have. We look forward to hearing from you!
              </p>
              
              <div className="space-y-6 mb-12">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-r from-pink-100 to-purple-100">
                        <info.icon className="h-6 w-6 text-pink-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium text-gray-900">{info.title}</h3>
                      <p className="mt-1 text-gray-600 whitespace-pre-line">{info.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Social Media */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Follow us</h3>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors">
                    <Facebook className="h-6 w-6" />
                    <span className="sr-only">Facebook</span>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors">
                    <Instagram className="h-6 w-6" />
                    <span className="sr-only">Instagram</span>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-pink-500 transition-colors">
                    <Twitter className="h-6 w-6" />
                    <span className="sr-only">Twitter</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions about our services
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do I book an appointment?</h3>
              <p className="text-gray-600">
                Simply create an account, browse our partner salons, select your preferred services, 
                and choose a convenient time slot. You'll receive a confirmation email with all details.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">What if I need to cancel my appointment?</h3>
              <p className="text-gray-600">
                You can cancel your appointment up to 24 hours in advance through your account dashboard. 
                Cancellations within 24 hours may be subject to a fee depending on the salon's policy.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How do you verify salon quality?</h3>
              <p className="text-gray-600">
                We conduct thorough background checks, verify licenses, inspect facilities, 
                and regularly review customer feedback to ensure all our partner salons meet our high standards.
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Is my payment information secure?</h3>
              <p className="text-gray-600">
                Absolutely. We use industry-standard encryption and secure payment processors to protect 
                your financial information. We never store your complete payment details on our servers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to book your next appointment?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience the convenience of AuraCares for yourself
          </p>
          <Link 
            to="/customer/book-appointment" 
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-full hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Book Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Contact;