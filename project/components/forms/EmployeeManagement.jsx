'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Search, Edit, Trash2, Clock } from 'lucide-react';

const mockEmployees = [
  { id: 1, name: 'Mike Johnson', role: 'Mechanic', email: 'mike@garage.com', phone: '+1-555-0101', status: 'active', hireDate: '2023-01-15' },
  { id: 2, name: 'Sarah Wilson', role: 'Mechanic', email: 'sarah@garage.com', phone: '+1-555-0102', status: 'active', hireDate: '2023-03-20' },
  { id: 3, name: 'Tom Brown', role: 'Inspector', email: 'tom@garage.com', phone: '+1-555-0103', status: 'active', hireDate: '2023-05-10' },
  { id: 4, name: 'Lisa Davis', role: 'Customer Service', email: 'lisa@garage.com', phone: '+1-555-0104', status: 'inactive', hireDate: '2022-11-05' },
];

const mockAttendance = [
  { id: 1, employeeId: 1, date: '2024-01-15', checkIn: '08:00', checkOut: '17:00', status: 'present' },
  { id: 2, employeeId: 2, date: '2024-01-15', checkIn: '08:15', checkOut: '17:30', status: 'present' },
  { id: 3, employeeId: 3, date: '2024-01-15', checkIn: null, checkOut: null, status: 'absent' },
];

export default function EmployeeManagement() {
  const [activeTab, setActiveTab] = useState('employees');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredEmployees = mockEmployees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderEmployeeList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Employee Management</h3>
        <Button onClick={() => setShowAddForm(true)} className="btn-primary">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>

            <div className="grid gap-4">
              {filteredEmployees.map(employee => (
                <div key={employee.id} className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all card-hover">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                        employee.status === 'active' ? 'from-green-400 to-green-600' : 'from-gray-400 to-gray-600'
                      } flex items-center justify-center`}>
                        <Users className="w-6 h-6 text-white animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{employee.name}</h4>
                        <p className="text-gray-600">{employee.role}</p>
                        <div className="text-sm text-gray-500">
                          <p>{employee.email}</p>
                          <p>{employee.phone}</p>
                          <p>Hired: {employee.hireDate}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant={employee.status === 'active' ? 'default' : 'secondary'}>
                        {employee.status}
                      </Badge>
                      <div className="space-x-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs text-red-600">
                          <Trash2 className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Attendance Management</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-green-600">Present Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {mockAttendance.filter(a => a.status === 'present').length}
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-red-600">Absent Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {mockAttendance.filter(a => a.status === 'absent').length}
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-blue-600">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{mockEmployees.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Today&apos;s Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockAttendance.map(record => {
              const employee = mockEmployees.find(e => e.id === record.employeeId);
              return (
                <div key={record.id} className="p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Clock className={`w-5 h-5 ${record.status === 'present' ? 'text-green-600' : 'text-red-600'}`} />
                      <div>
                        <p className="font-semibold">{employee?.name}</p>
                        <p className="text-sm text-gray-600">{employee?.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={record.status === 'present' ? 'default' : 'destructive'}>
                        {record.status}
                      </Badge>
                      {record.checkIn && (
                        <p className="text-sm text-gray-600 mt-1">
                          {record.checkIn} - {record.checkOut || 'Working'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-2 px-4 font-medium ${
            activeTab === 'employees' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          Employees
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-2 px-4 font-medium ${
            activeTab === 'attendance' 
              ? 'border-b-2 border-blue-600 text-blue-600' 
              : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          Attendance
        </button>
      </div>

      {activeTab === 'employees' ? renderEmployeeList() : renderAttendance()}

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add New Employee</CardTitle>
              <CardDescription>Enter employee information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Full Name" />
              <Input placeholder="Email" type="email" />
              <Input placeholder="Phone" type="tel" />
              <select className="w-full p-2 border rounded-lg">
                <option>Select Role</option>
                <option>Mechanic</option>
                <option>Inspector</option>
                <option>Customer Service</option>
                <option>Manager</option>
              </select>
              <div className="flex space-x-2">
                <Button className="btn-primary flex-1">
                  Add Employee
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