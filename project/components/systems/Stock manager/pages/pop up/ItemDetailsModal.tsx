import React, { useState } from 'react';
import { X, Package, Edit, Trash2, TrendingUp, TrendingDown, Calendar, DollarSign, Hash, User } from 'lucide-react';

interface ItemDetailsModalProps {
  item: {
    id: number;
    name: string;
    moved: number;
    trend: string;
    stock: number;
    price: number;
  };
  onClose: () => void;
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ item, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const stockHistory = [
    { date: '2024-01-15', action: 'Stock In', quantity: 50, balance: 170 },
    { date: '2024-01-12', action: 'Stock Out', quantity: -25, balance: 120 },
    { date: '2024-01-10', action: 'Stock In', quantity: 30, balance: 145 },
    { date: '2024-01-08', action: 'Stock Out', quantity: -15, balance: 115 },
    { date: '2024-01-05', action: 'Stock In', quantity: 40, balance: 130 },
  ];

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'history', name: 'Stock History' },
    { id: 'analytics', name: 'Analytics' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                <p className="text-sm text-gray-500">Item Details & Analytics</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Edit className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-red-100 rounded-xl transition-colors">
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Current Stock</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{item.stock}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Unit Price</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">${item.price}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">Units Moved</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{item.moved}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Total Value</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">${(item.stock * item.price).toFixed(2)}</p>
                </div>
              </div>

              {/* Item Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Hash className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">SKU</p>
                        <p className="font-medium text-gray-900">SKU-{item.id.toString().padStart(4, '0')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Category</p>
                        <p className="font-medium text-gray-900">Automotive Parts</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Supplier</p>
                        <p className="font-medium text-gray-900">AutoParts Inc.</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Last Updated</p>
                        <p className="font-medium text-gray-900">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Status</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Stock Level</span>
                        <span className="text-sm font-medium text-gray-900">{item.stock} / 200</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            item.stock > 100 ? 'bg-green-500' :
                            item.stock > 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(item.stock / 200) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Minimum Stock Level</span>
                      <span className="font-medium text-gray-900">20</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Reorder Point</span>
                      <span className="font-medium text-gray-900">30</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-full ${
                        item.trend === 'up' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {item.trend === 'up' ? 
                          <TrendingUp className="w-4 h-4 text-green-600" /> :
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        }
                      </div>
                      <span className={`text-sm font-medium ${
                        item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.trend === 'up' ? 'Trending Up' : 'Trending Down'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Stock Movement History</h3>
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stockHistory.map((record, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              record.action === 'Stock In' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {record.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-medium ${
                              record.quantity > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {record.quantity > 0 ? '+' : ''}{record.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.balance}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-xl">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Analytics data will be displayed here</p>
                <p className="text-sm text-gray-500 mt-2">Charts and trends coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsModal;