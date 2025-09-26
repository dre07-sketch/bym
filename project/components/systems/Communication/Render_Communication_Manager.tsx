import React, { useState } from 'react';
import {
  Home,
  FileText,
  Users,
  BarChart3,
  Settings,
  DollarSign,
  PersonStanding,
  PersonStandingIcon,
  FormInputIcon,
  DollarSignIcon,
} from 'lucide-react';

import SidebarHeader from '../../layout/SidebarHeader';
import CommunicationDashboard from './screens/CommunicationDashboard';
import Performa from './screens/Performa';
import OutsourceStock from './screens/OutsourceStocksPage';
import ReportsAnalytics from './screens/ReportsAnalytics';
import SettingsPage from './screens/SettingsPage';
import PerformaDashboard from './screens/Performa';
import OutsourceStocksPage from './screens/OutsourceStocksPage';
import RequestSurveyor from './screens/RequestSurveyor';
import RequestSalvage from './screens/RequestSalvage';
import { Form } from 'react-hook-form';

interface Render_Communication_ManagerDashboardProps {
  onLogout: () => void;
  userRole: string;
}

const Render_Communication_Manager: React.FC<Render_Communication_ManagerDashboardProps> = ({ onLogout, userRole }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'performa', label: 'Performa', icon: FileText },
    { id: 'outsource', label: 'OutsourceStock', icon: Users },
    { id: 'request surveyor', label: 'Request surveyor', icon: PersonStandingIcon },
    { id: 'request salvage', label: 'Request salvage', icon: FormInputIcon },
    
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    
  ];

  const notifications = [
    {
      id: '1',
      title: 'New Message Received',
      message: 'Customer inquiry about service status',
      time: '8 min ago',
      read: false,
      type: 'info' as const,
    },
    {
      id: '2',
      title: 'Broadcast Sent',
      message: 'Maintenance alert sent to 45 customers',
      time: '1 hour ago',
      read: false,
      type: 'info' as const,
    },
    {
      id: '3',
      title: 'Urgent Response Needed',
      message: 'Complaint received from VIP client',
      time: '3 hours ago',
      read: false,
      type: 'urgent' as const,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <CommunicationDashboard onLogout={onLogout} userRole={userRole} />;
      case 'performa':
        return <PerformaDashboard />;
      case 'outsource':
        return <OutsourceStocksPage />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'request surveyor':
        return <RequestSurveyor />;
      case 'request salvage':
        return <RequestSalvage />;
      case 'request payment':
        return <ReportsAnalytics />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <CommunicationDashboard onLogout={onLogout} userRole={userRole} />;
    }
  };

  return (
    <SidebarHeader
      title={navigation.find(item => item.id === activeTab)?.label}
      subtitle="Manage customer communications and engagement"
      sidebarTitle="Communication Management"
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

export default Render_Communication_Manager;