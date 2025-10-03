  import React, { useState } from 'react';
  import {
    Package,
    TrendingDown,
    Activity,
    ShoppingCart,
    Truck,
    BarChart3,
    FileText,
    QrCode,
    Users,
  } from 'lucide-react';

  import SidebarHeader from '../../layout/SidebarHeader';
  import Stock_Manager_Dashboard from './pages/screens/Stock_dashboard';
  import InventoryManagement from './pages/screens/InventoryManagement';
  import StockLevels from './pages/screens/StockLevels';
  import StockMovements from './pages/screens/StockMovement';
  import PurchaseOrders from './pages/screens/PurchaseOrders';
  import SupplierManagement from './pages/screens/SupplierManagement';
  import Reports from './pages/screens/Reports';
  // import AuditLogs from './pages/screens/AuditLogs';
  import MobileScanner from './pages/screens/MobileScanner';
  import UserManagement from './pages/screens/UserManagement';
  import OrderManagementSystem from './pages/screens/OrderManagementSystem';

  interface DashboardProps {
    onLogout: () => void;
    userRole: string;
  }

  const Render_Stock_Manager: React.FC<DashboardProps> = ({ onLogout, userRole }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const navigation = [
      { id: 'dashboard', label: 'Dashboard', icon: Package },
      { id: 'inventory', label: 'Inventory Management', icon: Package },
      {id: 'orders', label: 'Order Management', icon: Package}, 
      { id: 'stock-levels', label: 'Stock Monitoring', icon: TrendingDown },
      { id: 'movements', label: 'Stock Movements', icon: Activity },
      { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
      { id: 'suppliers', label: 'Suppliers', icon: Truck },
      { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
      //{ id: 'audit-logs', label: 'Audit Logs', icon: FileText },
      //{ id: 'scanner', label: 'Mobile Scanner', icon: QrCode },
     // { id: 'users', label: 'User Management', icon: Users },
    ];

    const notifications = [
      { 
        id: '1',
        title: 'Low Stock Alert', 
        message: 'Engine oil is running low (5 remaining)', 
        time: '15 min ago', 
        read: false,
        type: 'warning' as const
      },
      { 
        id: '2',
        title: 'New Delivery', 
        message: 'Order #4567 has arrived from supplier', 
        time: '2 hours ago', 
        read: true,
        type: 'info' as const
      },
      { 
        id: '3',
        title: 'Audit Required', 
        message: 'Monthly inventory audit due tomorrow', 
        time: '1 day ago', 
        read: false,
        type: 'urgent' as const
      },
    ];

    const renderContent = () => {
      switch (activeTab) {
        case 'dashboard': return <Stock_Manager_Dashboard onLogout={onLogout} userRole={userRole} />;
        case 'inventory': return <InventoryManagement />;
        case 'orders': return <OrderManagementSystem />;
        case 'stock-levels': return <StockLevels />;
        case 'movements': return <StockMovements />;
        case 'purchase-orders': return <PurchaseOrders />;
        case 'suppliers': return <SupplierManagement />;
        case 'reports': return <Reports />;
        // case 'audit-logs': return <AuditLogs />;
        case 'scanner': return <MobileScanner />;
        case 'users': return <UserManagement />;
        default: return <Stock_Manager_Dashboard onLogout={onLogout} userRole={userRole} />;
      }
    };

    return (
      <SidebarHeader
        title={navigation.find(item => item.id === activeTab)?.label}
        subtitle="Manage inventory and stock operations efficiently"
        sidebarTitle="Stock Management"
        navigation={navigation}
      
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={onLogout}
      >
        {renderContent()}
      </SidebarHeader>
    );
  };

  export default Render_Stock_Manager;