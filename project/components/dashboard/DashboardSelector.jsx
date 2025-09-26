'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Import your dashboards
import Manager from '../systems/manager/Dashboard';
import PartCoordinatorDashboard from '../systems/part-corrdinet/Dashboard';
import CustomerService from '../systems/Customer_Service/Render_CS';
import Inspection from '../systems/inspection/Dashboard';
import StockManager from '../systems/Stock manager/Render_Stock_Manager';
import StoreManager from '../systems/Store_manager/Render_Store_Manager';
import Communication from '../systems/Communication/Render_Communication_Manager';
import Marketing from '../systems/Marketing_manager/Render_MarketingManager';

export default function DashboardSelector({ userRole: propRole, onLogout }) {
  // Read from localStorage if prop is missing (e.g., after page refresh)
  const [userRole, setUserRole] = React.useState(propRole || null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token && !propRole) {
      router.push('/login');
      return;
    }

    if (!propRole) {
      const user = localStorage.getItem('user');
      if (user) {
        const parsed = JSON.parse(user);
        setUserRole(parsed.role || null);
      } else {
        router.push('/login');
      }
    }
  }, [propRole, router]);

  const renderDashboard = () => {
    if (!userRole) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Role Found</h2>
            <p className="text-gray-600">Please log in again.</p>
            <button
              onClick={onLogout}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      );
    }

    switch (userRole.toLowerCase()) {
      case 'customer-service':
        return <CustomerService onLogout={onLogout} />;
      case 'manager':
        return <Manager onLogout={onLogout} />;
      case 'stock-manager':
        return <StockManager onLogout={onLogout} />;
      case 'tool-manager':
        return <StoreManager onLogout={onLogout} />;
      case 'part-coordinator':
        return <PartCoordinatorDashboard onLogout={onLogout} />;
      case 'inspector':
        return <Inspection onLogout={onLogout} />;
      case 'communication':
        return <Communication onLogout={onLogout} />;
      case 'marketing':
        return <Marketing onLogout={onLogout} />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Invalid Role</h2>
              <p className="text-gray-600">Please contact your administrator.</p>
              <button
                onClick={onLogout}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          </div>
        );
    }
  };

  return <div className="min-h-screen">{renderDashboard()}</div>;
}