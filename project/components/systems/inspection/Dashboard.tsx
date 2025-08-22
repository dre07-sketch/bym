import React, { useState } from 'react';
import {
  LayoutDashboard,
  User,
  Wrench,
} from 'lucide-react';

import Dashboard from '../inspection/dashboard/Dashboard';
import MyInspections from '../inspection/inspections/MyInspections';
import CompletedReports from '../inspection/completedreports/CompletedReports';
import SidebarHeader from '../../layout/SidebarHeader';

interface DashboardProps {
  onLogout: () => void;
  userRole: string;
}

const InspectionDashboard: React.FC<DashboardProps> = ({ onLogout, userRole }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'MyInspections', label: 'My Inspections', icon: Wrench },
    { id: 'completed reports', label: 'Completed reports', icon: User },
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
      case 'MyInspections': return <MyInspections />;
      case 'completed reports': return <CompletedReports />;
      default: return <Dashboard />;
    }
  };

  return (
    <SidebarHeader
      title={navigation.find(item => item.id === activeTab)?.label}
      subtitle="Manage inspection operations efficiently"
      sidebarTitle="Inspection Service"
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

export default InspectionDashboard;