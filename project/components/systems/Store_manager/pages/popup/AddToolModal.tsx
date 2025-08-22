// components/AddToolModal.tsx
import React, { useState } from 'react';
import { X, UploadCloud, Image as ImageIcon, File, Loader } from 'lucide-react';

interface AddToolModalProps {
  show: boolean;
  onClose: () => void;
  categories: string[];
  defaultCategory?: string;
}

const AddToolModal: React.FC<AddToolModalProps> = ({
  show,
  onClose,
  categories,
  defaultCategory,
}) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!show) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(true);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setDocFiles((prev) => [...prev, ...files]);
    }
  };

  const removeDoc = (index: number) => {
    setDocFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeImage = () => {
    setImageFile(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.target as HTMLFormElement;
    const toolName = (form.toolName as HTMLInputElement).value.trim();
    const brand = (form.brand as HTMLInputElement).value.trim();
    const toolType = (form.toolType as HTMLInputElement).value.trim();
    const quantityStr = (form.quantity as HTMLInputElement).value;
    const minStockStr = (form.minStock as HTMLInputElement).value;
    const condition = (form.condition as HTMLSelectElement).value;
    const costStr = (form.cost as HTMLInputElement).value;
    const purchaseDate = (form.purchaseDate as HTMLInputElement).value;
    const supplier = (form.supplier as HTMLInputElement).value.trim();
    const warranty = (form.warranty as HTMLInputElement).value.trim();
    const remarks = (form.remarks as HTMLTextAreaElement).value.trim();

    // Validation
    if (!toolName) {
      alert('Tool Name is required.');
      setIsSubmitting(false);
      return;
    }

    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity < 1) {
      alert('Quantity must be a positive number.');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('toolName', toolName);
    if (brand) formData.append('brand', brand);
    if (toolType) formData.append('category', toolType); // or use as sub-category
    formData.append('quantity', quantity.toString());
    if (minStockStr) formData.append('minStock', minStockStr);
    formData.append('status', 'Available'); // default
    formData.append('tool_condition', condition); // matches DB column
    if (costStr) formData.append('cost', costStr);
    if (purchaseDate) formData.append('purchaseDate', purchaseDate);
    if (supplier) formData.append('supplier', supplier);
    if (warranty) formData.append('warranty', warranty);
    if (remarks) formData.append('notes', remarks);

    // Use defaultCategory if passed, else first in list, else 'General'
    const category = defaultCategory || (categories.length > 0 ? categories[0] : 'General');
    formData.append('category', category);

    // Append files
    if (imageFile) formData.append('imagePath', imageFile); // backend can save to /uploads
    docFiles.forEach((file) => formData.append('documents', file));

    try {
      const res = await fetch('http://localhost:5001/api/tools', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert('✅ Tool added successfully!');
        onClose(); // Close modal
      } else {
        console.error('API Error:', data);
        alert(`❌ Failed to add tool: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('⚠️ Network error. Is the server running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 bg-gradient-to-r from-gray-50 to-orange-50 rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Add New Tool</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form className="p-6 space-y-8" onSubmit={handleSubmit}>
          {/* Tool ID (Auto-generated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tool ID</label>
            <div className="relative">
              <input
                type="text"
                value={`TOL${Date.now().toString().slice(-6)}`}
                disabled
                className="w-full px-4 py-3 bg-gray-50 text-gray-500 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">Auto-generated</span>
            </div>
          </div>

          {/* Tool Name & Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tool Name *</label>
              <input
                type="text"
                name="toolName"
                placeholder="e.g., Impact Wrench"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand / Manufacturer</label>
              <input
                type="text"
                name="brand"
                placeholder="e.g., Bosch, Snap-on"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
              />
            </div>
          </div>

          {/* Tool Type & Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category / Type</label>
              <select
                name="toolType"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md bg-white"
                defaultValue=""
              >
                <option value="" disabled>Select a category</option>
                {categories.length > 0 ? (
                  categories.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))
                ) : (
                  <option value="General">General</option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
              <input
                type="number"
                name="quantity"
                min="1"
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                required
              />
            </div>
          </div>

          {/* Minimum Stock */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stock</label>
            <input
              type="number"
              name="minStock"
              min="0"
              placeholder="e.g., 2"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
            />
          </div>

          {/* Condition, Cost, Purchase Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
              <select
                name="condition"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md bg-white"
              >
                <option value="New">New</option>
                <option value="Good" selected>Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cost ($)</label>
              <input
                type="number"
                step="0.01"
                name="cost"
                placeholder="0.00"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Date</label>
              <input
                type="date"
                name="purchaseDate"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md bg-white"
              />
            </div>
          </div>

          {/* Supplier & Warranty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
              <input
                type="text"
                name="supplier"
                placeholder="e.g., Power Tools Inc"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Warranty</label>
              <input
                type="text"
                name="warranty"
                placeholder="e.g., 2 years"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tool Image</label>
            <div
              onDragOver={handleImageDragOver}
              onDragLeave={() => setIsDraggingImage(false)}
              onDrop={handleImageDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
                ${isDraggingImage ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
              `}
            >
              <input
                type="file"
                accept="image/*"
                name="imagePath"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center space-y-2">
                <ImageIcon className="w-8 h-8 text-gray-400" />
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-orange-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
            {imageFile && (
              <div className="mt-3 flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
                  <span className="text-sm text-green-800 truncate">{imageFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-red-500 hover:text-red-700 text-xs font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Document Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attach Documents</label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4">
              <input
                type="file"
                name="documents"
                multiple
                onChange={handleDocUpload}
                className="w-full text-sm"
              />
            </div>
            {docFiles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {docFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-800 truncate">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDoc(index)}
                      className="text-red-500 hover:text-red-700 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Status (Auto-set) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="relative">
              <input
                type="text"
                value="Available"
                disabled
                className="w-full px-4 py-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">Auto-set on creation</span>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks / Notes</label>
            <textarea
              name="remarks"
              placeholder="Additional notes or maintenance instructions..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-orange-500 to-blue-600 text-white py-3 rounded-xl hover:shadow-xl hover:from-orange-600 hover:to-blue-700 disabled:opacity-70 transition-all duration-300 transform hover:scale-105 font-medium flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Adding Tool...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>Add Tool</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:shadow transition-all duration-200 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToolModal;