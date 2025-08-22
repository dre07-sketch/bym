'use client';

import React, { useState, useEffect } from 'react';

import Manager from '../systems/manager/Dashboard';
import PartCoordinatorDashboard from '../systems/part-corrdinet/Dashboard';
import Dashboard from '../systems/Customer_Service/Render_CS'
import Inspection from '../systems/inspection/Dashboard'
import Stock_manager from '../systems/Stock manager/Render_Stock_Manager'
import Store_manager from '../systems/Store_manager/Render_Store_Manager'

export default function DashboardSelector({ userRole, onLogout }) {
  const renderDashboard = () => {
    switch (userRole) {
      case 'customer-service':
        return <Dashboard onLogout={onLogout} />;
      case 'manager':
        return <Manager onLogout={onLogout} />;
      case 'stock-manager':
        return <Stock_manager onLogout={onLogout} />;
      case 'tool-manager':
        return <Store_manager onLogout={onLogout} />;
      case 'part-coordinator':
        return <PartCoordinatorDashboard onLogout={onLogout} />;
      case 'inspector':
        return <Inspection onLogout={onLogout} />;
      default:
        return <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Invalid Role</h2>
            <p className="text-gray-600">Please contact your administrator.</p>
          </div>
        </div>;
    }
  };

  return (
    <div className="min-h-screen">
      {renderDashboard()}
    </div>
  );
}