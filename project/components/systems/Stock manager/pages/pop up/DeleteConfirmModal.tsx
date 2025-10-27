import { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: number;
    name: string;
    sku: string;
    quantity: number;
    imageUrl?: string;
  } | null;
  onItemDeleted: () => void;
}

const DeleteConfirmModal = ({ isOpen, onClose, item, onItemDeleted }: DeleteConfirmModalProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !item) return null;

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      // Revert to the original endpoint that was working
      const response = await fetch(`https://ipasystem.bymsystem.com/api/inventory/items/${item.id}`, {
        method: 'DELETE',
      });

      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();

      if (response.ok) {
        alert(`✅ ${result.message || 'Item deleted successfully!'}`);
        onItemDeleted();
        onClose();
      } else {
        // Handle specific error statuses
        if (response.status === 400) {
          alert(`❌ ${result.message || 'Invalid request'}`);
        } else if (response.status === 404) {
          alert(`❌ ${result.message || 'Item not found'}`);
          onItemDeleted(); // Refresh list since item doesn't exist
          onClose();
        } else {
          alert(`❌ ${result.message || 'Failed to delete item'}`);
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      if (error instanceof Error && error.message === 'Server returned non-JSON response') {
        alert('❌ Server returned an unexpected response. Please check the server logs.');
      } else {
        alert('❌ Failed to connect to server. Is the backend running?');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Item</h3>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Are you sure you want to delete this item?
            </h4>
            <p className="text-gray-600 mb-4">
              This action cannot be undone. The item "{item.name}" will be permanently removed from your inventory.
            </p>

            {/* Item Preview */}
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  {item.imageUrl ? (
                    <img 
                      src={`https://ipasystem.bymsystem.com${item.imageUrl}`} 
                      alt={item.name} 
                      className="w-full h-full object-cover rounded-lg" 
                    />
                  ) : (
                    <Trash2 className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-500">SKU: {item.sku}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:opacity-70 transition font-medium shadow-lg flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting...' : 'Delete Item'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;