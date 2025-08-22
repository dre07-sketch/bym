// pages/inventory.tsx
'use client';

import { useState, useMemo, SetStateAction } from 'react';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import {
  Input
} from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import {
  Button
} from '@/components/ui/button';
import {
  Badge
} from '@/components/ui/badge';

import {
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  Package,
  Eye,
  Edit,
  QrCode
} from 'lucide-react';

import { InventoryItem } from '../../components/data/mockData'; // Adjust path if needed

const InventoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const inventoryData: InventoryItem[] = [
    {
      id: 1,
      name: 'Brake Pads',
      sku: 'BP-1001',
      category: 'Brakes',
      quantity: 45,
      price: 29.99,
      cost: 15.50,
      status: 'in-stock',
      location: 'Aisle 3',
      supplier: 'AutoParts Inc',
      minStock: 20,
      maxStock: 100,
      lastUpdated: '2023-10-05'
    },
    // Add more items here
  ];

  const filteredInventory = useMemo(() => {
    return inventoryData.filter(item => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' ||
        item.category.toLowerCase() === categoryFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchTerm, categoryFilter, statusFilter, inventoryData]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <div className="space-x-2">
          <Button onClick={() => setShowAddItemModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, SKU, or category..."
                value={searchTerm}
                onChange={(e: { target: { value: SetStateAction<string> } }) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="brakes">Brakes</SelectItem>
                <SelectItem value="fluids">Fluids</SelectItem>
                <SelectItem value="filters">Filters</SelectItem>
                <SelectItem value="engine">Engine</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredInventory.map(item => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${
                    item.status === 'in-stock' ? 'from-green-400 to-green-600' :
                    item.status === 'low-stock' ? 'from-orange-400 to-orange-600' :
                    'from-red-400 to-red-600'
                  } flex items-center justify-center`}>
                    <Package className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-gray-600">SKU: {item.sku} • {item.category}</p>
                    <p className="text-sm text-gray-500">
                      Location: {item.location} • Supplier: {item.supplier}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span>Min: {item.minStock}</span>
                      <span>Max: {item.maxStock}</span>
                      <span>Last Updated: {item.lastUpdated}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{item.quantity}</p>
                      <p className="text-sm text-gray-600">in stock</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">${item.price}</p>
                      <p className="text-sm text-gray-600">sell price</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">${item.cost}</p>
                      <p className="text-sm text-gray-600">cost price</p>
                    </div>
                  </div>
                  <Badge variant={
                    item.status === 'in-stock' ? 'default' :
                    item.status === 'low-stock' ? 'secondary' : 'destructive'
                  }>
                    {item.status.replace('-', ' ')}
                  </Badge>
                  <div className="space-x-2 mt-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedItem(item)}>
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <QrCode className="w-3 h-3 mr-1" />
                      QR
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-1/2">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-4">Add New Item</h3>
              <Button onClick={() => setShowAddItemModal(false)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
