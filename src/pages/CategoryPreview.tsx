import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

interface Category {
  id: number;
  documentId: string;
  name: string;
  description?: string;
  icon?: any;
  image?: any;
  products?: any[];
  services?: any[];
  active: boolean;
  featured: boolean;
  type: string;
}

const CategoryPreview: React.FC = () => {
  const { documentId } = useParams();
  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPreview = searchParams.get('preview') === 'true';
  const status = searchParams.get('status') || 'published';

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setLoading(true);
        
        // Build API URL based on preview status
        const baseUrl = `${process.env.REACT_APP_STRAPI_URL || 'http://localhost:1337'}/api/categories`;
        const url = isPreview 
          ? `${baseUrl}?filters[documentId][$eq]=${documentId}&publicationState=preview&populate=*`
          : `${baseUrl}?filters[documentId][$eq]=${documentId}&populate=*`;

        const response = await axios.get(url);
        
        if (response.data.data && response.data.data.length > 0) {
          setCategory(response.data.data[0]);
        } else {
          setError('Category not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load category');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchCategory();
    }
  }, [documentId, isPreview, status]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Category Not Found</h1>
          <p className="text-gray-500">The requested category could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center font-medium">
          🔍 PREVIEW MODE - This is how your category will look when published
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center space-x-4 mb-6">
            {category.icon?.url && (
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white p-2 shadow-md">
                <img 
                  src={category.icon.url}
                  alt={`${category.name} icon`}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <h1 className="text-4xl font-bold text-gray-900">{category.name}</h1>
          </div>

          {/* Status Indicators */}
          <div className="flex justify-center items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${category.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`font-medium ${category.active ? 'text-green-600' : 'text-red-600'}`}>
                {category.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            {category.featured && (
              <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
                Featured
              </span>
            )}
            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
              {category.type}
            </span>
          </div>

          {category.description && (
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">{category.description}</p>
          )}
        </div>

        {/* Category Banner Image */}
        {category.image?.url && (
          <div className="mb-12">
            <div className="aspect-[21/9] rounded-lg overflow-hidden">
              <img 
                src={category.image.url}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Products Section */}
        {category.products && category.products.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Products in this Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.products.map((product: any, index: number) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {product.image?.url ? (
                    <div className="aspect-square">
                      <img 
                        src={product.image.url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-pink-600 font-bold">${product.price}</span>
                      <span className={`text-sm ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Section */}
        {category.services && category.services.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Services in this Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.services.map((service: any, index: number) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {service.image?.url ? (
                    <div className="aspect-square">
                      <img 
                        src={service.image.url}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-pink-600 font-bold">${service.price}</span>
                      <span className={`text-sm ${service.available ? 'text-green-600' : 'text-red-600'}`}>
                        {service.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    {service.duration && (
                      <p className="text-sm text-gray-500 mt-1">Duration: {service.duration}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!category.products || category.products.length === 0) && (!category.services || category.services.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No Items in Category</h3>
            <p className="text-gray-500">This category doesn't have any products or services yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPreview;