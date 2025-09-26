'use client';

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';

interface PasswordResetLoadingProps {
  onComplete: () => void;
}

const PasswordResetLoading: React.FC<PasswordResetLoadingProps> = ({ onComplete }) => {
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseIntensity(prev => prev === 1 ? 1.2 : 1);
    }, 1500);

    return () => clearInterval(pulseInterval);
  }, []);

  useEffect(() => {
    // Start redirecting after a short delay
    const redirectTimer = setTimeout(() => {
      setRedirecting(true);
      // Then navigate to login page after another delay
      const navigateTimer = setTimeout(() => {
        onComplete();
      }, 1500);
      
      return () => clearTimeout(navigateTimer);
    }, 1500);

    return () => clearTimeout(redirectTimer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-30 animate-float"
            style={{
              width: `${Math.random() * 6 + 3}px`,
              height: `${Math.random() * 6 + 3}px`,
              background: `linear-gradient(45deg, ${['#3B82F6', '#8B5CF6', '#EC4899'][Math.floor(Math.random() * 3)]}, transparent)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
          
          {/* Animated Background Gradient */}
          <div className={`absolute inset-0 bg-gradient-to-b from-blue-500/20 to-purple-600/20 opacity-50 transition-all duration-1000`}></div>
          
          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-transform duration-500"
                style={{ transform: `scale(${pulseIntensity})` }}
              ></div>
              <div className="absolute inset-1 bg-slate-900/80 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Mail className="w-10 h-10 text-blue-400 transition-all duration-500" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Password Reset
            </h1>
            <p className="text-blue-200 text-lg font-light">
              You have requested for a password change
            </p>
          </div>

          {/* Message Display */}
          <div className="text-center mb-8 relative z-10">
            <div className="flex items-center justify-center space-x-3 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
              <Mail className="w-6 h-6 text-blue-400 animate-pulse" />
              <span className="text-white font-medium">
                Check your email for reset instructions
              </span>
            </div>
          </div>

          {/* Info Text */}
          <div className="text-center space-y-4 relative z-10">
            <div className="bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10">
              <p className="text-blue-100 text-sm font-medium mb-2">
                📧 Reset link will be sent to your email
              </p>
              <p className="text-blue-200 text-xs opacity-80">
                Check your inbox and spam folder. The link expires in 15 minutes.
              </p>
            </div>
            
            {redirecting && (
              <div className="flex items-center justify-center space-x-2 text-green-300 text-sm animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                <span>Redirecting to login page</span>
                <ArrowRight className="w-4 h-4 animate-pulse" />
              </div>
            )}
            
            {/* Manual navigation button */}
            <button 
              onClick={onComplete}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300"
            >
              Go to Login Now
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.1); }
          66% { transform: translate(-15px, 15px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-blob { animation: blob 8s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animate-float { animation: float 4s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>
    </div>
  );
};

export default PasswordResetLoading;