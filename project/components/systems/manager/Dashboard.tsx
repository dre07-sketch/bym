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
  CarFront,
  ListOrdered,
} from 'lucide-react';

import Dashboard from '../manager/dashboard/main-dash/Dashboard';
import Mechanic from '../manager/mechanic/Mechanic';
import Customer from '../manager/customer/Customer';
import Createaccount from '../manager/createaccount/Createaccount';
import Feedback from './feedback/Feedback';
import CompletedCars from '../manager/compleated-cars/CompletedCars';
import SidebarHeader from '../../layout/SidebarHeader';
import PurchaseOrderpage from '../manager/Purchase Orders/PurchaseOrdersPage';

interface DashboardProps {
  onLogout: () => void;
  userRole: string;
}

const ManagerDashboard: React.FC<DashboardProps> = ({ onLogout, userRole }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'mechanics', label: 'Mechanics', icon: Wrench },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'create-account', label: 'Create Account', icon: UserPlus },
    {id: 'purchase-order', label: 'Purchase Order', icon: ListOrdered},
    { id: 'CompletedCars', label: 'Completed Cars', icon: CarFront },
    { id: 'feedback', label: 'Feedback', icon: Reply },

    
    
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
      case 'mechanics': return <Mechanic />;
      case 'customers': return <Customer />;
      case 'create-account': return <Createaccount />;
      case 'purchase-order': return <PurchaseOrderpage />;
      case 'CompletedCars': return <CompletedCars />;
      case 'feedback': return <Feedback />;
      
      default: return <Dashboard />;
    }
  };

  return (
    <SidebarHeader
      title={navigation.find(item => item.id === activeTab)?.label}
      subtitle="Manage customer service operations efficiently"
      sidebarTitle="Customer Service"
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

export default ManagerDashboard;