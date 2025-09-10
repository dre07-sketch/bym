'use client';

import React, { useState } from 'react';
import SidebarHeader from '../../layout/SidebarHeader';

// Pages
import DashboardPage from './pages/screens/MarketingDashboardPage';
import ActivitiesPage from './pages/screens/ActivitiesPage';
import ContactsPage from './pages/screens/ContactsPage';
import FollowUpsPage from './pages/screens/FollowUpsPage';
import ReportsPage from './pages/screens/ReportsPage';

// Icons
import { BarChart3, Calendar, Users, Clock, FileText } from 'lucide-react';

interface Render_MarketingManagerProps {
  onLogout: () => void;
  userRole: string;
}

const Render_MarketingManager: React.FC<Render_MarketingManagerProps> = ({ onLogout, userRole }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'activities', label: 'Daily Activities', icon: Calendar },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'follow-ups', label: 'Follow-ups', icon: Clock },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const notifications = [
    {
      id: '1',
      title: 'New Activity Logged',
      message: 'Sarah logged a client meeting in downtown',
      time: '3 min ago',
      read: false,
      type: 'info' as const,
    },
  ];

  const userInfo = {
    name: 'Alex Johnson',
    role: 'Marketing Manager',
    email: 'alex.johnson@bym.com',
    avatar: null,
    status: 'online' as const,
  };


  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage userRole="customer-service" />;
      case 'activities': return <ActivitiesPage />;
      case 'contacts': return <ContactsPage />;
      case 'follow-ups': return <FollowUpsPage />;
      case 'reports': return <ReportsPage />;
      
      
      // case 'reports': return <Reports />;
      
      default: return <DashboardPage userRole="customer-service" />;
    }
  };



  return (
      <SidebarHeader
      title={navigation.find(item => item.id === activeTab)?.label}
      subtitle="Track campaigns, leads, and daily activities"
      sidebarTitle="Marketingt"
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

export default Render_MarketingManager;