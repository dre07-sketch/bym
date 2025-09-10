import React, { useState } from 'react';
import { CreditCard, DollarSign, FileText, AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { Button } from '../ui/button';

interface PaymentItem {
  id: string;
  description: string;
  amount: string;
  category: string;
}

interface PaymentRequestFormProps {
  onSubmit?: (data: unknown) => void;
  onCancel?: () => void;
}

const PaymentRequestForm: React.FC<PaymentRequestFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    claimInfo: {
      claimNumber: '',
      policyNumber: '',
      insuranceCompany: '',
      adjusterName: '',
      adjusterEmail: '',
      adjusterPhone: ''
    },
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      vin: '',
      licensePlate: ''
    },
    paymentItems: [] as PaymentItem[],
    paymentInfo: {
      totalAmount: '',
      paymentMethod: 'check',
      urgency: 'normal',
      requestedDate: '',
      specialInstructions: ''
    },
    supportingDocs: {
      estimate: false,
      photos: false,
      invoices: false,
      surveyorReport: false,
      other: false,
      otherDescription: ''
    },
    contactInfo: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      businessName: '',
      businessAddress: '',
      taxId: ''
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (section: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const addPaymentItem = () => {
    const newItem: PaymentItem = {
      id: Date.now().toString(),
      description: '',
      amount: '',
      category: 'repair'
    };

    setFormData(prev => ({
      ...prev,
      paymentItems: [...prev.paymentItems, newItem]
    }));
  };

  const updatePaymentItem = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      paymentItems: prev.paymentItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const removePaymentItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      paymentItems: prev.paymentItems.filter(item => item.id !== id)
    }));
  };

  const calculateTotal = () => {
    return formData.paymentItems.reduce((total, item) => {
      return total + (parseFloat(item.amount) || 0);
    }, 0).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Update total amount
    const updatedFormData = {
      ...formData,
      paymentInfo: {
        ...formData.paymentInfo,
        totalAmount: calculateTotal()
      }
    };
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onSubmit?.(updatedFormData);
    setIsSubmitting(false);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const steps = [
    { number: 1, title: 'Claim Information', icon: FileText },
    { number: 2, title: 'Payment Details', icon: DollarSign },
    { number: 3, title: 'Documentation', icon: Upload },
    { number: 4, title: 'Review & Submit', icon: CheckCircle2 }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-8 py-6">
        <h2 className="text-2xl font-bold text-white mb-2">Insurance Payment Request</h2>
        <p className="text-green-100">Submit a payment request to the insurance company</p>
      </div>

      {/* Progress Steps */}
      <div className="px-8 py-6 bg-slate-50 dark:bg-slate-700 border-b">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                currentStep >= step.number 
                  ? 'bg-green-600 border-green-600 text-white' 
                  : 'border-slate-300 text-slate-400'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <div className="ml-3 hidden md:block">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-green-600' : 'text-slate-400'
                }`}>
                  Step {step.number}
                </p>
                <p className={`text-xs ${
                  currentStep >= step.number ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'
                }`}>
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-green-600' : 'bg-slate-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        {/* Step 1: Claim Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Claim Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Claim Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.claimInfo.claimNumber}
                  onChange={(e) => handleInputChange('claimInfo', 'claimNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Insurance claim number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Policy Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.claimInfo.policyNumber}
                  onChange={(e) => handleInputChange('claimInfo', 'policyNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Insurance policy number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Insurance Company *
                </label>
                <input
                  type="text"
                  required
                  value={formData.claimInfo.insuranceCompany}
                  onChange={(e) => handleInputChange('claimInfo', 'insuranceCompany', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., State Farm, Allstate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Adjuster Name
                </label>
                <input
                  type="text"
                  value={formData.claimInfo.adjusterName}
                  onChange={(e) => handleInputChange('claimInfo', 'adjusterName', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Adjuster's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Adjuster Email
                </label>
                <input
                  type="email"
                  value={formData.claimInfo.adjusterEmail}
                  onChange={(e) => handleInputChange('claimInfo', 'adjusterEmail', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="adjuster@insurance.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Adjuster Phone
                </label>
                <input
                  type="tel"
                  value={formData.claimInfo.adjusterPhone}
                  onChange={(e) => handleInputChange('claimInfo', 'adjusterPhone', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Vehicle Information */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-600">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Vehicle Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Vehicle Make *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleInfo.make}
                    onChange={(e) => handleInputChange('vehicleInfo', 'make', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Toyota, BMW"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Vehicle Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleInfo.model}
                    onChange={(e) => handleInputChange('vehicleInfo', 'model', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., Camry, X5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Year *
                  </label>
                  <input
                    type="number"
                    required
                    min="1900"
                    max="2025"
                    value={formData.vehicleInfo.year}
                    onChange={(e) => handleInputChange('vehicleInfo', 'year', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="2020"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    VIN Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleInfo.vin}
                    onChange={(e) => handleInputChange('vehicleInfo', 'vin', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="17-character VIN"
                    maxLength={17}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.vehicleInfo.licensePlate}
                    onChange={(e) => handleInputChange('vehicleInfo', 'licensePlate', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="ABC-1234"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Payment Details */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Payment Details</h3>
              </div>
              <Button
                type="button"
                onClick={addPaymentItem}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Add Item
              </Button>
            </div>

            {formData.paymentItems.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <DollarSign className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">No payment items added yet</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Click "Add Item" to start adding payment items</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.paymentItems.map((item, index) => (
                  <div key={item.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 relative">
                    <button
                      type="button"
                      onClick={() => removePaymentItem(item.id)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                    >
                      ×
                    </button>

                    <h4 className="font-semibold text-slate-800 dark:text-white mb-4">
                      Item #{index + 1}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Description *
                        </label>
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => updatePaymentItem(item.id, 'description', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="e.g., Front bumper repair, Paint work"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Amount ($) *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updatePaymentItem(item.id, 'amount', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="0.00"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Category *
                        </label>
                        <select
                          required
                          value={item.category}
                          onChange={(e) => updatePaymentItem(item.id, 'category', e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="repair">Repair Work</option>
                          <option value="parts">Parts & Materials</option>
                          <option value="labor">Labor Costs</option>
                          <option value="rental">Rental Car</option>
                          <option value="towing">Towing Services</option>
                          <option value="storage">Storage Fees</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Total Summary */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <span className="text-lg font-semibold text-green-800 dark:text-green-200">
                        Total Payment Request
                      </span>
                    </div>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                      ${calculateTotal()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Information */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-600">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Payment Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Preferred Payment Method
                  </label>
                  <select
                    value={formData.paymentInfo.paymentMethod}
                    onChange={(e) => handleInputChange('paymentInfo', 'paymentMethod', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="check">Check</option>
                    <option value="ach">ACH Transfer</option>
                    <option value="wire">Wire Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Urgency Level
                  </label>
                  <select
                    value={formData.paymentInfo.urgency}
                    onChange={(e) => handleInputChange('paymentInfo', 'urgency', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="low">Low - Standard processing</option>
                    <option value="normal">Normal - Within 5 business days</option>
                    <option value="high">High - Within 2 business days</option>
                    <option value="urgent">Urgent - Next business day</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Requested Payment Date
                  </label>
                  <input
                    type="date"
                    value={formData.paymentInfo.requestedDate}
                    onChange={(e) => handleInputChange('paymentInfo', 'requestedDate', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={formData.paymentInfo.specialInstructions}
                  onChange={(e) => handleInputChange('paymentInfo', 'specialInstructions', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  placeholder="Any special instructions for payment processing..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Documentation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Upload className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Supporting Documentation</h3>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6">
              <h4 className="font-semibold text-slate-800 dark:text-white mb-4">Required Documents</h4>
              <div className="space-y-4">
                {[
                  { key: 'estimate', label: 'Repair Estimate', required: true },
                  { key: 'photos', label: 'Damage Photos', required: true },
                  { key: 'invoices', label: 'Invoices/Receipts', required: false },
                  { key: 'surveyorReport', label: 'Surveyor Report', required: false }
                ].map((doc) => (
                  <div key={doc.key} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={doc.key}
                      checked={formData.supportingDocs[doc.key as keyof typeof formData.supportingDocs] as boolean}
                      onChange={(e) => handleInputChange('supportingDocs', doc.key, e.target.checked)}
                      className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor={doc.key} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {doc.label} {doc.required && <span className="text-red-500">*</span>}
                    </label>
                  </div>
                ))}

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="other"
                    checked={formData.supportingDocs.other}
                    onChange={(e) => handleInputChange('supportingDocs', 'other', e.target.checked)}
                    className="w-5 h-5 text-green-600 border-slate-300 rounded focus:ring-green-500"
                  />
                  <label htmlFor="other" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Other Documents
                  </label>
                </div>

                {formData.supportingDocs.other && (
                  <div className="ml-8">
                    <input
                      type="text"
                      value={formData.supportingDocs.otherDescription}
                      onChange={(e) => handleInputChange('supportingDocs', 'otherDescription', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Describe other documents..."
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-600">
              <h4 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Business Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactInfo.customerName}
                    onChange={(e) => handleInputChange('contactInfo', 'customerName', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.contactInfo.customerPhone}
                    onChange={(e) => handleInputChange('contactInfo', 'customerPhone', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.contactInfo.customerEmail}
                    onChange={(e) => handleInputChange('contactInfo', 'customerEmail', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="contact@business.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactInfo.businessName}
                    onChange={(e) => handleInputChange('contactInfo', 'businessName', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Business/Garage name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tax ID/EIN
                  </label>
                  <input
                    type="text"
                    value={formData.contactInfo.taxId}
                    onChange={(e) => handleInputChange('contactInfo', 'taxId', e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Business Address *
                </label>
                <textarea
                  required
                  value={formData.contactInfo.businessAddress}
                  onChange={(e) => handleInputChange('contactInfo', 'businessAddress', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Full business address"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Review & Submit</h3>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-white mb-3">Payment Summary</h4>
                <div className="space-y-2">
                  {formData.paymentItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">{item.description}</span>
                      <span className="font-medium text-slate-800 dark:text-white">${item.amount}</span>
                    </div>
                  ))}
                  <div className="border-t border-slate-300 dark:border-slate-600 pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span className="text-slate-800 dark:text-white">Total Amount</span>
                      <span className="text-green-600 dark:text-green-400">${calculateTotal()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Claim Information</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Claim: {formData.claimInfo.claimNumber}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Policy: {formData.claimInfo.policyNumber}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Company: {formData.claimInfo.insuranceCompany}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Vehicle Information</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {formData.vehicleInfo.year} {formData.vehicleInfo.make} {formData.vehicleInfo.model}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    VIN: {formData.vehicleInfo.vin}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    License: {formData.vehicleInfo.licensePlate}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Payment Details</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Method: {formData.paymentInfo.paymentMethod}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Urgency: {formData.paymentInfo.urgency}
                  </p>
                  {formData.paymentInfo.requestedDate && (
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Requested Date: {formData.paymentInfo.requestedDate}
                    </p>
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Business Information</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {formData.contactInfo.businessName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {formData.contactInfo.customerName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {formData.contactInfo.customerEmail}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Important Notice</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Please ensure all information is accurate. This payment request will be submitted to the insurance company for processing. 
                    You will receive a confirmation email with tracking information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-8 border-t border-slate-200 dark:border-slate-600">
          <div>
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={prevStep}
                variant="outline"
                className="px-6 py-3"
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              className="px-6 py-3"
            >
              Cancel
            </Button>

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting || formData.paymentItems.length === 0}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Payment Request'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default PaymentRequestForm;