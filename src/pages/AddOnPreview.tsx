import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';

interface AddOn {
  id: number;
  documentId: string;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  duration?: string;
  active: boolean;
  image?: any;
  services?: any[];
  category?: string;
  benefits?: string;
  applicableServiceTypes?: string;
}

const AddOnPreview: React.FC = () => {
  const { documentId } = useParams();
  const [searchParams] = useSearchParams();
  const [addOn, setAddOn] = useState<AddOn | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPreview = searchParams.get('preview') === 'true';
  const status = searchParams.get('status') || 'published';

  useEffect(() => {
    const fetchAddOn = async () => {
      try {
        setLoading(true);
        
        // Build API URL based on preview status
        const baseUrl = `${process.env.REACT_APP_STRAPI_URL || 'http://localhost:1337'}/api/add-ons`;
        const url = isPreview 
          ? `${baseUrl}?filters[documentId][$eq]=${documentId}&publicationState=preview&populate=*`
          : `${baseUrl}?filters[documentId][$eq]=${documentId}&populate=*`;

        const response = await axios.get(url);
        
        if (response.data.data && response.data.data.length > 0) {
          setAddOn(response.data.data[0]);
        } else {
          setError('Add-on not found');
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load add-on');
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      fetchAddOn();
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

  if (!addOn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-600 mb-4">Add-on Not Found</h1>
          <p className="text-gray-500">The requested add-on could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center font-medium">
          🔍 PREVIEW MODE - This is how your add-on will look when published
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add-on Image */}
          <div className="space-y-4">
            {addOn.image?.url ? (
              <div className="aspect-square rounded-lg overflow-hidden">
                <img 
                  src={addOn.image.url}
                  alt={addOn.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-6xl mb-2">🎁</div>
                  <span className="text-gray-400">Add-on Image</span>
                </div>
              </div>
            )}
          </div>

          {/* Add-on Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{addOn.name}</h1>
              {addOn.category && (
                <p className="text-pink-600 font-medium">{addOn.category}</p>
              )}
            </div>

            {/* Price and Duration */}
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-3xl font-bold text-pink-600">${addOn.price}</span>
              </div>
              {addOn.duration && (
                <div className="text-gray-600">
                  <span className="font-medium">Duration:</span> {addOn.duration}
                </div>
              )}
            </div>

            {/* Availability Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${addOn.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`font-medium ${addOn.active ? 'text-green-600' : 'text-red-600'}`}>
                {addOn.active ? 'Available' : 'Currently Unavailable'}
              </span>
            </div>

            {/* Short Description */}
            {addOn.shortDescription && (
              <div className="bg-pink-50 p-4 rounded-lg">
                <p className="text-pink-800 font-medium">{addOn.shortDescription}</p>
              </div>
            )}

            {/* Description */}
            {addOn.description && (
              <div className="prose prose-gray max-w-none">
                <div dangerouslySetInnerHTML={{ __html: addOn.description }} />
              </div>
            )}

            {/* Add-on Details */}
            <div className="grid grid-cols-1 gap-4">
              {addOn.benefits && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Benefits</h3>
                  <p className="text-gray-600">{addOn.benefits}</p>
                </div>
              )}
              
              {addOn.applicableServiceTypes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Compatible Services</h3>
                  <p className="text-gray-600">{addOn.applicableServiceTypes}</p>
                </div>
              )}
            </div>

            {/* Add to Cart Button */}
            <button className="w-full bg-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-pink-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed" disabled={!addOn.active}>
              {addOn.active ? 'Add to Service' : 'Currently Unavailable'}
            </button>
          </div>
        </div>

        {/* Compatible Services */}
        {addOn.services && addOn.services.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Compatible Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addOn.services.map((service: any, index: number) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {service.image?.url ? (
                    <div className="aspect-[4/3]">
                      <img 
                        src={service.image.url}
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{service.name}</h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-pink-600 font-bold">${service.price}</span>
                      <span className={`text-sm ${service.available ? 'text-green-600' : 'text-red-600'}`}>
                        {service.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    {service.duration && (
                      <p className="text-sm text-gray-500">Duration: {service.duration}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddOnPreview;