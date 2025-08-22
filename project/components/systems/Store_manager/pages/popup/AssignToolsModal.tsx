import React, { useState } from 'react';
import { X, Package } from 'lucide-react';

const AssignToolsModal = ({
  ticket,
  availableTools,
  onClose,
  onToolAssigned
}: {
  ticket: any;
  availableTools: any[];
  onClose: () => void;
  onToolAssigned: () => void;
}) => {
  const [selectedToolId, setSelectedToolId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleAssign = async () => {
    const tool = availableTools.find(t => t.id === selectedToolId);
    if (!tool || quantity < 1 || quantity > tool.available) {
      alert('Invalid quantity or tool not selected');
      return;
    }

    const res = await fetch('/api/tools/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolID: tool.id,
        ticketID: ticket.id,
        quantity,
        assignedBy: 'Mechanic' // Replace with actual user
      })
    });

    if (res.ok) {
      alert('Tool assigned successfully');
      onToolAssigned();
      onClose();
    } else {
      const data = await res.json();
      alert(`Error: ${data.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Assign Tool to {ticket.ticket_number}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Tool</label>
            <select
              value={selectedToolId}
              onChange={(e) => setSelectedToolId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            >
              <option value="">Choose a tool</option>
              {availableTools.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.name} ({tool.available} available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              min="1"
              max={availableTools.find(t => t.id === selectedToolId)?.available || 1}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        <div className="flex space-x-4 pt-6 border-t">
          <button
            onClick={handleAssign}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition-all"
          >
            Assign Tool
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignToolsModal;