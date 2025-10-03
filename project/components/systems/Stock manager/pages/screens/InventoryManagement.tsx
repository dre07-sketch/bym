import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Package,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  Star,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
} from 'lucide-react';

// ✅ Modal Components
import AddItemModal from '../pop up/Addnewitem';
import ViewItemModal from '../pop up/ViewItemModal';
import EditItemModal from '../pop up/EditItemModal';
import DeleteConfirmModal from '../pop up/DeleteConfirmModal';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  quality_type?: string; // ← Now properly included
  price: number;
  location: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  minStock: number;
  maxStock?: number; // Changed from number | null to just number | undefined
  imageUrl?: string; // Changed from string | null to just string | undefined
  rating?: number;
  sku: string;
  supplier?: string; // Changed from string | null to just string | undefined
  description?: string; // Changed from string | null to just string | undefined
  lastUpdated: string;
}

const InventoryManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [animatedCards, setAnimatedCards] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const categories = ['all', 'Engine Parts', 'Brake System', 'Electrical', 'Filters', 'Fluids', 'Tools'];

  // ✅ Fetch items directly
  const fetchItems = async () => {
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/inventory/items');
      if (!response.ok) throw new Error('Failed to fetch items');

      const result = await response.json();

      if (result.success && Array.isArray(result.data)) {
        const mappedItems: InventoryItem[] = result.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          // ✅ Map quality_type (from DB) — this was missing!
          quality_type: item.quality_type || item.qualityType || 'original', // fallback
          // Optional: also expose as qualityType for consistency
          price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
          location: item.location || '',
          status: item.quantity === 0
            ? 'Out of Stock'
            : item.quantity <= item.minStock
            ? 'Low Stock'
            : 'In Stock',
          minStock: item.minStock,
          maxStock: item.maxStock ?? undefined, // Convert null to undefined
          imageUrl: item.imageUrl ?? undefined, // Convert null to undefined
          rating: item.rating || 0,
          sku: item.sku,
          supplier: item.supplier ?? undefined, // Convert null to undefined
          description: item.description ?? undefined, // Convert null to undefined
          lastUpdated: item.lastUpdated,
        }));
        setInventoryItems(mappedItems);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      alert('❌ Failed to load inventory. Check if the server is running.');
    }
  };

  // Refresh after add/edit/delete
  const handleItemAdded = () => fetchItems();
  const handleItemUpdated = () => fetchItems();
  const handleItemDeleted = () => fetchItems();

  const handleViewItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleDeleteItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const toggleRowExpand = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  // Filter items
  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Status counts
  const statusCounts = {
    total: inventoryItems.length,
    inStock: inventoryItems.filter((item) => item.status === 'In Stock').length,
    lowStock: inventoryItems.filter((item) => item.status === 'Low Stock').length,
    outOfStock: inventoryItems.filter((item) => item.status === 'Out of Stock').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800';
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Load items on mount
  useEffect(() => {
    fetchItems();
    setTimeout(() => setAnimatedCards(true), 100);
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Inventory Management</h1>
        <p className="text-gray-600 text-sm sm:text-base">Manage your automotive parts inventory efficiently</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
        {[
          {
            title: 'Total Items',
            value: statusCounts.total,
            icon: Package,
            color: 'from-blue-500 to-blue-600',
            bgPattern: 'bg-gradient-to-br from-blue-500/10 to-blue-600/20',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
          },
          {
            title: 'In Stock',
            value: statusCounts.inStock,
            icon: CheckCircle,
            color: 'from-green-500 to-green-600',
            bgPattern: 'bg-gradient-to-br from-green-500/10 to-green-600/20',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
          },
          {
            title: 'Low Stock',
            value: statusCounts.lowStock,
            icon: TrendingDown,
            color: 'from-yellow-500 to-yellow-600',
            bgPattern: 'bg-gradient-to-br from-yellow-500/10 to-yellow-600/20',
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
          },
          {
            title: 'Out of Stock',
            value: statusCounts.outOfStock,
            icon: AlertTriangle,
            color: 'from-red-500 to-red-600',
            bgPattern: 'bg-gradient-to-br from-red-500/10 to-red-600/20',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
          },
        ].map((stat, index) => (
          <div
            key={index}
            className={`relative overflow-hidden bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 group ${
              animatedCards ? 'animate-fade-in-up' : 'opacity-0'
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`absolute inset-0 ${stat.bgPattern} opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Sparkles className="w-4 h-4 text-gray-400 animate-pulse" />
            </div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-semibold uppercase tracking-wide">{stat.title}</p>
                <p className="text-2xl sm:text-4xl font-bold mt-1 sm:mt-2 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <div className="flex items-center mt-2 space-x-1">
                  <Zap className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500 font-medium">Live data</span>
                </div>
              </div>
              <div className={`p-3 sm:p-4 ${stat.iconBg} rounded-xl sm:rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-6 sm:mt-8 bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-9 sm:pl-10 pr-8 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white text-sm sm:text-base min-w-[140px] sm:min-w-[160px]"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 sm:mt-8 bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
              <tr>
                <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Item</th>
                <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Category</th>
                <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Quantity</th>
                <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Status</th>
                <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-semibold text-gray-900 text-sm sm:text-base">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <React.Fragment key={item.id}>
                  <tr className="border-t border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                    <td className="py-3 sm:py-4 px-4 sm:px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                          {item.imageUrl ? (
                            <img
                              src={`https://ipasystem.bymsystem.com${item.imageUrl}`}
                              alt={item.name}
                              className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                            />
                          ) : (
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
                            {item.name}
                          </p>
                          <p className="text-gray-500 text-xs sm:text-sm">{item.location}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 sm:py-4 px-4 sm:px-6">
                      <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 sm:py-4 px-4 sm:px-6">
                      <span className="font-semibold text-gray-900 text-sm sm:text-base">{item.quantity}</span>
                    </td>
                    <td className="py-3 sm:py-4 px-4 sm:px-6">
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewItem(item)}
                          className="p-1 sm:p-2 hover:bg-blue-100 rounded-lg"
                          aria-label="View details"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleEditItem(item)}
                          className="p-1 sm:p-2 hover:bg-green-100 rounded-lg"
                          aria-label="Edit item"
                        >
                          <Edit className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-1 sm:p-2 hover:bg-red-100 rounded-lg"
                          aria-label="Delete item"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                        <button onClick={() => toggleRowExpand(item.id.toString())}>
                          {expandedRow === item.id.toString() ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === item.id.toString() && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="py-4 px-4 sm:px-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 font-medium">Price</p>
                            <p className="font-medium">${Number(item.price).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Location</p>
                            <p className="font-medium">{item.location}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Min Stock</p>
                            <p className="font-medium">{item.minStock}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Stock Range</p>
                            <p className="font-medium">{item.minStock} - {item.maxStock || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AddItemModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onItemAdded={handleItemAdded} />
      <ViewItemModal isOpen={showViewModal} onClose={() => setShowViewModal(false)} item={selectedItem} />
      <EditItemModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} item={selectedItem} onItemUpdated={handleItemUpdated} />
      <DeleteConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} item={selectedItem} onItemDeleted={handleItemDeleted} />
    </div>
  );
};

export default InventoryManagement;