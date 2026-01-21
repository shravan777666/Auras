import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Calendar, Tag, Filter, Search, Heart, Star, Gift } from 'lucide-react';
import giftCardService from '../../services/giftCardService';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const GiftCardsBrowse = () => {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [giftCards, setGiftCards] = useState([]);
  const [myGiftCards, setMyGiftCards] = useState([]);
  const [filteredGiftCards, setFilteredGiftCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOccasion, setSelectedOccasion] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Occasion filters
  const occasions = ['All', 'Wedding', 'Birthday', 'Anniversary', 'Other'];

  // Sample occasion-based filtering logic
  const filterByOccasion = (cards, occasion) => {
    if (occasion === 'All') return cards;
    
    return cards.filter(card => {
      const cardName = card.name.toLowerCase();
      const cardDescription = card.description ? card.description.toLowerCase() : '';
      
      switch(occasion) {
        case 'Wedding':
          return cardName.includes('wedding') || cardName.includes('bridal') || 
                 cardDescription.includes('wedding') || cardDescription.includes('bridal');
        case 'Birthday':
          return cardName.includes('birthday') || cardDescription.includes('birthday');
        case 'Anniversary':
          return cardName.includes('anniversary') || cardDescription.includes('anniversary');
        case 'Other':
          return !cardName.includes('wedding') && !cardName.includes('bridal') && 
                 !cardName.includes('birthday') && !cardName.includes('anniversary') &&
                 (!cardDescription.includes('wedding') && !cardDescription.includes('bridal') && 
                  !cardDescription.includes('birthday') && !cardDescription.includes('anniversary'));
        default:
          return cards;
      }
    });
  };

  // Search filtering
  const filterBySearch = (cards, term) => {
    if (!term) return cards;
    
    return cards.filter(card => {
      const cardName = card.name.toLowerCase();
      const cardDescription = card.description ? card.description.toLowerCase() : '';
      return cardName.includes(term.toLowerCase()) || 
             cardDescription.includes(term.toLowerCase());
    });
  };

  // Fetch gift cards for the salon
  const fetchGiftCards = async () => {
    try {
      setLoading(true);
      const response = await giftCardService.getActiveGiftCards(salonId);
      if (response.success) {
        setGiftCards(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch gift cards');
      }
    } catch (error) {
      console.error('Error fetching gift cards:', error);
      toast.error('Failed to fetch gift cards');
    } finally {
      setLoading(false);
    }
  };

  // Fetch gift cards owned by the current user
  const fetchMyGiftCards = async () => {
    try {
      const response = await giftCardService.getMyGiftCards();
      if (response.success) {
        setMyGiftCards(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch your gift cards');
      }
    } catch (error) {
      console.error('Error fetching your gift cards:', error);
      toast.error('Failed to fetch your gift cards');
    }
  };

  // Apply filters whenever filters change
  useEffect(() => {
    let result = [...giftCards];
    
    // Apply occasion filter
    result = filterByOccasion(result, selectedOccasion);
    
    // Apply search filter
    result = filterBySearch(result, searchTerm);
    
    setFilteredGiftCards(result);
  }, [giftCards, selectedOccasion, searchTerm]);

  // Fetch gift cards on component mount
  useEffect(() => {
    if (salonId) {
      fetchGiftCards();
      fetchMyGiftCards(); // Also fetch the user's gift cards
    }
  }, [salonId]);

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format amount for display
  const formatAmount = (amount) => {
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  if (loading) {
    return <LoadingSpinner text="Loading gift cards..." />;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Gift Cards</h1>
        <p className="text-gray-600 mt-2">Choose the perfect gift for your loved ones</p>
      </div>

      {/* My Gift Cards Section - Show if user has any gift cards */}
      {myGiftCards.length > 0 && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 mb-6 border border-blue-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <Gift className="h-6 w-6 mr-2 text-blue-600" />
              My Gift Cards
            </h2>
            <p className="text-gray-600 mb-4">Gift cards that have been sent to you</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myGiftCards.map((card) => (
                <div key={card._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{card.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold text-indigo-600">{formatAmount(card.balance)}</span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {card.code}
                          </span>
                        </div>
                      </div>
                      {card.occasionType && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                          {card.occasionType}
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Expires: {formatDate(card.expiryDate)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Tag className="h-4 w-4 mr-2" />
                        <span>
                          Valid for: {card.usageType === 'BOTH' ? 'Services & Products' : 
                                     card.usageType === 'SERVICE_ONLY' ? 'Services Only' : 
                                     card.usageType === 'PRODUCT_ONLY' ? 'Products Only' : 
                                     card.usageType.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {card.description && (
                      <p className="text-sm text-gray-700 mb-4 line-clamp-2">{card.description}</p>
                    )}

                    {card.personalMessage && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-sm text-gray-700 italic">"{card.personalMessage}"</p>
                        <p className="text-xs text-gray-500 mt-1">- From the sender</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        card.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        card.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {card.status}
                      </span>
                      
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{card.rating || 4.5}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search gift cards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Occasion Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedOccasion}
              onChange={(e) => setSelectedOccasion(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              {occasions.map(occasion => (
                <option key={occasion} value={occasion}>{occasion}</option>
              ))}
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-end">
            <span className="text-gray-600">{filteredGiftCards.length} gift cards available</span>
          </div>
        </div>
      </div>

      {/* Gift Cards Grid */}
      {filteredGiftCards.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No gift cards found</h3>
          <p className="text-gray-500 mb-6">There are no gift cards available for this salon.</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Browse Salons
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGiftCards.map((card) => (
            <div key={card._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{card.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-bold text-indigo-600">{formatAmount(card.amount)}</span>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {card.code}
                      </span>
                    </div>
                  </div>
                  {card.occasionType && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                      {card.occasionType}
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Expires: {formatDate(card.expiryDate)}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Tag className="h-4 w-4 mr-2" />
                    <span>
                      Valid for: {card.usageType === 'BOTH' ? 'Services & Products' : 
                                 card.usageType === 'SERVICE_ONLY' ? 'Services Only' : 
                                 card.usageType === 'PRODUCT_ONLY' ? 'Products Only' : 
                                 card.usageType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {card.description && (
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2">{card.description}</p>
                )}

                <div className="flex justify-between items-center">
                  <button 
                    onClick={() => {
                      // Navigate to gift card purchase page
                      navigate(`/customer/gift-card/purchase/${card._id}`, { state: { giftCard: card, salonId: salonId } });
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
                  >
                    Gift Now
                  </button>
                  
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">{card.rating || 4.5}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GiftCardsBrowse;