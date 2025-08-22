import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Car, 
  Wrench, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Eye,
  CheckSquare,
  ChevronDown,
  MapPin,
  Phone,
  X,
  FolderOpen,
  Clock,
  AlertCircle,
  Check
} from 'lucide-react';

const CompletedReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showParts, setShowParts] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [filterLicense, setFilterLicense] = useState('');
  const [filterTicket, setFilterTicket] = useState('');
  const [filterStatus, setFilterStatus] = useState(''); // '' = all, including 'completed' & 'awaiting bill'

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      // You can add logic here if needed (e.g., analytics)
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm, filterLicense, filterTicket, priorityFilter, dateFilter, filterStatus]);

  // Fetch reports
  useEffect(() => {
    const controller = new AbortController();

    const fetchReports = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/inspection-endpoint/completed-with-parts', {
          signal: controller.signal
        });
        if (!response.ok) throw new Error('Failed to fetch reports');
        const data = await response.json();
        setReports(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching completed reports:', err);
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReports();

    return () => controller.abort();
  }, []);

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString('en-US');
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const matchesSearch = 
      report.mechanicName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.licensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.issueDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;

    const matchesLicense = !filterLicense || 
      report.licensePlate?.toLowerCase().includes(filterLicense.toLowerCase());

    const matchesTicket = !filterTicket || 
      report.ticketNumber?.toLowerCase().includes(filterTicket.toLowerCase());

    const matchesStatus = !filterStatus || report.status === filterStatus;

    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;

    let matchesDate = true;
    if (dateFilter !== 'all' && report.finishedDate) {
      const reportDate = new Date(report.finishedDate);
      const today = new Date();
      const daysDiff = Math.floor((today - reportDate) / (1000 * 60 * 60 * 24));

      switch (dateFilter) {
        case 'week':  matchesDate = daysDiff <= 7; break;
        case 'month': matchesDate = daysDiff <= 30; break;
        case 'quarter': matchesDate = daysDiff <= 90; break;
        default: matchesDate = true;
      }
    }

    return matchesSearch && matchesLicense && matchesTicket && matchesStatus && matchesPriority && matchesDate;
  });

  // Priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-900 border-gray-200';
    }
  };

  // Handle report click
  const handleReportClick = (report) => {
    setSelectedReport(report);
    setShowModal(true);
    setShowParts(false);
  };

  // Prevent background scroll
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Clock className="w-12 h-12 text-purple-500 mx-auto animate-spin" />
          <p className="mt-4 text-lg text-gray-700">Loading completed reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="text-center p-6 bg-white rounded-lg shadow">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="mt-4 text-lg font-semibold text-red-700">Error Loading Reports</h3>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-h-screen overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 h-24 flex items-center">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Completed Reports</h1>
              <p className="text-sm text-gray-500">{filteredReports.length} report(s) found</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Toggle */}
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>

          {showFilters && (
            <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
                  <input
                    type="text"
                    placeholder="Search plate..."
                    value={filterLicense}
                    onChange={(e) => setFilterLicense(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Number</label>
                  <input
                    type="text"
                    placeholder="Search ticket..."
                    value={filterTicket}
                    onChange={(e) => setFilterTicket(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="all">All Time</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="quarter">Last 90 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="completed">Completed</option>
                    <option value="awaiting bill">Awaiting Bill</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || filterLicense || filterTicket || priorityFilter !== 'all' || dateFilter !== 'all' || filterStatus) && (
                <div>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterLicense('');
                      setFilterTicket('');
                      setPriorityFilter('all');
                      setDateFilter('all');
                      setFilterStatus('');
                    }}
                    className="text-sm text-purple-600 hover:text-purple-800"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {filteredReports.length > 0 ? (
            filteredReports.map((report) => (
              <div
                key={report.ticketNumber}
                onClick={() => handleReportClick(report)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleReportClick(report);
                }}
                role="button"
                tabIndex={0}
                className="bg-white rounded-lg shadow-md border border-gray-200 p-4 hover:shadow-lg hover:border-purple-300 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 font-sans">#{report.ticketNumber}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{report.vehicleModel}</span>
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          {report.licensePlate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                      {report.priority?.toUpperCase()}
                    </span>

                    {report.status === 'completed' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>COMPLETED</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>AWAITING BILL</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{report.clientName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{report.mechanicName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-purple-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(report.assignedDate)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500">Try adjusting your filters or check back later.</p>
              {(searchTerm || filterLicense || filterTicket || priorityFilter !== 'all' || dateFilter !== 'all' || filterStatus) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterLicense('');
                    setFilterTicket('');
                    setPriorityFilter('all');
                    setDateFilter('all');
                    setFilterStatus('');
                  }}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Details Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 text-black">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-custom-gradient text-white p-5 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Inspection Report</h2>
                    <div className="flex items-center gap-2 text-purple-100 text-sm">
                      <span>ID: {selectedReport.service_ticket_id}</span>
                      <span>•</span>
                      <span>Ticket: {selectedReport.ticketNumber}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                        selectedReport.status === 'completed'
                          ? 'bg-green-600'
                          : 'bg-yellow-600'
                      }`}>
                        {selectedReport.status === 'completed' ? 'DONE' : 'BILLING'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Vehicle and Client Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Car className="w-4 h-4 text-purple-600" />
                    Vehicle Info
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Ticket:</span> {selectedReport.ticketNumber}</p>
                    <p><span className="text-gray-500">Plate:</span> {selectedReport.licensePlate}</p>
                    <p><span className="text-gray-500">Model:</span> {selectedReport.vehicleModel}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-purple-600" />
                    People Involved
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-500">Client:</span> {selectedReport.clientName}</p>
                    <p><span className="text-gray-500">Mechanic:</span> {selectedReport.mechanicName}</p>
                  </div>
                </div>
              </div>

              {/* Issue Description */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Issue Found
                </h3>
                <p className="text-sm text-red-800">{selectedReport.issueDescription}</p>
              </div>

              {/* Dates */}
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Assigned: {formatDate(selectedReport.assignedDate)}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Completed: {formatDate(selectedReport.finishedDate)}</span>
                </div>
              </div>

              {/* Inspection Results */}
              <div className="border border-purple-100 rounded-lg p-4 bg-purple-50">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-purple-600" />
                  Inspection Results
                </h3>

                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Main Issue Resolved</h4>
                    <span className={`font-medium ${selectedReport.mainIssueResolved ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedReport.mainIssueResolved ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowParts(!showParts)}
                  >
                    <h4 className="font-medium text-gray-900">Reassembly Verified</h4>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${selectedReport.reassemblyVerified ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedReport.reassemblyVerified ? 'Yes' : 'No'}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showParts ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {showParts && Array.isArray(selectedReport.replacedParts) && selectedReport.replacedParts.length > 0 ? (
                    <div className="mt-3 space-y-2 pl-2 border-l-2 border-gray-200">
                      {selectedReport.replacedParts.map((part, index) => (
                        <div key={index} className="bg-white p-2 rounded border border-gray-100 text-sm">
                          <div className="flex justify-between">
                            <strong>{part.partName}</strong>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              part.status === 'replaced' ? 'bg-green-100 text-green-800' :
                              part.status === 'inspected' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {part.status}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-1">Condition: {part.condition}</p>
                          {part.notes && <p className="text-gray-500 italic mt-1">Note: {part.notes}</p>}
                        </div>
                      ))}
                    </div>
                  ) : showParts && (
                    <p className="text-gray-500 text-sm mt-2 pl-2">No parts recorded for this inspection.</p>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">General Condition</h4>
                    <span className={`font-medium ${selectedReport.generalCondition ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedReport.generalCondition ? 'Good' : 'Needs Attention'}
                    </span>
                  </div>
                </div>

                {selectedReport.notes && (
                  <div>
                    <label className="block font-medium text-gray-900 mb-2">Inspector Notes</label>
                    <div className="bg-white rounded-md p-3 text-sm border border-gray-200">
                      {selectedReport.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedReports;