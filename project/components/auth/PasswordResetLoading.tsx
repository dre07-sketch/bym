'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Shield, Clock, CheckCircle, Loader2, Eye, Lock, Zap, ArrowRight } from 'lucide-react';

interface PasswordResetLoadingProps {
  onComplete: () => void;
}

const PasswordResetLoading: React.FC<PasswordResetLoadingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [pulseIntensity, setPulseIntensity] = useState(1);
  const [progress, setProgress] = useState(0);

  const steps = [
    { icon: Mail, text: "Sending reset email...", color: "text-blue-400", bgColor: "from-blue-500/20 to-blue-600/20" },
    { icon: Shield, text: "Verifying security protocols...", color: "text-purple-400", bgColor: "from-purple-500/20 to-purple-600/20" },
    { icon: Lock, text: "Encrypting secure token...", color: "text-indigo-400", bgColor: "from-indigo-500/20 to-indigo-600/20" },
    { icon: Eye, text: "Validating permissions...", color: "text-cyan-400", bgColor: "from-cyan-500/20 to-cyan-600/20" },
    { icon: Zap, text: "Finalizing request...", color: "text-emerald-400", bgColor: "from-emerald-500/20 to-emerald-600/20" },
    { icon: CheckCircle, text: "Email sent successfully!", color: "text-green-400", bgColor: "from-green-500/20 to-green-600/20" }
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        const nextStep = prev + 1;
        if (nextStep >= steps.length) {
          clearInterval(stepInterval);
          setTimeout(() => onComplete(), 2000);
          return prev;
        }
        return nextStep;
      });
    }, 2000);

    return () => clearInterval(stepInterval);
  }, [onComplete]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 2, (currentStep + 1) * (100 / steps.length));
        return newProgress;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [currentStep]);

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseIntensity(prev => prev === 1 ? 1.2 : 1);
    }, 1500);

    return () => clearInterval(pulseInterval);
  }, []);

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
          <div className={`absolute inset-0 bg-gradient-to-b ${steps[currentStep]?.bgColor} opacity-50 transition-all duration-1000`}></div>
          
          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className="relative mx-auto w-24 h-24 mb-6">
              <div 
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-transform duration-500"
                style={{ transform: `scale(${pulseIntensity})` }}
              ></div>
              <div className="absolute inset-1 bg-slate-900/80 rounded-full flex items-center justify-center backdrop-blur-sm">
                {React.createElement(steps[currentStep]?.icon || Mail, {
                  className: `w-10 h-10 ${steps[currentStep]?.color || 'text-blue-400'} transition-all duration-500`
                })}
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Processing Request
            </h1>
            <p className="text-blue-200 text-lg font-light">
              Please wait while we send your reset link
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8 relative z-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/70">Progress</span>
              <span className="text-sm text-white font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Current Step Display */}
          <div className="text-center mb-8 relative z-10">
            <div className="flex items-center justify-center space-x-3 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10">
              {React.createElement(steps[currentStep]?.icon || Loader2, {
                className: `w-6 h-6 ${steps[currentStep]?.color || 'text-blue-400'} ${currentStep < steps.length - 1 ? 'animate-spin' : 'animate-pulse'}`
              })}
              <span className="text-white font-medium">
                {steps[currentStep]?.text || "Processing..."}
              </span>
            </div>
          </div>

          {/* Steps Indicator */}
          <div className="flex justify-center space-x-2 mb-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`relative transition-all duration-700 ${
                  index === currentStep ? 'scale-125' : 'scale-100'
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-700 ${
                    index === currentStep
                      ? `bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg`
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-white/20'
                  }`}
                />
                {index === currentStep && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-ping opacity-75"></div>
                )}
              </div>
            ))}
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
            
            {currentStep === steps.length - 1 && (
              <div className="flex items-center justify-center space-x-2 text-green-300 text-sm animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                <span>Redirecting to reset page</span>
                <ArrowRight className="w-4 h-4 animate-pulse" />
              </div>
            )}
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