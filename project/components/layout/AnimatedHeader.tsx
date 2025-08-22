import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, User, ChevronDown, Moon, Sun, Maximize, Minimize,
  Sparkles, Settings, LogOut, Sliders, Command, CheckCircle2, Clock, AlertTriangle,  
  Mail, Lock, Camera, X, Volume2, VolumeX, Monitor, Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface UserInfo {
  name: string;
  role: string;
  email: string;
  avatar: string | null;
  status: 'online' | 'offline' | 'away';
}

interface AnimatedHeaderProps {
  title?: string;
  subtitle?: string;
  notifications?: NotificationItem[];
  userInfo?: UserInfo;
}

const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
  title = "Dashboard",
  subtitle = "Welcome back",
  notifications = [
    {
      id: '1',
      title: 'New Message',
      message: 'You have a new message from Sarah',
      time: '2 min ago',
      read: false,
      type: 'info'
    },
    {
      id: '2',
      title: 'Task Completed',
      message: 'Project deployment finished successfully',
      time: '10 min ago',
      read: false,
      type: 'success'
    },
    {
      id: '3',
      title: 'System Alert',
      message: 'Server maintenance scheduled for tonight',
      time: '1 hour ago',
      read: true,
      type: 'warning'
    }
  ],
  userInfo = {
    name: 'Alex Johnson',
    role: 'Senior Manager',
    email: 'alex.johnson@company.com',
    avatar: null,
    status: 'online'
  }
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsList, setNotificationsList] = useState(notifications);
  const [formData, setFormData] = useState({
    name: userInfo.name,
    email: userInfo.email,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotificationsList(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotificationsList(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const unreadCount = notificationsList.filter(n => !n.read).length;

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <X className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = () => {
    // Here you would typically save to your backend
    console.log('Saving profile:', formData);
    setShowUserMenu(false);
  };

  return (
    <>
      <header className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 backdrop-blur-2xl border-b border-slate-700/30 dark:border-slate-800/30 px-4 md:px-8 py-4 md:py-6 shadow-2xl">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 via-indigo-900/20 to-slate-900/20 animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]"></div>

        <div className="relative flex items-center justify-between">
          {/* Left - Title */}
          <div className="flex items-center space-x-4 md:space-x-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-600 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-105 transition-transform duration-300">
                <Sparkles className="text-white w-6 h-6 md:w-7 md:h-7 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-slate-300 dark:text-slate-400 font-medium text-sm md:text-base">{subtitle}</p>
            </div>
          </div>

          {/* Right - Controls */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Clock */}
            <div className="hidden lg:block text-right bg-slate-800/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-2xl px-4 py-2 border border-slate-700/30 dark:border-slate-800/30 shadow-lg">
              <p className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {currentTime.toLocaleDateString()}
              </p>
            </div>

            {/* Theme / Fullscreen */}
            <div className="flex items-center space-x-1 md:space-x-2">
              <Button 
                onClick={toggleDarkMode} 
                variant="ghost" 
                size="icon" 
                className="rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300 transform hover:scale-105"
              >
                {isDarkMode ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-400" />}
              </Button>

              <Button 
                onClick={toggleFullscreen} 
                variant="ghost" 
                size="icon" 
                className="hidden md:flex rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300 transform hover:scale-105"
              >
                {isFullscreen ? <Minimize className="w-5 h-5 text-green-400" /> : <Maximize className="w-5 h-5 text-green-400" />}
              </Button>
            </div>

            {/* Settings */}
            <div className="relative">
              <Button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                variant="ghost" 
                size="icon" 
                className="rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300 transform hover:scale-105"
              >
                <Sliders className="w-5 h-5 text-indigo-400" />
              </Button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <Button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                variant="ghost" 
                size="icon" 
                className="rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300 transform hover:scale-105 relative"
              >
                <Bell className="w-5 h-5 text-red-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs px-1 min-w-5 h-5 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </div>

            {/* User Menu */}
            <div className="relative">
              <Button 
                onClick={() => setShowUserMenu(!showUserMenu)} 
                variant="ghost" 
                size="icon" 
                className="rounded-xl text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
              >
                <div className="relative">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm ${
                    userInfo.status === 'online' ? 'ring-2 ring-green-400' : ''
                  }`}>
                    {userInfo.avatar ? (
                      <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      userInfo.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                    userInfo.status === 'online' ? 'bg-green-400' : 
                    userInfo.status === 'away' ? 'bg-yellow-400' : 'bg-slate-400'
                  }`}></div>
                </div>
                <ChevronDown className="w-3 h-3 text-blue-400 hidden md:block" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal - Fixed Position */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative transform animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsSettingsOpen(false)} 
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quick Settings</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Customize your experience</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Monitor className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Dark Mode</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark themes</p>
                  </div>
                </div>
                <Button onClick={toggleDarkMode} variant="ghost" size="sm">
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <div className="flex items-center space-x-3">
                  <Maximize className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Fullscreen</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Toggle fullscreen mode</p>
                  </div>
                </div>
                <Button onClick={toggleFullscreen} variant="ghost" size="sm">
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                <div className="flex items-center space-x-3">
                  {soundEnabled ? <Volume2 className="w-5 h-5 text-slate-600 dark:text-slate-300" /> : <VolumeX className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">Sound Effects</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Enable notification sounds</p>
                  </div>
                </div>
                <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="ghost" size="sm">
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <Button 
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal - Fixed Position */}
      {isNotificationOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg relative transform animate-in zoom-in-95 max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button onClick={markAllAsRead} variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                    Mark all as read
                  </Button>
                )}
                <button 
                  onClick={() => setIsNotificationOpen(false)} 
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notificationsList.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium text-sm ${!notification.read ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {notification.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal - Fixed Position */}
      {showUserMenu && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 relative transform animate-in zoom-in-95 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowUserMenu(false)} 
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage your account settings</p>
            </div>

            {/* Profile Image */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : userInfo.avatar ? (
                    <img src={userInfo.avatar} alt={userInfo.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    userInfo.name.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-slate-100 dark:bg-slate-700 rounded-xl p-1">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'security', label: 'Security', icon: Lock },
                { id: 'preferences', label: 'Preferences', icon: Settings }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all text-sm font-medium flex items-center justify-center space-x-2 ${
                    activeTab === tab.id 
                      ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-4 mb-6">
              {activeTab === 'profile' && (
                <>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Full Name"
                      className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email"
                      className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </>
              )}

              {activeTab === 'security' && (
                <>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      placeholder="Current Password"
                      className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="New Password"
                      className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm New Password"
                      className="w-full pl-12 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <Monitor className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Dark Mode</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Switch between light and dark themes</p>
                      </div>
                    </div>
                    <Button onClick={toggleDarkMode} variant="ghost" size="sm">
                      {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                    <div className="flex items-center space-x-3">
                      {soundEnabled ? <Volume2 className="w-5 h-5 text-slate-600 dark:text-slate-300" /> : <VolumeX className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">Sound Effects</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Enable notification sounds</p>
                      </div>
                    </div>
                    <Button onClick={() => setSoundEnabled(!soundEnabled)} variant="ghost" size="sm">
                      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button 
                onClick={handleSaveProfile}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg"
              >
                Save Changes
              </Button>
              <Button 
                onClick={() => setShowUserMenu(false)}
                variant="outline"
                className="px-6 py-3 rounded-xl font-medium transition-all"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnimatedHeader;