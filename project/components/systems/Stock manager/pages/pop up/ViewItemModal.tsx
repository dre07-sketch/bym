import { useState } from 'react';
import { X, Package, MapPin, User, Calendar, DollarSign, Hash, Tag } from 'lucide-react';

interface ViewItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: number;
    name: string;
    sku: string;
    category: string;
    price: number;
    quantity: number;
    minStock: number;
    maxStock?: number | null;
    supplier?: string | null;
    location?: string | null;
    description?: string | null;
    imageUrl?: string | null;
    lastUpdated: string;
  } | null;
}

const ViewItemModal = ({ isOpen, onClose, item }: ViewItemModalProps) => {
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !item) return null;

  // Compute status
  const getStatusText = () => {
    if (item.quantity === 0) return 'Out of Stock';
    if (item.quantity <= item.minStock) return 'Low Stock';
    return 'In Stock';
  };

  const status = getStatusText();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800 border-green-200';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Out of Stock': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{item.name}</h3>
                <p className="text-gray-600">SKU: {item.sku}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="space-y-4">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden">
                {item.imageUrl && !imageError ? (
                 <img
  src={`http://localhost:5001${item.imageUrl}`}
  alt={item.name}
  className="w-full h-full object-cover"
  onError={(e) => {
  const target = e.target as HTMLImageElement;
  target.style.display = 'none';
  const fallback = target.parentElement?.querySelector('.fallback-icon');
  if (fallback) fallback.classList.remove('hidden');
}}


/>

                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div className="flex justify-center">
                <span className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm border font-medium ${getStatusColor(status)}`}>
                  {status}
                </span>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Price</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">${item.price?.toFixed(2) || '0.00'}</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Package className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Quantity</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{item.quantity}</p>
                </div>
              </div>

              {/* Stock Progress (Optional: Remove if no maxStock) */}
              {item.maxStock ? (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Stock Level</span>
                    <span className="text-sm text-gray-500">{item.quantity} / {item.maxStock}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        item.quantity <= item.minStock
                          ? 'bg-red-500'
                          : item.quantity <= item.minStock * 2
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${Math.min((item.quantity / item.maxStock) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Min: {item.minStock}</span>
                    <span>Max: {item.maxStock}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-500">
                    Stock tracking active with minimum threshold of <strong>{item.minStock}</strong>
                  </p>
                </div>
              )}

              {/* Additional Details */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <Tag className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-500">Category</p>
                    <p className="font-medium">{item.category}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="font-medium font-mono">{item.location || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-500">Supplier</p>
                    <p className="font-medium">{item.supplier || 'Not specified'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">
                      {new Date(item.lastUpdated).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              {item.description && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700 leading-relaxed">{item.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewItemModal;