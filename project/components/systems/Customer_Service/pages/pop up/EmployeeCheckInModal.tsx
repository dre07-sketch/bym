import React, { useState, useEffect } from 'react';
import {
  X, Clock, User, CheckCircle, AlertCircle, Search, Users,
} from 'lucide-react';

interface Employee {
  id: string;
  full_name: string; // This will come from 'name' in the API response
  role: string;
  status: 'in' | 'out'; // This will need to be determined or defaulted
  image: string | null; // This will come from 'image' in the API response
}

interface EmployeeCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Image URL helper function
const getImageUrl = (imagePath: string | null | undefined) => {
  if (!imagePath) {
    return 'https://ipasystem.bymsystem.com/uploads/default-profile.png';
  }
  // Assuming imagePath from backend is just the filename now due to .split(/[\\/]/).pop()
  // If it's still a full path, keep the original logic.
  // Based on your backend code: image: item.image_url ? item.image_url.split(/[\\/]/).pop() : null
  // It seems 'image' in the frontend response will just be the filename.
  // Let's adjust the logic accordingly.
  const filename = imagePath; // Since backend already extracted the filename
  return `https://ipasystem.bymsystem.com/uploads/${filename}`;
};

const EmployeeSelectionPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee: (employee: Employee) => void;
  employees: Employee[];
}> = ({ isOpen, onClose, onSelectEmployee, employees }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // --- FIX: Added defensive checks for potentially undefined properties ---
  const filteredEmployees = employees.filter((employee) =>
    (employee.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
    (employee.role?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
  );
  // --- END FIX ---

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50" onClick={onClose} />
        {/* Modal */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Select Employee</h3>
                <p className="text-sm text-gray-500">Choose an employee to check in/out</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees by name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {/* Employee List */}
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => {
                    onSelectEmployee(employee);
                    onClose();
                  }}
                  className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="flex items-center space-x-3">
                    {/* Profile Image */}
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                      <img
                        src={getImageUrl(employee.image)} // Use the adjusted getImageUrl
                        alt={employee.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.src = 'https://ipasystem.bymsystem.com/uploads/default-profile.png';
                        }}
                      />
                    </div>
                    {/* Text Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{employee.full_name}</p>
                      <p className="text-sm text-gray-500">{employee.role}</p>
                      <div className="flex items-center mt-1">
                        {/* Status might not be accurate from this endpoint alone */}
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            employee.status === 'in' ? 'bg-green-400' : 'bg-gray-400'
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            employee.status === 'in' ? 'text-green-600' : 'text-gray-600'
                          }`}
                        >
                          {employee.status === 'in' ? 'Currently In' : 'Currently Out'}
                        </span>
                      </div>
                    </div>
                    {/* ID Tag */}
                    <div className="text-gray-400">
                      <span className="text-xs font-medium">{employee.id}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {/* No Results */}
            {filteredEmployees.length === 0 && (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No employees found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeCheckInModal: React.FC<EmployeeCheckInModalProps> = ({ isOpen, onClose }) => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [checkInType, setCheckInType] = useState<'in' | 'out'>('in');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isEmployeePopupOpen, setIsEmployeePopupOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    setError('');
    try {
      // --- FIX: Changed URL to the correct endpoint for fetching all employees ---
      const response = await fetch('https://ipasystem.bymsystem.com/api/employees/getemployees'); // Use /api/employees
      // --- END FIX ---
      if (!response.ok) throw new Error(`Failed: ${response.statusText}`);
      const data = await response.json();

      
      const transformedEmployees: Employee[] = data.map((emp: any) => ({
        id: String(emp.id ?? ''), // Ensure ID is a string
        full_name: emp.name ?? 'Unknown Employee', // Map 'name' to 'full_name'
        role: emp.role ?? 'N/A',
        status: emp.status || 'out', // Default status if not provided or is falsy
        image: emp.image || null // Use 'image' directly (filename)
      }));
      // --- END FIX ---
      setEmployees(transformedEmployees);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError(`Failed to load data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setIsSubmitting(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('https://ipasystem.bymsystem.com/api/employeeattendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: selectedEmployee.id,
          employee_name: selectedEmployee.full_name,
          action: checkInType
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record attendance');
      }
      const data = await response.json();
      const timestamp = new Date().toLocaleString();
      setMessage(`${selectedEmployee.full_name} successfully checked ${checkInType} at ${timestamp}`);
      // Update the employee's status locally in the list
      setEmployees(prevEmployees =>
        prevEmployees.map(emp =>
          emp.id === selectedEmployee.id
            ? { ...emp, status: checkInType }
            : emp
        )
      );
      // Also update the selected employee state if needed immediately
      setSelectedEmployee(prev => prev ? { ...prev, status: checkInType } : null);
    } catch (err: any) {
      console.error('Error during check-in:', err);
      setError(err.message || 'Failed to process check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEmployeePopupOpen(false);
    // Set default action based on the selected employee's status
    setCheckInType(employee.status === 'in' ? 'out' : 'in');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto text-black">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Backdrop */}
          <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
          {/* Modal Panel */}
          <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Employee Check-In</h3>
                  <p className="text-sm text-gray-500">Record employee attendance</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            {/* Success Message */}
            {message ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Check-in Successful!</p>
                <p className="text-gray-600">{message}</p>
                <button
                  onClick={() => {
                    setSelectedEmployee(null);
                    setMessage('');
                    onClose();
                  }}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Employee Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Employee *
                  </label>
                  {isLoading ? (
                    <div className="p-4 text-center">
                      <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p>Loading employees...</p>
                    </div>
                  ) : selectedEmployee ? (
                    <div className="relative">
                      <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          <img
                            src={getImageUrl(selectedEmployee.image)}
                            alt={selectedEmployee.full_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.src = 'https://ipasystem.bymsystem.com/uploads/default-profile.png';
                            }}
                          />
                        </div>
                        <div className="flex-1 ml-3">
                          <p className="font-semibold text-gray-900">{selectedEmployee.full_name}</p>
                          <p className="text-sm text-gray-600">{selectedEmployee.role}</p>
                          <div className="flex items-center mt-1">
                            <div
                              className={`w-2 h-2 rounded-full mr-2 ${
                                selectedEmployee.status === 'in' ? 'bg-green-400' : 'bg-gray-400'
                              }`}
                            />
                            <span
                              className={`text-xs font-medium ${
                                selectedEmployee.status === 'in' ? 'text-green-600' : 'text-gray-600'
                              }`}
                            >
                              {selectedEmployee.status === 'in' ? 'Currently In' : 'Currently Out'}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEmployeePopupOpen(true)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEmployeePopupOpen(true)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center group"
                    >
                      <Users className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2" />
                      <p className="text-gray-600 group-hover:text-blue-600 font-medium">
                        Click to select employee
                      </p>
                      <p className="text-sm text-gray-500">Choose from employee list</p>
                    </button>
                  )}
                </div>
                {/* Action Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action *</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCheckInType('in')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        checkInType === 'in'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-green-300'
                      }`}
                    >
                      <div className="text-center">
                        <CheckCircle className="w-6 h-6 mx-auto mb-1" />
                        <span className="font-medium">Check In</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckInType('out')}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        checkInType === 'out'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:border-red-300'
                      }`}
                    >
                      <div className="text-center">
                        <AlertCircle className="w-6 h-6 mx-auto mb-1" />
                        <span className="font-medium">Check Out</span>
                      </div>
                    </button>
                  </div>
                </div>
                {/* Current Time */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Current Time</p>
                    <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleString()}</p>
                  </div>
                </div>
                {/* Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedEmployee}
                    className={`px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${
                      checkInType === 'in'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 mr-2" />
                        Check {checkInType === 'in' ? 'In' : 'Out'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      {/* Employee Selector Popup */}
      <EmployeeSelectionPopup
        isOpen={isEmployeePopupOpen}
        onClose={() => setIsEmployeePopupOpen(false)}
        onSelectEmployee={handleSelectEmployee}
        employees={employees}
      />
    </>
  );
};

export default EmployeeCheckInModal;