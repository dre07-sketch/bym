import React, { useState } from 'react';
import { X, CheckCircle2, Clock, AlertTriangle, Settings } from 'lucide-react';

interface NotificationItem {
  id: number;
  car?: string;
  licensePlate?: string;
  date?: string;
  message?: string;
  status?: string;
  estimatedCompletion?: string;
  part?: string;
}

interface NotificationProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: {
    completed: NotificationItem[];
    pending: NotificationItem[];
    parts: NotificationItem[];
  };
  children?: React.ReactNode;
}

const Notification: React.FC<NotificationProps> = ({ 
  isOpen, 
  onOpenChange, 
  notifications,
  children 
}) => {
  const [activeTab, setActiveTab] = useState<'completed' | 'pending' | 'parts'>('completed');

  if (!isOpen) return null;

  const onClose = () => onOpenChange(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300">
        {/* Header */}
        <div className="relative p-6 border-b flex items-center justify-between">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Notifications
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 p-4 border-b bg-gray-50">
          <button
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'completed'
                ? 'bg-green-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed</span>
            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
              {notifications.completed.length}
            </span>
          </button>
          <button
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'pending'
                ? 'bg-yellow-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('pending')}
          >
            <Clock className="w-4 h-4" />
            <span>Pending</span>
            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
              {notifications.pending.length}
            </span>
          </button>
          <button
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
              activeTab === 'parts'
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            onClick={() => setActiveTab('parts')}
          >
            <Settings className="w-4 h-4" />
            <span>Parts</span>
            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-sm">
              {notifications.parts.length}
            </span>
          </button>
        </div>

        {/* Notification List */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'completed' && (
            <div className="space-y-3">
              {notifications.completed.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white p-4 rounded-lg border border-green-100 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {notification.car} ({notification.licensePlate})
                      </h3>
                      <p className="text-gray-600 mt-1">{notification.message}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">{notification.date}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'pending' && (
            <div className="space-y-3">
              {notifications.pending.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white p-4 rounded-lg border border-yellow-100 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {notification.car} ({notification.licensePlate})
                      </h3>
                      <p className="text-yellow-600 mt-1">Status: {notification.status}</p>
                      <p className="text-gray-600 mt-1">
                        Estimated Completion: {notification.estimatedCompletion}
                      </p>
                    </div>
                    <Clock className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">{notification.date}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'parts' && (
            <div className="space-y-3">
              {notifications.parts.map((notification) => (
                <div
                  key={notification.id}
                  className="bg-white p-4 rounded-lg border border-red-100 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {notification.car} ({notification.licensePlate})
                      </h3>
                      <p className="text-gray-700 mt-1">Part: {notification.part}</p>
                      <p className="text-red-600 mt-1">Status: {notification.status}</p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notification;