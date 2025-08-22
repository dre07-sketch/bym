'use client';

import { useState } from 'react';
import { NotificationProvider } from '@/components/ui/NotificationSystem';
import LoginForm from '@/components/auth/LoginForm';
import DashboardSelector from '@/components/dashboard/DashboardSelector';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    <NotificationProvider>
      <div className="min-h-screen">
        {!isAuthenticated ? (
          <LoginForm onLogin={handleLogin} />
        ) : (
          <DashboardSelector userRole={userRole} onLogout={handleLogout} />
        )}
      </div>
    </NotificationProvider>
  );
}