

import React, { useState, useEffect } from 'react';
import {
  Search,
  UserCog,
  Filter,
  ChevronDown,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Clock,
  Briefcase,
  Key,
  RefreshCw
} from 'lucide-react';
const Employees = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [selectedRole, setSelectedRole] = useState('All');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState(null);
  const roles = ['All', 'Mechanic', 'Part Coordinator', 'Stockroom', 'Inspection', 'Finance/HR', 'Reception'];
  const departments = ['All', 'Engine Repair', 'Diagnostics', 'Brake Systems', 'Electrical'];
  const getImageUrl = (imagePath) => {
    if (!imagePath) {
      return 'http://localhost:5001/uploads/default-profile.png';
    }
    const normalizedPath = imagePath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
    const filename = parts[parts.length - 1];
    return `http://localhost:5001/uploads/${filename}`;
  };
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/employees/getemployees');
        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }
        const data = await response.json();
        setEmployees(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!showAttendance || !selectedEmployee) return;
      setAttendanceLoading(true);
      setAttendanceError(null);
      try {
        const response = await fetch(`http://localhost:5001/api/employeeattendance/getempsattendance?employeeId=${selectedEmployee.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch attendance data');
        }
        const data = await response.json();
        setAttendanceData(data);
      } catch (err) {
        setAttendanceError(err.message);
      } finally {
        setAttendanceLoading(false);
      }
    };
    fetchAttendance();
  }, [showAttendance, selectedEmployee]);
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All' ||
                            (employee.specialty && employee.specialty.includes(selectedDepartment));
    const matchesRole = selectedRole === 'All' ||
                       employee.role.toLowerCase().includes(selectedRole.toLowerCase());
    return matchesSearch && matchesDepartment && matchesRole;
  });
  if (loading) {
    return <div className="p-6 text-center">Loading employees...</div>;
  }
  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Directory</h1>
          <p className="text-gray-500 mt-1">Manage and view all employee information</p>
        </div>
      </div>
      {/* Role Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        {roles.map(role => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition text-sm font-medium
              ${
                selectedRole === role
                  ? 'bg-custom-gradient text-white shadow-md'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
          >
            {role === 'All' && <Filter size={16} />}
            {role}
          </button>
        ))}
      </div>
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search employees..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <select
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
          >
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>
      {/* Employee List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map(employee => (
          <div
            key={employee.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all transform hover:-translate-y-1 cursor-pointer p-4 flex items-center gap-4"
            onClick={() => setSelectedEmployee(employee)}
          >
            {employee.image ? (
              <img
                src={getImageUrl(employee.image)}
                alt={employee.name}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/80';
                }}
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                <UserCog size={24} className="text-gray-400" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{employee.name}</h3>
              <p className="text-gray-600 text-sm">{employee.role}</p>
              {employee.specialty && (
                <p className="text-gray-500 text-xs mt-1">{employee.specialty}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Employee Details Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="p-6 border-b border-gray-200 flex justify-between items-start sticky top-0 bg-white z-10">
              <div className="flex items-center gap-4">
                {selectedEmployee.image ? (
                  <img
                     src={getImageUrl(selectedEmployee.image)}
                    alt={selectedEmployee.name}
                    className="w-20 h-20 rounded-lg object-cover shadow-md"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/80';
                    }}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                    <UserCog size={32} className="text-gray-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedEmployee.name}</h2>
                  <p className="text-gray-600">{selectedEmployee.role}</p>
                  {selectedEmployee.specialty && (
                    <p className="text-gray-500 text-sm">{selectedEmployee.specialty}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Status Section */}
              <div className="flex items-center justify-between">
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  Available
                </span>
                <div className="flex items-center gap-2 text-gray-600">
                  <Briefcase size={18} />
                  <span>Active</span>
                </div>
              </div>
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="text-gray-400" size={18} />
                  <span>{selectedEmployee.email}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="text-gray-400" size={18} />
                  <span>{selectedEmployee.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="text-gray-400" size={18} />
                  <span>{selectedEmployee.location}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="text-gray-400" size={18} />
                  <span>Joined {new Date(selectedEmployee.joinDate).toLocaleDateString()}</span>
                </div>
              </div>
              {/* Password Change Grant Section */}
              <div className="border-t border-gray-200 pt-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Key className="text-purple-500 animate-bounce" size={20} />
            Password Reset
          </h3>
          
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-4 border border-purple-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">Last request:</p>
                <div className="flex items-center gap-2">
                  {selectedEmployee.passwordRequestTime ? (
                    <>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium animate-pulse">
                        Pending
                      </span>
                      <span className="text-sm font-medium">
                        {new Date(selectedEmployee.passwordRequestTime).toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500 italic">No recent requests</span>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => {
                  // Update request time
                  const updatedEmployee = {
                    ...selectedEmployee,
                    passwordRequestTime: new Date().toISOString()
                  };
                  setSelectedEmployee(updatedEmployee);
                  
                  // Trigger animations
                  const button = document.getElementById('grant-password-btn');
                  button.classList.add('animate-blink');
                  setTimeout(() => button.classList.remove('animate-blink'), 1000);
                  
                  // Show confirmation
                  const timeString = new Date().toLocaleTimeString();
                  alert(`Password reset granted at ${timeString}\n${selectedEmployee.name} will receive instructions.`);
                }}
                id="grant-password-btn"
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-medium hover:from-purple-700 hover:to-blue-700 shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <RefreshCw size={16} className="animate-spin-once" />
                  Grant Password Reset
                </span>
                <span className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity"></span>
              </button>
            </div>

            <p className="text-gray-500 text-xs mt-3 italic">
              Request expires in 24 hours. Employee will receive email instructions.
            </p>
          </div>
        </div>
              
              {/* Expertise */}
              {selectedEmployee.expertise && selectedEmployee.expertise.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Award size={20} />
                    Expertise
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {selectedEmployee.expertise.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Action Buttons */}
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold text-gray-800">Manage Account</h3>
                <div className="flex justify-center flex-wrap gap-4">
                  <button
                    className="px-6 py-2 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 shadow-md transition"
                  >
                    Activate
                  </button>
                  <button
                    className="px-6 py-2 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 shadow-md transition"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => setShowAttendance(true)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 shadow-md transition"
                  >
                    Check Attendance
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Attendance Modal */}
      {showAttendance && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="backdrop-blur-md bg-white/80 rounded-xl shadow-2xl max-w-xl w-full max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white/80 z-10">
              <h3 className="text-xl font-semibold text-gray-800">
                Attendance - {selectedEmployee.name}
              </h3>
              <button
                onClick={() => setShowAttendance(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {attendanceLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading attendance data...</p>
                </div>
              ) : attendanceError ? (
                <div className="text-center py-8 text-red-500">
                  <p>Error loading attendance data: {attendanceError}</p>
                  <button
                    onClick={() => {
                      setShowAttendance(false);
                      setTimeout(() => setShowAttendance(true), 100);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Retry
                  </button>
                </div>
              ) : attendanceData.length > 0 ? (
                attendanceData.map((record, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 border rounded-lg bg-white shadow-sm hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <Calendar className="text-gray-400" size={18} />
                      <span className="font-medium text-gray-700">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.status === 'Present'
                          ? 'bg-green-100 text-green-800'
                          : record.status === 'Absent'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                      {record.check_in && (
                        <span className="text-sm text-gray-600">
                          <Clock size={14} className="inline mr-1" />
                          {record.check_in} - {record.check_out || 'N/A'}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No attendance records found for this employee</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default Employees;
