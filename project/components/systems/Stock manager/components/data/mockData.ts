
///Stock room mock data
export const mockPurchaseOrders = [
  {
    id: 'PO-001',
    supplier: 'AutoParts Plus',
    status: 'ordered',
    orderDate: '2024-01-15',
    expectedDate: '2024-01-20',
    totalAmount: 2450.75,
    items: [
      { name: 'Brake Pads - Toyota', quantity: 50, unitPrice: 32.50 },
      { name: 'Brake Rotors - Toyota', quantity: 25, unitPrice: 45.00 }
    ],
    paymentTerms: 'Net 30',
    leadTime: '5-7 days'
  },
  {
    id: 'PO-002',
    supplier: 'Oil Express',
    status: 'received',
    orderDate: '2024-01-12',
    receivedDate: '2024-01-15',
    totalAmount: 875.50,
    items: [
      { name: 'Synthetic Oil 5W-30', quantity: 100, unitPrice: 8.75 }
    ],
    paymentTerms: 'Net 15',
    leadTime: '3-5 days'
  }
];
export const mockInventory = [
  { 
    id: 'ITM-001', 
    sku: 'BP-TOY-001',
    name: 'Brake Pads - Toyota Camry', 
    category: 'Brakes', 
    quantity: 25, 
    minStock: 10, 
    maxStock: 50,
    price: 45.99, 
    cost: 32.50,
    status: 'in-stock',
    supplier: 'AutoParts Plus',
    location: 'A1-B2',
    lastUpdated: '2024-01-15',
    warranty: '12 months',
    compatibility: ['Toyota Camry 2018-2023', 'Toyota Avalon 2019-2023']
  },
  { 
    id: 'ITM-002', 
    sku: 'OIL-SYN-001',
    name: 'Synthetic Engine Oil 5W-30', 
    category: 'Fluids', 
    quantity: 8, 
    minStock: 15, 
    maxStock: 40,
    price: 12.99, 
    cost: 8.75,
    status: 'low-stock',
    supplier: 'Oil Express',
    location: 'C3-D1',
    lastUpdated: '2024-01-14',
    warranty: 'N/A',
    compatibility: ['Universal - Most vehicles']
  },
  { 
    id: 'ITM-003', 
    sku: 'AF-HON-001',
    name: 'Air Filter - Honda Civic', 
    category: 'Filters', 
    quantity: 0, 
    minStock: 5, 
    maxStock: 25,
    price: 18.50, 
    cost: 12.25,
    status: 'out-of-stock',
    supplier: 'Filter World',
    location: 'B2-C3',
    lastUpdated: '2024-01-13',
    warranty: '6 months',
    compatibility: ['Honda Civic 2016-2023']
  }
];



export const mockSuppliers = [
  {
    id: 'SUP-001',
    name: 'AutoParts Plus',
    contact: 'John Smith',
    phone: '+1-555-0123',
    email: 'orders@autopartsplus.com',
    rating: 4.8,
    leadTime: '5-7 days',
    paymentTerms: 'Net 30',
    totalOrders: 45,
    reliability: 95
  },
  {
    id: 'SUP-002',
    name: 'Oil Express',
    contact: 'Sarah Johnson',
    phone: '+1-555-0456',
    email: 'supply@oilexpress.com',
    rating: 4.6,
    leadTime: '3-5 days',
    paymentTerms: 'Net 15',
    totalOrders: 32,
    reliability: 92
  }
];

const mockStockMovements = [
  {
    id: 'MOV-001',
    item: 'Brake Pads - Toyota Camry',
    type: 'out',
    quantity: 2,
    reason: 'Job Card #JC-001',
    user: 'Mike Johnson',
    timestamp: '2024-01-15 14:30',
    reference: 'JC-001'
  },
  {
    id: 'MOV-002',
    item: 'Synthetic Engine Oil 5W-30',
    type: 'in',
    quantity: 50,
    reason: 'Purchase Order #PO-002',
    user: 'Stock Manager',
    timestamp: '2024-01-15 09:15',
    reference: 'PO-002'
  }
];

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  cost: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  location: string;
  supplier: string;
  minStock: number;
  maxStock: number;
  lastUpdated: string;
}
