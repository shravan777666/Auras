import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { productService } from '../../services/product';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import BackButton from '../../components/common/BackButton';
import AddProductModal from '../../components/salon/AddProductModal';
import { toast } from 'react-hot-toast';
import { 
  PlusCircle, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Eye,
  DollarSign,
  Tag,
  ArrowLeft,
  MoreVertical,
  ShoppingCart,
  Package,
  Box,
  AlertTriangle,
  TrendingDown
} from 'lucide-react';

const ManageProducts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [showAlertProductsOnly, setShowAlertProductsOnly] = useState(false);
  const [lowSalesThreshold] = useState(5); // Threshold for low sales
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalItems: 0
  });

  // Parse URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');
    
    if (filterParam === 'low_sales') {
      setShowAlertProductsOnly(true);
    }
  }, [location.search]);

  // Fetch products
  const fetchProducts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await productService.getProducts({
        page,
        limit: pagination.limit,
        category: categoryFilter || undefined,
        // Always filter for active products unless specifically requesting inactive ones
        active: statusFilter ? statusFilter === 'true' : true,
        filter: showAlertProductsOnly ? 'low_sales' : undefined
      });
      
      // DEBUG: Log the actual response structure
      console.log('API Response:', response);
      
      // FIX: Correctly access the data structure { success: true, data: [...], meta: {...} }
      const productsData = response?.data?.data ?? [];
      const metaData = response?.data?.meta ?? {};
      
      setProducts(productsData);
      setPagination({
        page: metaData?.page ?? 1,
        limit: metaData?.limit ?? 20,
        totalPages: metaData?.totalPages ?? 1,
        totalItems: metaData?.totalItems ?? (productsData ? productsData.length : 0)
      });
      
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch products';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, statusFilter, showAlertProductsOnly, pagination.page, location.search]);

  // Get count of products with low sales
  const getLowSalesCount = () => {
    return products.filter(product => (product?.totalSales ?? 0) < lowSalesThreshold).length;
  };

  // Filter products based on all criteria
  const getFilteredProducts = () => {
    let filtered = products;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        (product?.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product?.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product?.category ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(product => (product?.category ?? '') === categoryFilter);
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(product => (product?.isActive ?? false) === (statusFilter === 'true'));
    }
    
    // Apply alert products filter (but only for active products)
    if (showAlertProductsOnly) {
      filtered = filtered.filter(product => 
        (product?.isActive ?? false) === true && 
        (product?.totalSales ?? 0) < lowSalesThreshold
      );
    }
    
    return filtered;
  };

  const handleProductAdded = () => {
    fetchProducts(pagination.page);
    setIsAddProductModalOpen(false);
  };

  const handleProductUpdated = () => {
    fetchProducts(pagination.page);
    setProductToEdit(null);
    setIsAddProductModalOpen(false);
  };

  const handleEdit = (product) => {
    setProductToEdit(product);
    setIsAddProductModalOpen(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productService.deleteProduct(productId);
        fetchProducts(pagination.page);
        toast.success('Product deleted successfully');
      } catch (error) {
        toast.error('Failed to delete product');
      }
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleAlertFilterToggle = () => {
    const newShowAlertProductsOnly = !showAlertProductsOnly;
    setShowAlertProductsOnly(newShowAlertProductsOnly);
    
    // Update URL to reflect the filter state
    const params = new URLSearchParams(location.search);
    if (newShowAlertProductsOnly) {
      params.set('filter', 'low_sales');
    } else {
      params.delete('filter');
    }
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>
    );
  };

  const getCategoryIcon = (category) => {
    // Safely handle undefined category
    const safeCategory = category ?? '';
    
    switch (safeCategory) {
      case 'Hair':
        return <Box className="h-4 w-4" />;
      case 'Skin':
        return <Package className="h-4 w-4" />;
      case 'Nails':
        return <ShoppingCart className="h-4 w-4" />;
      default:
        return <Tag className="h-4 w-4" />;
    }
  };

  // Get low sales alert info for a product
  const getProductAlertInfo = (product) => {
    // Safely access product properties
    const totalSales = product?.totalSales ?? 0;
    
    if (totalSales < lowSalesThreshold) {
      const targetSales = lowSalesThreshold * 4; // Monthly target is 4 times the threshold
      return {
        isLowSale: true,
        message: `Sales: ${totalSales}/Month (Target: ${targetSales})`
      };
    }
    return { isLowSale: false };
  };

  const filteredProducts = getFilteredProducts();
  const lowSalesCount = getLowSalesCount();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/salon/dashboard')}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manage Products</h1>
              {showAlertProductsOnly ? (
                <p className="text-gray-600">Showing {products?.length ?? 0} Products with Low Sales</p>
              ) : (
                <p className="text-gray-600">Add, edit, and manage your salon products</p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setProductToEdit(null);
              setIsAddProductModalOpen(true);
            }}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:from-pink-600 hover:to-purple-700 transition-all"
          >
            <PlusCircle size={20} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">All Categories</option>
            <option value="Hair">Hair</option>
            <option value="Skin">Skin</option>
            <option value="Nails">Nails</option>
            <option value="Makeup">Makeup</option>
            <option value="Fragrance">Fragrance</option>
            <option value="Tools">Tools</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button
            onClick={handleAlertFilterToggle}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all font-medium ${
              showAlertProductsOnly
                ? 'bg-red-600 hover:bg-red-700 text-white shadow-md transform hover:scale-105'
                : 'bg-orange-100 hover:bg-orange-200 text-orange-800 border border-orange-300'
            }`}
          >
            <AlertTriangle size={16} />
            <span>
              {showAlertProductsOnly 
                ? '[Clear Alert Filter]' 
                : `Show Alert Products Only (${pagination?.totalItems ?? 0})`}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Filter size={16} />
          <span>Total: {products?.length ?? 0} products</span>
          {showAlertProductsOnly && (
            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
              Showing only alert products
            </span>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredProducts.map((product) => {
          const alertInfo = getProductAlertInfo(product);
          
          return (
            <div key={product?._id ?? Math.random()} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Product Image */}
              {product?.image ? (
                <div className="w-full h-48 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product?.name ?? 'Product'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{product?.name ?? 'Unnamed Product'}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{product?.description ?? ''}</p>
                    {product?.ingredients && product.ingredients.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-500 font-medium">Ingredients:</p>
                        <p className="text-xs text-gray-600">{product.ingredients.slice(0, 3).join(', ')}{product.ingredients.length > 3 ? '...' : ''}</p>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      {getCategoryIcon(product?.category)}
                      <span className="ml-1">{product?.category ?? 'Uncategorized'}</span>
                    </div>
                    {product?.brand && (
                      <div className="flex items-center text-gray-600">
                        <Tag size={16} className="mr-1" />
                        <span>{product?.brand}</span>
                      </div>
                    )}
                  </div>

                  {/* Alert Badge for Low Sales */}
                  {alertInfo.isLowSale && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-red-800">LOW SALES ALERT</p>
                          <p className="text-xs text-red-700 mt-1">{alertInfo.message}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <button 
                          onClick={() => navigate('/salon/marketing?promo_product=' + (product?._id ?? ''))}
                          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          Run 10% Promo
                        </button>
                        <button 
                          onClick={() => navigate('/salon/analytics?product=' + (product?._id ?? ''))}
                          className="text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                        >
                          View Analytics
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-green-600 font-semibold">
                      <DollarSign size={16} />
                      <span>₹{product?.price ?? 0}</span>
                    </div>
                    {getStatusBadge(product?.isActive)}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Stock: {product?.quantity ?? 0}</span>
                    <span>Sales: {product?.totalSales ?? 0}</span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                  <button onClick={() => handleEdit(product)} className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button onClick={() => handleDelete(product?._id)} className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || categoryFilter || statusFilter || showAlertProductsOnly
                ? "Try adjusting your search or filters" 
                : "Get started by adding your first product"}
            </p>
            {!searchQuery && !categoryFilter && !statusFilter && !showAlertProductsOnly && (
              <button
                onClick={() => setIsAddProductModalOpen(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all"
              >
                Add Your First Product
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination?.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-md">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: pagination?.totalPages ?? 1 }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm rounded-lg ${
                  page === pagination?.page
                    ? 'bg-pink-500 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => handlePageChange((pagination?.page ?? 1) + 1)}
            disabled={pagination?.page === pagination?.totalPages}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isAddProductModalOpen && (
        <AddProductModal
          isOpen={isAddProductModalOpen}
          onClose={() => {
            setIsAddProductModalOpen(false);
            setProductToEdit(null);
          }}
          onProductAdded={handleProductAdded}
          onProductUpdated={handleProductUpdated}
          productToEdit={productToEdit}
        />
      )}
    </div>
  );
};

export default ManageProducts;