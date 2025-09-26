import React, { useState, useEffect } from 'react';
import { X, ArrowUpCircle, ArrowDownCircle, Search } from 'lucide-react';

interface StockLog {
  id: number;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  transactionDate: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

interface StockHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StockHistoryModal: React.FC<StockHistoryModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<StockLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const fetchHistory = async () => {
      try {
        const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/stock-history');
        if (!response.ok) throw new Error('Failed to fetch stock history');
        const result = await response.json();
        setLogs(result.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen]);

  // Reset loading state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(null);
      // No need to fetch here — useEffect above handles it
    }
  }, [isOpen]);

  const filteredLogs = logs.filter(log =>
    log.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.itemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.reference && log.reference.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Stock History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-xl transition"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by item, ID, reference, or notes..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-500">Loading stock history...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-red-600 text-center">
              <p>❌ Error: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm underline"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8 text-gray-500">
            No matching records found.
          </div>
        ) : (
          /* Table */
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Item</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Qty</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Reference</th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900">{log.itemName}</p>
                        <p className="text-sm text-gray-500">ID: {log.itemId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center space-x-1 text-sm font-medium ${
                          log.type === 'IN' ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {log.type === 'IN' ? (
                          <ArrowUpCircle className="w-4 h-4" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4" />
                        )}
                        <span>{log.type === 'IN' ? 'Stock In' : 'Stock Out'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {log.type === 'IN' ? '+' : '-'}
                      {log.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(log.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.reference || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="p-4 text-right text-sm text-gray-500 border-t bg-gray-50">
          Total Records: {filteredLogs.length}
        </div>
      </div>
    </div>
  );
};

export default StockHistoryModal;