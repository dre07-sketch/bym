'use client';
import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Bell,
  Lock,
  Shield,
  Sun,
  Moon,
  Globe,
  FileText,
  Download,
  Save,
  X,
  Check,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';

interface SettingOption {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'preferences'>('profile');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Profile Form State
  const [profile, setProfile] = useState({
    name: 'Alex Morgan',
    email: 'alex.morgan@workshop.com',
    phone: '+1 (555) 123-4567',
    role: 'Communication Manager',
    department: 'Insurance & Claims',
    avatar: '/avatar-placeholder.jpg',
  });

  // Notification Preferences
  const [notifications, setNotifications] = useState<SettingOption[]>([
    {
      id: 'email-notifications',
      label: 'Email Notifications',
      description: 'Receive updates via email for new requests and approvals',
      enabled: true,
    },
    {
      id: 'push-notifications',
      label: 'Push Notifications',
      description: 'Get real-time alerts on your device',
      enabled: true,
    },
    {
      id: 'urgent-only',
      label: 'Urgent Only',
      description: 'Only receive notifications for high/urgent priority items',
      enabled: false,
    },
    {
      id: 'daily-digest',
      label: 'Daily Digest',
      description: 'Get a summary email at the end of each day',
      enabled: true,
    },
  ]);

  // Communication Preferences
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en',
    timeZone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12-hour',
  });

  // Security Settings
  const [security, setSecurity] = useState({
    twoFactorEnabled: true,
    lastPasswordChange: '2024-01-10',
    loginAlerts: true,
    sessionTimeout: 30, // minutes
  });

  // Simulate loading user data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('✅ Settings saved successfully!');
    }, 800);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  const updatePreference = (field: string, value: string) => {
    setPreferences((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Settings
          </h2>
          <p className="text-gray-500 mt-1">Manage your account, preferences, and security</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-70"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 mb-6">
        {[
          { id: 'profile', label: 'Profile', icon: User },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'preferences', label: 'Preferences', icon: Globe },
          { id: 'security', label: 'Security', icon: Shield },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-500 text-purple-700 bg-purple-50'
                : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 space-y-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <User className="w-5 h-5 text-purple-600 mr-2" />
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <input
                type="text"
                value={profile.role}
                readOnly
                className="w-full px-4 py-2 border border-gray-200 bg-gray-100 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                value={profile.department}
                readOnly
                className="w-full px-4 py-2 border border-gray-200 bg-gray-100 rounded-lg text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 pt-4">
            <img
              src={profile.avatar}
              alt="Profile"
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Change Photo
            </button>
            <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-1">
              <Trash2 className="w-4 h-4" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 space-y-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <Bell className="w-5 h-5 text-blue-600 mr-2" />
            Notification Preferences
          </h3>

          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-800">{notif.label}</p>
                  <p className="text-sm text-gray-600">{notif.description}</p>
                </div>
                <button
                  onClick={() => toggleNotification(notif.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notif.enabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notif.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 space-y-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <Globe className="w-5 h-5 text-green-600 mr-2" />
            System Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) => updatePreference('theme', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="light">Light Mode</option>
                <option value="dark">Dark Mode</option>
                <option value="system">System Default</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => updatePreference('language', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
              <select
                value={preferences.timeZone}
                onChange={(e) => updatePreference('timeZone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                value={preferences.dateFormat}
                onChange={(e) => updatePreference('dateFormat', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
              <select
                value={preferences.timeFormat}
                onChange={(e) => updatePreference('timeFormat', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="12-hour">12-Hour</option>
                <option value="24-hour">24-Hour</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 space-y-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center">
            <Shield className="w-5 h-5 text-red-600 mr-2" />
            Security Settings
          </h3>

          <div className="space-y-5">
            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
              </div>
              <button
                onClick={() =>
                  setSecurity((prev) => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  security.twoFactorEnabled ? 'bg-red-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Login Alerts */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
              <div>
                <p className="font-medium text-gray-800">Login Alerts</p>
                <p className="text-sm text-gray-600">Get notified when your account is accessed</p>
              </div>
              <button
                onClick={() =>
                  setSecurity((prev) => ({ ...prev, loginAlerts: !prev.loginAlerts }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  security.loginAlerts ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    security.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Session Timeout */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={security.sessionTimeout}
                onChange={(e) =>
                  setSecurity((prev) => ({
                    ...prev,
                    sessionTimeout: parseInt(e.target.value) || 5,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Last Password Change */}
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-700">
                <strong>Last password change:</strong> {new Date(security.lastPasswordChange).toLocaleDateString()}
              </p>
              <button className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1">
                <Lock className="w-4 h-4" />
                <span>Change Password</span>
              </button>
            </div>

            {/* Export Data */}
            <div className="p-4 border border-gray-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Export Your Data</p>
                  <p className="text-sm text-gray-600">Download a copy of your account data</p>
                </div>
                <button className="flex items-center space-x-2 text-green-600 hover:text-green-800">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="p-4 border border-red-200 rounded-xl bg-red-50">
              <h4 className="font-semibold text-red-800 flex items-center">
                <Trash2 className="w-5 h-5 mr-2" />
                Danger Zone
              </h4>
              <p className="text-sm text-red-700 mt-1">
                Permanently delete your account and all associated data.
              </p>
              <button className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center space-x-1">
                <Trash2 className="w-4 h-4" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;