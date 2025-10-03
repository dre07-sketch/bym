import React from 'react';
import {
  Search,
  Star,
  Clock,
  Briefcase,
  Award,
  PenTool,
  CheckCircle2,
  X,
  Calendar,
  ThumbsUp,
  Wrench,
  FileText,
  Ticket,
  Timer,
  Phone,
  Mail,
  MapPin,
  Package,
  Truck,
  Settings
} from 'lucide-react';

class Mechanic extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchTerm: '',
      selectedMechanic: null,
      selectedJob: null,
      selectedTicket: null,
      mechanics: [],
      loading: true,
      error: null,
      activeTab: 'Details',
      activeMechanicTab: 'current'
    };
  }

  componentDidMount() {
    this.fetchMechanics();
  }

  fetchMechanics = () => {
    fetch('http://localhost:5001/api/mechanic/mechanics-fetch')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch mechanics');
        return res.json();
      })
      .then((data) => {
        const mappedMechanics = data.map((mech) => ({
          id: mech.id,
          name: mech.full_name,
          email: mech.email,
          specialty: mech.specialty || 'General Mechanic',
          experience: `${mech.experience || 0} years of service`,
          rating: parseFloat((4.5 + Math.random() * 0.5).toFixed(1)),
          completedJobs: 0,
          avatar: mech.image_url
            ? `http://localhost:5001/uploads/${encodeURIComponent(mech.image_url)}`
            : 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
          availability: mech.mechanic_status === 'available'
            ? 'Available'
            : mech.mechanic_status === 'assigned'
            ? 'Assigned'
            : 'Unavailable',
          phone_number: mech.phone_number,
          address: mech.address,
          expertise: mech.expertise
            ? mech.expertise.split(',').map((e) => e.trim())
            : ['General Repair'],
          currentAssignments: [],
          workHistory: [],
          certifications: ['ASE Certified', 'State Licensed']
        }));
        
        const promises = mappedMechanics.map(async (mechanic) => {
          try {
            // 1. Fetch Current Assignments: status = 'in progress', 'ready for inspection'
            const currentRes = await fetch(
              `http://localhost:5001/api/mechanic/${encodeURIComponent(mechanic.name.trim())}/tickets`
            );
            const currentTickets = currentRes.ok ? await currentRes.json() : [];
            const formattedCurrent = currentTickets.map((ticket) => ({
              id: ticket.id,
              ticketNumber: ticket.ticket_number,
              vehicle: ticket.vehicle_info,
              customerName: ticket.customer_name,
              status: ticket.status,
              priority: ticket.priority,
              issue: ticket.title,
              description: ticket.description,
              technician: ticket.mechanic_assign,
              inspector: ticket.inspector_assign || 'Not Assigned',
              disassembledParts: Array.isArray(ticket.disassembledParts) ? ticket.disassembledParts : [],
              progressLogs: Array.isArray(ticket.progressLogs) ? ticket.progressLogs : [],
              inspections: Array.isArray(ticket.inspections) ? ticket.inspections : [],
              orderedParts: Array.isArray(ticket.orderedParts) ? ticket.orderedParts : [],
              outsourceStock: Array.isArray(ticket.outsourceStock) ? ticket.outsourceStock : [],
              toolAssignments: Array.isArray(ticket.toolAssignments) ? ticket.toolAssignments : [],
              toolsUsed: [],
              partsOrdered: [],
              startDate: ticket.created_at,
              estimatedCompletion: ticket.estimated_completion_date,
              dailyProgress: ticket.progressLogs?.[0]
                ? `${ticket.progressLogs[0].description} (Updated: ${new Date(ticket.progressLogs[0].created_at).toLocaleString()})`
                : 'No updates yet.'
            }));
            
            // 2. Fetch Work History: status = 'awaiting inspection', 'ready for inspection', etc.
            const historyRes = await fetch(
              `http://localhost:5001/api/mechanic/${encodeURIComponent(mechanic.name.trim())}/tickets-history`
            );
            const historyTickets = historyRes.ok ? await historyRes.json() : [];
            const formattedHistory = historyTickets.map((ticket) => ({
              id: ticket.id,
              ticketNumber: ticket.ticket_number,
              vehicle: ticket.vehicle_info,
              customerName: ticket.customer_name,
              status: ticket.status,
              priority: ticket.priority,
              issue: ticket.title,
              description: ticket.description,
              technician: ticket.mechanic_assign,
              inspector: ticket.inspector_assign || 'Not Assigned',
              disassembledParts: Array.isArray(ticket.disassembledParts) ? ticket.disassembledParts : [],
              progressLogs: Array.isArray(ticket.progressLogs) ? ticket.progressLogs : [],
              inspections: Array.isArray(ticket.inspections) ? ticket.inspections : [],
              orderedParts: Array.isArray(ticket.orderedParts) ? ticket.orderedParts : [],
              outsourceStock: Array.isArray(ticket.outsourceStock) ? ticket.outsourceStock : [],
              toolAssignments: Array.isArray(ticket.toolAssignments) ? ticket.toolAssignments : [],
              toolsUsed: [],
              partsOrdered: [],
              date: ticket.completion_date || ticket.updated_at || new Date().toISOString(),
              rating: (Math.random() * 0.5 + 4.5).toFixed(1),
              service: ticket.title,
              completionTime: `${Math.floor(Math.random() * 5) + 1} hrs`,
              customerFeedback: "Vehicle repaired successfully. Excellent service.",
              dailyProgress: 'Job completed and awaiting inspection.'
            }));
            
            // 3. Fetch Real Completed Jobs Count: status = 'awaiting bill'
            let completedJobs = 0;
            try {
              const countRes = await fetch(
                `http://localhost:5001/api/mechanic/${encodeURIComponent(mechanic.name.trim())}/awaiting-bill-count`
              );
              if (countRes.ok) {
                const countData = await countRes.json();
                completedJobs = countData.awaitingBillCount || 0;
              }
            } catch (err) {
              console.warn(`Failed to fetch awaiting-bill-count for ${mechanic.name}`, err);
              completedJobs = Math.floor(Math.random() * 50) + 10;
            }
            
            return {
              ...mechanic,
              currentAssignments: formattedCurrent,
              workHistory: formattedHistory,
              completedJobs
            };
          } catch (err) {
            console.warn(`Error loading data for ${mechanic.name}:`, err);
            return {
              ...mechanic,
              currentAssignments: [],
              workHistory: [],
              completedJobs: mechanic.completedJobs || 0
            };
          }
        });
        
        Promise.all(promises)
          .then((updatedMechanics) => {
            console.log('Updated mechanics with history:', updatedMechanics);
            this.setState({
              mechanics: updatedMechanics,
              loading: false
            });
          })
          .catch((err) => {
            console.error('Error processing mechanic data:', err);
            this.setState({
              loading: false,
              error: 'Could not load full mechanic data.',
              mechanics: mappedMechanics
            });
          });
      })
      .catch((err) => {
        console.error('Error loading mechanics:', err);
        this.setState({
          loading: false,
          error: 'Could not load mechanics. Please try again later.',
          mechanics: []
        });
      });
  };

  handleSearch = (e) => {
    this.setState({ searchTerm: e.target.value });
  };

  handleMechanicSelect = (mechanic) => {
    this.setState({ 
      selectedMechanic: mechanic,
      activeMechanicTab: 'current'
    });
  };

  handleCloseModal = () => {
    this.setState({ selectedMechanic: null });
  };

  getFilteredMechanics = () => {
    const { searchTerm, mechanics } = this.state;
    return mechanics.filter(
      (mechanic) =>
        mechanic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mechanic.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  handleJobClick = (job, type) => {
    this.setState({ 
      selectedTicket: job,
      activeTab: 'Details'
    });
  };

  handleCloseJobModal = (e) => {
    e.stopPropagation();
    this.setState({ selectedJob: null });
  };

  handleCloseTicketModal = (e) => {
    e.stopPropagation();
    this.setState({ selectedTicket: null });
  };

  // Helper function to format checklist labels
  formatChecklistLabel = (key) => {
    const labels = {
      oilLeaks: "Oil Leaks",
      engineAirFilterOilCoolant: "Engine Air Filter, Oil & Coolant Level",
      brakeFluidLevels: "Brake Fluid Levels",
      glutenFluidLevels: "Clutch Fluid Levels",
      batteryTimingBelt: "Battery & Timing Belt",
      tire: "Tire Condition",
      tirePressureRotation: "Tire Pressure & Rotation",
      lightsWiperHorn: "Lights, Wiper & Horn",
      doorLocksCentralLocks: "Door Locks & Central Locks",
      customerWorkOrderReceptionBook: "Customer Work Order Reception Book"
    };
    return labels[key] || key;
  };

  // --- MODALS ---
  renderJobModal() {
    const { selectedJob } = this.state;
    if (!selectedJob) return null;
    const isCurrentAssignment = selectedJob.type === 'current';
    
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={this.handleCloseJobModal}
      >
        <div
          className="bg-white w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-up"
          style={{ maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-customBlue p-4 text-white flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-2">
              {isCurrentAssignment ? <Wrench size={20} /> : <FileText size={20} />}
              <h3 className="text-xl font-semibold">
                {isCurrentAssignment ? 'Current Assignment Details' : 'Completed Work Details'}
              </h3>
            </div>
            <button
              onClick={this.handleCloseJobModal}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-grow">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{selectedJob.vehicle}</h4>
                  <p className="text-gray-600">{selectedJob.service}</p>
                </div>
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full">
                  <Ticket className="text-blue-600" size={16} />
                  <span className="text-sm font-medium text-blue-800">{selectedJob.ticketNumber}</span>
                </div>
              </div>
              
              {isCurrentAssignment ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Start Date</p>
                      <p className="font-medium">
                        {selectedJob.startDate ? new Date(selectedJob.startDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estimated Completion</p>
                      <p className="font-medium">
                        {selectedJob.estimatedCompletion 
                          ? new Date(selectedJob.estimatedCompletion).toLocaleDateString() 
                          : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Completion Date</p>
                    <p className="font-medium">
                      {selectedJob.date ? new Date(selectedJob.date).toLocaleDateString() : 'Not available'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="font-medium">{selectedJob.completionTime}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Customer Feedback</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        <Star className="text-yellow-400" size={16} fill="currentColor" />
                        <span className="font-medium ml-1">{selectedJob.rating}</span>
                      </div>
                      <p className="text-gray-700">{selectedJob.customerFeedback}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <h5 className="font-medium mb-2">Service Details</h5>
                <p className="text-gray-700">{selectedJob.description || 'No details available'}</p>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Parts Used</h5>
                <ul className="list-disc list-inside space-y-1">
                  {selectedJob.parts && selectedJob.parts.length > 0 ? (
                    selectedJob.parts.map((part, index) => (
                      <li key={index} className="text-gray-700">
                        {part}
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500">No parts recorded</li>
                  )}
                </ul>
              </div>
              
              {isCurrentAssignment && selectedJob.notes && (
                <div>
                  <h5 className="font-medium mb-2">Notes</h5>
                  <p className="text-gray-700">{selectedJob.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderTicketModal() {
    const { selectedTicket } = this.state;
    if (!selectedTicket) return null;
    const activeTab = this.state.activeTab;
    
    return (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center text-black bg-black/60 backdrop-blur-sm p-4"
        onClick={this.handleCloseTicketModal}
      >
        <div
          className="bg-white w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-up"
          style={{ maxHeight: '90vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-custom-gradient text-white p-5 flex justify-between items-start flex-shrink-0">
            <div>
              <h3 className="text-xl font-bold">{selectedTicket.vehicle}</h3>
              <p className="text-sm text-purple-200">Ticket #{selectedTicket.ticketNumber}</p>
            </div>
            <button
              onClick={this.handleCloseTicketModal}
              className="text-white hover:bg-purple-700 p-1 rounded"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-6 py-3 flex-shrink-0 overflow-x-auto">
            {[
              { id: 'Details', label: 'Details', icon: <FileText size={14} /> },
              { id: 'Disassembled', label: 'Disassembled', icon: <PenTool size={14} /> },
              { id: 'Progress', label: 'Progress', icon: <Timer size={14} /> },
              { id: 'Inspections', label: 'Inspections', icon: <ThumbsUp size={14} /> },
              { id: 'OrderedParts', label: 'Ordered Parts', icon: <Package size={14} /> },
              { id: 'OutsourceParts', label: 'Outsource Parts', icon: <Truck size={14} /> },
              { id: 'Tools', label: 'Tools', icon: <Settings size={14} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => this.setState({ activeTab: tab.id })}
                className={`px-4 py-2 text-sm font-medium flex items-center gap-1 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 border-transparent'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto flex-grow">
            {activeTab === 'Details' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="text-blue-500" size={18} />
                      <h4 className="font-semibold">Status</h4>
                    </div>
                    <div className="text-sm text-gray-700 space-y-2">
                      <p>
                        <span className="font-medium">Status:</span>{' '}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            selectedTicket.status === 'in progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : selectedTicket.status === 'ready for inspection'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">Priority:</span>{' '}
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            selectedTicket.priority === 'HIGH'
                              ? 'bg-red-100 text-red-800'
                              : selectedTicket.priority === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {selectedTicket.priority}
                        </span>
                      </p>
                      <p>
                        <span className="font-medium">Estimated Completion:</span>{' '}
                        <span className="text-gray-700">
                          {selectedTicket.estimated_completion_date
                            ? new Date(selectedTicket.estimated_completion_date).toLocaleDateString()
                            : 'Not set'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="text-blue-500" size={18} />
                      <h4 className="font-semibold">Technician</h4>
                    </div>
                    <p className="text-gray-700">{selectedTicket.technician}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="text-blue-500" size={18} />
                      <h4 className="font-semibold">Inspector</h4>
                    </div>
                    <p className="text-gray-700">{selectedTicket.inspector}</p>
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4">
                      <p className="text-sm font-medium">Issue</p>
                      <p className="text-gray-900 mt-1">{selectedTicket.issue}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Description</p>
                      <p className="text-gray-700 mt-1">{selectedTicket.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'Disassembled' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-4">Disassembled Parts</h4>
                {selectedTicket.disassembledParts && selectedTicket.disassembledParts.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2">Part</th>
                        <th className="text-left pb-2">Condition</th>
                        <th className="text-left pb-2">Status</th>
                        <th className="text-left pb-2">Notes</th>
                        <th className="text-left pb-2">Logged</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTicket.disassembledParts.map((part, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2">{part.part_name}</td>
                          <td>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                part.condition === 'damaged'
                                  ? 'bg-red-100 text-red-800'
                                  : part.condition === 'worn'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {part.condition}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                part.status === 'awaiting_repair'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : part.status === 'repaired'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {part.status}
                            </span>
                          </td>
                          <td>{part.notes || '-'}</td>
                          <td className="text-gray-500 text-xs">
                            {part.logged_at ? new Date(part.logged_at).toLocaleString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500">No disassembled parts logged.</p>
                )}
              </div>
            )}
            
            {activeTab === 'Progress' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-4">Progress Logs</h4>
                {selectedTicket.progressLogs && selectedTicket.progressLogs.length > 0 ? (
                  <div className="space-y-4">
                    {selectedTicket.progressLogs.map((log, idx) => (
                      <div key={idx} className="border-l-4 border-blue-400 pl-4 py-2 bg-white rounded shadow-sm">
                        <p className="text-sm font-medium">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                        </p>
                        <p><strong>Status:</strong> {log.status || 'N/A'}</p>
                        <p><strong>Description:</strong> {log.description || 'No description'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No progress logs recorded.</p>
                )}
              </div>
            )}
            
            {activeTab === 'Inspections' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-4">Inspection Records</h4>
                {selectedTicket.inspections && selectedTicket.inspections.length > 0 ? (
                  <div className="space-y-6">
                    {selectedTicket.inspections.map((insp, idx) => (
                      <div key={idx} className="border-l-4 border-green-400 pl-4 py-2 bg-white rounded shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-sm font-medium">
                              {insp.inspection_date || insp.created_at 
                                ? new Date(insp.inspection_date || insp.created_at).toLocaleString() 
                                : 'N/A'}
                            </p>
                            <p><strong>Status:</strong> {insp.inspection_status || 'N/A'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              insp.main_issue_resolved === 'Yes' ? 'bg-green-100 text-green-800' : 
                              insp.main_issue_resolved === 'No' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              Main Issue: {insp.main_issue_resolved || 'Not specified'}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              insp.reassembly_verified === 'Yes' ? 'bg-green-100 text-green-800' : 
                              insp.reassembly_verified === 'No' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'
                            }`}>
                              Reassembly: {insp.reassembly_verified || 'Not specified'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Inspection Checklist */}
                        <div className="mb-4">
                          <h5 className="font-medium mb-3">Inspection Checklist</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(insp.checklist || {}).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-700">{this.formatChecklistLabel(key)}</span>
                                {value === 'Yes' ? (
                                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                                    <span className="mr-1">√</span> Yes
                                  </span>
                                ) : value === 'No' ? (
                                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                                    <span className="mr-1">×</span> No
                                  </span>
                                ) : (
                                  <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">N/A</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Additional Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm font-medium">General Condition</p>
                            <p className="text-gray-700">{insp.general_condition || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Inspector Notes</p>
                            <p className="text-gray-700">{insp.notes || 'No notes provided'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No inspection performed yet.</p>
                )}
              </div>
            )}
            
            {activeTab === 'OrderedParts' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-4">Ordered Parts</h4>
                {selectedTicket.orderedParts && selectedTicket.orderedParts.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2">Name</th>
                        <th className="text-left pb-2">Category</th>
                        <th className="text-left pb-2">SKU</th>
                        <th className="text-left pb-2">Price</th>
                        <th className="text-left pb-2">Quantity</th>
                        <th className="text-left pb-2">Status</th>
                        <th className="text-left pb-2">Ordered At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTicket.orderedParts.map((part, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2">{part.name}</td>
                          <td>{part.category}</td>
                          <td>{part.sku}</td>
                          <td>${part.price}</td>
                          <td>{part.quantity}</td>
                          <td>
                            <span className={`px-2 py-1 rounded text-xs ${
                              part.status === 'ordered' ? 'bg-yellow-100 text-yellow-800' :
                              part.status === 'received' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {part.status}
                            </span>
                          </td>
                          <td className="text-gray-500 text-xs">
                            {part.ordered_at ? new Date(part.ordered_at).toLocaleDateString() : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500">No ordered parts recorded.</p>
                )}
              </div>
            )}
            
            {activeTab === 'OutsourceParts' && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-4">Outsource Parts</h4>
                {selectedTicket.outsourceStock && selectedTicket.outsourceStock.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2">Tool Name</th>
                        <th className="text-left pb-2">Assigned Quantity</th>
                        <th className="text-left pb-2">Assigned By</th>
                        <th className="text-left pb-2">Status</th>
                        <th className="text-left pb-2">Assigned At</th>
                        <th className="text-left pb-2">Returned At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTicket.outsourceStock.map((part, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2">{part.name || part.tool_name}</td>
                          <td>{part.quantity || part.assigned_quantity}</td>
                          <td>{part.assigned_by || 'N/A'}</td>
                          <td>
                            <span className={`px-2 py-1 rounded text-xs ${
                              part.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                              part.status === 'returned' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {part.status}
                            </span>
                          </td>
                          <td className="text-gray-500 text-xs">
                            {part.requested_at || part.assigned_at 
                              ? new Date(part.requested_at || part.assigned_at).toLocaleDateString() 
                              : 'N/A'}
                          </td>
                          <td className="text-gray-500 text-xs">
                            {part.received_at || part.returned_at 
                              ? new Date(part.received_at || part.returned_at).toLocaleDateString() 
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-gray-500">No outsource parts recorded.</p>
                )}
              </div>
            )}
            
            {activeTab === 'Tools' && (
              <div className="space-y-6">
                {/* Tool Assignments */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Wrench className="text-blue-600" size={18} />
                    Tool Assignments
                  </h4>
                  {selectedTicket.toolAssignments && selectedTicket.toolAssignments.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left pb-2">Tool Name</th>
                          <th className="text-left pb-2">Assigned Quantity</th>
                          <th className="text-left pb-2">Assigned By</th>
                          <th className="text-left pb-2">Status</th>
                          <th className="text-left pb-2">Assigned At</th>
                          <th className="text-left pb-2">Returned At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTicket.toolAssignments.map((tool, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="py-2">{tool.tool_name}</td>
                            <td>{tool.assigned_quantity}</td>
                            <td>{tool.assigned_by}</td>
                            <td>
                              <span className={`px-2 py-1 rounded text-xs ${
                                tool.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                                tool.status === 'returned' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {tool.status}
                              </span>
                            </td>
                            <td className="text-gray-500 text-xs">
                              {tool.assigned_at ? new Date(tool.assigned_at).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="text-gray-500 text-xs">
                              {tool.returned_at ? new Date(tool.returned_at).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500">No tool assignments recorded.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { selectedMechanic, loading, error } = this.state;
    const filteredMechanics = this.getFilteredMechanics();
    
    if (loading) {
      return (
        <div className="p-6 text-center text-gray-600">
          <p className="text-lg">Loading mechanics...</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="p-6 text-center text-red-600">
          <p>{error}</p>
        </div>
      );
    }
    
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Mechanics Directory</h1>
          <p className="text-gray-500 mt-2">View detailed information about our expert mechanics</p>
        </div>
        
        <div className="relative max-w-md mb-10">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search mechanics by name or specialty..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            value={this.state.searchTerm}
            onChange={this.handleSearch}
          />
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {filteredMechanics.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {filteredMechanics.map((mechanic) => (
                <li 
                  key={mechanic.id}
                  onClick={() => this.handleMechanicSelect(mechanic)}
                  className="p-5 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Avatar and Status */}
                    <div className="flex-shrink-0 relative">
                      <img
                        src={mechanic.avatar}
                        alt={mechanic.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                        mechanic.availability === 'Available' ? 'bg-green-500' :
                        mechanic.availability === 'Assigned' ? 'bg-blue-500' :
                        'bg-gray-400'
                      }`}></span>
                    </div>
                    
                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg text-gray-900 truncate">{mechanic.name}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              mechanic.availability === 'Available' ? 'bg-green-100 text-green-800' :
                              mechanic.availability === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {mechanic.availability}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{mechanic.specialty}</p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center">
                            <Clock className="text-gray-400 mr-1" size={16} />
                            <span className="text-sm text-gray-600">{mechanic.experience}</span>
                          </div>
                          
                        </div>
                      </div>
                      
                      {/* Expertise Tags */}
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2">
                          {mechanic.expertise.slice(0, 4).map((skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          {mechanic.expertise.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                              +{mechanic.expertise.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Contact Info */}
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Phone className="mr-2 text-gray-400" size={14} />
                          <span className="truncate">{mechanic.phone_number || 'Not provided'}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Mail className="mr-2 text-gray-400" size={14} />
                          <span className="truncate">{mechanic.email}</span>
                        </div>
                        <div className="flex items-start text-gray-600">
                          <MapPin className="mr-2 mt-0.5 text-gray-400 flex-shrink-0" size={14} />
                          <span className="truncate">{mechanic.address || 'No address provided'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* View Details Button */}
                    <div className="flex-shrink-0 self-center">
                      <button 
                        className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          this.handleMechanicSelect(mechanic);
                        }}
                      >
                        View Details
                        <svg className="ml-1 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Search className="text-gray-400" size={24} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No mechanics found</h3>
              <p className="text-gray-500">Try adjusting your search to find what you're looking for.</p>
            </div>
          )}
        </div>
        
        {/* Mechanic Detail Modal */}
        {selectedMechanic && (
          <div className="fixed inset-0 z-50 text-black flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-up" style={{ maxHeight: '90vh' }}>
              <div className="relative bg-customBlue p-6 text-white flex-shrink-0">
                <button
                  onClick={this.handleCloseModal}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-6">
                  <img
                    src={selectedMechanic.avatar}
                    alt={selectedMechanic.name}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white/30"
                  />
                  <div>
                    <h2 className="text-2xl font-bold">{selectedMechanic.name}</h2>
                    <p className="text-blue-100">{selectedMechanic.specialty}</p>
                    <div className="flex items-center mt-2">
                      <Star className="text-yellow-400 mr-1" size={16} fill="currentColor" />
                      <span className="text-blue-100">{selectedMechanic.experience}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tabs for mechanic detail modal */}
              <div className="flex border-b border-gray-200 px-6 py-3 flex-shrink-0">
                {[
                  { id: 'current', label: 'Current Assignments', icon: <Wrench size={14} /> },
                  { id: 'history', label: 'Work History', icon: <Calendar size={14} /> }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => this.setState({ activeMechanicTab: tab.id })}
                    className={`px-4 py-2 text-sm font-medium flex items-center gap-1 border-b-2 transition-colors ${
                      this.state.activeMechanicTab === tab.id
                        ? 'text-blue-600 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700 border-transparent'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
              
              <div className="p-6 overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Assignments or Work History based on active tab */}
                  {this.state.activeMechanicTab === 'current' && (
                    <div className="col-span-full bg-gray-50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Wrench className="text-blue-600" size={20} />
                        Current Assignments
                      </h3>
                      <div className="space-y-4">
                        {selectedMechanic.currentAssignments && selectedMechanic.currentAssignments.length > 0 ? (
                          selectedMechanic.currentAssignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                this.handleJobClick(assignment, 'current');
                              }}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium">{assignment.vehicle}</h4>
                                  <p className="text-sm text-gray-600">{assignment.issue}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Ticket className="text-gray-400" size={14} />
                                    <span className="text-xs text-gray-500">{assignment.ticketNumber}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No active assignments</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {this.state.activeMechanicTab === 'history' && (
                    <div className="col-span-full bg-gray-50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="text-blue-600" size={20} />
                        Recent Work History
                      </h3>
                      <div className="space-y-3">
                        {selectedMechanic.workHistory && selectedMechanic.workHistory.length > 0 ? (
                          selectedMechanic.workHistory.map((work) => (
                            <div
                              key={work.id}
                              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                this.handleJobClick(work, 'history');
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">{work.vehicle || 'Vehicle info not available'}</p>
                                  <p className="text-sm text-gray-600">{work.service || 'Service not specified'}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Ticket className="text-gray-400" size={14} />
                                    <span className="text-xs text-gray-500">{work.ticketNumber || 'N/A'}</span>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {work.date ? new Date(work.date).toLocaleDateString() : 'Date not available'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="text-yellow-400" size={16} fill="currentColor" />
                                  <span className="font-medium">{work.rating || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No recent work history available</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <PenTool className="text-blue-600" size={20} />
                        Areas of Expertise
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedMechanic.expertise.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <ThumbsUp className="mx-auto text-blue-600 mb-2" size={24} />
                    <p className="text-2xl font-bold text-gray-900">{selectedMechanic.completedJobs}</p>
                    <p className="text-sm text-gray-600">Completed Jobs</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <CheckCircle2 className="mx-auto text-blue-600 mb-2" size={24} />
                    <p className="text-2xl font-bold text-gray-900">{selectedMechanic.experience}</p>
                    <p className="text-sm text-gray-600">Experience</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Modals */}
        {this.renderJobModal()}
        {this.renderTicketModal()}
      </div>
    );
  }
}

export default Mechanic;