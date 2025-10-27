// FinancePage.tsx
import { useState, useEffect } from 'react';

// Types
interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  email: string;
  phone: string;
  salary: number;
  salaryDay: number; // Derived from createdAt
  imageUrls: string[]; // Changed from avatar to imageUrls array
  createdAt: string; // Added from API
}

interface PaymentFormData {
  salary: number;
  date: string;
  paymentMethod: string;
  note: string;
}

interface PaymentHistory {
  id: number;
  date: string;
  amount: number;
  method: string;
  note: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

const API_BASE_URL = 'https://ipasystem.bymsystem.com/api';

const FinancePage = () => {
  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    salary: 0,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank',
    note: ''
  });
  const [filter, setFilter] = useState<'all' | 'upcoming'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [paymentHistoryError, setPaymentHistoryError] = useState<string | null>(null);

  // Fetch employees based on filter
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const endpoint = filter === 'upcoming' 
          ? `${API_BASE_URL}/finance/upcoming-salaries`
          : `${API_BASE_URL}/employees/getemployees`;
          
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform API data to match our Employee interface
        const formattedEmployees = data.map((item: any) => {
          // Extract payment day from createdAt
          const createdDate = new Date(item.createdAt);
          const paymentDay = createdDate.getDate(); // Get day of month (1-31)
          
          return {
            id: item.id,
            name: item.name,
            position: item.role,
            department: item.specialty || 'General',
            email: item.email,
            phone: item.phone,
            salary: item.salary,
            salaryDay: paymentDay, // Use the day from createdAt
            imageUrls: item.imageUrls || [], // Use imageUrls array from API
            createdAt: item.createdAt // Store the original createdAt value
          };
        });
        
        setEmployees(formattedEmployees);
      } catch (err) {
        console.error('Error fetching employees:', err);
        setError('Failed to fetch employees. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [filter]);
  
  // Fetch payment history for selected employee
  const fetchPaymentHistory = async (employeeId: number) => {
    setPaymentHistoryLoading(true);
    setPaymentHistoryError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/finance/payment-history/${employeeId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPaymentHistory(data.payments);
      } else {
        throw new Error(data.message || 'Failed to fetch payment history');
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setPaymentHistoryError('Failed to fetch payment history. Please try again later.');
    } finally {
      setPaymentHistoryLoading(false);
    }
  };
  
  // Handle employee selection
  const handleEmployeeClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowDetailModal(true);
    setPaymentForm({
      ...paymentForm,
      salary: employee.salary
    });
    
    // Load payment history for this employee
    fetchPaymentHistory(employee.id);
  };
  
  // Handle payment form submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/finance/employee-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          employeeName: selectedEmployee.name,
          salary: paymentForm.salary,
          date: paymentForm.date,
          paymentMethod: paymentForm.paymentMethod,
          note: paymentForm.note,
          status: 'Completed'
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process payment');
      }
      
      alert(`Payment of $${paymentForm.salary} processed for ${selectedEmployee.name}`);
      
      // Refresh employee list to get updated data
      const endpoint = filter === 'upcoming' 
        ? `${API_BASE_URL}/finance/upcoming-salaries`
        : `${API_BASE_URL}/employees/getemployees`;
        
      const refreshResponse = await fetch(endpoint);
      const refreshData = await refreshResponse.json();
      
      const formattedEmployees = refreshData.map((item: any) => {
        // Extract payment day from createdAt
        const createdDate = new Date(item.createdAt);
        const paymentDay = createdDate.getDate(); // Get day of month (1-31)
        
        return {
          id: item.id,
          name: item.name,
          position: item.role,
          department: item.specialty || 'General',
          email: item.email,
          phone: item.phone,
          salary: item.salary,
          salaryDay: paymentDay, // Use the day from createdAt
          imageUrls: item.imageUrls || [], // Use imageUrls array from API
          createdAt: item.createdAt // Store the original createdAt value
        };
      });
      
      setEmployees(formattedEmployees);
      setShowPaymentModal(false);
      setShowDetailModal(false);
    } catch (err) {
      console.error('Error processing payment:', err);
      alert('Failed to process payment. Please try again.');
    }
  };
  
  // Helper functions
  const isSalaryDayClose = (salaryDay: number): boolean => {
    const today = new Date();
    const currentDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    let daysUntilSalary = salaryDay - currentDay;
    if (daysUntilSalary < 0) {
      daysUntilSalary += daysInMonth;
    }
    
    return daysUntilSalary <= 3;
  };
  
  const filteredEmployees = employees.filter(employee => {
    const matchesFilter = filter === 'upcoming' 
      ? isSalaryDayClose(employee.salaryDay)
      : true;
    
    const matchesSearch = searchTerm === '' 
      ? true 
      : employee.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: name === 'salary' ? Number(value) : value
    }));
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // EmployeeImage component to handle multiple image URLs with fallback
  const EmployeeImage = ({ imageUrls, name, className }: { 
    imageUrls: string[], 
    name: string, 
    className: string 
  }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [imageError, setImageError] = useState(false);
    
    const handleImageError = () => {
      if (currentImageIndex < imageUrls.length - 1) {
        // Try the next URL in the array
        setCurrentImageIndex(currentImageIndex + 1);
      } else {
        // All URLs failed, use fallback
        setImageError(true);
      }
    };
    
    if (imageError || imageUrls.length === 0) {
      return (
        <img 
          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`}
          alt={name}
          className={className}
        />
      );
    }
    
    return (
      <img 
        src={imageUrls[currentImageIndex]} 
        alt={name}
        className={className}
        onError={handleImageError}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Finance Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage employee salaries and payments</p>
          
          {/* Search Bar */}
          <div className="mt-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search employees by name..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </header>
        
        {/* Filter Controls */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button 
            className={`px-4 py-2 rounded-lg transition ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setFilter('all')}
          >
            All Employees
          </button>
          
        </div>
        
        {/* Loading and Error States */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Employee Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-black">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(employee => (
                <div 
                  key={employee.id} 
                  className="bg-white rounded-xl shadow-md overflow-hidden transition-transform duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                  onClick={() => handleEmployeeClick(employee)}
                >
                  <div className="p-5">
                    <div className="flex items-center">
                      <EmployeeImage 
                        imageUrls={employee.imageUrls}
                        name={employee.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                      />
                      <div className="ml-4">
                        <h2 className="font-bold text-lg text-gray-800">{employee.name}</h2>
                        <p className="text-gray-600">{employee.position}</p>
                        <div className="mt-1 flex items-center">
                          <span className="text-sm text-gray-500">{employee.department}</span>
                          {isSalaryDayClose(employee.salaryDay) && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                              Payment Due Soon
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Salary:</span>
                        <span className="font-medium">{formatCurrency(employee.salary)}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-500">Payment Day:</span>
                        <span className="font-medium">{employee.salaryDay}{employee.salaryDay === 1 ? 'st' : employee.salaryDay === 2 ? 'nd' : employee.salaryDay === 3 ? 'rd' : 'th'} of month</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No employees found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        )}
        
        {/* Employee Detail Modal */}
        {showDetailModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 text-black">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-gray-800">Employee Details</h2>
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-6 flex flex-col items-center">
                  <EmployeeImage 
                    imageUrls={selectedEmployee.imageUrls}
                    name={selectedEmployee.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                  />
                  <h3 className="mt-4 text-xl font-bold text-gray-800">{selectedEmployee.name}</h3>
                  <p className="text-gray-600">{selectedEmployee.position}</p>
                  <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {selectedEmployee.department}
                  </div>
                </div>
                
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium">{selectedEmployee.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone:</span>
                    <span className="font-medium">{selectedEmployee.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Salary:</span>
                    <span className="font-medium">{formatCurrency(selectedEmployee.salary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Payment Day:</span>
                    <span className="font-medium">{selectedEmployee.salaryDay}{selectedEmployee.salaryDay === 1 ? 'st' : selectedEmployee.salaryDay === 2 ? 'nd' : selectedEmployee.salaryDay === 3 ? 'rd' : 'th'} of month</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Joined:</span>
                    <span className="font-medium">{formatDate(selectedEmployee.createdAt)}</span>
                  </div>
                </div>
                
                <div className="mt-8 space-y-3">
                  <button 
                    onClick={() => {
                      setShowDetailModal(false);
                      setShowPaymentModal(true);
                    }}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                  >
                    Process Salary Payment
                  </button>
                  
                  <button 
                    onClick={() => {
                      setShowPaymentHistoryModal(true);
                    }}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    View Payment History
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Payment Form Modal */}
        {showPaymentModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 text-black">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-gray-800">Process Payment</h2>
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-4 flex items-center">
                  <EmployeeImage 
                    imageUrls={selectedEmployee.imageUrls}
                    name={selectedEmployee.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="ml-3">
                    <h3 className="font-bold text-gray-800">{selectedEmployee.name}</h3>
                    <p className="text-sm text-gray-600">{selectedEmployee.position}</p>
                  </div>
                </div>
                
                <form onSubmit={handlePaymentSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Salary Amount ($)</label>
                    <input
                      type="number"
                      name="salary"
                      value={paymentForm.salary}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                    <input
                      type="date"
                      name="date"
                      value={paymentForm.date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select
                      name="paymentMethod"
                      value={paymentForm.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="bank">Bank Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="check">Check</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                    <textarea
                      name="note"
                      value={paymentForm.note}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add any additional notes..."
                    />
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                    >
                      Submit Payment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Payment History Modal */}
        {showPaymentHistoryModal && selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-gray-800">Payment History</h2>
                  <button 
                    onClick={() => setShowPaymentHistoryModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-4 flex items-center">
                  <EmployeeImage 
                    imageUrls={selectedEmployee.imageUrls}
                    name={selectedEmployee.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="ml-3">
                    <h3 className="font-bold text-gray-800">{selectedEmployee.name}</h3>
                    <p className="text-sm text-gray-600">{selectedEmployee.position}</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  {paymentHistoryLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : paymentHistoryError ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">{paymentHistoryError}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {paymentHistory.map((payment) => (
                              <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(payment.date)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.method}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                                    {payment.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {paymentHistory.length === 0 && (
                        <div className="text-center py-8">
                          <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No payment history</h3>
                          <p className="mt-1 text-sm text-gray-500">No payments have been processed for this employee yet.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => setShowPaymentHistoryModal(false)}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancePage;