import { useState, useEffect } from 'react';
import { X, Save, Package } from 'lucide-react';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: number;
    name: string;
    sku: string;
    category: string;
    quality_type?: string; // Added quality_type field
    price: number;
    quantity: number;
    minStock: number;
    supplier?: string;
    location?: string;
    description?: string;
    imageUrl?: string;
  } | null;
  onItemUpdated: () => void;
}

const categories = ['Engine Parts', 'Brake System', 'Electrical', 'Filters', 'Fluids', 'Tools'];

const EditItemModal = ({ isOpen, onClose, item, onItemUpdated }: EditItemModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    qualityType: '', // Added qualityType field
    unitPrice: '',
    quantity: '',
    minStock: '',
    supplier: '',
    location: '',
    description: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        sku: item.sku || '',
        category: item.category || '',
        qualityType: item.quality_type || 'original', // Set qualityType from item
        unitPrice: item.price?.toString() || '',
        quantity: item.quantity?.toString() || '',
        minStock: item.minStock?.toString() || '',
        supplier: item.supplier || '',
        location: item.location || '',
        description: item.description || '',
      });
      setImagePreview(item.imageUrl ? `https://ipasystem.bymsystem.com${item.imageUrl}` : null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle quality type selection
  const handleQualityTypeSelect = (id: string) => {
    setFormData(prev => ({ ...prev, qualityType: id }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = new FormData();
    // Append all fields with correct names
    payload.append('name', formData.name);
    payload.append('sku', formData.sku);
    payload.append('category', formData.category);
    payload.append('qualityType', formData.qualityType); // Added qualityType
    payload.append('unitPrice', formData.unitPrice);
    payload.append('quantity', formData.quantity);
    payload.append('minStock', formData.minStock);
    payload.append('supplier', formData.supplier || '');
    payload.append('location', formData.location || '');
    payload.append('description', formData.description || '');
    if (image) {
      payload.append('image', image);
    }
    try {
      const response = await fetch(`https://ipasystem.bymsystem.com/api/inventory/items/${item?.id}`, {
        method: 'PUT',
        body: payload,
      });
      const result = await response.json();
      if (response.ok) {
        alert('✅ Item updated successfully!');
        onItemUpdated();
        onClose();
      } else {
        alert(`❌ ${result.message || 'Failed to update item'}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('❌ Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quality options with icons
  const qualityOptions = [
    { 
      id: 'original', 
      label: 'Original', 
      icon: '⭐',
      description: 'Genuine manufacturer part'
    },
    { 
      id: 'local', 
      label: 'Local', 
      icon: '🏭',
      description: 'Quality local production'
    },
    { 
      id: 'high-copy', 
      label: 'High Copy', 
      icon: '🔍',
      description: 'Premium replica'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 text-black">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Edit Item</h3>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Quality Type Radio Buttons */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Quality Type *</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {qualityOptions.map((option) => (
                  <div
                    key={option.id}
                    onClick={() => handleQualityTypeSelect(option.id)}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 ${
                      formData.qualityType === option.id
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <span className="text-xl">{option.icon}</span>
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{option.label}</span>
                        <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                      </div>
                    </div>
                    {formData.qualityType === option.id && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                    {/* Hidden radio button for form submission */}
                    <input
                      type="radio"
                      name="qualityType"
                      value={option.id}
                      checked={formData.qualityType === option.id}
                      onChange={() => {}}
                      className="sr-only"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Price *</label>
              <input
                type="number"
                step="0.01"
                name="price"
                value={formData.unitPrice}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Min Stock *</label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Supplier</label>
              <input
                type="text"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500"
                placeholder="e.g., A1-B2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-green-500"
            ></textarea>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Item Image</label>
            <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 cursor-pointer">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 mx-auto mb-2 object-cover rounded"
                />
              ) : (
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              )}
              <p className="text-gray-600 font-medium">
                {imagePreview ? 'Change image' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
              <input type="file" accept="image/*" onChange={handleImageChange} className="sr-only" />
            </label>
          </div>
          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-70 transition font-medium shadow-lg flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Updating...' : 'Update Item'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;