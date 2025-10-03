import React, { useState } from 'react';
import {
  LayoutDashboard,
  Ticket,
  AlertTriangle,
  Calendar,
  Users,
  UserCheck,
  Car,
  Search,
  Phone,
  MessageSquare,
  BarChart3,
  Settings,
  DollarSign,
  TicketPlus,
  TicketCheck,
} from 'lucide-react';

import SidebarHeader from '../../layout/SidebarHeader';
import InteractiveDashboard from './pages/screens/InteractiveDashboard';
import ServiceTickets from './pages/screens/ServiceTickets';
import SOSManagement from './pages/screens/SOSManagement';
import AppointmentScheduler from './pages/screens/AppointmentScheduler';
import CustomerManagement from './pages/screens/customer_management';
import Employees from './pages/screens/employee_directory';
import VehicleStatus from './pages/screens/VehicleStatus';
import Reports from '../Stock manager/pages/screens/Reports';
import Feedback from './pages/screens/Feedback';
import FinancePage from './pages/screens/FinancePage';
import Insurance from './pages/screens/Insurance';
import ConvertedProformasPage from './pages/screens/ConvertedProformasPage';

interface DashboardProps {
  onLogout: () => void;
  userRole: string;
}

const Render_CS: React.FC<DashboardProps> = ({ onLogout, userRole }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tickets', label: 'Service Tickets', icon: Ticket },
    { id: 'sos', label: 'SOS Management', icon: AlertTriangle },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'insurance', label: 'insurance', icon: TicketPlus },
     {id: 'converted-proformas', label: 'Converted Proformas', icon: TicketCheck },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'employees', label: 'Employee Management', icon: UserCheck },
    { id: 'vehicle-status', label: 'Vehicle Status', icon: Car },
    { id: 'finance', label: 'Finance', icon: DollarSign },
    { id: 'feedback', label: 'Feedback', icon: MessageSquare },
    // { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    
  ];

  const userInfo = {
    name: 'Sarah Johnson',
    role: 'CS Manager',
    avatar: null,
    status: 'online',
  };

  const notifications = [
    { 
      id: '1',
      title: 'New SOS Request', 
      message: 'Emergency breakdown on Highway 101', 
      time: '2 min ago', 
      read: false,
      type: 'urgent' as const
    },
    { 
      id: '2',
      title: 'Ticket Completed', 
      message: 'Toyota Camry service finished', 
      time: '15 min ago', 
      read: false,
      type: 'success' as const
    },
    { 
      id: '3',
      title: 'Customer Feedback', 
      message: 'New 5-star review received', 
      time: '1 hour ago', 
      read: true,
      type: 'info' as const
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <InteractiveDashboard userRole="customer-service" />;
      case 'tickets': return <ServiceTickets />;
      case 'sos': return <SOSManagement />;
      case 'appointments': return <AppointmentScheduler />;
      case 'insurance': return <Insurance />;
      case 'converted-proformas': return <ConvertedProformasPage />;  
      case 'customers': return <CustomerManagement />;
      case 'employees': return <Employees />;
      case 'vehicle-status': return <VehicleStatus />;
      // case 'vin-search': return <SOSManagement />;
      case 'finance': return <FinancePage />;
      case 'feedback': return <Feedback />;
      // case 'reports': return <Reports />;
      
      default: return <InteractiveDashboard userRole="customer-service" />;
    }
  };

  return (
    <SidebarHeader
      title={navigation.find(item => item.id === activeTab)?.label}
      subtitle="Manage customer service operations efficiently"
      sidebarTitle="Customer Service"
      navigation={navigation}
      
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={onLogout}
      
    >
      {renderContent()}
    </SidebarHeader>
  );
};

export default Render_CS;