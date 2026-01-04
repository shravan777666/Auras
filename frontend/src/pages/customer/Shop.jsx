import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerService } from '../../services/customer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BackButton from '../../components/common/BackButton';
import { ShoppingCart, Package, Tag, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const Shop = () => {
  const { salonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch salon details
        const salonRes = await customerService.getSalonDetails(salonId);
        if (salonRes?.success) {
          setSalon(salonRes.data);
        }
        
        // Fetch products (we'll need to implement this in the customer service)
        // For now, we'll simulate with salon services
        if (salonRes?.success && salonRes.data?.services) {
          // In a real implementation, we would fetch actual products
          // For now, we'll use services as placeholders
          setProducts(salonRes.data.services.map(service => ({
            _id: service._id,
            name: service.name,
            description: service.description,
            price: service.price,
            category: service.category,
            image: null, // Would be actual product image in real implementation
            brand: 'Service', // Placeholder
            quantity: 10 // Placeholder stock
          })));
        }
      } catch (error) {
        toast.error('Failed to load shop data');
        console.error('Error fetching shop data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (salonId) {
      fetchData();
    }
  }, [salonId]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        return prevCart.map(item => 
          item._id === product._id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
    toast.success(`${product.name} added to cart!`);
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item._id === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <BackButton fallbackPath={`/customer/book-appointment/${salonId}`} className="mb-4" />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shop Products</h1>
          {salon && (
            <p className="text-gray-600 mt-1">
              Browse products from {salon.salonName}
            </p>
          )}
        </div>
        
        {cart.length > 0 && (
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <span className="text-lg font-semibold">
              Cart: ₹{getTotalPrice().toFixed(2)}
            </span>
            <button
              onClick={() => toast('Checkout functionality would go here', { icon: '🛒' })}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              Checkout ({cart.length})
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Products Grid */}
        <div className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No products available</h3>
              <p className="text-gray-500">
                This salon hasn't added any products yet. Check back later!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Product Image */}
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      <span className="text-lg font-bold text-green-600">
                        ₹{product.price?.toFixed(2)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span className="flex items-center">
                        <Tag className="h-4 w-4 mr-1" />
                        {product.category || 'Uncategorized'}
                      </span>
                      <span>
                        Stock: {product.quantity || 0}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Shopping Cart Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Cart
            </h2>
            
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Your cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add some products to get started
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {cart.map(item => (
                    <div key={item._id} className="border-b pb-4 last:border-b-0">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{item.name}</h3>
                          <p className="text-sm text-gray-500">₹{item.price?.toFixed(2)}</p>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border rounded">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="px-3 py-1">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        
                        <span className="font-medium">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between text-lg font-bold mb-4">
                    <span>Total:</span>
                    <span>₹{getTotalPrice().toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={() => toast('Checkout functionality would go here', { icon: '🛒' })}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Proceed to Checkout
                  </button>
                  
                  <button
                    onClick={() => setCart([])}
                    className="w-full mt-2 py-2 text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Clear Cart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;