'use client';

import { useState, useEffect } from 'react';
import { NotificationProvider } from '@/components/ui/NotificationSystem';
import LoginForm from '@/components/auth/LoginForm';
import DashboardSelector from '@/components/dashboard/DashboardSelector';
import Shutdown from '@/components/auth/Shutdown';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [systemStatusLoading, setSystemStatusLoading] = useState(true);
  const [systemStatusError, setSystemStatusError] = useState(null);

  // Fetch system status on component mount
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        setSystemStatusLoading(true);
        setSystemStatusError(null);
        const response = await fetch('https://ipasystem.bymsystem.com/api/auth/system-status');
        const result = await response.json();
        
        console.log('API Response:', result); // Debug log
        
        if (result.success) {
          console.log('System status data:', result.data); // Debug log
          console.log('is_active value:', result.data.is_active); // Debug log
          console.log('isActive flag:', result.data.isActive); // Debug log
          setSystemStatus(result.data);
        } else {
          console.log('API Error:', result.message); // Debug log
          setSystemStatusError(result.message || 'Failed to fetch system status');
        }
      } catch (err) {
        console.error('Error fetching system status:', err);
        setSystemStatusError('Failed to fetch system status');
      } finally {
        setSystemStatusLoading(false);
      }
    };

    fetchSystemStatus();
  }, []);

  const handleLogin = (role) => {
    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
  };

  // Show loading state while checking system status
  if (systemStatusLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm border border-orange-500/30 rounded-full px-4 py-2 mb-3">
            <div className="w-5 h-5 border-t-2 border-orange-400 border-solid rounded-full animate-spin"></div>
            <span className="text-xl font-bold text-white tracking-wider">Checking System Status</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error if system status check failed
  if (systemStatusError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm border border-red-500/30 rounded-full px-4 py-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-xl font-bold text-white tracking-wider">System Error</span>
          </div>
          <p className="text-slate-300 mb-4">Unable to check system status: {systemStatusError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Check if system is active using the isActive flag
  if (systemStatus && systemStatus.isActive === true) {
    console.log('System is active (is_active=activate), showing login/dashboard');
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
  } else {
    // If system is not active (is_active=deactivate or undefined), show shutdown page
    
    return <Shutdown />;
  }
}