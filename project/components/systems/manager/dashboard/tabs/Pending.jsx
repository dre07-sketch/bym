import React, { useState, useEffect } from "react";
const Pending = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showMechanicModal, setShowMechanicModal] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [mechanicSearchTerm, setMechanicSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [mechanicsLoading, setMechanicsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mechanics, setMechanics] = useState([]);
  const [showLimitPopup, setShowLimitPopup] = useState(false);
  const [limitMessage, setLimitMessage] = useState("");
  
  // ✅ Fetch pending service tickets
  useEffect(() => {
    const fetchPendingTickets = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/process/pending");
        if (!response.ok) throw new Error("Failed to fetch pending tickets");
        const data = await response.json();
        const formatted = data.map((ticket) => {
          const vehicle = (ticket.make && ticket.model && ticket.year)
            ? `${ticket.make} ${ticket.model} ${ticket.year}`
            : ticket.vehicle_info || "Unknown Vehicle";
          return {
            id: ticket.id,
            ticketNumber: ticket.ticket_number || "N/A",
            customerName: ticket.customer_name || "Unknown Customer",
            vehicle,
            licensePlate: ticket.license_plate || "N/A",
            issue: ticket.title || "No issue specified",
            email: ticket.customer_email || "No email",
            phone: ticket.customer_phone || "No phone",
            dateRequested: ticket.created_at || new Date().toISOString(),
            description: ticket.description || "No additional details provided.",
            vehicleImage: ticket.image || null,
          };
        });
        setPendingRequests(formatted);
      } catch (err) {
        console.error("Error loading pending requests:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPendingTickets();
  }, []);
  
  // ✅ Fetch mechanics
  useEffect(() => {
    const fetchMechanics = async () => {
      try {
        const response = await fetch("http://localhost:5001/api/mechanic/mechanics-fetch");
        if (!response.ok) throw new Error("Failed to fetch mechanics");
        const data = await response.json();
        console.log("Mechanics API response:", data); // Debug log
        
        const formatted = data.map((m) => ({
          id: m.id,
          name: m.full_name || "Unnamed Mechanic",
          email: m.email || "No email",
          specialty: m.specialty || m.expertise || "General Repair",
          experience: m.experience || "N/A",
          activeTickets: parseInt(m.active_tickets) || 0, // Ensure it's a number
          availability: m.mechanic_status,
          avatar: m.image_url
            ? `http://localhost:5001/uploads/${m.image_url}`
            : 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
          status: m.mechanic_status,
        }));
        
        console.log("Formatted mechanics:", formatted); // Debug log
        setMechanics(formatted);
      } catch (err) {
        console.error("Error fetching mechanics:", err);
        setMechanics([]);
      } finally {
        setMechanicsLoading(false);
      }
    };
    fetchMechanics();
  }, []);
  
  // ✅ Fetch full ticket details
  const fetchTicketDetails = async (ticketNumber) => {
    try {
      const response = await fetch(`http://localhost:5001/api/process/details/${ticketNumber}`);
      if (!response.ok) throw new Error("Ticket not found");
      const ticket = await response.json();
      const vehicle = (ticket.make && ticket.model && ticket.year)
        ? `${ticket.make} ${ticket.model} ${ticket.year}`
        : ticket.vehicle_info || "Unknown Vehicle";
      return {
        id: ticket.id,
        ticketNumber: ticket.ticket_number || "N/A",
        customerName: ticket.customer_name || "Unknown Customer",
        vehicle,
        licensePlate: ticket.license_plate || "N/A",
        issue: ticket.title || "No issue specified",
        email: ticket.customer_email || "No email",
        phone: ticket.customer_phone || "No phone",
        dateRequested: ticket.created_at || new Date().toISOString(),
        description: ticket.description || "No additional details provided.",
        vehicleImage: ticket.image || null,
      };
    } catch (err) {
      console.error("Error fetching ticket details:", err);
      alert("Could not load full ticket details.");
      return null;
    }
  };
  
  const openRequestDetails = async (request) => {
    const fullData = await fetchTicketDetails(request.ticketNumber);
    if (fullData) {
      setSelectedRequest(fullData);
    }
  };
  
  // ✅ Assign mechanic using POST /mechanics-status
  const handleAssignMechanic = async (requestId, mechanicId) => {
    if (!mechanicId) return;
    try {
      const response = await fetch("http://localhost:5001/api/mechanic/mechanics-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: requestId, mechanicId }),
      });
      
      // ✅ Handle HTML response (e.g. 404 page)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        alert("❌ Server returned an error page. Check console.");
        return;
      }
      
      const result = await response.json();
      if (response.ok) {
        alert(`✅ ${result.message}`);
        setPendingRequests((prev) => prev.filter((req) => req.id !== requestId));
      } else {
        if (result.message && result.message.includes("already has 5 active assignments")) {
          setLimitMessage(result.message);
          setShowLimitPopup(true);
        } else {
          alert(`❌ Assignment failed: ${result.message}`);
        }
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("⚠️ Failed to connect to server. Is the backend running?");
    } finally {
      setSelectedRequest(null);
      setShowMechanicModal(false);
      setSelectedMechanic(null);
      setMechanicSearchTerm("");
    }
  };
  
  // ✅ Filter requests
  const filteredRequests = pendingRequests.filter((req) => {
    const customer = (req.customerName ?? "").toLowerCase();
    const vehicle = (req.vehicle ?? "").toLowerCase();
    const ticket = (req.ticketNumber ?? "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return customer.includes(term) || vehicle.includes(term) || ticket.includes(term);
  });
  
  // ✅ Filter mechanics
  const filteredMechanics = (mechanics || []).filter((m) => {
    const name = (m.name ?? "").toLowerCase();
    const specialty = (m.specialty ?? "").toLowerCase();
    const status = (m.status ?? "").toLowerCase();
    const term = mechanicSearchTerm.toLowerCase();
    return name.includes(term) || specialty.includes(term) || status.includes(term);
  });
  
  // ✅ Loading
  if (loading || mechanicsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-xl text-gray-600">Loading repair requests and mechanics...</p>
      </div>
    );
  }
  
  // ✅ Error
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-xl">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen relative">
      <h1 className="text-3xl font-semibold mb-6 text-black drop-shadow-sm">
        Pending Repair Requests
      </h1>
      <input
        type="text"
        placeholder="Search by ticket number, customer or vehicle..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-6 w-full max-w-md p-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      {filteredRequests.length === 0 ? (
        <p className="text-gray-600 text-center mt-20 text-xl font-medium">
          No pending repair requests found.
        </p>
      ) : (
        <ul className="space-y-3">
          {filteredRequests.map((request) => (
            <li
              key={request.id}
              onClick={() => openRequestDetails(request)}
              className="bg-white rounded-lg shadow-sm p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3
                 transition-transform duration-200 ease-in-out hover:scale-[1.015] hover:shadow-md cursor-pointer max-w-5xl mx-auto"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-600">{request.ticketNumber}</span>
                  <h2 className="text-lg font-medium text-black truncate max-w-xs">
                    {request.customerName}
                  </h2>
                </div>
                <p className="text-gray-500 font-semibold mt-0.5 text-sm">
                  {request.vehicle} <span className="mx-1 text-gray-300">•</span> {request.licensePlate}
                </p>
                <p
                  className="mt-1 text-gray-500 italic text-sm max-w-sm truncate"
                  title={request.issue}
                >
                  Issue: {request.issue}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openRequestDetails(request).then(() => {
                    setShowMechanicModal(true);
                  });
                }}
                className="bg-blue-600 text-white font-semibold rounded-md px-4 py-1.5 shadow
                   hover:bg-blue-700 hover:shadow-md hover:scale-105 transition-transform duration-200"
              >
                Assign
              </button>
            </li>
          ))}
        </ul>
      )}
      
      {/* Request Details Modal */}
      {selectedRequest && !showMechanicModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full p-8 relative animate-fade-in-up overflow-auto max-h-[90vh]">
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition text-4xl font-bold leading-none"
            >
              &times;
            </button>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-4xl font-semibold text-black drop-shadow-sm">
                {selectedRequest.customerName}
              </h2>
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold">
                {selectedRequest.ticketNumber}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4 border-r border-gray-200 pr-6 text-gray-700 font-medium">
                <p><span className="font-semibold text-black">Vehicle:</span> {selectedRequest.vehicle}</p>
                <p><span className="font-semibold text-black">License Plate:</span> {selectedRequest.licensePlate}</p>
                <p><span className="font-semibold text-black">Email:</span> {selectedRequest.email}</p>
                <p><span className="font-semibold text-black">Phone:</span> {selectedRequest.phone}</p>
                <p>
                  <span className="font-semibold text-black">Date Requested:</span>{" "}
                  {new Date(selectedRequest.dateRequested).toLocaleString()}
                </p>
                <p>
                  <span className="font-semibold text-yellow-600">Status:</span>{" "}
                  <span className="font-semibold text-yellow-600">Pending</span>
                </p>
              </div>
              <div className="space-y-4 pl-6 text-gray-700 font-medium">
                <div>
                  <span className="font-semibold text-gray-900">Issue:</span>
                  <p className="mt-1 italic text-gray-800">{selectedRequest.issue}</p>
                </div>
                <div className="mt-4">
                  <span className="font-semibold text-gray-900">Details:</span>
                  <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedRequest.description}
                  </div>
                </div>
                {selectedRequest.vehicleImage && (
                  <div className="mt-4">
                    <img
                      src={selectedRequest.vehicleImage}
                      alt="Vehicle"
                      className="w-full max-w-xs rounded-lg shadow"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-12 flex justify-end">
              <button
                onClick={() => setShowMechanicModal(true)}
                className="bg-blue-600 text-white font-semibold rounded-xl px-12 py-3 shadow-lg
                     hover:bg-blue-700 hover:shadow-xl hover:scale-105 transition-transform duration-300"
              >
                Assign Mechanic
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Mechanic Selection Modal */}
      {showMechanicModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-screen overflow-y-auto p-8 relative">
            <button
              onClick={() => {
                setShowMechanicModal(false);
                setSelectedMechanic(null);
                setMechanicSearchTerm("");
              }}
              className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition text-4xl font-bold leading-none"
            >
              &times;
            </button>
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-3xl font-semibold text-black">Select Mechanic</h2>
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">
                {selectedRequest.ticketNumber}
              </span>
            </div>
            <p className="text-black mb-6">
              Choose a mechanic for {selectedRequest.customerName}'s {selectedRequest.vehicle}
            </p>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search by name, specialty, or status..."
                value={mechanicSearchTerm}
                onChange={(e) => setMechanicSearchTerm(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
            {mechanicsLoading ? (
              <p className="text-center text-gray-500">Loading mechanics...</p>
            ) : filteredMechanics.length === 0 ? (
              <p className="text-center text-gray-500">No mechanics match your search.</p>
            ) : (
              <div className="overflow-y-auto max-h-[60vh] pr-2 -mr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMechanics.map((mechanic) => (
                    <div
                      key={mechanic.id}
                      onClick={() => setSelectedMechanic(mechanic)}
                      className={`relative p-6 rounded-xl cursor-pointer transition-all duration-300 ${
                        selectedMechanic?.id === mechanic.id
                          ? "bg-blue-50 border-2 border-blue-500 shadow-lg transform scale-[1.02]"
                          : "bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={mechanic.avatar}
                          alt={mechanic.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-black text-lg">{mechanic.name}</h3>
                          <p className="text-gray-600 text-sm">{mechanic.specialty}</p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-600">Experience: {mechanic.experience}</p>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-600">Active Tickets:</p>
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              mechanic.activeTickets >= 5 
                                ? "bg-red-100 text-red-800" 
                                : mechanic.activeTickets >= 3 
                                  ? "bg-yellow-100 text-yellow-800" 
                                  : "bg-green-100 text-green-800"
                            }`}>
                              {mechanic.activeTickets}/5
                            </span>
                            {mechanic.activeTickets >= 5 && (
                              <span className="ml-2 text-xs text-red-600 font-medium">LIMIT REACHED</span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">Status: {mechanic.status}</p>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            mechanic.status === "Available"
                              ? "bg-green-100 text-green-800"
                              : mechanic.status === "Busy"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {mechanic.status || "Unknown"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-8 flex justify-end pt-4 border-t border-gray-100">
              <button
                onClick={() => handleAssignMechanic(selectedRequest.id, selectedMechanic?.id)}
                disabled={!selectedMechanic || selectedMechanic?.activeTickets >= 5}
                className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  selectedMechanic && selectedMechanic.activeTickets < 5
                    ? "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Assignment Limit Popup */}
      {showLimitPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fade-in-up">
            <button
              onClick={() => setShowLimitPopup(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition text-4xl font-bold leading-none"
            >
              &times;
            </button>
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">Assignment Limit Reached</h3>
              <p className="text-gray-600 mb-6">{limitMessage}</p>
              <button
                onClick={() => setShowLimitPopup(false)}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Select Another Mechanic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Pending;