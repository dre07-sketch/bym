import React, { useState, useEffect } from 'react';

const CompletedCars = () => {
  const [completedCars, setCompletedCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCar, setSelectedCar] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    licensePlate: '',
    ticketNumber: '',
    status: 'All statuses',
  });
  // Add state for active tab and sub-tab
  const [activeTab, setActiveTab] = useState('Overview');
  const [activeSubTab, setActiveSubTab] = useState('Ordered Parts');

  // Format ISO date to readable string: "July 31, 2025 at 9:00 PM"
  const formatDateTime = (isoString) => {
    if (!isoString) return 'Unknown date';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Format date only: "July 31, 2025"
  const formatDateOnly = (isoString) => {
    if (!isoString) return 'Unknown date';
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Fetch list of completed cars on mount
  useEffect(() => {
    const fetchCompletedCars = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/active-tickets/completed-cars');
        if (!response.ok) throw new Error('Failed to fetch completed cars');
        const data = await response.json();
        const mappedData = data.map((car) => ({
          id: car.ticket_number,
          ticketNumber: car.ticket_number,
          carName: car.vehicle_info,
          licensePlate: car.license_plate,
          clientName: car.customer_name,
          mechanicName: car.mechanicName, // Mechanic name from API
          startDate: car.startDate,
          dueDate: car.estimatedCompletionDate,     // Estimated due date
          completedDate: car.completedDate,         // Actual completion date
          
          status: car.status,
        }));
        setCompletedCars(mappedData);
      } catch (err) {
        console.error(err);
        setError('Failed to load completed vehicles.');
      } finally {
        setLoading(false);
      }
    };
    fetchCompletedCars();
  }, []);

  const openModal = async (car) => {
    setSelectedCar(null);
    setIsModalOpen(true);
    // Reset tabs when opening modal
    setActiveTab('Overview');
    setActiveSubTab('Ordered Parts');
    
    try {
      const response = await fetch(`http://localhost:5001/api/active-tickets/completed-cars/${car.ticketNumber}`);
      if (!response.ok) throw new Error('Ticket not found');
      const detailedCar = await response.json();
      // Map API response to UI format
      const mappedCar = {
        id: detailedCar.ticket_number,
        ticketNumber: detailedCar.ticket_number,
        carName: detailedCar.vehicle_info,
        licensePlate: detailedCar.license_plate,
        clientName: detailedCar.customer_name,
        mechanicName: detailedCar.mechanicName, // Mechanic name from API
        startDate: detailedCar.startDate,
        dueDate: detailedCar.estimatedDueDate || detailedCar.estimatedCompletionDate, // Estimated
        completedDate: detailedCar.actualCompletionDate || detailedCar.dueDate,       // Actual completion
        
        status: detailedCar.status,
        description: detailedCar.description,
        toolsUsed: Array.isArray(detailedCar.toolsUsed) ? detailedCar.toolsUsed : [],
        activityLogs: detailedCar.activityLogs.map((log) => ({
          date: log.date || log.created_at,
          activity: log.description, // assuming description is the activity
          notes: log.notes,
        })),
        disassembledParts: detailedCar.disassembledParts.map((part) => ({
          part_name: part.part_name,
          condition: part.condition,
          status: part.status,
          notes: part.notes,
          logged_at: part.logged_at,
        })),
        outsourceStock: detailedCar.outsourceStock || [],
        orderedParts: detailedCar.orderedParts || [],
        outsourceMechanics: detailedCar.outsourceMechanics || [],
      };
      setSelectedCar(mappedCar);
    } catch (err) {
      console.error(err);
      alert('Failed to load vehicle details.');
      // Fallback with safe values
      setSelectedCar({
        ...car,
        description: 'No description available.',
        activityLogs: [],
        toolsUsed: [],
        disassembledParts: [],
        outsourceStock: [],
        orderedParts: [],
        outsourceMechanics: [],
      });
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCar(null);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const filteredCars = completedCars.filter((car) => {
    return (
      (filters.licensePlate === '' ||
        car.licensePlate.toLowerCase().includes(filters.licensePlate.toLowerCase())) &&
      (filters.ticketNumber === '' ||
        car.ticketNumber.toLowerCase().includes(filters.ticketNumber.toLowerCase())) &&
      (filters.status === 'All statuses' || car.status === filters.status)
    );
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600 text-lg animate-pulse">Loading completed vehicles...</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8 overflow-y-auto max-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-800">🔧 Completed Repairs</h1>
          <p className="text-gray-500 mt-1">
            {filteredCars.length} vehicle{filteredCars.length !== 1 ? 's' : ''} completed
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-indigo-600">
          </p>
        </div>
      </div>
      {/* Filters */}
      <div className="mb-6">
        <button
          onClick={toggleFilters}
          className="flex items-center text-indigo-700 hover:text-indigo-900 font-medium transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
            />
          </svg>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
        {showFilters && (
          <div className="bg-white p-5 rounded-xl shadow-lg mt-3 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">⚙️</span>
              Filter Options
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
                <input
                  type="text"
                  name="licensePlate"
                  value={filters.licensePlate}
                  onChange={handleFilterChange}
                  placeholder="Search plate..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Number</label>
                <input
                  type="text"
                  name="ticketNumber"
                  value={filters.ticketNumber}
                  onChange={handleFilterChange}
                  placeholder="Search TKT-..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-indigo-300 focus:border-indigo-500"
                >
                  <option>All statuses</option>
                  <option>Completed</option>
                  <option>Delivered</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Cars List */}
      <div className="space-y-5">
        {filteredCars.length === 0 ? (
          <div className="text-center py-10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mx-auto h-12 w-12 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500 mt-4 text-lg">No vehicles match your filters.</p>
          </div>
        ) : (
          filteredCars.map((car) => (
            <div
              key={car.id}
              onClick={() => openModal(car)}
              className="group bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-xl hover:border-indigo-200 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden"
            >
              {/* Gradient Top Bar */}
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              <div className="p-5">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  <div>
                    <h3 className="font-bold text-xl text-gray-800 group-hover:text-indigo-700 transition-colors">
                      {car.clientName}
                    </h3>
                    <p className="text-indigo-600 font-semibold mt-1">{car.carName}</p>
                    {/* Added mechanic name here */}
                    <p className="text-gray-600 text-sm mt-1">Mechanic: {car.mechanicName}</p>
                  </div>
                  <div className="text-right mt-2 md:mt-0">
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium mb-1">
                      {car.status}
                    </span>
                    <p className="text-sm text-gray-500">{car.licensePlate}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1 text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <span>{car.ticketNumber}</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.84-1.29M9 17H5a2 2 0 01-2-2V9a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 00.707.293H19a2 2 0 012 2v4.586a1 1 0 01-.293.707l-4.414 4.414A1 1 0 0117 20z"
                      />
                    </svg>
                    <span>{formatDateOnly(car.startDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1 text-orange-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span title="Estimated completion date">{formatDateOnly(car.dueDate)}</span>
                  </div>
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.165-2.052-.48-3.016z"
                      />
                    </svg>
                    <span title="Actual completion date">{formatDateOnly(car.completedDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-fadeIn">
          {selectedCar ? (
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="bg-custom-gradient text-white p-6 rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center space-x-4">
                      <h2 className="text-2xl font-bold">{selectedCar.ticketNumber}</h2>
                      <span className="bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-medium">
                        {selectedCar.status}
                      </span>
                    </div>
                    <p className="text-indigo-100 mt-2">User: {selectedCar.clientName}</p>
                  </div>
                  <button
                    onClick={closeModal}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <div className="flex border-b border-gray-200 bg-gray-50">
                {['Overview', 'Progress Logs', 'Disassembled Parts', 'Used Tools', 'Ordered Parts', ].map((tab) => (
                  <button
                    key={tab}
                    className={`px-4 py-3 font-medium text-sm ${
                      activeTab === tab
                        ? 'text-indigo-600 border-b-2 border-indigo-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              {/* Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'Overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-5 rounded-xl">
                        <h3 className="font-bold text-lg text-black mb-4">Client Information</h3>
                        <div className="space-y-3 text-black">
                          <p><span className="font-medium">Name:</span> {selectedCar.clientName}</p>
                          <p><span className="font-medium">License Plate:</span> {selectedCar.licensePlate}</p>
                          <p><span className="font-medium">Vehicle:</span> {selectedCar.carName}</p>
                          <p><span className="font-medium">Ticket #:</span> {selectedCar.ticketNumber}</p>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-5 rounded-xl">
                        <h3 className="font-bold text-lg text-black mb-4">Repair Details</h3>
                        <div className="space-y-3 text-black">
                          <p><span className="font-medium">Mechanic:</span> {selectedCar.mechanicName}</p>
                          <p><span className="font-medium">Start Date:</span> {formatDateOnly(selectedCar.startDate)}</p>
                          <p><span className="font-medium">Estimated Due:</span> {formatDateOnly(selectedCar.dueDate)}</p>
                          <p><span className="font-medium">Completed On:</span> {formatDateOnly(selectedCar.completedDate)}</p>
                          <p><span className="font-medium">Status:</span> <span className="font-bold text-green-600">{selectedCar.status}</span></p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-black mb-3">Description</h3>
                      <p className="text-black bg-gray-50 p-4 rounded-xl">{selectedCar.description || 'No description available.'}</p>
                    </div>
                  </div>
                )}
                
                {/* Progress Logs Tab */}
                {activeTab === 'Progress Logs' && (
                  <div>
                    <h3 className="font-bold text-lg text-black mb-3">Activity Log</h3>
                    <div className="space-y-3">
                      {selectedCar.activityLogs && selectedCar.activityLogs.length > 0 ? (
                        selectedCar.activityLogs.map((log, index) => (
                          <div
                            key={index}
                            className="border-l-4 border-indigo-500 pl-4 py-3 bg-indigo-50 rounded-r-lg"
                          >
                            <div className="flex justify-between">
                              <span className="font-semibold text-black">{log.notes}</span>
                              <span className="text-xs text-indigo-600 font-medium">
                                {formatDateTime(log.date)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-black italic">No activity logs available.</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Disassembled Parts Tab */}
                {activeTab === 'Disassembled Parts' && (
                  <div>
                    <h3 className="font-bold text-lg text-black mb-3">Disassembled Parts</h3>
                    <div className="space-y-3">
                      {selectedCar.disassembledParts && selectedCar.disassembledParts.length > 0 ? (
                        selectedCar.disassembledParts.map((part, index) => (
                          <div
                            key={index}
                            className="border-l-4 border-amber-400 pl-4 py-3 bg-amber-50 rounded-r-lg"
                          >
                            <div className="flex justify-between">
                              <span className="font-semibold text-black">{part.part_name}</span>
                              <div className="flex space-x-2">
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    part.condition === 'Worn'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {part.condition}
                                </span>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    part.status === 'Removed'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {part.status}
                                </span>
                              </div>
                            </div>
                            <p className="text-black text-sm mt-1">{part.notes}</p>
                            <p className="text-gray-500 text-xs mt-1">
                              Logged: {formatDateTime(part.logged_at)}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-black italic">No disassembled parts recorded.</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Used Tools Tab */}
                {activeTab === 'Used Tools' && (
                  <div>
                    <h3 className="font-bold text-lg text-black mb-3">Tools Used</h3>
                    {selectedCar.toolsUsed && selectedCar.toolsUsed.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedCar.toolsUsed.map((tool, index) => (
                          <span
                            key={index}
                            className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm"
                          >
                            {tool.tool_name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-black italic">No tools recorded for this repair.</p>
                    )}
                  </div>
                )}
                
                {/* Ordered Parts Tab */}
                {activeTab === 'Ordered Parts' && (
                  <div>
                    {/* Sub-tabs */}
                    <div className="flex border-b border-gray-200 mb-4">
                      <button
                        className={`px-4 py-2 font-medium text-sm ${
                          activeSubTab === 'Ordered Parts'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={() => setActiveSubTab('Ordered Parts')}
                      >
                        Ordered Parts
                      </button>
                      <button
                        className={`px-4 py-2 font-medium text-sm ${
                          activeSubTab === 'Outsource Stock'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={() => setActiveSubTab('Outsource Stock')}
                      >
                        Outsource Stock
                      </button>
                    </div>
                    
                    {/* Ordered Parts Sub-tab */}
                    {activeSubTab === 'Ordered Parts' && (
                      <div>
                        <h3 className="font-bold text-lg text-black mb-3">Ordered Parts</h3>
                        {selectedCar.orderedParts && selectedCar.orderedParts.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="py-2 px-4 border-b text-left text-black">Name</th>
                                  <th className="py-2 px-4 border-b text-left text-black">Category</th>
                                  <th className="py-2 px-4 border-b text-left text-black">SKU</th>
                                  <th className="py-2 px-4 border-b text-left text-black">Quantity</th>
                                  <th className="py-2 px-4 border-b text-left text-black">Price</th>
                                  <th className="py-2 px-4 border-b text-left text-black">Status</th>
                                  <th className="py-2 px-4 border-b text-left text-black">Ordered</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedCar.orderedParts.map((part, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b text-black">{part.name}</td>
                                    <td className="py-2 px-4 border-b text-black">{part.category}</td>
                                    <td className="py-2 px-4 border-b text-black">{part.sku}</td>
                                    <td className="py-2 px-4 border-b text-black">{part.quantity}</td>
                                    <td className="py-2 px-4 border-b text-black">${part.price}</td>
                                    <td className="py-2 px-4 border-b">
                                      <span className={`px-2 py-1 rounded-full text-xs ${
                                        part.status === 'Received' ? 'bg-green-100 text-green-800' : 
                                        part.status === 'Ordered' ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {part.status}
                                      </span>
                                    </td>
                                    <td className="py-2 px-4 border-b text-black">{formatDateOnly(part.ordered_at)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-black italic">No ordered parts recorded.</p>
                        )}
                      </div>
                    )}
                    
                    {/* Outsource Stock Sub-tab */}
                    {activeSubTab === 'Outsource Stock' && (
                      <div>
                        <h3 className="font-bold text-lg text-black mb-3">Outsource Stock</h3>
                        {selectedCar.outsourceStock && selectedCar.outsourceStock.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="py-2 px-4 border-b text-left text-black">Name</th>
                                  <th className="py-2 px-4 border-b text-left text-black">Category</th>
                                  <th className="py-2 px-4 border-b text-left text-black">Source</th>
                                  <th className="py-2 px-4 border-b text-left text-black">Quantity</th>
                                  <th className="py-2 px-4 border-b text-left text-black">Status</th>
                                  <th className="py-2 px-4 border-b text-left text-black">Requested</th>
                                  <th className="py-2 px-4 border-b text-left text-black">Received</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedCar.outsourceStock.map((item, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b text-black">{item.name}</td>
                                    <td className="py-2 px-4 border-b text-black">{item.category}</td>
                                    <td className="py-2 px-4 border-b text-black">{item.source_shop}</td>
                                    <td className="py-2 px-4 border-b text-black">{item.quantity}</td>
                                    <td className="py-2 px-4 border-b">
                                      <span className={`px-2 py-1 rounded-full text-xs ${
                                        item.status === 'Received' ? 'bg-green-100 text-green-800' : 
                                        item.status === 'Requested' ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {item.status}
                                      </span>
                                    </td>
                                    <td className="py-2 px-4 border-b text-black">{formatDateOnly(item.requested_at)}</td>
                                    <td className="py-2 px-4 border-b text-black">
                                      {item.received_at ? formatDateOnly(item.received_at) : 'Pending'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-black italic">No outsource stock recorded.</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Inspection Tab */}
                
              </div>
              
              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-3xl text-right">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-3xl shadow-2xl text-center">
              <p className="text-black">Loading vehicle details...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompletedCars;