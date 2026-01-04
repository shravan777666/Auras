import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [carts, setCarts] = useState({}); // Object to hold carts for different salons

  // Load all carts from localStorage on app start
  useEffect(() => {
    const loadCarts = () => {
      const allCarts = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('cart_')) {
          try {
            const cart = JSON.parse(localStorage.getItem(key));
            const salonId = key.replace('cart_', '');
            allCarts[salonId] = cart;
          } catch (error) {
            console.error(`Failed to parse cart for ${key}:`, error);
          }
        }
      }
      setCarts(allCarts);
    };

    loadCarts();
  }, []);

  // Get cart for a specific salon
  const getCart = (salonId) => {
    return carts[salonId] || [];
  };

  // Get total items in cart for a specific salon
  const getCartItemCount = (salonId) => {
    const cart = getCart(salonId);
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  // Get total items across all carts
  const getTotalItemCount = () => {
    return Object.values(carts).reduce((total, cart) => {
      return total + cart.reduce((cartTotal, item) => cartTotal + item.quantity, 0);
    }, 0);
  };

  // Update cart for a specific salon
  const updateCart = (salonId, newCart) => {
    setCarts(prev => ({
      ...prev,
      [salonId]: newCart
    }));
    
    // Save to localStorage
    localStorage.setItem(`cart_${salonId}`, JSON.stringify(newCart));
  };

  // Add item to cart
  const addItemToCart = (salonId, item, itemType = 'product') => {
    const currentCart = getCart(salonId);
    const existingItem = currentCart.find(cartItem => cartItem._id === item._id && cartItem.itemType === itemType);
    
    let newCart;
    if (existingItem) {
      newCart = currentCart.map(cartItem => 
        cartItem._id === item._id && cartItem.itemType === itemType
          ? { ...cartItem, quantity: cartItem.quantity + 1 } 
          : cartItem
      );
    } else {
      newCart = [...currentCart, { ...item, quantity: 1, itemType }];
    }
    
    updateCart(salonId, newCart);
  };

  // Add service to cart
  const addServiceToCart = (salonId, service) => {
    addItemToCart(salonId, service, 'service');
  };

  // Add product to cart
  const addProductToCart = (salonId, product) => {
    addItemToCart(salonId, product, 'product');
  };

  // Get items by type
  const getItemsByType = (salonId, itemType) => {
    const cart = getCart(salonId);
    return cart.filter(item => item.itemType === itemType);
  };

  // Get services in cart
  const getServicesInCart = (salonId) => {
    return getItemsByType(salonId, 'service');
  };

  // Get products in cart
  const getProductsInCart = (salonId) => {
    return getItemsByType(salonId, 'product');
  };

  // Get total price for items of a specific type
  const getTotalPriceByType = (salonId, itemType) => {
    const items = getItemsByType(salonId, itemType);
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Get total price for services
  const getTotalServicePrice = (salonId) => {
    return getTotalPriceByType(salonId, 'service');
  };

  // Get total price for products
  const getTotalProductPrice = (salonId) => {
    return getTotalPriceByType(salonId, 'product');
  };

  // Get combined total price
  const getTotalPrice = (salonId) => {
    const cart = getCart(salonId);
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Get item count by type
  const getItemCountByType = (salonId, itemType) => {
    const items = getItemsByType(salonId, itemType);
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Get service count
  const getServiceCount = (salonId) => {
    return getItemCountByType(salonId, 'service');
  };

  // Get product count
  const getProductCount = (salonId) => {
    return getItemCountByType(salonId, 'product');
  };

  // Check if cart has services
  const hasServices = (salonId) => {
    return getServicesInCart(salonId).length > 0;
  };

  // Check if cart has products
  const hasProducts = (salonId) => {
    return getProductsInCart(salonId).length > 0;
  };

  // Check if cart has both services and products
  const hasBothServicesAndProducts = (salonId) => {
    return hasServices(salonId) && hasProducts(salonId);
  };

  // Remove item from cart
  const removeItemFromCart = (salonId, productId) => {
    const currentCart = getCart(salonId);
    const newCart = currentCart.filter(item => item._id !== productId);
    updateCart(salonId, newCart);
  };

  // Update item quantity
  const updateItemQuantity = (salonId, productId, quantity) => {
    const currentCart = getCart(salonId);
    
    if (quantity <= 0) {
      removeItemFromCart(salonId, productId);
      return;
    }
    
    const newCart = currentCart.map(item => 
      item._id === productId 
        ? { ...item, quantity } 
        : item
    );
    
    updateCart(salonId, newCart);
  };

  // Clear cart for a specific salon
  const clearCart = (salonId) => {
    setCarts(prev => {
      const newCarts = { ...prev };
      delete newCarts[salonId];
      return newCarts;
    });
    
    localStorage.removeItem(`cart_${salonId}`);
  };

  return (
    <CartContext.Provider value={{
      carts,
      getCart,
      getCartItemCount,
      getTotalItemCount,
      addItemToCart,
      addServiceToCart,
      addProductToCart,
      removeItemFromCart,
      updateItemQuantity,
      updateCart,
      clearCart,
      getItemsByType,
      getServicesInCart,
      getProductsInCart,
      getTotalPriceByType,
      getTotalServicePrice,
      getTotalProductPrice,
      getTotalPrice,
      getItemCountByType,
      getServiceCount,
      getProductCount,
      hasServices,
      hasProducts,
      hasBothServicesAndProducts
    }}>
      {children}
    </CartContext.Provider>
  );
};