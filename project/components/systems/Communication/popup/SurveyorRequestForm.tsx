import React, { useState } from 'react';
import { Calendar, Car, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../ui/button';

interface SurveyorRequestFormProps {
  onSubmit?: (data: unknown) => void;
  onCancel?: () => void;
}

const SurveyorRequestForm: React.FC<SurveyorRequestFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      vin: '',
      licensePlate: '',
      color: '',
      mileage: ''
    },
    damageInfo: {
      incidentDate: '',
      damageType: '',
      damageDescription: '',
      estimatedCost: '',
      priority: 'medium'
    },
    insuranceInfo: {
      company: '',
      policyNumber: '',
      claimNumber: '',
      adjusterName: '',
      adjusterPhone: '',
      adjusterEmail: ''
    },
    requestInfo: {
      preferredDate: '',
      preferredTime: '',
      urgency: 'normal',
      specialInstructions: ''
    },
    contactInfo: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      address: ''
    }
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (section: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onSubmit?.(formData);
    setIsSubmitting(false);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const steps = [
    { number: 1, title: 'Vehicle Information', icon: Car },
    { number: 2, title: 'Insurance Details', icon: FileText },
    { number: 3, title: 'Request Details', icon: Calendar },
    { number: 4, title: 'Review & Submit', icon: CheckCircle2 }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
        <h2 className="text-2xl font-bold text-white mb-2">Request Insurance Surveyor</h2>
        <p className="text-blue-100">Submit a request for insurance surveyor inspection</p>
      </div>

      {/* Progress Steps */}
      <div className="px-8 py-6 bg-slate-50 dark:bg-slate-700 border-b">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                currentStep >= step.number 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-slate-300 text-slate-400'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <div className="ml-3 hidden md:block">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-slate-400'
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
                  currentStep > step.number ? 'bg-blue-600' : 'bg-slate-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        {/* Step 1: Vehicle Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Car className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Vehicle Information</h3>
            </div>

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
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Toyota, BMW, Mercedes"
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
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Camry, X5, C-Class"
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
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ABC-1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.vehicleInfo.color}
                  onChange={(e) => handleInputChange('vehicleInfo', 'color', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., White, Black, Silver"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Current Mileage
              </label>
              <input
                type="number"
                value={formData.vehicleInfo.mileage}
                onChange={(e) => handleInputChange('vehicleInfo', 'mileage', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 45000"
              />
            </div>
          </div>
        )}

        {/* Step 2: Insurance Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Insurance Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Insurance Company *
                </label>
                <input
                  type="text"
                  required
                  value={formData.insuranceInfo.company}
                  onChange={(e) => handleInputChange('insuranceInfo', 'company', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., State Farm, Allstate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Policy Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.insuranceInfo.policyNumber}
                  onChange={(e) => handleInputChange('insuranceInfo', 'policyNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Policy number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Claim Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.insuranceInfo.claimNumber}
                  onChange={(e) => handleInputChange('insuranceInfo', 'claimNumber', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Claim number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Adjuster Name
                </label>
                <input
                  type="text"
                  value={formData.insuranceInfo.adjusterName}
                  onChange={(e) => handleInputChange('insuranceInfo', 'adjusterName', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Adjuster's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Adjuster Phone
                </label>
                <input
                  type="tel"
                  value={formData.insuranceInfo.adjusterPhone}
                  onChange={(e) => handleInputChange('insuranceInfo', 'adjusterPhone', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Adjuster Email
                </label>
                <input
                  type="email"
                  value={formData.insuranceInfo.adjusterEmail}
                  onChange={(e) => handleInputChange('insuranceInfo', 'adjusterEmail', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="adjuster@insurance.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Request Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Request Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Preferred Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.requestInfo.preferredDate}
                  onChange={(e) => handleInputChange('requestInfo', 'preferredDate', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Preferred Time *
                </label>
                <select
                  required
                  value={formData.requestInfo.preferredTime}
                  onChange={(e) => handleInputChange('requestInfo', 'preferredTime', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select time</option>
                  <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
                  <option value="afternoon">Afternoon (12:00 PM - 5:00 PM)</option>
                  <option value="evening">Evening (5:00 PM - 8:00 PM)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Urgency Level
                </label>
                <select
                  value={formData.requestInfo.urgency}
                  onChange={(e) => handleInputChange('requestInfo', 'urgency', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low - Within 1 week</option>
                  <option value="normal">Normal - Within 3 days</option>
                  <option value="high">High - Within 24 hours</option>
                  <option value="urgent">Urgent - Same day</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.contactInfo.customerName}
                  onChange={(e) => handleInputChange('contactInfo', 'customerName', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Customer full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Customer Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contactInfo.customerPhone}
                  onChange={(e) => handleInputChange('contactInfo', 'customerPhone', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Customer Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.contactInfo.customerEmail}
                  onChange={(e) => handleInputChange('contactInfo', 'customerEmail', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="customer@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Address *
              </label>
              <textarea
                required
                value={formData.contactInfo.address}
                onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Full address where vehicle is located"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Special Instructions
              </label>
              <textarea
                value={formData.requestInfo.specialInstructions}
                onChange={(e) => handleInputChange('requestInfo', 'specialInstructions', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Any special instructions or additional information for the surveyor..."
              />
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircle2 className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Review & Submit</h3>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Insurance Details</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Company: {formData.insuranceInfo.company}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Policy: {formData.insuranceInfo.policyNumber}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Claim: {formData.insuranceInfo.claimNumber}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Request Details</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Date: {formData.requestInfo.preferredDate}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Time: {formData.requestInfo.preferredTime}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Urgency: {formData.requestInfo.urgency}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 dark:text-white mb-2">Contact Information</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {formData.contactInfo.customerName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {formData.contactInfo.customerPhone}
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
                    Please ensure all information is accurate. Once submitted, this request will be sent to the insurance company and surveyor. You will receive a confirmation email with the request details.
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
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default SurveyorRequestForm;