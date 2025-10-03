import { useState, useEffect, useRef } from 'react';
import { X, Image as ImageIcon, CheckCircle, Upload, ChevronDown } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: () => void;
}

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  leadTime: string;
  categories: string[];
  createdAt: string;
}

const categories = ['Engine Parts', 'Brake System', 'Electrical', 'Filters', 'Fluids', 'Tools', 'others'];

const qualityOptions = [
  { 
    id: 'original', 
    label: 'Original', 
    icon: '⭐',
    color: 'bg-blue-500'
  },
  { 
    id: 'local', 
    label: 'Local', 
    icon: '🏭',
    color: 'bg-green-500'
  },
  { 
    id: 'high-copy', 
    label: 'High Copy', 
    icon: '🔍',
    color: 'bg-purple-500'
  }
];

const AddItemModal = ({ isOpen, onClose, onItemAdded }: AddItemModalProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    qualityType: '',
    unitPrice: '',
    quantity: '0',
    minStock: '',
    supplier: '',
    location: '',
    description: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const supplierInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSuccessPopup) {
      const timer = setTimeout(() => setShowSuccessPopup(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessPopup]);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierInputRef.current && !supplierInputRef.current.contains(event.target as Node)) {
        setShowSupplierDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/inventory/suppliers');
      const result = await response.json();
      
      if (result.success) {
        setSuppliers(result.data);
        setFilteredSuppliers(result.data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Filter suppliers when typing in the supplier field
    if (name === 'supplier') {
      const filtered = suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuppliers(filtered);
      setShowSupplierDropdown(true);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image too large! Max 10MB.');
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleQualityTypeSelect = (id: string) => {
    setFormData((prev) => ({ ...prev, qualityType: id }));
  };

  const handleSupplierSelect = (supplierName: string) => {
    setFormData(prev => ({ ...prev, supplier: supplierName }));
    setShowSupplierDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target as HTMLFormElement;
    const payload = new FormData(form);

    if (image) {
      payload.append('image', image);
    }

    try {
      const response = await fetch('http://localhost:5001/api/inventory/items', {
        method: 'POST',
        body: payload,
      });

      const result = await response.json();

      if (response.ok) {
        setShowSuccessPopup(true);
        setTimeout(() => {
          onItemAdded();
          onClose();
          // Reset form
          setFormData({
            name: '',
            sku: '',
            category: '',
            qualityType: '',
            unitPrice: '',
            quantity: '0',
            minStock: '',
            supplier: '',
            location: '',
            description: '',
          });
          setImage(null);
          setImagePreview(null);
        }, 1500);
      } else {
        alert(`❌ ${result.message || 'Failed to add item'}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('❌ Failed to connect to server. Is the backend running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div
          className="bg-white rounded-3xl shadow-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Add New Item
                </h3>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="p-2 hover:bg-gray-100 rounded-2xl transition-all"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-7" ref={formRef}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-800">Item Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  placeholder="e.g., Brake Pad Set"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-800">Part Number (SKU) *</label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
                  placeholder="e.g., BP-2024-XL"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-800">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
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

              {/* Supplier Dropdown */}
              <div className="space-y-1 relative" ref={supplierInputRef}>
                <label className="block text-sm font-semibold text-gray-800">Supplier</label>
                <div className="relative">
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    onFocus={() => setShowSupplierDropdown(true)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none pr-10"
                    placeholder="e.g., ABC Auto Parts"
                  />
                  <button 
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
                  >
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                
                {showSupplierDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map((supplier) => (
                        <div
                          key={supplier.id}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => handleSupplierSelect(supplier.name)}
                        >
                          <div className="font-medium text-gray-900">{supplier.name}</div>
                          <div className="text-sm text-gray-500">{supplier.contactPerson}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center">
                        No suppliers found. Type to add a new one.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quality Type */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-gray-800">Quality Type *</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {qualityOptions.map((option) => (
                    <div
                      key={option.id}
                      onClick={() => handleQualityTypeSelect(option.id)}
                      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:scale-105 ${
                        formData.qualityType === option.id
                          ? `${option.color.replace('bg-', 'border-')} bg-opacity-10 bg-${option.id === 'original' ? 'blue' : option.id === 'local' ? 'green' : 'purple'}-50 shadow-lg`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div>
                          <p className="font-bold text-gray-900">{option.label}</p>
                        </div>
                      </div>
                      {formData.qualityType === option.id && (
                        <div className="absolute -top-1 -right-1">
                          <div className={`${option.color} w-6 h-6 rounded-full flex items-center justify-center shadow-md`}>
                            <CheckCircle className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      )}
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

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-800">Unit Price *</label>
                <input
                  type="number"
                  step="0.01"
                  name="unitPrice"
                  value={formData.unitPrice}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100"
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-800">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100"
                  placeholder="e.g., Aisle 3, Shelf B"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-800">Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100"
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-800">Min Stock Level *</label>
                <input
                  type="number"
                  name="minStock"
                  value={formData.minStock}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-100"
                  placeholder="e.g., 5"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-800">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:ring-4 focus:ring-blue-100 outline-none"
                placeholder="Provide details like compatibility, material, or notes..."
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-gray-800">Item Image</label>
              <label className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg shadow-md"
                  />
                ) : (
                  <Upload className="w-10 h-10 text-gray-400" />
                )}
                <p className="mt-3 text-gray-700 font-medium">
                  {imagePreview ? 'Click to change image' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="sr-only"
                />
              </label>
            </div>

            <div className="flex justify-end space-x-4 pt-5 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 rounded-2xl hover:bg-gray-50 transition font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-70 disabled:cursor-not-allowed transition-all font-medium shadow-lg transform hover:scale-105"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    Adding...
                  </span>
                ) : (
                  'Add Item'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none">
          <div className="animate-bounce">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-6 rounded-3xl shadow-2xl backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <CheckCircle className="w-12 h-12 text-white animate-pulse" />
                <div>
                  <h3 className="text-2xl font-bold">Success!</h3>
                  <p className="text-green-100">Item added to inventory 🎉</p>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-bounce bg-gradient-to-r from-yellow-400 via-pink-400 to-green-400"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random()}s`,
                  }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddItemModal;