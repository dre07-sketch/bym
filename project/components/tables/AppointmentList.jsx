'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Search, Plus, Edit, Trash2 } from 'lucide-react';

const mockAppointments = [
  { 
    id: 1, 
    customer: 'John Smith', 
    phone: '+1-555-0123',
    vehicle: 'Toyota Camry 2020',
    plateNumber: 'ABC-123',
    date: '2024-01-15', 
    time: '09:00', 
    reason: 'Oil Change', 
    status: 'confirmed',
    notes: 'Regular maintenance'
  },
  { 
    id: 2, 
    customer: 'ABC Corp', 
    phone: '+1-555-0456',
    vehicle: 'Ford F-150 2019',
    plateNumber: 'XYZ-789',
    date: '2024-01-15', 
    time: '14:00', 
    reason: 'Brake Repair', 
    status: 'pending',
    notes: 'Customer reported squeaking noise'
  },
  { 
    id: 3, 
    customer: 'Jane Doe', 
    phone: '+1-555-0789',
    vehicle: 'Honda Civic 2021',
    plateNumber: 'DEF-456',
    date: '2024-01-16', 
    time: '10:30', 
    reason: 'Engine Diagnostic', 
    status: 'confirmed',
    notes: 'Check engine light on'
  },
  { 
    id: 4, 
    customer: 'Mike Wilson', 
    phone: '+1-555-0321',
    vehicle: 'BMW X5 2018',
    plateNumber: 'GHI-789',
    date: '2024-01-16', 
    time: '15:00', 
    reason: 'Transmission Service', 
    status: 'completed',
    notes: 'Annual service'
  },
];

export default function AppointmentList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredAppointments = mockAppointments.filter(appointment => {
    const matchesSearch = 
      appointment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'pending': return 'secondary';
      case 'completed': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Appointment Management</h2>
        <Button onClick={() => setShowAddForm(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Appointment
        </Button>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span>Appointments</span>
          </CardTitle>
          <CardDescription>
            Manage customer appointments and scheduling
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search appointments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 input-field"
                />
              </div>
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border rounded-lg bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="grid gap-4">
              {filteredAppointments.map(appointment => (
                <div key={appointment.id} className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all card-hover">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white animate-pulse" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{appointment.customer}</h3>
                        <p className="text-gray-600">{appointment.vehicle} - {appointment.plateNumber}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {appointment.date}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {appointment.time}
                          </span>
                        </div>
                        <p className="text-sm text-blue-600 mt-1">{appointment.reason}</p>
                        {appointment.notes && (
                          <p className="text-xs text-gray-500 mt-1">Notes: {appointment.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs text-red-600">
                          <Trash2 className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAppointments.length === 0 && (
              <div className="text-center py-8">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Appointments Found</h3>
                <p className="text-gray-500">No appointments match your search criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Schedule New Appointment</CardTitle>
              <CardDescription>Book an appointment for a customer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Customer Name" />
              <Input placeholder="Phone Number" type="tel" />
              <Input placeholder="Vehicle (Make Model Year)" />
              <Input placeholder="License Plate" />
              <Input placeholder="Date" type="date" />
              <Input placeholder="Time" type="time" />
              <Input placeholder="Service Reason" />
              <textarea 
                placeholder="Additional Notes" 
                className="w-full p-2 border rounded-lg"
                rows="3"
              ></textarea>
              <div className="flex space-x-2">
                <Button className="btn-primary flex-1">
                  Schedule Appointment
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}