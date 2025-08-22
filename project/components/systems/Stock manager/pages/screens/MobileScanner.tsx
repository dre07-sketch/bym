import React, { useState } from 'react';
import { 
  Smartphone, 
  QrCode, 
  Scan, 
  Package, 
  Plus, 
  Minus,
  Search,
  CheckCircle,
  AlertTriangle,
  Camera,
  Flashlight
} from 'lucide-react';

const MobileScanner: React.FC = () => {
  const [scanMode, setScanMode] = useState<'barcode' | 'qr' | 'manual'>('barcode');
  const [scannedItem, setScannedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [operation, setOperation] = useState<'in' | 'out' | 'lookup'>('lookup');

  const mockScanResult = {
    sku: 'BP-001',
    name: 'Premium Brake Pads',
    currentStock: 45,
    minStock: 10,
    maxStock: 100,
    location: 'A1-B2',
    unitPrice: 89.99,
    supplier: 'AutoParts Pro',
    category: 'Brake System'
  };

  const handleScan = () => {
    // Simulate scanning
    setScannedItem(mockScanResult);
  };

  const handleStockOperation = () => {
    if (!scannedItem) return;
    
    // Simulate stock operation
    console.log(`${operation} operation: ${quantity} units of ${scannedItem.name}`);
    
    // Reset after operation
    setScannedItem(null);
    setQuantity(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Mobile Scanner</h2>
        <p className="text-gray-600">Quick stock lookup and adjustments</p>
      </div>

      {/* Operation Mode Selection */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Operation</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'lookup', label: 'Lookup', icon: Search, color: 'blue' },
            { id: 'in', label: 'Stock In', icon: Plus, color: 'green' },
            { id: 'out', label: 'Stock Out', icon: Minus, color: 'red' }
          ].map(op => (
            <button
              key={op.id}
              onClick={() => setOperation(op.id as any)}
              className={`p-4 rounded-xl border-2 transition-all ${
                operation === op.id
                  ? `border-${op.color}-300 bg-${op.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <op.icon className={`w-6 h-6 mx-auto mb-2 ${
                operation === op.id ? `text-${op.color}-600` : 'text-gray-400'
              }`} />
              <p className={`text-sm font-medium ${
                operation === op.id ? `text-${op.color}-700` : 'text-gray-600'
              }`}>
                {op.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Scanner Interface */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Scanner</h3>
        
        {/* Scan Mode Selection */}
        <div className="flex space-x-2 mb-6">
          {[
            { id: 'barcode', label: 'Barcode', icon: Scan },
            { id: 'qr', label: 'QR Code', icon: QrCode },
            { id: 'manual', label: 'Manual', icon: Search }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setScanMode(mode.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-colors ${
                scanMode === mode.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <mode.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{mode.label}</span>
            </button>
          ))}
        </div>

        {/* Scanner Area */}
        <div className="relative">
          {scanMode === 'manual' ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter SKU or barcode..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleScan}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl hover:shadow-lg transition-all duration-200"
              >
                Search Item
              </button>
            </div>
          ) : (
            <div className="bg-gray-900 rounded-2xl p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-600/20"></div>
              <div className="relative z-10">
                <div className="w-48 h-48 border-4 border-white/50 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <div className="w-32 h-32 border-2 border-white/30 rounded-xl flex items-center justify-center">
                    {scanMode === 'barcode' ? (
                      <Scan className="w-16 h-16 text-white/70" />
                    ) : (
                      <QrCode className="w-16 h-16 text-white/70" />
                    )}
                  </div>
                </div>
                <p className="text-white/80 mb-6">
                  Position the {scanMode} within the frame
                </p>
                <div className="flex justify-center space-x-4">
                  <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={handleScan}
                    className="px-6 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-colors font-medium"
                  >
                    Simulate Scan
                  </button>
                  <button className="p-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
                    <Flashlight className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scanned Item Details */}
      {scannedItem && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Item Found</h3>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{scannedItem.name}</h4>
                <p className="text-sm text-gray-500">SKU: {scannedItem.sku}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Current Stock</p>
                <p className="font-medium text-gray-900">{scannedItem.currentStock}</p>
              </div>
              <div>
                <p className="text-gray-500">Location</p>
                <p className="font-medium text-gray-900">{scannedItem.location}</p>
              </div>
              <div>
                <p className="text-gray-500">Unit Price</p>
                <p className="font-medium text-gray-900">${scannedItem.unitPrice}</p>
              </div>
              <div>
                <p className="text-gray-500">Supplier</p>
                <p className="font-medium text-gray-900">{scannedItem.supplier}</p>
              </div>
            </div>
            
            {/* Stock Level Indicator */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">Stock Level</span>
                <span className={`text-sm font-medium ${
                  scannedItem.currentStock <= scannedItem.minStock ? 'text-red-600' :
                  scannedItem.currentStock >= scannedItem.maxStock ? 'text-blue-600' :
                  'text-green-600'
                }`}>
                  {scannedItem.currentStock <= scannedItem.minStock ? 'Low Stock' :
                   scannedItem.currentStock >= scannedItem.maxStock ? 'Overstocked' :
                   'Normal'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    scannedItem.currentStock <= scannedItem.minStock ? 'bg-red-500' :
                    scannedItem.currentStock >= scannedItem.maxStock ? 'bg-blue-500' :
                    'bg-green-500'
                  }`}
                  style={{ 
                    width: `${Math.min((scannedItem.currentStock / scannedItem.maxStock) * 100, 100)}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-400">
                <span>0</span>
                <span>Min: {scannedItem.minStock}</span>
                <span>Max: {scannedItem.maxStock}</span>
              </div>
            </div>
          </div>

          {/* Quantity and Action */}
          {operation !== 'lookup' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <button
                onClick={handleStockOperation}
                className={`w-full py-3 rounded-xl font-medium transition-all duration-200 ${
                  operation === 'in'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg'
                    : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg'
                }`}
              >
                {operation === 'in' ? 'Add to Stock' : 'Remove from Stock'}
              </button>
            </div>
          )}
          
          <button
            onClick={() => setScannedItem(null)}
            className="w-full mt-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Scan Another Item
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-colors group">
            <Package className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">View All Items</span>
          </button>
          <button className="flex flex-col items-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-colors group">
            <AlertTriangle className="w-8 h-8 text-gray-400 group-hover:text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-600 group-hover:text-green-600">Low Stock Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileScanner;