import {
  Customer,
  Vehicle,
  Ticket,
  Notification,
  CSAgent,
  TowTruckCompany,
  MechanicInfo,
  Appointment
} from '../../components/types/index';

/* ----------------------------------------
   Tow Truck Companies
----------------------------------------- */
export const mockTowTruckCompanies: TowTruckCompany[] = [
  {
    id: '1',
    name: 'Quick Response Towing',
    phone: '+1-555-TOW-FAST',
    coverage: ['Downtown', 'North District', 'Highway 101'],
    rating: 4.8,
    estimatedArrival: 15,
    available24h: true
  },
  {
    id: '2',
    name: 'City Wide Towing Services',
    phone: '+1-555-CITY-TOW',
    coverage: ['South District', 'East Side', 'Industrial Area'],
    rating: 4.6,
    estimatedArrival: 20,
    available24h: true
  },
  {
    id: '3',
    name: 'Highway Heroes Towing',
    phone: '+1-555-HIGHWAY-1',
    coverage: ['Highway 101', 'Highway 405', 'Interstate Routes'],
    rating: 4.9,
    estimatedArrival: 12,
    available24h: true
  },
  {
    id: '4',
    name: 'Metro Towing Company',
    phone: '+1-555-METRO-TOW',
    coverage: ['Metro Area', 'Suburbs', 'Airport District'],
    rating: 4.5,
    estimatedArrival: 25,
    available24h: false
  }
];

/* ----------------------------------------
   Mechanics
----------------------------------------- */
export const mockMechanics: MechanicInfo[] = [
  {
    id: '1',
    name: 'Tom Wilson',
    specialty: ['Engine Repair', 'Transmission', 'Diagnostics'],
    estimatedStartTime: '2024-12-21T09:00:00Z',
    currentWorkload: 3,
    isAvailable: true
  },
  {
    id: '2',
    name: 'Sarah Martinez',
    specialty: ['Brake Systems', 'Suspension', 'Electrical'],
    estimatedStartTime: '2024-12-21T10:30:00Z',
    currentWorkload: 2,
    isAvailable: true
  },
  {
    id: '3',
    name: 'Mike Johnson',
    specialty: ['Body Work', 'Paint', 'Collision Repair'],
    estimatedStartTime: '2024-12-21T14:00:00Z',
    currentWorkload: 4,
    isAvailable: false
  },
  {
    id: '4',
    name: 'Lisa Chen',
    specialty: ['Air Conditioning', 'Heating', 'Climate Control'],
    estimatedStartTime: '2024-12-21T11:00:00Z',
    currentWorkload: 1,
    isAvailable: true
  }
];

/* ----------------------------------------
   Vehicles
----------------------------------------- */
export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    customerId: '1',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    licensePlate: 'ABC-123',
    color: 'Silver',
    vin: '1HGBH41JXMN109186',
    mileage: 45000,
    status: {
      current: 'in-queue',
      updatedAt: '2024-12-20T10:30:00Z',
      updatedBy: 'CS Agent',
      estimatedCompletion: '2024-12-21T16:00:00Z'
    }
  },
  {
    id: '2',
    customerId: '2',
    make: 'Honda',
    model: 'Civic',
    year: 2019,
    licensePlate: 'XYZ-789',
    color: 'Blue',
    vin: '2T1BURHE0JC123456',
    mileage: 32000,
    status: {
      current: 'repair-in-progress',
      updatedAt: '2024-12-20T14:15:00Z',
      updatedBy: 'Tom Wilson',
      estimatedCompletion: '2024-12-22T12:00:00Z'
    }
  },
  {
    id: '3',
    customerId: '3',
    make: 'Ford',
    model: 'F-150',
    year: 2021,
    licensePlate: 'DEF-456',
    color: 'Black',
    vin: '1FTFW1ET5DFC12345',
    mileage: 28000,
    status: {
      current: 'ready-for-pickup',
      updatedAt: '2024-12-20T16:00:00Z',
      updatedBy: 'Sarah Martinez'
    }
  }
];

/* ----------------------------------------
   Customers
----------------------------------------- */
export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+251911223344',
    address: 'Bole, Addis Ababa',
    createdAt: '2024-01-15T09:00:00Z',
    isArchived: false,
    notes: 'Very punctual and detailed with service expectations.',
    vehicles: [mockVehicles[0]],
    serviceHistory: [
      {
        id: 'S001',
        serviceType: 'Oil Change',
        status: 'Completed',
        description: 'Changed oil and filter',
        date: '2024-04-10',
        cost: 850
      }
    ],
    registrationDate: '2024-01-15',
    totalServices: 1
  },
  {
    id: '2',
    name: 'Mekdes Ayele',
    email: 'mekdes@example.com',
    phone: '+251922334455',
    address: 'Piassa, Addis Ababa',
    createdAt: '2024-02-10T10:00:00Z',
    isArchived: true,
    notes: '',
    vehicles: [mockVehicles[1]],
    serviceHistory: [],
    registrationDate: '2024-02-10',
    totalServices: 0
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike.davis@example.com',
    phone: '+251933556677',
    address: 'CMC, Addis Ababa',
    createdAt: '2024-03-12T14:30:00Z',
    isArchived: false,
    notes: 'Likes to be contacted by SMS.',
    vehicles: [mockVehicles[2]],
    serviceHistory: [
      {
        id: 'S003',
        serviceType: 'Brake Inspection',
        status: 'Completed',
        description: 'Replaced front brake pads',
        date: '2024-06-28',
        cost: 950
      }
    ],
    registrationDate: '2024-03-12',
    totalServices: 1
  }
];

/* ----------------------------------------
   Tickets
----------------------------------------- */
export const mockTickets: Ticket[] = [
  {
    id: 'T001',
    customerId: '1',
    vehicleId: '1',
    title: 'Engine Making Strange Noise',
    description: 'Customer reports unusual knocking sound from engine during acceleration.',
    status: 'assigned',
    priority: 'high',
    type: 'regular',
    createdAt: '2024-12-20T10:30:00Z',
    updatedAt: '2024-12-20T10:30:00Z',
    assignedMechanic: mockMechanics[0],
    serviceIntake: {
      customerComplaint: 'Engine making knocking noise during acceleration',
      currentMileage: 45000,
      fuelLevel: '3/4 Full',
      accessories: ['Phone charger', 'Sunglasses'],
      visibleDamage: ['Small scratch on rear bumper'],
      agentSignature: 'CS Agent',
      completedAt: '2024-12-20T10:45:00Z'
    },
    internalNotes: [
      {
        id: '1',
        content: 'Customer is very concerned about engine noise. Handle with care.',
        addedBy: 'CS Agent',
        addedAt: '2024-12-20T10:35:00Z',
        type: 'important'
      }
    ],
    followUpReminders: [
      {
        id: '1',
        title: 'Call customer with update',
        description: 'Provide diagnostic results to customer',
        dueDate: '2024-12-21T14:00:00Z',
        completed: false,
        type: 'call-customer'
      }
    ]
  },
  {
    id: 'T002',
    customerId: '2',
    vehicleId: '2',
    title: 'SOS - Car Won\'t Start',
    description: 'Vehicle completely dead, need immediate roadside assistance.',
    status: 'pending',
    priority: 'urgent',
    type: 'sos',
    createdAt: '2024-12-20T14:15:00Z',
    updatedAt: '2024-12-20T14:20:00Z',
    sosDetails: {
      location: 'Highway 101, Mile Marker 45',
      urgencyLevel: 'critical',
      serviceType: 'both',
      responseTime: 30,
      towTruckCompany: mockTowTruckCompanies[0]
    }
  },
  {
    id: 'T003',
    customerId: '3',
    vehicleId: '3',
    title: 'Brake Inspection',
    description: 'Routine brake inspection and potential pad replacement.',
    status: 'completed',
    priority: 'medium',
    type: 'appointment',
    createdAt: '2024-12-19T09:00:00Z',
    updatedAt: '2024-12-20T08:30:00Z',
    assignedMechanic: mockMechanics[1],
    completedAt: '2024-12-20T16:00:00Z',
    appointmentDetails: {
      scheduledDate: '2024-12-20',
      scheduledTime: '09:00',
      duration: 120,
      serviceType: 'Brake Inspection',
      mechanicId: '2',
      serviceBay: 'Bay 3',
      confirmed: true,
      reminderSent: true
    }
  }
];

/* ----------------------------------------
   Appointments
----------------------------------------- */
export const mockAppointments: Appointment[] = [
  {
    id: 'A001',
    customerId: '1',
    vehicleId: '1',
    mechanicId: '1',
    serviceBay: 'Bay 1',
    scheduledDate: '2024-12-21',
    scheduledTime: '09:00',
    duration: 180,
    serviceType: 'Engine Diagnostic',
    status: 'confirmed',
    notes: 'Customer prefers morning appointments',
    createdBy: 'CS Agent',
    createdAt: '2024-12-20T10:30:00Z'
  },
  {
    id: 'A002',
    customerId: '2',
    vehicleId: '2',
    mechanicId: '2',
    serviceBay: 'Bay 2',
    scheduledDate: '2024-12-22',
    scheduledTime: '14:00',
    duration: 120,
    serviceType: 'Oil Change',
    status: 'scheduled',
    createdBy: 'Customer Portal',
    createdAt: '2024-12-20T16:45:00Z'
  }
];

/* ----------------------------------------
   Notifications
----------------------------------------- */
export const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New SOS Request',
    message: 'Critical SOS request from Sarah Johnson - Car won\'t start',
    type: 'error',
    timestamp: '2024-12-20T14:15:00Z',
    read: false
  },
  {
    id: '2',
    title: 'Appointment Confirmed',
    message: 'John Smith confirmed appointment for tomorrow 9:00 AM',
    type: 'success',
    timestamp: '2024-12-20T08:30:00Z',
    read: false
  },
  {
    id: '3',
    title: 'Follow-up Reminder',
    message: 'Call Mike Davis about completed brake service',
    type: 'info',
    timestamp: '2024-12-19T16:45:00Z',
    read: true
  }
];

/* ----------------------------------------
   Customer Service Agents
----------------------------------------- */
export const mockCSAgents: CSAgent[] = [
  {
    id: '1',
    name: 'Bruce Wayne',
    email: 'bruce@garage.com',
    role: 'supervisor',
    isOnline: true,
    activeTickets: 5
  },
  {
    id: '2',
    name: 'Diana Prince',
    email: 'diana@garage.com',
    role: 'agent',
    isOnline: true,
    activeTickets: 3
  },
  {
    id: '3',
    name: 'Clark Kent',
    email: 'clark@garage.com',
    role: 'agent',
    isOnline: false,
    activeTickets: 2
  }
];
