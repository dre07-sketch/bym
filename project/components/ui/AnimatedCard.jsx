'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnimatedCard({ 
  children, 
  className = '', 
  hover = true, 
  gradient = false,
  onClick,
  ...props 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const baseClasses = `
    transition-all duration-300 ease-in-out
    ${hover ? 'hover:shadow-2xl hover:scale-105 hover:-translate-y-2' : ''}
    ${gradient ? 'bg-gradient-to-br from-white to-gray-50' : 'bg-white'}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `;

  return (
    <Card 
      className={baseClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      {...props}
    >
      {children}
      {hover && isHovered && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg pointer-events-none"></div>
      )}
    </Card>
  );
}

export function AnimatedStatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue',
  trend,
  onClick 
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  return (
    <AnimatedCard 
      className={`stat-card bg-gradient-to-br ${colorClasses[color]} relative overflow-hidden`}
      onClick={onClick}
    >
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
            {subtitle && (
              <p className="text-white/70 text-sm mt-1">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  trend.direction === 'up' 
                    ? 'bg-white/20 text-white' 
                    : 'bg-red-500/20 text-red-100'
                }`}>
                  {trend.direction === 'up' ? '↗' : '↘'} {trend.value}
                </span>
              </div>
            )}
          </div>
          <div className="relative">
            <Icon className="w-12 h-12 text-white/80 animate-pulse" />
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
          </div>
        </div>
      </CardContent>
      
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12 animate-pulse"></div>
    </AnimatedCard>
  );
}