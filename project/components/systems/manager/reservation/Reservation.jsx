import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Car,
  PenTool as Tool,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronRight,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Wrench,
  ArrowRight,
  Ticket,
  Star,
  Award,
  Users,
  CheckSquare,
  Settings,
  Zap
} from 'lucide-react';

const reservations = [
  {
    id: 1,
    ticketNumber: "SRV-2024-001",
    customerName: "John Smith",
    vehicleModel: "Toyota Camry 2020",
    licensePlate: "ABC-123",
    currentMileage: 45000,
    serviceInterval: 50000,
    lastServiceDate: "2024-01-15",
    nextServiceDue: "2024-03-25",
    status: "pending",
    notes: "Regular maintenance check due to mileage"
  },
  {
    id: 2,
    ticketNumber: "SRV-2024-002",
    customerName: "Sarah Johnson",
    vehicleModel: "Honda CR-V 2021",
    licensePlate: "XYZ-789",
    currentMileage: 29800,
    serviceInterval: 30000,
    lastServiceDate: "2023-12-10",
    nextServiceDue: "2024-03-20",
    status: "confirmed",
    notes: "30,000 mile service check"
  },
  {
    id: 3,
    ticketNumber: "SRV-2024-003",
    customerName: "Michael Brown",
    vehicleModel: "Ford F-150 2019",
    licensePlate: "DEF-456",
    currentMileage: 59500,
    serviceInterval: 60000,
    lastServiceDate: "2023-11-20",
    nextServiceDue: "2024-03-18",
    status: "pending",
    notes: "Major service inspection required"
  }
];

const mechanics = [
  {
    id: 1,
    name: "John Martinez",
    specialization: "Engine & Transmission",
    experience: "8 years",
    rating: 4.9,
    completedJobs: 1247,
    status: "available",
    avatar: "JM",
    skills: ["Engine Repair", "Transmission", "Diagnostics"],
    currentWorkload: 3,
    maxWorkload: 8,
    location: "Bay 1-3"
  },
  {
    id: 2,
    name: "Sarah Chen",
    specialization: "Electrical & Electronics",
    experience: "6 years",
    rating: 4.8,
    completedJobs: 892,
    status: "available",
    avatar: "SC",
    skills: ["Electrical Systems", "ECU Programming", "Diagnostics"],
    currentWorkload: 2,
    maxWorkload: 6,
    location: "Bay 4-5"
  },
  {
    id: 3,
    name: "Mike Thompson",
    specialization: "Brakes & Suspension",
    experience: "12 years",
    rating: 4.9,
    completedJobs: 1856,
    status: "busy",
    avatar: "MT",
    skills: ["Brake Systems", "Suspension", "Alignment"],
    currentWorkload: 7,
    maxWorkload: 8,
    location: "Bay 6-7"
  },
  {
    id: 4,
    name: "Lisa Rodriguez",
    specialization: "General Maintenance",
    experience: "5 years",
    rating: 4.7,
    completedJobs: 634,
    status: "available",
    avatar: "LR",
    skills: ["Oil Changes", "Tune-ups", "Inspections"],
    currentWorkload: 1,
    maxWorkload: 10,
    location: "Bay 8-10"
  },
  {
    id: 5,
    name: "David Kim",
    specialization: "Hybrid & Electric",
    experience: "4 years",
    rating: 4.8,
    completedJobs: 423,
    status: "available",
    avatar: "DK",
    skills: ["Hybrid Systems", "Electric Vehicles", "Battery Service"],
    currentWorkload: 2,
    maxWorkload: 5,
    location: "Bay 11-12"
  },
  {
    id: 6,
    name: "Alex Johnson",
    specialization: "Diesel & Heavy Duty",
    experience: "10 years",
    rating: 4.9,
    completedJobs: 1123,
    status: "on-break",
    avatar: "AJ",
    skills: ["Diesel Engines", "Heavy Duty", "Fleet Service"],
    currentWorkload: 4,
    maxWorkload: 6,
    location: "Bay 13-14"
  }
];

const Reservation = () => {
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMechanicsModalOpen, setIsMechanicsModalOpen] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [mechanicSearchTerm, setMechanicSearchTerm] = useState('');
  const [mechanicFilter, setMechanicFilter] = useState('all');

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getMechanicStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'busy':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'on-break':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMechanicStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4" />;
      case 'busy':
        return <XCircle className="w-4 h-4" />;
      case 'on-break':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getWorkloadPercentage = (current, max) => {
    return (current / max) * 100;
  };

  const getWorkloadColor = (percentage) => {
    if (percentage <= 50) return 'bg-green-500';
    if (percentage <= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const filteredReservations = reservations
    .filter(res => filter === 'all' || res.status === filter)
    .filter(res =>
      res.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const filteredMechanics = mechanics
    .filter(mechanic => mechanicFilter === 'all' || mechanic.status === mechanicFilter)
    .filter(mechanic =>
      mechanic.name.toLowerCase().includes(mechanicSearchTerm.toLowerCase()) ||
      mechanic.specialization.toLowerCase().includes(mechanicSearchTerm.toLowerCase()) ||
      mechanic.skills.some(skill => skill.toLowerCase().includes(mechanicSearchTerm.toLowerCase()))
    );

  const handleProcessService = () => {
    setIsModalOpen(false);
    setIsMechanicsModalOpen(true);
  };

  const handleAssignMechanic = () => {
    if (selectedMechanic && selectedReservation) {
      // Here you would typically make an API call to assign the mechanic
      console.log(`Assigned ${selectedMechanic.name} to ${selectedReservation.ticketNumber}`);
      setIsMechanicsModalOpen(false);
      setSelectedMechanic(null);
      setSelectedReservation(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-screen overflow-hidden flex flex-col">
      {/* Header + Filters */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold bg-custom-gradient bg-clip-text text-transparent">
            Service Reservations
          </h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reservations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64 bg-white shadow-sm"
              />
            </div>
            <Filter className="w-6 h-6 text-gray-500" />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2 overflow-x-auto pb-2 mb-4">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 ${
                filter === status
                  ? 'bg-custom-gradient text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {status === 'all' ? (
                <Filter className="w-4 h-4" />
              ) : (
                getStatusIcon(status)
              )}
              <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReservations.map((reservation) => (
            <div
              key={reservation.id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border border-gray-100"
              onClick={() => setSelectedReservation(reservation)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    <Ticket className="w-4 h-4" />
                    <span>{reservation.ticketNumber}</span>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 border ${getStatusColor(
                      reservation.status
                    )}`}
                  >
                    {getStatusIcon(reservation.status)}
                    {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {reservation.customerName}
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <Car className="w-5 h-5 mr-3 text-blue-500" />
                    <div>
                      <div className="font-medium">{reservation.vehicleModel}</div>
                      <div className="text-sm text-gray-500">{reservation.licensePlate}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <Tool className="w-4 h-4 mr-2 text-purple-500" />
                      <div className="text-sm">
                        <div className="font-medium">{reservation.currentMileage.toLocaleString()}</div>
                        <div className="text-gray-500">Current Miles</div>
                      </div>
                    </div>

                    <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-lg">
                      <Clock className="w-4 h-4 mr-2 text-green-500" />
                      <div className="text-sm">
                        <div className="font-medium">{reservation.serviceInterval.toLocaleString()}</div>
                        <div className="text-gray-500">Service At</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <Calendar className="w-4 h-4 mr-2 text-red-500" />
                    <div className="text-sm">
                      <div className="font-medium">
                        {new Date(reservation.nextServiceDue).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-gray-500">Service Due Date</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 italic">{reservation.notes}</p>
                </div>

                <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReservation(reservation);
                      setIsModalOpen(true);
                    }}
                    className="mt-4 w-full bg-custom-gradient text-white py-2.5 rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center justify-center space-x-2"
                  >
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
              </div>
            </div>
          ))}
        </div>

        {filteredReservations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-600">No reservations found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Reservation Details Modal */}
        {isModalOpen && selectedReservation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 text-black">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl transform transition-all duration-300">
              {/* Modal Header */}
              <div className="bg-custom-gradient text-white p-6 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Car className="w-8 h-8" />
                  <div>
                    <h3 className="text-2xl font-bold">{selectedReservation.vehicleModel}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-100">{selectedReservation.licensePlate}</span>
                      <span className="text-white/70">|</span>
                      <div className="flex items-center space-x-1 text-blue-100">
                        <Ticket className="w-4 h-4" />
                        <span>{selectedReservation.ticketNumber}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                    <h4 className="text-lg font-semibold flex items-center space-x-2">
                      <User className="w-5 h-5 text-blue-500" />
                      <span>Customer Information</span>
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{selectedReservation.customerName}</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>customer@example.com</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>+1 234 567 890</span>
                      </div>
                      <div className="flex items-center space-x-3 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>123 Street, City, Country</span>
                      </div>
                    </div>
                  </div>

                  {/* Service Details */}
                  <div className="bg-gray-50 p-6 rounded-xl space-y-4">
                    <h4 className="text-lg font-semibold flex items-center space-x-2">
                      <Wrench className="w-5 h-5 text-purple-500" />
                      <span>Service Details</span>
                    </h4>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Ticket Number</span>
                        <span className="font-semibold">{selectedReservation.ticketNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Current Mileage</span>
                        <span className="font-semibold">{selectedReservation.currentMileage.toLocaleString()} miles</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Service Interval</span>
                        <span className="font-semibold">{selectedReservation.serviceInterval.toLocaleString()} miles</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Last Service</span>
                        <span className="font-semibold">{selectedReservation.lastServiceDate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Next Service Due</span>
                        <span className="font-semibold">{selectedReservation.nextServiceDue}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mt-6 bg-gray-50 p-6 rounded-xl">
                  <h4 className="text-lg font-semibold mb-4">Service Notes</h4>
                  <p className="text-gray-600">{selectedReservation.notes}</p>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Close
                  </button>
                  <button 
                    onClick={handleProcessService}
                    className="px-6 py-2 bg-custom-gradient text-white rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center space-x-2"
                  >
                    <span>Process Service</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mechanics Selection Modal */}
        {isMechanicsModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-6xl max-h-[100vh] rounded-2xl shadow-2xl transform transition-all duration-300 flex flex-col">
      {/* Modal Header */}
      <div className="bg-custom-gradient text-white p-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Users className="w-8 h-8" />
          <div>
            <h3 className="text-2xl font-bold">Select Mechanic</h3>
            <p className="text-purple-100">Choose the best mechanic for this service</p>
          </div>
        </div>
        <button
          onClick={() => setIsMechanicsModalOpen(false)}
          className="text-white hover:bg-white/20 rounded-full p-2 transition-colors duration-200"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Search and Filter */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search mechanics..."
              value={mechanicSearchTerm}
              onChange={(e) => setMechanicSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2">
            {['all', 'available', 'busy', 'on-break'].map((status) => (
              <button
                key={status}
                onClick={() => setMechanicFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                  mechanicFilter === status
                    ? 'bg-custom-gradient text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {status !== 'all' && getMechanicStatusIcon(status)}
                <span>{status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMechanics.map((mechanic) => (
            <div
              key={mechanic.id}
              onClick={() => setSelectedMechanic(mechanic)}
              className={`bg-white rounded-xl border-2 p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                selectedMechanic?.id === mechanic.id
                  ? 'border-purple-500 bg-purple-50 shadow-lg'
                  : 'border-gray-200 hover:border-purple-300'
              }`}
            >
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {mechanic.avatar}
                  </div>
                </div>

                {/* Mechanic Info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{mechanic.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 border ${getMechanicStatusColor(mechanic.status)}`}>
                      {getMechanicStatusIcon(mechanic.status)}
                      <span>{mechanic.status.replace('-', ' ')}</span>
                    </span>
                  </div>

                  <p className="text-purple-600 font-medium mb-2">{mechanic.specialization}</p>
                  
                  <div className="flex items-center space-x-4 mb-3 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4" />
                      <span>{mechanic.experience}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>{mechanic.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <CheckSquare className="w-4 h-4" />
                      <span>{mechanic.completedJobs} jobs</span>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {mechanic.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Workload */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Current Workload</span>
                      <span>{mechanic.currentWorkload}/{mechanic.maxWorkload}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getWorkloadColor(getWorkloadPercentage(mechanic.currentWorkload, mechanic.maxWorkload))}`}
                        style={{ width: `${getWorkloadPercentage(mechanic.currentWorkload, mechanic.maxWorkload)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{mechanic.location}</span>
                  </div>
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedMechanic?.id === mechanic.id && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="bg-purple-600 text-white px-4 py-2 rounded-full flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">Selected</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredMechanics.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No mechanics found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Fixed Action Buttons */}
      <div className="p-6 border-t border-gray-200 flex justify-end space-x-4 bg-white sticky bottom-0">
        <button
          onClick={() => setIsMechanicsModalOpen(false)}
          className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors duration-200 font-medium"
        >
          Cancel
        </button>
        <button
          onClick={handleAssignMechanic}
          disabled={!selectedMechanic}
          className={`px-8 py-3 rounded-xl font-medium transition-all duration-200 flex items-center space-x-2 ${
            selectedMechanic
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span>Assign Mechanic</span>
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default Reservation;