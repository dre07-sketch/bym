'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  X,
  Upload,
  Download,
  QrCode
} from 'lucide-react';
import AddToolModal from '../popup/AddToolModal';

interface Tool {
  id: string;
  toolId: string;
  name: string;
  brand: string;
  category: string;
  quantity: number;
  minStock: number;
  status: string;
  toolCondition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Damaged';
  cost: number;
  purchaseDate: string | null;
  supplier: string;
  warranty: string;
  notes: string | null;
  imageUrl: string | null;
  documentPaths: string[];
  createdAt: string;
  updatedAt: string;

  // Computed for UI
  available: number;
  inUse: number;
  damaged: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
}

const InventoryManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Stats from backend API
  const [stats, setStats] = useState({
    totalTools: 0,
    totalQuantity: 0,
    toolsInUse: 0,
    availableTools: 0,
    damagedTools: 0
  });

  const categories = [
    'Power Tools',
    'Hand Tools',
    'Measuring Instruments',
    'Safety Equipment',
    'Diagnostic Tools',
    'Pneumatic Tools',
    'Welding Equipment',
    'General'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [toolsRes, statsRes] = await Promise.all([
          fetch('http://localhost:5001/api/tools/tools-get'),
          fetch('http://localhost:5001/api/tools/stats')
        ]);

        // Handle tools
        if (!toolsRes.ok) throw new Error('Failed to fetch tools');
        const toolsData = await toolsRes.json();
        if (!toolsData.success) throw new Error(toolsData.message);

        const mappedTools = toolsData.data.map((tool: any): Tool => {
          const condition = tool.toolCondition?.toLowerCase();
          const validConditions = ['excellent', 'good', 'fair', 'poor', 'damaged'];
          const normalizedCondition = validConditions.includes(condition)
            ? condition
            : 'good';

          return {
            id: tool.id.toString(),
            toolId: tool.toolId || `TOL-${tool.id}`,
            name: tool.name || tool.tool_name || tool.toolName || 'Unnamed Tool',
            brand: tool.brand || 'Unknown',
            category: tool.category,
            quantity: tool.quantity,
            minStock: tool.minStock || 0,
            status: tool.status,
            toolCondition: tool.toolCondition,
            cost: typeof tool.cost === 'number'
              ? tool.cost
              : Number(tool.cost || tool.tool_cost) || 0,
            purchaseDate: tool.purchaseDate,
            supplier: tool.supplier || 'Unknown',
            warranty: tool.warranty || 'N/A',
            notes: tool.notes,
            imageUrl: tool.imageUrl,
            documentPaths: Array.isArray(tool.documentPaths)
              ? tool.documentPaths
              : (tool.documentPaths ? JSON.parse(tool.documentPaths) : []),
            createdAt: tool.createdAt,
            updatedAt: tool.updatedAt,

            // Computed fields
            available: tool.quantity - (tool.in_use || 0),
            inUse: tool.in_use || 0,
            damaged: tool.toolCondition === 'Damaged' ? 1 : 0,
            condition: normalizedCondition
          };
        });

        setTools(mappedTools);

        // Handle stats
        if (!statsRes.ok) throw new Error('Failed to fetch stats');
        const statsData = await statsRes.json();
        if (!statsData.success) throw new Error(statsData.message);

        setStats(statsData.data);
      } catch (err: any) {
        console.error('Fetch Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTools = tools.filter(tool => {
    const matchesSearch =
      (tool.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tool.category ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tool.toolId ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
    const matchesCondition = conditionFilter === 'all' || tool.condition === conditionFilter;

    return matchesSearch && matchesCategory && matchesCondition;
  });

  const getConditionColor = (condition: string): string => {
    switch (condition) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fair': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'poor': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'damaged': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConditionIcon = (condition: string): JSX.Element => {
    switch (condition) {
      case 'excellent': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'good': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'fair': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'damaged': return <X className="w-4 h-4 text-red-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAvailabilityPercentage = (tool: Tool): number => {
    return (tool.available / tool.quantity) * 100;
  };

  const deleteTool = async (id: string) => {
    const confirm = window.confirm("Are you sure you want to delete this tool? This cannot be undone.");
    if (!confirm) return;

    try {
      const res = await fetch(`http://localhost:5001/api/tools/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete tool');
      }

      setTools(prev => prev.filter(tool => tool.id !== id));
      alert(data.message);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(`❌ Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl text-gray-600">Loading tools...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
            Tool Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your complete tool inventory and equipment</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors">
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tool</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Tools</p>
              <p className="text-3xl font-bold">{stats.totalTools}</p>
            </div>
            <Wrench className="w-8 h-8 text-blue-200 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Available</p>
              <p className="text-3xl font-bold">{stats.availableTools}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">In Use</p>
              <p className="text-3xl font-bold">{stats.toolsInUse}</p>
            </div>
            <Package className="w-8 h-8 text-orange-200 animate-spin" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Damaged</p>
              <p className="text-3xl font-bold">{stats.damagedTools}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-200 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tools by name, category, or serial number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Conditions</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
            <option value="damaged">Damaged</option>
          </select>

          <button className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-6">
        {filteredTools.length === 0 ? (
          <p className="text-center py-10 text-gray-500">No tools found matching your filters.</p>
        ) : (
          filteredTools.map((tool, index) => (
            <div
              key={tool.id}
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                    tool.condition === 'excellent' ? 'from-green-400 to-green-600' :
                    tool.condition === 'good' ? 'from-blue-400 to-blue-600' :
                    tool.condition === 'fair' ? 'from-yellow-400 to-yellow-600' :
                    tool.condition === 'poor' ? 'from-orange-400 to-orange-600' :
                    'from-red-400 to-red-600'
                  } flex items-center justify-center shadow-lg`}>
                    {getConditionIcon(tool.condition)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{tool.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getConditionColor(tool.condition)}`}>
                        {tool.condition}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Category:</span> {tool.category}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Brand:</span> {tool.brand}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Serial:</span> {tool.toolId}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Status:</span> {tool.status}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Supplier:</span> {tool.supplier}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Warranty:</span> {tool.warranty}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Cost:</span> ETB {typeof tool.cost === 'number' ? tool.cost.toFixed(2) : '0.00'}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Purchase Date:</span> {tool.purchaseDate || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Min Stock:</span> {tool.minStock}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-3">
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{tool.available}</p>
                      <p className="text-sm text-gray-600">available</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{tool.inUse}</p>
                      <p className="text-sm text-gray-600">in use</p>
                    </div>
                    {tool.damaged > 0 && (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">{tool.damaged}</p>
                        <p className="text-sm text-gray-600">damaged</p>
                      </div>
                    )}
                  </div>

                  <div className="w-32">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Availability</span>
                      <span>{Math.round(getAvailabilityPercentage(tool))}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          getAvailabilityPercentage(tool) > 70 ? 'bg-green-500' :
                          getAvailabilityPercentage(tool) > 30 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${getAvailabilityPercentage(tool)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedTool(tool)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      <QrCode className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTool(tool.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Tool Modal */}
      <AddToolModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
      />

      {/* Tool Details Modal */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Tool Details</h2>
              <button
                onClick={() => setSelectedTool(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Tool Name</label>
                  <p className="text-lg font-semibold text-gray-800">{selectedTool.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Category</label>
                  <p className="text-gray-800">{selectedTool.category}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Brand</label>
                  <p className="text-gray-800">{selectedTool.brand}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Serial Number</label>
                  <p className="text-gray-800 font-mono">{selectedTool.toolId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Condition</label>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getConditionColor(selectedTool.condition)}`}>
                    {selectedTool.condition}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  <p className="text-gray-800">{selectedTool.status}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Total</label>
                    <p className="text-2xl font-bold text-gray-800">{selectedTool.quantity}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Available</label>
                    <p className="text-2xl font-bold text-green-600">{selectedTool.available}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">In Use</label>
                    <p className="text-2xl font-bold text-orange-600">{selectedTool.inUse}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Supplier</label>
                  <p className="text-gray-800">{selectedTool.supplier}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Purchase Date</label>
                  <p className="text-gray-800">{selectedTool.purchaseDate || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Warranty</label>
                  <p className="text-gray-800">{selectedTool.warranty}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Cost</label>
                  <p className="text-lg font-semibold text-blue-600">
                    ${typeof selectedTool.cost === 'number' ? selectedTool.cost.toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Stock Info</label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Min Stock:</span> {selectedTool.minStock}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {selectedTool.notes || 'None'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Availability Status</label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full ${
                        getAvailabilityPercentage(selectedTool) > 70 ? 'bg-green-500' :
                        getAvailabilityPercentage(selectedTool) > 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${getAvailabilityPercentage(selectedTool)}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {Math.round(getAvailabilityPercentage(selectedTool))}% available
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t mt-6">
              <button
                onClick={() => setSelectedTool(null)}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;