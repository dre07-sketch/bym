import React, { useState } from 'react';
import {
  Wrench,
  Package,
  UserCheck,
  AlertTriangle,
  BarChart3,
  Users,
} from 'lucide-react';

import SidebarHeader from '../../layout/SidebarHeader';
import ToolDashboard from './pages/screens/ToolDashboard';
import ToolRequests from './pages/screens/ToolRequests';
import InventoryManagement from './pages/screens/InventoryManagement';
import AssignmentReturn from './pages/screens/AssignmentReturn';
import ToolMaintenance from './pages/screens/ToolMaintenance';
import ToolReports from './pages/screens/ToolReports';
import DamageReportPage from './pages/screens/DamageReportPage';
import Reports from './pages/screens/reports-analytic';

interface Render_Store_ManagerDashboardProps {
  onLogout: () => void;
  userRole: string;
}

const Render_Store_Manager: React.FC<Render_Store_ManagerDashboardProps> = ({ onLogout, userRole }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Wrench },
    { id: 'requests', label: 'Assign Tool', icon: Package },
    { id: 'inventory', label: 'Inventory Management', icon: Package },
    { id: 'assignments', label: 'Assignment & Return', icon: UserCheck },
    { id: 'damage-reports', label: 'Damage Reports', icon: AlertTriangle },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    
  ];

  const notifications = [
    { 
      id: '1',
      title: 'New Tool Request', 
      message: 'Mechanic requested impact wrench', 
      time: '15 min ago', 
      read: false,
      type: 'info' as const
    },
    { 
      id: '2',
      title: 'Damage Reported', 
      message: 'Torque wrench reported as damaged', 
      time: '2 hours ago', 
      read: false,
      type: 'warning' as const
    },
    { 
      id: '3',
      title: 'Maintenance Due', 
      message: '5 tools due for calibration', 
      time: '1 day ago', 
      read: true,
      type: 'urgent' as const
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <ToolDashboard onLogout={onLogout} userRole={userRole} />;
      case 'requests': return <ToolRequests />;
      case 'inventory': return <InventoryManagement />;
      case 'assignments': return <AssignmentReturn />;
      case 'damage-reports': return <DamageReportPage />;
      case 'reports': return <Reports />;
     
      default: return <ToolDashboard onLogout={onLogout} userRole={userRole} />;
    }
  };

  return (
    <SidebarHeader
      title={navigation.find(item => item.id === activeTab)?.label}
      subtitle="Manage tool inventory and assignments efficiently"
      sidebarTitle="Store Management"
      navigation={navigation}
      notifications={notifications}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={onLogout}
    >
      {renderContent()}
    </SidebarHeader>
  );
};

export default Render_Store_Manager;