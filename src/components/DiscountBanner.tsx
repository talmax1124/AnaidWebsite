import React, { useState, useEffect, useCallback } from 'react';
import { X, Tag, Clock, Gift, Zap } from 'lucide-react';
import { discountService, Discount } from '../services/discountService';

interface DiscountBannerProps {
  onDiscountSelect?: (discount: Discount) => void;
  currentPage?: 'products' | 'services' | 'all';
}

const DiscountBanner: React.FC<DiscountBannerProps> = ({ 
  onDiscountSelect, 
  currentPage = 'all' 
}) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [currentDiscountIndex, setCurrentDiscountIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchActiveDiscounts = useCallback(async () => {
    try {
      setLoading(true);
      const activeDiscounts = await discountService.getActiveDiscounts();
      
      // Filter discounts based on current page
      const filteredDiscounts = activeDiscounts.filter(discount => {
        if (currentPage === 'all') return true;
        if (currentPage === 'products' && discount.applicableTo === 'products') return true;
        if (currentPage === 'services' && discount.applicableTo === 'services') return true;
        if (discount.applicableTo === 'all') return true;
        return false;
      });

      // Only show discounts that are currently valid and have good visibility
      const visibleDiscounts = filteredDiscounts.filter(discount => 
        discountService.isDiscountValid(discount) && 
        (discount.automaticallyApply || discount.code)
      );

      setDiscounts(visibleDiscounts);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchActiveDiscounts();
  }, [fetchActiveDiscounts]);

  useEffect(() => {
    if (discounts.length > 1) {
      const interval = setInterval(() => {
        setCurrentDiscountIndex((prev) => (prev + 1) % discounts.length);
      }, 4000); // Rotate every 4 seconds

      return () => clearInterval(interval);
    }
  }, [discounts.length]);

  

  const handleDiscountClick = (discount: Discount) => {
    if (onDiscountSelect) {
      onDiscountSelect(discount);
    } else {
      // Copy discount code to clipboard
      if (discount.code) {
        navigator.clipboard.writeText(discount.code);
        // You might want to show a toast notification here
      }
    }
  };

  const getDiscountIcon = (type: string) => {
    switch (type) {
      case 'percentage':
      case 'fixed':
        return <Tag className="w-5 h-5" />;
      case 'free_shipping':
        return <Gift className="w-5 h-5" />;
      case 'bxgy':
        return <Zap className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  const getUrgencyLevel = (discount: Discount): 'low' | 'medium' | 'high' => {
    if (!discount.validUntil) return 'low';
    
    const now = new Date();
    const end = new Date(discount.validUntil);
    const hoursLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursLeft <= 24) return 'high';
    if (hoursLeft <= 72) return 'medium';
    return 'low';
  };

  const formatTimeLeft = (validUntil: string): string => {
    const now = new Date();
    const end = new Date(validUntil);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
    return `${hours} hour${hours > 1 ? 's' : ''} left`;
  };

  if (loading || !isVisible || discounts.length === 0) {
    return null;
  }

  const currentDiscount = discounts[currentDiscountIndex];
  const urgency = getUrgencyLevel(currentDiscount);

  const getBackgroundColor = () => {
    switch (urgency) {
      case 'high':
        return 'bg-gradient-to-r from-red-500 to-red-600';
      case 'medium':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
      default:
        return 'bg-gradient-to-r from-primary-500 to-primary-600';
    }
  };

  return (
    <div className={`${getBackgroundColor()} text-white shadow-lg relative overflow-hidden`}>
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse" />
      </div>
      
      <div className="container-custom py-3 relative z-10">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-4 cursor-pointer flex-1"
            onClick={() => handleDiscountClick(currentDiscount)}
          >
            {/* Icon */}
            <div className="flex-shrink-0 p-2 bg-white bg-opacity-20 rounded-lg">
              {getDiscountIcon(currentDiscount.type)}
            </div>
            
            {/* Content */}
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <span className="font-bold text-lg">
                  {discountService.formatDiscountDescription(currentDiscount)}
                </span>
                
                {currentDiscount.code && (
                  <span className="bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-bold tracking-wide">
                    {currentDiscount.code}
                  </span>
                )}
                
                {currentDiscount.validUntil && urgency !== 'low' && (
                  <span className="flex items-center space-x-1 text-sm opacity-90">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeLeft(currentDiscount.validUntil)}</span>
                  </span>
                )}
              </div>
              
              <p className="text-sm opacity-90 mt-1">
                {currentDiscount.description || 'Limited time offer - shop now and save!'}
                {currentDiscount.code && ' • Click to copy code'}
              </p>
            </div>
            
            {/* Discount indicators */}
            <div className="flex items-center space-x-2">
              {discounts.length > 1 && (
                <div className="flex space-x-1">
                  {discounts.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-opacity ${
                        index === currentDiscountIndex ? 'bg-white' : 'bg-white opacity-50'
                      }`}
                    />
                  ))}
                </div>
              )}
              
              {urgency === 'high' && (
                <div className="flex items-center space-x-1 bg-white bg-opacity-20 px-2 py-1 rounded">
                  <Zap className="w-3 h-3" />
                  <span className="text-xs font-medium">URGENT</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="ml-4 p-1 hover:bg-white hover:bg-opacity-20 rounded transition-colors"
            aria-label="Dismiss banner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscountBanner;
