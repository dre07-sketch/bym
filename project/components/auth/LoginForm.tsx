'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Shield, Users, Settings, Package, Wrench, CheckCircle, Sparkles, ArrowRight, Star, MessageCircle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from './../../components/types';
import ForgotPassword from './ForgotPassword';
import PasswordResetLoading from './PasswordResetLoading';
import ResetPassword from './ResetPassword';

interface Role {
  value: UserRole;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
}

interface LoginFormProps {
  onLogin: (role: UserRole) => void;
}

const roles: Role[] = [
  { value: 'customer-service', label: 'Customer Service', icon: Users, color: 'text-blue-600', gradient: 'from-blue-500 to-cyan-500' },
  { value: 'manager', label: 'Manager', icon: Settings, color: 'text-purple-600', gradient: 'from-purple-500 to-pink-500' },
  { value: 'stock-manager', label: 'Stock Manager', icon: Package, color: 'text-green-600', gradient: 'from-green-500 to-emerald-500' },
  { value: 'tool-manager', label: 'Tool Manager', icon: Wrench, color: 'text-orange-600', gradient: 'from-orange-500 to-red-500' },
  { value: 'part-coordinator', label: 'Part Coordinator', icon: Lock, color: 'text-red-600', gradient: 'from-red-500 to-rose-500' },
  { value: 'inspector', label: 'Inspector', icon: CheckCircle, color: 'text-indigo-600', gradient: 'from-indigo-500 to-purple-500' },
  { value: 'communication', label: 'Communication', icon: MessageCircle, color: 'text-teal-600', gradient: 'from-teal-500 to-cyan-500' },
  { value: 'marketing', label: 'Marketing', icon: TrendingUp, color: 'text-yellow-600', gradient: 'from-yellow-500 to-amber-500' },
];

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [focusedField, setFocusedField] = useState<string>('');
  const [currentView, setCurrentView] = useState<'login' | 'forgot' | 'loading' | 'reset'>('login');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRole) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      onLogin(selectedRole);
      setIsLoading(false);
    }, 2000);
  };

  const handleForgotPassword = (): void => {
    setCurrentView('forgot');
  };

  const handleSendOtp = (): void => {
    setCurrentView('loading');
  };

  const handleLoadingComplete = (): void => {
    setCurrentView('reset');
  };

  const handleResetComplete = (): void => {
    setCurrentView('login');
  };

  const handleBackToLogin = (): void => {
    setCurrentView('login');
  };

  if (currentView === 'forgot') {
    return <ForgotPassword onBack={handleBackToLogin} onSendOtp={handleSendOtp} />;
  }

  if (currentView === 'loading') {
    return <PasswordResetLoading onComplete={handleLoadingComplete} />;
  }

  if (currentView === 'reset') {
    return <ResetPassword onBack={handleBackToLogin} onComplete={handleResetComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Simplified Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full blur-xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-gradient-to-r from-purple-400/20 to-pink-600/20 rounded-full blur-xl"></div>
      </div>

      {/* Main Login Card - Reduced Height */}
      <div className="w-full max-w-5xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-white/20 relative">
        {/* Decorative Top Border */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 via-pink-500 to-cyan-500"></div>
        
        <div className="flex flex-col lg:flex-row min-h-[500px]"> {/* Reduced from min-h-[600px] */}
          
          {/* Left Side - Login Form */}
          <div className="w-full lg:w-1/2 p-6 lg:p-8 flex flex-col justify-center relative"> {/* Reduced padding */}
            {/* Logo Integration in Form */}
            <div className="absolute top-4 left-4"> {/* Adjusted position */}
              <div className="w-12 h-12 rounded-full overflow-hidden shadow-lg border-4 border-white/50"> {/* Smaller logo */}
                <img 
                  src="/photo_2025-06-05_14-35-04-removebg-preview.png" 
                  alt="BYM Trading PLC" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="max-w-sm mx-auto w-full mt-4"> {/* Reduced margin */}
              
              {/* Header */}
              <div className="text-center mb-6"> {/* Reduced margin */}
                <div className="flex items-center justify-center mb-2"> {/* Reduced margin */}
                  <Sparkles className="w-5 h-5 text-blue-500 mr-2" /> {/* Smaller icons */}
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-purple-800 bg-clip-text text-transparent tracking-tight"> {/* Smaller text */}
                    Welcome Back
                  </h1>
                  <Sparkles className="w-5 h-5 text-purple-500 ml-2" /> {/* Smaller icons */}
                </div>
                <p className="text-slate-600 text-sm">Sign in to BYM Trading Portal</p> {/* Smaller text */}
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 mx-auto mt-2 rounded-full"></div> {/* Reduced margin */}
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4"> {/* Reduced spacing */}
                
                {/* Email Field */}
                <div className="space-y-1"> {/* Reduced spacing */}
                  <label className="text-xs font-bold text-slate-700 ml-2 tracking-wide">EMAIL ADDRESS</label>
                  <div className="relative group">
                    <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-all duration-300 ${
                      focusedField === 'email' ? 'text-blue-500 scale-110' : 'text-slate-400'
                    }`} /> {/* Smaller icon */}
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField('')}
                      className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 hover:bg-white text-slate-800 placeholder-slate-400 backdrop-blur-sm font-medium shadow-md hover:shadow-lg"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1"> {/* Reduced spacing */}
                  <label className="text-xs font-bold text-slate-700 ml-2 tracking-wide">PASSWORD</label>
                  <div className="relative group">
                    <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-all duration-300 ${
                      focusedField === 'password' ? 'text-purple-500 scale-110' : 'text-slate-400'
                    }`} /> {/* Smaller icon */}
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField('')}
                      className="w-full pl-10 pr-10 py-3 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 bg-white/70 hover:bg-white text-slate-800 placeholder-slate-400 backdrop-blur-sm font-medium shadow-md hover:shadow-lg"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all duration-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {/* Smaller icons */}
                    </button>
                  </div>
                  
                  {/* Forgot Password Link */}
                  <div className="text-right mt-1"> {/* Reduced margin */}
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-blue-600 hover:text-blue-700 transition-all duration-200 font-semibold text-xs hover:underline inline-flex items-center group"
                    >
                      Forgot Password?
                      <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
                    </button>
                  </div>
                </div>

                {/* Role Selection */}
                <div className="space-y-1"> {/* Reduced spacing */}
                  <label className="text-xs font-bold text-slate-700 ml-2 tracking-wide">SELECT YOUR ROLE</label>
                  <div className="relative">
                    <Select value={selectedRole} onValueChange={(value: UserRole) => setSelectedRole(value)}>
                      <SelectTrigger 
                        onFocus={() => setFocusedField('role')}
                        onBlur={() => setFocusedField('')}
                        className="w-full py-3 px-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/70 hover:bg-white text-slate-800 backdrop-blur-sm font-medium shadow-md hover:shadow-lg"
                      >
                        <SelectValue placeholder="Choose your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => {
                          const Icon = role.icon;
                          return (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex items-center space-x-2">
                                <Icon className={`w-4 h-4 ${role.color}`} /> {/* Smaller icons */}
                                <span className="text-sm">{role.label}</span> {/* Smaller text */}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isLoading || !selectedRole}
                  className="w-full bg-custom-gradient text-white py-3 rounded-xl font-bold hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 shadow-md relative overflow-hidden group mt-4"
                >
                  {/* Button Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> {/* Smaller spinner */}
                      <span className="tracking-wider text-sm">SIGNING IN...</span>
                    </>
                  ) : (
                    <>
                      <span className="tracking-wider text-sm">SIGN IN</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" /> {/* Smaller icon */}
                    </>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-4 text-center"> {/* Reduced margin */}
                <p className="text-slate-500 text-xs font-medium">
                  🔒 Secure automotive management system
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Logo/Branding - Compact Version */}
          <div className="w-full lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-900 to-black flex items-center justify-center p-6 lg:p-8 relative overflow-hidden"> {/* Reduced padding */}
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
            </div>

            <div className="text-center text-white relative z-10">
              
              {/* Main Logo */}
              <div className="relative mb-6"> {/* Reduced margin */}
                <div className="w-48 h-48 mx-auto relative group"> {/* Smaller logo container */}
                  <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl shadow-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                    <img 
                      src="/photo_2025-06-05_14-35-04-removebg-preview.png" 
                      alt="BYM Trading PLC" 
                      className="w-40 h-40 object-contain drop-shadow-xl" 
                    />
                  </div>
                </div>
              </div>

              {/* Company Info */}
              <div className="space-y-4"> {/* Reduced spacing */}
                <div>
                  <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent"> {/* Smaller text */}
                    BYM Trading PLC
                  </h2>
                  <p className="text-blue-200 text-lg font-light">Automotive Excellence</p> {/* Smaller text */}
                </div>
                
                <p className="text-slate-300 max-w-md mx-auto leading-relaxed text-sm">
                  Professional automotive services and trading solutions
                </p>
                
                {/* Compact Features Grid */}
                <div className="grid grid-cols-3 gap-3 mt-6"> {/* Reduced margin and gap */}
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center"> {/* Smaller container */}
                      <Shield className="w-5 h-5 text-blue-400" /> {/* Smaller icon */}
                    </div>
                    <div className="text-xs text-slate-300 font-semibold">Secure</div> {/* Smaller text */}
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center"> {/* Smaller container */}
                      <CheckCircle className="w-5 h-5 text-green-400" /> {/* Smaller icon */}
                    </div>
                    <div className="text-xs text-slate-300 font-semibold">Reliable</div> {/* Smaller text */}
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-1 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center"> {/* Smaller container */}
                      <Lock className="w-5 h-5 text-purple-400" /> {/* Smaller icon */}
                    </div>
                    <div className="text-xs text-slate-300 font-semibold">Protected</div> {/* Smaller text */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;