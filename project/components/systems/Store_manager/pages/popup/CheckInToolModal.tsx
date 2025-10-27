// components/CheckInToolModal.tsx
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader } from 'lucide-react';

interface Tool {
  id: number;
  tool_name: string;
  brand: string;
  quantity: number;
  image_url?: string;
}

interface CheckInToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CheckInToolModal: React.FC<CheckInToolModalProps> = ({ isOpen, onClose, onSuccess }) => {
  // ✅ All useState at the very top
  const [tools, setTools] = useState<Tool[]>([]);
  const [loadingTools, setLoadingTools] = useState<boolean>(true);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState<string>('1');
  const [condition, setCondition] = useState<string>('Good');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ✅ useEffect — also at the top, no conditions before it
  useEffect(() => {
    // ✅ Safe: we're not skipping the hook
    if (!isOpen) {
      // Modal is closed — reset form
      setSelectedTool(null);
      setQuantityToAdd('1');
      setCondition('Good');
      setNotes('');
      return;
    }

    // Modal opened — fetch tools
    const fetchTools = async () => {
      setLoadingTools(true);
      try {
        const res = await fetch('https://ipasystem.bymsystem.com/api/tools');
        if (!res.ok) throw new Error('Failed to fetch tools');
        const data = await res.json();
        setTools(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        console.error('Error fetching tools:', err);
        alert('Could not load tools. Is the server running?');
      } finally {
        setLoadingTools(false);
      }
    };

    fetchTools();
  }, [isOpen]); // Only re-run when `isOpen` changes

  // ✅ Now it's safe to return null if not open
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const qty = parseInt(quantityToAdd, 10);
    if (!selectedTool || isNaN(qty) || qty < 1) {
      alert('Please enter a valid quantity.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('https://ipasystem.bymsystem.com/api/tools/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolID: selectedTool.id,
          quantity: qty,
          condition,
          notes,
        }),
      });

      const result = await res.json();

      if (result.success) {
        alert('✅ Tool checked in successfully!');
        onSuccess();
        onClose();
      } else {
        alert(`❌ ${result.message || 'Check-in failed'}`);
      }
    } catch (err) {
      alert('⚠️ Network error. Is the server running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 bg-gradient-to-r from-gray-50 to-green-50 rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Check In Tool</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form className="p-6 space-y-8" onSubmit={handleSubmit}>
          {/* Tool Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Tool *</label>
            {loadingTools ? (
              <div className="flex justify-center py-6">
                <Loader className="w-6 h-6 animate-spin text-green-600" />
              </div>
            ) : tools.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No tools available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto p-2 border border-gray-200 rounded-xl">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => setSelectedTool(tool)}
                    className={`p-3 border-2 rounded-xl cursor-pointer transition-all ${
                      selectedTool?.id === tool.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <img
                        src={tool.image_url || '/placeholder-tool.png'}
                        alt={tool.tool_name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <p className="font-medium text-gray-800 text-sm text-center">{tool.tool_name}</p>
                      <p className="text-xs text-gray-500">{tool.brand}</p>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Qty: {tool.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity to Add *</label>
            <input
              type="number"
              min="1"
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:shadow-md"
              required
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm hover:shadow-md"
            >
              <option value="New">New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Serviced, Repaired, Returned from job"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm hover:shadow-md resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-100">
            <button
              type="submit"
              disabled={isSubmitting || !selectedTool}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 rounded-xl hover:shadow-xl hover:from-green-600 hover:to-blue-700 disabled:opacity-70 transition-all duration-300 transform hover:scale-105 font-medium flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Checking In...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Confirm Check-In</span>
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

export default CheckInToolModal;