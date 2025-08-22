import React, { useState, useEffect } from 'react';
import { Car, Calendar, User, Wrench, Eye, FileText, DollarSign, X, CheckCircle, Clock, AlertTriangle, Settings, Search, Filter, Star, MapPin, Phone, Mail } from 'lucide-react';

const CompletedCars = () => {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all completed cars
  useEffect(() => {
    const fetchCompletedCars = async () => {
      try {
        const response = await fetch('/api/tickets/completed'); // Adjust endpoint as needed
        if (!response.ok) throw new Error('Failed to fetch completed cars');
        const data = await response.json();

        const mappedCars = data.map(ticket => {
          // Estimate total cost
          const totalCost = (ticket.progress_logs?.reduce((sum, log) => sum + (parseFloat(log.cost) || 0), 0) ||
                           ticket.disassembled_parts?.reduce((sum, part) => sum + (parseFloat(part.cost) || 0), 0) ||
                           0);

          return {
            id: ticket.ticket_number,
            model: ticket.vehicle_info || 'Unknown Model',
            make: ticket.vehicle_info?.split(' ')[1] || 'Unknown',
            year: parseInt(ticket.vehicle_info?.split(' ')[0]) || null,
            color: 'Unknown',
            plateNumber: ticket.license_plate,
            completedDate: ticket.completion_date || ticket.estimated_completion_date,
            totalCost: Math.round(totalCost),
            status: ticket.status,
            priority: ticket.priority?.toLowerCase() || 'low',
            technician: ticket.mechanic_assign || 'Unassigned',
            inspector: ticket.inspections[0]?.inspector || 'Unassigned',
            issues: ticket.disassembled_parts?.map(part => ({
              title: part.part_name,
              description: part.notes || 'No description',
              status: part.reassembly_verified ? 'resolved' : 'pending',
              cost: parseFloat(part.cost) || 0
            })) || [],
            progress: ticket.progress_logs?.map(log => ({
              stage: log.part_name || 'Unknown Stage',
              date: log.logged_at,
              status: log.status || 'in-progress'
            })) || [],
            inspections: ticket.inspections?.map(insp => ({
              type: insp.inspection_status?.charAt(0).toUpperCase() + insp.inspection_status.slice(1),
              date: insp.inspection_date,
              result: insp.main_issue_resolved ? 'Passed' : 'Needs Review'
            })) || [],
            customerInfo: {
              name: ticket.customer_name,
              phone: ticket.customer_phone || 'N/A',
              email: ticket.customer_email || 'N/A',
              address: ticket.customer_address || 'N/A'
            }
          };
        });

        setCars(mappedCars);
      } catch (err) {
        console.error('Error fetching completed cars:', err);
        setError('Failed to load completed cars. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedCars();
  }, []);

  // Filter cars based on search and priority
  const filteredCars = cars.filter(car => {
    const matchesSearch = car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         car.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         car.customerInfo.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || car.priority === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'resolved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Open car details with full fetch
  const openCarDetails = async (car) => {
    setSelectedCar(null); // Reset for loading
    try {
      const response = await fetch(`/api/tickets/completed/${car.id}`);
      if (!response.ok) throw new Error('Failed to load ticket details');

      const data = await response.json();

      const fullCar = {
        ...car,
        issues: data.disassembled_parts?.map(part => ({
          title: part.part_name,
          description: part.notes || 'No description',
          status: part.reassembly_verified ? 'resolved' : 'pending',
          cost: parseFloat(part.cost) || 0
        })) || [],
        progress: data.progress_logs?.map(log => ({
          stage: log.part_name || 'Unknown',
          date: log.logged_at,
          status: log.status || 'in-progress'
        })) || [],
        inspections: data.inspections?.map(insp => ({
          type: insp.inspection_status?.charAt(0).toUpperCase() + insp.inspection_status.slice(1),
          date: insp.inspection_date,
          result: insp.main_issue_resolved ? 'Passed' : 'Needs Review'
        })) || [],
        technician: data.ticket.mechanic_assign || 'Unassigned',
        inspector: data.inspections[0]?.inspector || 'Unassigned'
      };

      setSelectedCar(fullCar);
      setActiveTab('details');
    } catch (err) {
      console.error('Error loading ticket details:', err);
      alert('Failed to load ticket details. Please try again.');
    }
  };

  const closeModal = () => {
    setSelectedCar(null);
  };

  // Tab Button Component
  const TabButton = ({ id, label, icon: Icon, isActive, onClick }) => (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        isActive
          ? 'bg-blue-500 text-white shadow-lg'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-6"></div>
          <p className="text-xl text-gray-600">Loading completed cars...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center text-red-600 p-8 rounded-3xl bg-white shadow-xl max-w-md">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Oops!</h3>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            Completed Cars
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto md:mx-0"></div>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by model, plate, or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all duration-200"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-200 outline-none transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Cars Grid */}
        {filteredCars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCars.map((car) => (
              <div
                key={car.id}
                className="group bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden cursor-pointer"
                onClick={() => openCarDetails(car)}
              >
                <div className="relative p-6">
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(car.status)}`}>
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                      Completed
                    </span>
                  </div>

                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Car className="w-8 h-8 text-white" />
                  </div>

                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                      {car.model}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">Ticket: {car.id}</p>
                    <p className="text-gray-600 text-sm">Customer: {car.customerInfo.name}</p>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(car.priority)}`}>
                      {car.priority.toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-green-600">
                      ${car.totalCost}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(car.completedDate).toLocaleDateString()}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Cool Empty State */
          <div className="text-center py-16 px-4">
            <div className="relative inline-block mb-6">
              <div className="animate-float">
                <Car className="w-20 h-20 text-gray-300 mx-auto" />
              </div>
              <div className="absolute -top-2 -right-2 animate-ping">
                <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
              </div>
              <div className="absolute -bottom-1 -left-1 animate-pulse">
                <div className="w-2 h-2 bg-indigo-200 rounded-full"></div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-500 mb-2">No Completed Cars Yet</h3>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              All vehicles are still in repair or haven’t been marked as completed. Check back later!
            </p>

            <div className="flex justify-center space-x-4 text-gray-300 mb-6">
              <Calendar className="w-6 h-6 animate-bounce delay-100" />
              <Wrench className="w-6 h-6 animate-bounce delay-200" />
              <Eye className="w-6 h-6 animate-bounce delay-300" />
            </div>

            <div className="flex items-center justify-center mb-6">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-gray-300"></div>
              <Star className="w-5 h-5 text-yellow-300 mx-2" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-gray-300"></div>
            </div>

            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
              }}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 shadow-lg transform hover:scale-105"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Modal */}
        {selectedCar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden transform animate-slideUp">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 relative">
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Car className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedCar.customerInfo.name}</h2>
                    <p className="text-blue-100">Ticket: {selectedCar.id}</p>
                  </div>
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex space-x-2 overflow-x-auto">
                  <TabButton id="details" label="Details" icon={FileText} isActive={activeTab === 'details'} onClick={setActiveTab} />
                  <TabButton id="disassembled" label="Issues" icon={Settings} isActive={activeTab === 'disassembled'} onClick={setActiveTab} />
                  <TabButton id="progress" label="Progress" icon={Clock} isActive={activeTab === 'progress'} onClick={setActiveTab} />
                  <TabButton id="inspections" label="Inspections" icon={Eye} isActive={activeTab === 'inspections'} onClick={setActiveTab} />
                  <TabButton id="bill" label="Bill" icon={DollarSign} isActive={activeTab === 'bill'} onClick={setActiveTab} />
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 max-h-96 overflow-y-auto">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <Car className="w-5 h-5 mr-2 text-blue-500" />
                          Vehicle Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-gray-600">Make:</span><span className="font-medium">{selectedCar.make}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Year:</span><span className="font-medium">{selectedCar.year}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Color:</span><span className="font-medium">{selectedCar.color}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Status:</span><span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedCar.status)}`}>{selectedCar.status}</span></div>
                          <div className="flex justify-between"><span className="text-gray-600">Priority:</span><span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(selectedCar.priority)}`}>{selectedCar.priority.toUpperCase()}</span></div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                          <User className="w-5 h-5 mr-2 text-green-500" />
                          Customer Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center"><User className="w-4 h-4 mr-2 text-gray-400" /><span>{selectedCar.customerInfo.name}</span></div>
                          <div className="flex items-center"><Phone className="w-4 h-4 mr-2 text-gray-400" /><span>{selectedCar.customerInfo.phone}</span></div>
                          <div className="flex items-center"><Mail className="w-4 h-4 mr-2 text-gray-400" /><span>{selectedCar.customerInfo.email}</span></div>
                          <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-gray-400" /><span>{selectedCar.customerInfo.address}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-blue-50 rounded-2xl p-4">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                          <Wrench className="w-5 h-5 mr-2 text-blue-500" />
                          Technician
                        </h4>
                        <p className="text-gray-700">{selectedCar.technician}</p>
                      </div>
                      <div className="bg-purple-50 rounded-2xl p-4">
                        <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                          <Eye className="w-5 h-5 mr-2 text-purple-500" />
                          Inspector
                        </h4>
                        <p className="text-gray-700">{selectedCar.inspector}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'disassembled' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 mb-4">Issues & Repairs</h4>
                    {selectedCar.issues.map((issue, index) => (
                      <div key={index} className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-gray-800">{issue.title}</h5>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-3">{issue.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Cost:</span>
                          <span className="font-semibold text-green-600">${issue.cost}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'progress' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 mb-4">Repair Progress</h4>
                    {selectedCar.progress.map((stage, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-xl">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${stage.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}>
                          {stage.status === 'completed' ? <CheckCircle className="w-5 h-5 text-white" /> : <Clock className="w-5 h-5 text-gray-600" />}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-800">{stage.stage}</h5>
                          <p className="text-sm text-gray-600">{new Date(stage.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(stage.status)}`}>{stage.status}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'inspections' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 mb-4">Inspection History</h4>
                    {selectedCar.inspections.map((ins, index) => (
                      <div key={index} className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-800">{ins.type}</h5>
                          <span className="text-sm text-gray-600">{new Date(ins.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-2">Result:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            ['Approved', 'Passed', 'Excellent', 'Perfect'].includes(ins.result) 
                              ? 'bg-green-100 text-green-800' 
                              : ['Issues Found', 'Multiple Issues', 'Major Issues'].includes(ins.result) 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {ins.result}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'bill' && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-800 mb-4">Billing Summary</h4>
                    <div className="bg-gray-50 rounded-2xl p-4">
                      <div className="space-y-3">
                        {selectedCar.issues.map((issue, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                            <span className="text-gray-700">{issue.title}</span>
                            <span className="font-medium">${issue.cost}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                          <span className="text-lg font-semibold text-gray-800">Total Cost:</span>
                          <span className="text-2xl font-bold text-green-600">${selectedCar.totalCost}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Completion Date:</span>
                        <span className="font-medium">{new Date(selectedCar.completedDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                <div className="flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75% { transform: scale(1.2); opacity: 0; }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
        .animate-float { animation: float 3s ease-in-out infinite; }
        .animate-ping { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>
    </div>
  );
};

export default CompletedCars;