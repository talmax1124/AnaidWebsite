import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { AddOn, Service } from '../types';

interface AddOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (addOn: Omit<AddOn, 'id' | 'createdAt' | 'updatedAt'>) => void;
  addOn?: AddOn | null;
  services: Service[];
}

const emojiOptions = [
  // Beauty & Glamour
  '✨', '💫', '🌟', '💎', '👁️', '🎯', '🔥', '💖',
  '🌺', '🦋', '💐', '🌸', '🌿', '⭐', '💝', '🎨',
  '💧', '🧴', '🎪', '🏆', '💆', '🧼', '🎀', '💄',
  '🌈', '💍', '🎭', '🔮', '🍃', '🌙', '☀️', '⚡',
  '🌊', '🕊️', '🌷', '🌹', '🥀', '🌻', '🌱', '🦢',
  '🧚', '🪶', '💅', '🎗️', '🪄', '🔬', '🪞', '✂️',
  // Spa & Skincare
  '🧴', '🧽', '🧼', '🧊', '🤲', '👐', '🙌', '🧖‍♀️',
  '🛁', '🚿', '🥒', '🥑', '🍯', '🍵', '🧘‍♀️', '🪷',
  '🪥', '🪒', '🧺', '🧦',
  // Colors & Shapes
  '🔸', '🔹', '💠', '🔷', '🔶', '⚪', '⚫', '🟢',
  '🟣', '🟡', '🟠', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '🟫',
  // Seasonal & Special
  '❄️', '🌨️', '☃️', '⛄', '🎄', '🎁', '🎉', '🎊',
  '🎃', '👻', '🌞', '🌛'
];

const AddOnModal: React.FC<AddOnModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  addOn,
  services
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    icon: '✨',
    category: 'enhancement' as AddOn['category'],
    active: true,
    compatibleServices: [] as string[]
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (addOn) {
      setFormData({
        name: addOn.name,
        description: addOn.description,
        price: addOn.price.toString(),
        duration: addOn.duration.toString(),
        icon: addOn.icon,
        category: addOn.category,
        active: addOn.active,
        compatibleServices: addOn.compatibleServices
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        duration: '',
        icon: '✨',
        category: 'enhancement',
        active: true,
        compatibleServices: []
      });
    }
    setErrors({});
  }, [addOn, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Add-on name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }

    if (!formData.duration) {
      newErrors.duration = 'Duration is required';
    }

    if (formData.compatibleServices.length === 0) {
      newErrors.compatibleServices = 'At least one compatible service must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      duration: parseInt(formData.duration),
      icon: formData.icon,
      category: formData.category,
      active: formData.active,
      compatibleServices: formData.compatibleServices
    });

    onClose();
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      compatibleServices: prev.compatibleServices.includes(serviceId)
        ? prev.compatibleServices.filter(id => id !== serviceId)
        : [...prev.compatibleServices, serviceId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {addOn ? 'Edit Add-On' : 'Add New Add-On'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add-On Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Lash Primer"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              placeholder="Describe the add-on..."
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Time (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
              {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <div className="grid grid-cols-8 gap-2">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: emoji })}
                  className={`p-2 text-xl border rounded-md hover:bg-gray-50 ${
                    formData.icon === emoji ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="enhancement">Enhancement</option>
              <option value="lashes">Lashes</option>
              <option value="brows">Brows</option>
              <option value="aftercare">Aftercare</option>
              <option value="skincare">Skincare</option>
              <option value="massage">Massage</option>
              <option value="facial">Facial</option>
              <option value="waxing">Waxing</option>
              <option value="nails">Nails</option>
              <option value="hair">Hair</option>
              <option value="makeup">Makeup</option>
              <option value="wellness">Wellness</option>
              <option value="tools">Tools & Equipment</option>
              <option value="products">Products</option>
              {/* Expanded skincare and service-related categories */}
              <option value="hydration">Hydration</option>
              <option value="cleansing">Cleansing</option>
              <option value="exfoliation">Exfoliation</option>
              <option value="serum">Serum</option>
              <option value="moisturizer">Moisturizer</option>
              <option value="sunscreen">Sunscreen</option>
              <option value="primer">Primer</option>
              <option value="setting">Setting</option>
              <option value="removal">Removal</option>
              <option value="prep">Prep</option>
              <option value="tinting">Tinting</option>
              <option value="lifting">Lifting</option>
              <option value="lamination">Lamination</option>
              <option value="brightening">Brightening</option>
              <option value="soothing">Soothing</option>
              <option value="anti-aging">Anti-Aging</option>
              <option value="acne-care">Acne Care</option>
              <option value="sensitive-care">Sensitive Care</option>
              <option value="luxury">Luxury</option>
              <option value="travel-size">Travel Size</option>
              <option value="gift-set">Gift Set</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compatible Services
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
              {services.map((service) => (
                <label key={service.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.compatibleServices.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{service.name}</span>
                </label>
              ))}
            </div>
            {errors.compatibleServices && (
              <p className="text-red-500 text-sm mt-1">{errors.compatibleServices}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="active"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="active" className="ml-2 text-sm font-medium text-gray-700">
              Active (visible to customers)
            </label>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              {addOn ? 'Update' : 'Create'} Add-On
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOnModal;
