// components/systems/manager/dashboard/tabs/pop up/OutsourceMechanicModal.jsx
import React from 'react';
import { X } from 'lucide-react';

class OutsourceMechanicModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      formData: {
        mechanic_name: '',
        payment: '',
        phone: '',
        payment_method: '',
        work_done: '',
        notes: ''
      },
      loading: false,
      error: ''
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(e) {
    const { name, value } = e.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      }
    }));
  }

  async handleSubmit(e) {
    e.preventDefault();
    this.setState({ loading: true, error: '' });

    const { ticketNumber, onSuccess, onClose } = this.props;
    const { formData } = this.state;

    // Client-side validation
    if (!formData.mechanic_name.trim()) {
      this.setState({ error: 'Mechanic name is required.' });
      this.setState({ loading: false });
      return;
    }

    if (!formData.phone.trim()) {
      this.setState({ error: 'Phone number is required.' });
      this.setState({ loading: false });
      return;
    }

    if (!formData.payment || isNaN(parseFloat(formData.payment)) || parseFloat(formData.payment) < 0) {
      this.setState({ error: 'Valid payment amount is required.' });
      this.setState({ loading: false });
      return;
    }

    if (!formData.payment_method.trim()) {
      this.setState({ error: 'Payment method is required.' });
      this.setState({ loading: false });
      return;
    }

    if (!formData.work_done.trim()) {
      this.setState({ error: 'Description of work done is required.' });
      this.setState({ loading: false });
      return;
    }

    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/active-progress/outsource-mechanic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_number: ticketNumber,
          mechanic_name: formData.mechanic_name.trim(),
          phone: formData.phone.trim(),
          payment: parseFloat(formData.payment),
          payment_method: formData.payment_method.trim(),
          work_done: formData.work_done.trim(),
          notes: formData.notes.trim() || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to outsource mechanic');
      }

      onSuccess(data);
      onClose();
    } catch (err) {
      console.error('Error outsourcing mechanic:', err);
      this.setState({ error: err.message });
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const { isOpen, onClose, ticketNumber } = this.props;
    const { formData, loading, error } = this.state;

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Outsource Mechanic</h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Ticket Info */}
          <div className="mb-5 p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
            <strong className="text-blue-800">Ticket Number:</strong>{' '}
            <span className="font-medium">{ticketNumber}</span>
          </div>

          {/* Form */}
          <form onSubmit={this.handleSubmit}>
            {/* Two-column Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-black">
              {/* Mechanic Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mechanic Name *
                </label>
                <input
                  type="text"
                  name="mechanic_name"
                  value={formData.mechanic_name}
                  onChange={this.handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Enter full name"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={this.handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount ($) *
                </label>
                <input
                  type="number"
                  name="payment"
                  value={formData.payment}
                  onChange={this.handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="0.00"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={this.handleChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                   <option value="">Select Payment Method</option>
                <option value="Per month">Per month</option>
                <option value="Per week">Per week</option>
                <option value="Per day">Per day</option>
                <option value="Per work">Per work</option>
                </select>
              </div>
            </div>

            {/* Work Done */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-1">
                Work Done *
              </label>
              <textarea
                name="work_done"
                value={formData.work_done}
                onChange={this.handleChange}
                required
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Describe the work performed or to be performed..."
                rows={3}
              />
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-1">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={this.handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Any special instructions or details..."
                rows={3}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                <span className="font-medium">Error:</span> {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-70"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default OutsourceMechanicModal;