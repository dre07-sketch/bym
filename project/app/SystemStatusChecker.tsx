// components/SystemStatusChecker.tsx
import React, { useEffect, useState } from 'react';

const SystemStatusChecker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSystemActive, setIsSystemActive] = useState(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  const checkSystemStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/system/status');
      if (!response.ok) throw new Error('Failed to check system status');
      const { is_active, message } = await response.json();
      
      setIsSystemActive(is_active);
      setMaintenanceMessage(message);
    } catch (err) {
      console.error('Error checking system status:', err);
      // Assume system is up if check fails (fail-open)
      setIsSystemActive(true);
    }
  };

  useEffect(() => {
    checkSystemStatus();
    // Check every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!isSystemActive) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">System Unavailable</h2>
          <p className="text-gray-600 mb-4">{maintenanceMessage}</p>
          <p className="text-sm text-gray-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SystemStatusChecker;