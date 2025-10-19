import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/customer';
import { Link } from 'react-router-dom';

const FavoriteSalonCard = () => {
  const [favoriteSalon, setFavoriteSalon] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteSalon = async () => {
      try {
        const response = await customerService.getProfile();
        if (response.data && response.data.favoriteSalon) {
          // Assuming getSalonDetails exists and fetches salon details
          const salonDetails = await customerService.getSalonDetails(response.data.favoriteSalon);
          setFavoriteSalon(salonDetails.data);
        }
      } catch (error) {
        console.error("Error fetching favorite salon:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavoriteSalon();
  }, []);

  const handleToggleFavorite = async () => {
    const newFavoriteSalon = favoriteSalon ? null : 'SALON_ID_TO_BE_REPLACED'; // Replace with actual salon id
    try {
      await customerService.updateFavoriteSalon(newFavoriteSalon);
      setFavoriteSalon(newFavoriteSalon);
    } catch (error) {
      console.error("Error updating favorite salon:", error);
    }
  };

  if (isLoading) {
    return <div>Loading favorite salon...</div>;
  }

  if (!favoriteSalon) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h3 className="text-xl font-semibold mb-4">Favorite Salon</h3>
        <p className="text-gray-600 mb-4">You haven't set a favorite salon yet.</p>
        <Link to="/salons" className="text-blue-500 hover:underline">Explore and add a favorite</Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold">{favoriteSalon.salonName}</h3>
          <p className="text-gray-600">{favoriteSalon.salonAddress?.city}</p>
          <p className="text-yellow-500">{'★'.repeat(Math.round(favoriteSalon.rating?.average || 0))}</p>
        </div>
        <button onClick={handleToggleFavorite} className="text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={favoriteSalon ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 016.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" />
          </svg>
        </button>
      </div>
      <div className="mt-4">
        <Link to={`/salons/${favoriteSalon._id}/book`} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Book Now</Link>
      </div>
    </div>
  );
};

export default FavoriteSalonCard;
