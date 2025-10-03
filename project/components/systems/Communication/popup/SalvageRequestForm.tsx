import React, { useState } from 'react';
import { Trash2, Package, DollarSign, FileText, Plus, X, AlertTriangle } from 'lucide-react';
import { Button } from '../../../ui/button';

interface SalvagePart {
  id: string;
  partName: string;
  partNumber: string;
  condition: string;
  estimatedValue: string;
  description: string;
}

interface SalvageRequestFormProps {
  onSubmit?: (data: unknown) => void;
  onCancel?: () => void;
}

const SalvageRequestForm: React.FC<SalvageRequestFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    vehicleInfo: {
      make: '',
      model: '',
      year: '',
      vin: '',
      licensePlate: '',
      totalLoss: false
    },
    salvageParts: [] as SalvagePart[],
    requestInfo: {
      requestType: 'parts',
      urgency: 'normal',
      pickupDate: '',
      specialInstructions: '',
      estimatedTotalValue: ''
    },
    contactInfo: {
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      address: ''
    }
  });

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

  const addSalvagePart = () => {
    const newPart: SalvagePart = {
      id: Date.now().toString(),
      partName: '',
      partNumber: '',
      condition: '',
      estimatedValue: '',
      description: ''
    };

    setFormData(prev => ({
      ...prev,
      salvageParts: [...prev.salvageParts, newPart]
    }));
  };

  const updateSalvagePart = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      salvageParts: prev.salvageParts.map(part =>
        part.id === id ? { ...part, [field]: value } : part
      )
    }));
  };

  const removeSalvagePart = (id: string) => {
    setFormData(prev => ({
      ...prev,
      salvageParts: prev.salvageParts.filter(part => part.id !== id)
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

  const calculateTotalValue = () => {
    return formData.salvageParts.reduce((total, part) => {
      return total + (parseFloat(part.estimatedValue) || 0);
    }, 0).toFixed(2);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-700 px-8 py-6">
        <h2 className="text-2xl font-bold text-white mb-2">Salvage Request Form</h2>
        <p className="text-orange-100">Request salvage processing for damaged vehicle parts</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Vehicle Information */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <Package className="w-6 h-6 text-orange-600" />
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
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="ABC-1234"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="totalLoss"
                checked={formData.vehicleInfo.totalLoss}
                onChange={(e) => handleInputChange('vehicleInfo', 'totalLoss', e.target.checked)}
                className="w-5 h-5 text-orange-600 border-slate-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="totalLoss" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Total Loss Vehicle
              </label>
            </div>
          </div>
        </div>

        {/* Salvage Parts */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trash2 className="w-6 h-6 text-orange-600" />
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Salvage Parts</h3>
            </div>
            <Button
              type="button"
              onClick={addSalvagePart}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Part
            </Button>
          </div>

          {formData.salvageParts.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No salvage parts added yet</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">Click "Add Part" to start adding salvage parts</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.salvageParts.map((part, index) => (
                <div key={part.id} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-6 relative">
                  <button
                    type="button"
                    onClick={() => removeSalvagePart(part.id)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <h4 className="font-semibold text-slate-800 dark:text-white mb-4">
                    Part #{index + 1}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Part Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={part.partName}
                        onChange={(e) => updateSalvagePart(part.id, 'partName', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="e.g., Front Bumper, Engine Block"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Part Number
                      </label>
                      <input
                        type="text"
                        value={part.partNumber}
                        onChange={(e) => updateSalvagePart(part.id, 'partNumber', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Manufacturer part number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Condition *
                      </label>
                      <select
                        required
                        value={part.condition}
                        onChange={(e) => updateSalvagePart(part.id, 'condition', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="">Select condition</option>
                        <option value="excellent">Excellent - Like new</option>
                        <option value="good">Good - Minor wear</option>
                        <option value="fair">Fair - Moderate damage</option>
                        <option value="poor">Poor - Heavily damaged</option>
                        <option value="scrap">Scrap - Metal value only</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Estimated Value ($) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={part.estimatedValue}
                        onChange={(e) => updateSalvagePart(part.id, 'estimatedValue', e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={part.description}
                      onChange={(e) => updateSalvagePart(part.id, 'description', e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows={3}
                      placeholder="Detailed description of the part condition and any damage..."
                    />
                  </div>
                </div>
              ))}

              {/* Total Value Summary */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-green-800 dark:text-green-200">
                      Total Estimated Value
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ${calculateTotalValue()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Request Information */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-6 h-6 text-orange-600" />
            <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Request Information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Request Type *
              </label>
              <select
                required
                value={formData.requestInfo.requestType}
                onChange={(e) => handleInputChange('requestInfo', 'requestType', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="parts">Individual Parts</option>
                <option value="whole">Whole Vehicle</option>
                <option value="evaluation">Evaluation Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Urgency Level
              </label>
              <select
                value={formData.requestInfo.urgency}
                onChange={(e) => handleInputChange('requestInfo', 'urgency', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="low">Low - Within 2 weeks</option>
                <option value="normal">Normal - Within 1 week</option>
                <option value="high">High - Within 3 days</option>
                <option value="urgent">Urgent - Within 24 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Preferred Pickup Date
              </label>
              <input
                type="date"
                value={formData.requestInfo.pickupDate}
                onChange={(e) => handleInputChange('requestInfo', 'pickupDate', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
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
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="customer@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Pickup Address *
            </label>
            <textarea
              required
              value={formData.contactInfo.address}
              onChange={(e) => handleInputChange('contactInfo', 'address', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
              placeholder="Full address where parts/vehicle are located"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Special Instructions
            </label>
            <textarea
              value={formData.requestInfo.specialInstructions}
              onChange={(e) => handleInputChange('requestInfo', 'specialInstructions', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={4}
              placeholder="Any special instructions for pickup, handling, or processing..."
            />
          </div>
        </div>

        {/* Warning Notice */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Important Notice</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Salvage requests are final once processed. Please ensure all part information is accurate. 
                Estimated values are subject to professional evaluation and may be adjusted based on actual condition.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200 dark:border-slate-600">
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="px-6 py-3"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || formData.salvageParts.length === 0}
            className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Salvage Request'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SalvageRequestForm;