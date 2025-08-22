import React, { useState } from 'react';
import {
  LayoutDashboard,
  Settings as LucideSettings,
  User,
  UserPlus,
  Reply,
  Bell,
  Calendar,
  LogOut,
  Users,
  Wrench,
  Car,
} from 'lucide-react';

import Dashboard from '../part-corrdinet/dashboard/Dashboard';
import PartsManagement from '../part-corrdinet/Parts Management/PartsManagement';
import CompletedCars from '../part-corrdinet/completed/completed';

import SidebarHeader from '../../layout/SidebarHeader';

interface DashboardProps {
  onLogout: () => void;
  userRole: string;
}

const PartcordinatorDashboard: React.FC<DashboardProps> = ({ onLogout, userRole }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'parts-management', label: 'Parts Management', icon: Wrench },
    { id: 'completed-cars', label: 'Completed Cars', icon: Car },
  ];

  const notifications = [
    { 
      id: '1',
      title: 'New Booking', 
      message: 'John Doe booked a service', 
      time: '2 min ago', 
      read: false,
      type: 'info' as const
    },
    { 
      id: '2',
      title: 'Mechanic Assigned', 
      message: 'Assigned to Toyota Corolla case', 
      time: '30 min ago', 
      read: true,
      type: 'success' as const
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'parts-management': return <PartsManagement />;
      case 'completed-cars': return <CompletedCars />;
      default: return <Dashboard />;
    }
  };

  return (
    <SidebarHeader
      title={navigation.find(item => item.id === activeTab)?.label}
      subtitle="Manage parts coordination operations efficiently"
      sidebarTitle="Parts Coordinator"
      navigation={navigation}
      notifications={notifications}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={onLogout}
    >
      {/* Content will render in the main content area of SidebarHeader */}
      {renderContent()}
    </SidebarHeader>
  );
};

export default PartcordinatorDashboard;