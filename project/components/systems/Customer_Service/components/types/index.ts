export interface Customer {
  notes: any;
  createdAt: string | number | Date;
  vehicles: any;
  serviceHistory: any;
  isArchived: any;
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  registrationDate: string;
  totalServices: number;
  lastService?: string;
  flags?: CustomerFlag[];
  vin?: string;
}
export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isAvailable: boolean;
  currentWorkload: number;
  specialty: string[];
  certifications: string[];
  performanceMetrics: {
    completedJobs: number;
    averageCompletionTime: number;
    customerSatisfactionRating: number;
    efficiency: number;
  };
  schedule: {
    [day: string]: {
      isWorking: boolean;
      start: string;
      end: string;
    };
  };
}

export interface CustomerFlag {
  id: string;
  type: 'vip' | 'frequent' | 'difficult' | 'new' | 'priority';
  label: string;
  color: string;
  addedBy: string;
  addedAt: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  vin?: string;
  color?: string;
  mileage?: number;
  status?: VehicleStatus;
}

export interface VehicleStatus {
  current: 'in-queue' | 'under-inspection' | 'repair-in-progress' | 'waiting-for-parts' | 'ready-for-pickup' | 'completed';
  updatedAt: string;
  updatedBy: string;
  estimatedCompletion?: string;
}

export interface Ticket {
  id: string;
  customerId: string;
  vehicleId: string;
  title: string;
  description: string;
  status: 'new' | 'pending' | 'approved' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'regular' | 'sos' | 'appointment';
  createdAt: string;
  updatedAt: string;
  assignedMechanic?: MechanicInfo;
  estimatedCost?: number;
  actualCost?: number;
  completedAt?: string;
  customerFeedback?: CustomerFeedback;
  sosDetails?: SOSDetails;
  serviceIntake?: ServiceIntake;
  internalNotes?: InternalNote[];
  documents?: Document[];
  followUpReminders?: FollowUpReminder[];
  appointmentDetails?: AppointmentDetails;
}

export interface ServiceIntake {
  customerComplaint: string;
  currentMileage: number;
  fuelLevel: string;
  accessories: string[];
  visibleDamage: string[];
  customerSignature?: string;
  agentSignature: string;
  completedAt: string;
  photos?: string[];
}

export interface InternalNote {
  id: string;
  content: string;
  addedBy: string;
  addedAt: string;
  type: 'general' | 'warning' | 'important';
}

export interface Document {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'document';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  category: 'damage-photo' | 'invoice' | 'estimate' | 'other';
}

export interface FollowUpReminder {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  type: 'call-customer' | 'check-parts' | 'quality-check' | 'pickup-reminder';
}

export interface AppointmentDetails {
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  serviceType: string;
  mechanicId?: string;
  serviceBay?: string;
  confirmed: boolean;
  reminderSent: boolean;
}

export interface MechanicInfo {
  id: string;
  name: string;
  specialty: string[];
  estimatedStartTime?: string;
  currentWorkload: number;
  isAvailable: boolean;
}

export interface SOSDetails {
  location: string;
  coordinates?: { lat: number; lng: number };
  urgencyLevel: 'moderate' | 'high' | 'critical';
  serviceType: 'tow' | 'field-mechanic' | 'both';
  responseTime?: number;
  dispatchedAt?: string;
  towTruckCompany?: TowTruckCompany;
}

export interface TowTruckCompany {
  id: string;
  name: string;
  phone: string;
  coverage: string[];
  rating: number;
  estimatedArrival: number;
  available24h: boolean;
}

export interface CustomerFeedback {
  rating: number;
  comment?: string;
  submittedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface CSAgent {
  id: string;
  name: string;
  email: string;
  role: 'agent' | 'supervisor';
  avatar?: string;
  isOnline: boolean;
  activeTickets: number;
}

export interface Appointment {
  id: string;
  customerId: string;
  vehicleId: string;
  mechanicId?: string;
  serviceBay?: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  serviceType: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface CommunicationLog {
  id: string;
  ticketId: string;
  type: 'whatsapp' | 'sms' | 'email' | 'call';
  direction: 'inbound' | 'outbound';
  content: string;
  timestamp: string;
  sentBy: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}