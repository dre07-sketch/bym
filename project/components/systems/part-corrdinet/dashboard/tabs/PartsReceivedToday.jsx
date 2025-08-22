import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Package, 
  User, 
  Car, 
  Wrench,
  X,
  Phone,
  Mail,
  Calendar,
  Ticket,
  Clock
} from 'lucide-react';

const PartsReceivedToday = () => {
  const [partsReceived, setPartsReceived] = useState([]);
  const [selectedPart, setSelectedPart] = useState(null);
  const [filterLicense, setFilterLicense] = useState('');
  const [filterTicket, setFilterTicket] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from backend
  useEffect(() => {
    const fetchParts = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/disassmbled/today-parts');
        if (!response.ok) throw new Error('Failed to fetch parts');
        const data = await response.json();

        // Map backend data to frontend model
        const mappedData = data.map(item => ({
          id: item.part_id,
          ticketNumber: item.ticket_number,
          partName: item.part_name,
          condition: item.condition,
          status: item.part_status,
          notes: item.part_notes,
          receivedDate: item.logged_at.split('T')[0], // Format date
          estimatedDueDate: item.estimated_completion_date
            ? new Date(item.estimated_completion_date).toISOString().split('T')[0]
            : 'N/A',
          actualCompletionDate: item.completion_date
            ? new Date(item.completion_date).toISOString().split('T')[0]
            : 'N/A',
          clientName: item.customer_name,
          licensePlate: item.license_plate,
          mechanicName: item.mechanic_assign,
          problem: item.description,
          title: item.title,
          priority: item.priority,
          type: item.type,
          ticketStatus: item.ticket_status,
          ticketNotes: item.ticket_notes,
          // Mock contact info
          clientPhone: '+1 (555) 000-0000',
          clientEmail: `${item.customer_name.toLowerCase().replace(' ', '.')}@example.com`,
          partNumber: `PART-${item.part_id}`,
        }));

        setPartsReceived(mappedData);
      } catch (err) {
        console.error("Error loading parts:", err);
        setError("Could not load parts. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, []);

  // Client-side filtering
  const filteredParts = partsReceived.filter(part => {
    return (
      (!filterLicense || part.licensePlate.toLowerCase().includes(filterLicense.toLowerCase())) &&
      (!filterTicket || part.ticketNumber.toLowerCase().includes(filterTicket.toLowerCase()))
    );
  });

  const closeModal = () => setSelectedPart(null);

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
        <p className="mt-4 text-gray-600">Loading today's parts...</p>
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
    <div className="p-6 bg-gradient-to-br from-slate-50 to-green-50 min-h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Parts Disassembled Today</h2>
        <p className="text-gray-600">Showing parts logged during the current day.</p>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm border hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
        </button>

        {showFilters && (
          <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Plate</label>
                <input
                  type="text"
                  placeholder="Filter by plate..."
                  value={filterLicense}
                  onChange={(e) => setFilterLicense(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Number</label>
                <input
                  type="text"
                  placeholder="Filter by ticket..."
                  value={filterTicket}
                  onChange={(e) => setFilterTicket(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Parts List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Disassembled Parts</h3>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {filteredParts.length} part(s)
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {filteredParts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No parts found</h3>
              <p className="text-gray-500">No disassembled parts match your filters.</p>
            </div>
          ) : (
            filteredParts.map((part) => (
              <div
                key={part.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => setSelectedPart(part)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Package className="w-5 h-5 text-green-600" />
                      <h4 className="text-lg font-semibold text-gray-900">{part.partName}</h4>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {part.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Ticket className="w-4 h-4" />
                        <span>{part.ticketNumber}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Car className="w-4 h-4" />
                        <span>{part.licensePlate}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span>{part.clientName}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Wrench className="w-4 h-4" />
                        <span>Mechanic: {part.mechanicName}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span title="Estimated completion date">Est Due: {part.estimatedDueDate}</span>
                      </div>
                    </div>
                  </div>
                  <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedPart && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Part Details</h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl">
                    <Ticket className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Ticket Number</p>
                      <p className="font-semibold text-gray-900">{selectedPart.ticketNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
                    <Package className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Part Name</p>
                      <p className="font-semibold text-gray-900">{selectedPart.partName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl">
                    <User className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Client</p>
                      <p className="font-semibold text-gray-900">{selectedPart.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-4 bg-orange-50 rounded-xl">
                    <Car className="w-6 h-6 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">License Plate</p>
                      <p className="font-semibold text-gray-900">{selectedPart.licensePlate}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-2">Problem Description</p>
                    <p className="text-gray-900">{selectedPart.problem}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <p className="text-sm text-gray-600">Logged At</p>
                      <p className="font-semibold text-gray-900">{selectedPart.receivedDate}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <p className="text-sm text-gray-600">Estimated Due</p>
                      <p className="font-semibold text-gray-900">{selectedPart.estimatedDueDate}</p>
                    </div>
                    {selectedPart.actualCompletionDate !== 'N/A' && (
                      <div className="p-4 bg-red-50 rounded-xl">
                        <p className="text-sm text-gray-600">Final Deadline</p>
                        <p className="font-semibold text-gray-900">{selectedPart.actualCompletionDate}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-xl">
                    <Wrench className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">Mechanic</p>
                      <p className="font-semibold text-gray-900">{selectedPart.mechanicName}</p>
                    </div>
                  </div>

                  {selectedPart.clientPhone && (
                    <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl">
                      <Phone className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold text-gray-900">{selectedPart.clientPhone}</p>
                      </div>
                    </div>
                  )}

                  {selectedPart.clientEmail && (
                    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900">{selectedPart.clientEmail}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity & Notes</h3>
                <div className="space-y-3">
                  {selectedPart.notes && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-700"><strong>Part Note:</strong> {selectedPart.notes}</p>
                    </div>
                  )}
                  {selectedPart.ticketNotes && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-gray-700"><strong>Ticket Note:</strong> {selectedPart.ticketNotes}</p>
                    </div>
                  )}
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-green-800"><strong>Condition:</strong> {selectedPart.condition}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsReceivedToday;