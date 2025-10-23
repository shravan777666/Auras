import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q');

  useEffect(() => {
    // Redirect to explore salons with the search query
    if (query) {
      navigate(`/customer/explore-salons?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/customer/explore-salons');
    }
  }, [query, navigate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">
        Redirecting to search results...
      </h1>
      <p className="text-gray-600">
        Please wait while we redirect you to the search results.
      </p>
    </div>
  );
};

export default SearchResults;