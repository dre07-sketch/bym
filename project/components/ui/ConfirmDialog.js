'use client';

import { useState } from 'react';
import Modal from './Modal';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  type = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false
}) {
  const icons = {
    warning: AlertTriangle,
    success: CheckCircle,
    info: Info,
    error: XCircle
  };

  const colors = {
    warning: 'text-orange-600',
    success: 'text-green-600',
    info: 'text-blue-600',
    error: 'text-red-600'
  };

  const Icon = icons[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center`}>
          <Icon className={`w-8 h-8 ${colors[type]}`} />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 ${
              type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'btn-primary'
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : null}
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}