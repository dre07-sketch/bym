import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, LogOut, Sparkles, Zap, Activity, Star, Award, Palette,
  Cpu, Wifi, Battery
} from 'lucide-react';


export default function AnimatedSidebar(props) {
  const {
    title = "BYM Trading PLC",
    navigation = [],
    onLogout,
    activeTab,
    setActiveTab,
    userInfo = { name: 'Alex Johnson', role: 'Senior Manager', avatar: null }
  } = props;


  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });


  useEffect(() => {
    document.body.classList.add('animate-fade-in');
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);


  const toggleSidebar = () => setIsCollapsed(!isCollapsed);


  return (
    <div className={`${isCollapsed ? 'w-28' : 'w-72'} relative transition-all duration-700 ease-in-out flex flex-col overflow-hidden group min-h-screen`}>
      {/* Enhanced Animated Background - Dark Navy Theme */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/98 via-slate-900/98 to-slate-950/98 backdrop-blur-2xl" style={{
        background: 'linear-gradient(to bottom, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98))'
      }}></div>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/15 via-indigo-800/15 to-purple-900/15" style={{
        background: 'linear-gradient(to bottom right, rgba(30, 58, 138, 0.15), rgba(55, 48, 163, 0.15), rgba(88, 28, 135, 0.15))'
      }}></div>
     
      {/* Dynamic mesh gradient overlay */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10 animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/8 to-transparent"></div>
      </div>
     
      {/* Enhanced floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(35)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-gradient-to-r from-blue-300/60 to-purple-300/60 rounded-full animate-float"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${4 + Math.random() * 6}s`,
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)'
            }}
          />
        ))}
      </div>


      {/* Subtle border glow */}
      <div className="absolute inset-0 border-r border-blue-200/20 shadow-2xl shadow-blue-500/25"></div>


      {/* Header Section with Enhanced Logo */}
      <div className="relative z-10 p-6 border-b border-blue-200/20">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-4'}`}>
            <div className="relative group/logo">
              {/* Enhanced Logo container with multiple glow layers */}
              <div className="relative">
                {/* Outer glow effect - largest */}
                <div className="absolute -inset-6 bg-gradient-to-r from-blue-400/40 via-purple-400/40 to-indigo-400/40 rounded-3xl blur-3xl opacity-0 group-hover/logo:opacity-100 transition-all duration-700 scale-150 animate-pulse"></div>
               
                {/* Middle glow effect */}
                <div className="absolute -inset-3 bg-gradient-to-r from-blue-300/50 via-purple-300/50 to-indigo-300/50 rounded-2xl blur-2xl opacity-70 group-hover/logo:opacity-100 transition-all duration-500 scale-125"></div>
               
                {/* Inner glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-200/60 via-purple-200/60 to-indigo-200/60 rounded-xl blur-xl opacity-50 group-hover/logo:opacity-90 transition-all duration-300"></div>
               
                {/* Logo image - much larger size */}
                <img
                  src="./photo_2025-06-05_14-35-04-removebg-preview.png"
                  alt="BYM Trading PLC Logo"
                  className="relative w-20 h-20 object-contain transition-all duration-500 group-hover/logo:scale-110 group-hover/logo:brightness-125 filter drop-shadow-2xl"
                  style={{
                    filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.6)) drop-shadow(0 0 40px rgba(139, 92, 246, 0.4))'
                  }}
                  draggable={false}
                />
               
                {/* Animated ring around logo */}
                <div className="absolute inset-0 rounded-3xl border-2 border-blue-300/30 group-hover/logo:border-purple-300/60 transition-all duration-500 animate-pulse"></div>
               
                {/* Rotating glow ring */}
                <div className="absolute inset-0 rounded-3xl border border-purple-400/40 group-hover/logo:animate-spin group-hover/logo:border-blue-400/70 transition-all duration-1000" style={{
                  animationDuration: '4s'
                }}></div>
              </div>
            </div>
           
            {!isCollapsed && (
              <div className="animate-slide-in flex flex-col">
                
              </div>
            )}
          </div>
         
          {!isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="relative group/toggle bg-blue-900/40 backdrop-blur-xl border border-blue-300/30 hover:bg-blue-800/50 hover:scale-110 transition-all duration-500 rounded-xl p-3 shadow-lg shadow-blue-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/40 to-purple-400/40 rounded-xl opacity-0 group-hover/toggle:opacity-100 transition-opacity duration-300 blur-sm"></div>
              <ChevronLeft className="w-5 h-5 text-blue-100 group-hover/toggle:text-white group-hover/toggle:animate-pulse relative z-10 drop-shadow-lg" />
            </button>
          )}
         
          {isCollapsed && (
            <button
              onClick={toggleSidebar}
              className="absolute -right-3 top-1/2 -translate-y-1/2 bg-slate-800/95 backdrop-blur-xl border border-blue-300/40 hover:bg-slate-700/95 hover:scale-110 transition-all duration-500 rounded-full p-2 shadow-xl shadow-blue-400/30"
            >
              <ChevronRight className="w-4 h-4 text-blue-200 hover:text-white" />
            </button>
          )}
        </div>
      </div>


      {/* Navigation Section */}
      <nav className="relative z-10 flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-blue-200/30">
        <ul className="space-y-3">
          {navigation.map((item, index) => (
            <li key={item.id} className="animate-slide-in" style={{ animationDelay: `${index * 0.08}s` }}>
              <button
                onClick={() => setActiveTab?.(item.id)}
                className={`relative w-full group/nav flex items-center ${isCollapsed ? 'justify-center' : 'space-x-4'} p-4 rounded-xl transition-all duration-300 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-blue-600/40 to-purple-600/40 backdrop-blur-xl border border-blue-300/40 shadow-xl shadow-blue-500/30'
                    : 'hover:bg-blue-900/30 hover:backdrop-blur-xl hover:border hover:border-blue-200/25 hover:shadow-lg hover:shadow-blue-500/20'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                {/* Enhanced active indicator */}
                {activeTab === item.id && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-500/30 rounded-xl blur-xl animate-pulse"></div>
                    {!isCollapsed && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-blue-300 via-purple-300 to-blue-400 rounded-r-full shadow-xl shadow-blue-400/60"></div>
                    )}
                  </>
                )}
               
                <div className={`relative flex items-center ${isCollapsed ? '' : 'space-x-4 w-full'}`}>
                  <div className="relative">
                    <item.icon className={`w-6 h-6 flex-shrink-0 transition-all duration-300 group-hover/nav:scale-110 ${
                      activeTab === item.id ? 'text-blue-200 drop-shadow-lg' : 'text-blue-300/80 group-hover/nav:text-blue-100'
                    }`} style={{
                      filter: activeTab === item.id ? 'drop-shadow(0 0 8px rgba(147, 197, 253, 0.6))' : ''
                    }} />
                    {activeTab === item.id && (
                      <div className="absolute inset-0 bg-blue-300/60 rounded-lg blur-md animate-pulse"></div>
                    )}
                  </div>
                 
                  {!isCollapsed && (
                    <>
                      <span className={`text-sm font-semibold truncate transition-all duration-300 ${
                        activeTab === item.id ? 'text-white drop-shadow-sm' : 'text-blue-100/90 group-hover/nav:text-white'
                      }`}>
                        {item.label}
                      </span>


                      {activeTab === item.id && (
                        <div className="ml-auto flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-blue-300 to-purple-400 rounded-full animate-pulse shadow-lg shadow-blue-400/60"></div>
                          <Sparkles className="w-4 h-4 text-yellow-200 animate-pulse drop-shadow-lg" style={{
                            filter: 'drop-shadow(0 0 8px rgba(254, 240, 138, 0.8))'
                          }} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </nav>


      {/* Enhanced Footer Section */}
      <div className="relative z-10 p-4 border-t border-blue-200/20">
        <button
          onClick={onLogout}
          className={`relative w-full group/logout flex items-center ${isCollapsed ? 'justify-center' : 'space-x-4'} p-4 rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-red-600/35 hover:to-red-700/35 hover:backdrop-blur-xl hover:border hover:border-red-300/40 hover:shadow-lg hover:shadow-red-500/25`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-400/30 to-red-500/30 rounded-xl opacity-0 group-hover/logout:opacity-100 transition-opacity duration-300 blur-lg"></div>
          <LogOut className="w-6 h-6 flex-shrink-0 text-blue-300/80 group-hover/logout:text-red-300 group-hover/logout:scale-110 transition-all duration-300 relative z-10 drop-shadow-sm" />
          {!isCollapsed && (
            <span className="text-sm font-semibold text-blue-100/90 group-hover/logout:text-red-300 transition-colors duration-300 relative z-10">
              Sign Out
            </span>
          )}
        </button>
      </div>
    </div>
  );
}