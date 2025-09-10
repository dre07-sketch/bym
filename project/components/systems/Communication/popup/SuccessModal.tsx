import React from 'react';
import { CheckCircle, Printer, Download, X, FileText } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  onPrint: () => void;
  onDownload: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  invoiceNumber,
  onPrint,
  onDownload,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all animate-scale-up">
        
        {/* Gradient Border Top */}
        <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-500"></div>

        {/* Header */}
        <div className="text-center pt-10 pb-6 px-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg animate-pulse">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-green-700 bg-clip-text text-transparent">
            Success!
          </h2>
          <p className="text-gray-600 mt-2">Proforma Invoice Created</p>
        </div>

        {/* Body */}
        <div className="px-8 pb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200 mb-6">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-gray-800">Invoice Number</p>
                <p className="text-lg font-mono font-bold text-green-700">{invoiceNumber}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500 text-center mb-6">
            Your proforma invoice has been saved successfully and is ready for sharing.
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <button
              onClick={onPrint}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md"
            >
              <Printer className="w-5 h-5" />
              <span>Print</span>
            </button>
            <button
              onClick={onDownload}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-300 transform hover:scale-105 shadow-md"
            >
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200 font-medium"
          >
            Close & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;