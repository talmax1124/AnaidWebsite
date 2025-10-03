import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Service } from '../types';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => void;
  service?: Service | null;
}

const emojiOptions = [
  // Beauty & Glamour
  '✨', '💫', '🌟', '💎', '👁️', '🎯', '🔥', '💖', 
  '🌺', '🦋', '💐', '🌸', '🌿', '⭐', '💝', '🎨',
  '💧', '🧴', '🎪', '🏆', '💆', '🧼', '🎀', '💄',
  '🌈', '💍', '🎭', '🔮', '🍃', '🌙', '☀️', '⚡',
  '🌊', '🕊️', '🌷', '🌹', '🥀', '🌻', '🌱', '🦢',
  '🧚', '🪶', '💅', '🎗️', '🎳', '🎲', '🔬', '🪄',
  '💊', '🌀', '✂️', '🪞', '🧴', '🌴', '🍯', '🌵',
  '🪷', '🌺', '🥥', '🍀', '🌿', '🍃', '🔸', '🔹',
  '💠', '🔷', '🔶', '⚪', '🟢', '🟣', '🟡', '🟠',
  // Lashes & Eyes
  '👀', '👁️‍🗨️', '🤍', '🖤', '💜', '💙', '💚', '🤎',
  '✏️', '🖊️', '🖌️', '🎪', '🌸', '🦚', '🕷️', '🕸️',
  // Skincare & Wellness
  '🧴', '🧽', '🧼', '🧊', '💎', '🤲', '👐', '🙌',
  '🌿', '🍀', '🌱', '🌾', '🌳', '🌲', '🎋', '🪴',
  '🥒', '🥑', '🍃', '🌊', '💧', '❄️', '🧊', '⛄',
  // Facial & Spa
  '🧖‍♀️', '🧘‍♀️', '🛁', '🚿', '🧴', '🪥', '🪒', '🪃',
  '⛑️', '🎭', '🎪', '🎨', '🖼️', '🖌️', '🎯', '🎪',
  // Hair & Color
  '💇‍♀️', '💆‍♀️', '🎨', '🌈', '🦄', '🎪', '🎭', '🎯',
  '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '🟤', '⚫',
  '⚪', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫',
  // Nails & Manicure
  '💅', '💍', '💎', '✨', '🌟', '⭐', '🌠', '💫',
  '🎨', '🖌️', '✏️', '🖊️', '🖍️', '🎪', '🎭', '🎯',
  // Special Occasions
  '👰‍♀️', '🤵‍♀️', '💒', '🎊', '🎉', '🥳', '🎈', '🎀',
  '🎁', '💝', '🎂', '🍰', '🧁', '🍭', '🍬', '🍫',
  // Nature & Organic
  '🌿', '🍃', '🌱', '🌾', '🌳', '🌲', '🎋', '🪴',
  '🥒', '🥑', '🥬', '🥦', '🌽', '🍇', '🍓', '🫐',
  '🍊', '🍋', '🍌', '🥭', '🍑', '🍒', '🍉', '🥝',
  // Luxury & Premium
  '👑', '💎', '💍', '💰', '🏆', '🥇', '🌟', '⭐',
  '✨', '💫', '🌠', '🎪', '🎭', '🎯', '🔮', '🪄',
  // Seasonal & Special
  '❄️', '🌨️', '☃️', '⛄', '🎄', '🎅', '🤶', '🎁',
  '🌸', '🌺', '🌻', '🌷', '🌹', '🥀', '💐', '🌼',
  '🍂', '🍁', '🎃', '👻', '🦇', '🕷️', '🕸️', '🌙',
  '☀️', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖',
  // Extra variety
  '👑', '🪷', '🍵', '🍯', '🧖‍♀️', '🛁', '🚿', '🧊'
];

const ServiceModal: React.FC<ServiceModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  service 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    icon: '✨',
    category: 'lashes' as Service['category'],
    active: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description,
        price: service.price.toString(),
        duration: service.duration.toString(),
        icon: service.icon,
        category: service.category,
        active: service.active
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        duration: '',
        icon: '✨',
        category: 'lashes',
        active: true
      });
    }
    setErrors({});
  }, [service, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Valid duration is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const serviceData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
      icon: formData.icon,
      category: formData.category,
      active: formData.active
    };

    onSubmit(serviceData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {service ? 'Edit Service' : 'Add New Service'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Service Name */}
          <div>
            <label className="form-label">Service Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`form-input ${errors.name ? 'border-red-500' : ''}`}
              placeholder="e.g., Classic Lashes"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className={`form-input ${errors.description ? 'border-red-500' : ''}`}
              rows={3}
              placeholder="Describe what's included in this service..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Price and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Price ($) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                className={`form-input ${errors.price ? 'border-red-500' : ''}`}
                placeholder="120.00"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="form-label">Duration (min) *</label>
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                className={`form-input ${errors.duration ? 'border-red-500' : ''}`}
                placeholder="120"
              />
              {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="form-label">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="form-input"
            >
              <option value="lashes">Lashes</option>
              <option value="lash-lift">Lash Lift</option>
              <option value="lash-tinting">Lash Tinting</option>
              <option value="brows">Brows</option>
              <option value="brow-lamination">Brow Lamination</option>
              <option value="eyebrow-tinting">Eyebrow Tinting</option>
              <option value="microblading">Microblading</option>
              <option value="permanent-makeup">Permanent Makeup</option>
              <option value="lip-blush">Lip Blush</option>
              <option value="threading">Threading</option>
              <option value="facial">Facial</option>
              <option value="hydrafacial">HydraFacial</option>
              <option value="chemical-peel">Chemical Peel</option>
              <option value="microneedling">Microneedling</option>
              <option value="dermaplaning">Dermaplaning</option>
              <option value="skincare">Skincare</option>
              <option value="acne-treatment">Acne Treatment</option>
              <option value="anti-aging">Anti-Aging</option>
              <option value="brightening">Brightening</option>
              <option value="sensitive-skin">Sensitive Skin</option>
              <option value="massage">Massage</option>
              <option value="lymphatic-drainage">Lymphatic Drainage</option>
              <option value="body-contouring">Body Contouring</option>
              <option value="waxing">Waxing</option>
              <option value="nails">Nails</option>
              <option value="hair">Hair</option>
              <option value="makeup">Makeup</option>
              <option value="consultation">Consultation</option>
              <option value="package-deals">Package Deals</option>
              <option value="seasonal-special">Seasonal Special</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Icon */}
          <div>
            <label className="form-label">Icon</label>
            <div className="grid grid-cols-8 gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleChange('icon', emoji)}
                  className={`p-2 text-xl rounded-lg border-2 hover:bg-gray-50 ${
                    formData.icon === emoji 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => handleChange('active', e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700">
              Active (visible to customers)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              {service ? 'Update Service' : 'Create Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;
