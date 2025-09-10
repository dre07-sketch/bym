'use client';

import React from 'react';

import Manager from '../systems/manager/Dashboard';
import PartCoordinatorDashboard from '../systems//part-corrdinet/Dashboard';
import CustomerService from '../systems/Customer_Service/Render_CS';
import Inspection from '../systems/inspection/Dashboard';
import StockManager from '../systems/Stock manager/Render_Stock_Manager';
import StoreManager from '../systems/Store_manager/Render_Store_Manager';
import Communication from '../systems/Communication/Render_Communication_Manager';
import Marketing from '../systems/Marketing_manager/Render_MarketingManager';

export default function DashboardSelector({ userRole, onLogout }) {
  const renderDashboard = () => {
    switch (userRole?.toLowerCase()) {
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
            </div>
          </div>
        );
    }
  };

  return <div className="min-h-screen">{renderDashboard()}</div>;
}
