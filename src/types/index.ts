// ============================================================
// PULSEGRID — SHARED TYPESCRIPT TYPES
// ============================================================

// ---- Role IDs -----------------------------------------------
export type RoleId =
  | 'superAdmin'
  | 'networkAdmin'
  | 'hospitalAdmin'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'ambulanceDriver'
  | 'pharmacist'
  | 'diagnosticStaff'
  | 'ruralVolunteer'
  | 'patient'
  | 'familyMember'
  | 'emergencyOperator'
  | 'pending';

// ---- Permission Keys -----------------------------------------
export type PermissionKey =
  // User management
  | 'MANAGE_USERS'
  | 'VIEW_USERS'
  | 'APPROVE_USERS'
  | 'ASSIGN_ROLES'
  // Hospital management
  | 'MANAGE_HOSPITALS'
  | 'VIEW_HOSPITALS'
  | 'MANAGE_HOSPITAL_STAFF'
  // Patient management
  | 'VIEW_PATIENTS'
  | 'MANAGE_PATIENTS'
  | 'VIEW_OWN_PROFILE'
  | 'EDIT_OWN_PROFILE'
  // Medical records
  | 'READ_MEDICAL_RECORDS'
  | 'WRITE_MEDICAL_RECORDS'
  | 'DELETE_MEDICAL_RECORDS'
  // Prescriptions
  | 'WRITE_PRESCRIPTION'
  | 'READ_PRESCRIPTION'
  | 'DISPENSE_MEDICATION'
  // Diagnostics
  | 'ORDER_DIAGNOSTICS'
  | 'VIEW_DIAGNOSTICS'
  | 'UPLOAD_DIAGNOSTIC_RESULTS'
  // Emergency
  | 'TRIGGER_EMERGENCY'
  | 'RESPOND_EMERGENCY'
  | 'MANAGE_AMBULANCE'
  | 'VIEW_EMERGENCY_REQUESTS'
  // Notifications
  | 'SEND_NOTIFICATIONS'
  | 'VIEW_NOTIFICATIONS'
  | 'BROADCAST_ALERTS'
  // Audit logs
  | 'VIEW_AUDIT_LOGS'
  | 'EXPORT_AUDIT_LOGS'
  // Analytics
  | 'VIEW_ANALYTICS'
  | 'VIEW_ADVANCED_ANALYTICS'
  // Settings
  | 'MANAGE_SETTINGS'
  | 'VIEW_SETTINGS'
  // Family
  | 'VIEW_FAMILY_MEMBER_RECORDS'
  | 'MANAGE_FAMILY_LINKS';

// ---- User Profile -------------------------------------------
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  roleId: RoleId;
  hospitalId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  metadata?: Record<string, unknown>;
  profileData?: any; // Role-specific profile data
}

// ---- Role Definition ----------------------------------------
export interface RoleDefinition {
  id: RoleId;
  label: string;
  description: string;
  permissions: PermissionKey[];
  parentRoles?: RoleId[];
  color: string;
  icon: string;
  dashboardPath: string;
}

// ---- Hospital -----------------------------------------------
export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  adminId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// ---- Doctor -------------------------------------------------
export interface Doctor {
  id: string;
  uid: string;
  hospitalId: string;
  specialization: string;
  licenseNumber: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// ---- Patient Profile ----------------------------------------
export interface PatientProfile {
  id: string;
  uid: string;
  hospitalId?: string;
  bloodGroup?: string;
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  familyMemberIds?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// ---- Medical Document ---------------------------------------
export interface MedicalDocument {
  id: string;
  patientId: string;
  uploaderId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  notes?: string;
  uploadedAt: string | Date;
}

// ---- Telemedicine -------------------------------------------
export interface TelemedicineAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledTime: string | Date;
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  meetingLink?: string;
  notes?: string;
  createdAt: string | Date;
  
  patient?: any; // The User object joined from DB
  doctor?: any; // The User object joined from DB
}

// ---- Emergency Request --------------------------------------
export interface EmergencyRequest {
  id: string;
  patientId: string;
  hospitalId?: string;
  ambulanceId?: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  status: 'pending' | 'dispatched' | 'resolved' | 'cancelled';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description?: string;
  responderId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// ---- Notification -------------------------------------------
export interface AppNotification {
  id: string;
  uid: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'emergency';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

// ---- Audit Log Entry ----------------------------------------
export interface AuditLogEntry {
  id: string;
  uid: string;
  roleId: RoleId;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  timestamp: Date;
  hospitalId?: string;
}

// ---- Auth State ---------------------------------------------
export interface AuthState {
  userProfile: UserProfile | null;
  roleId: RoleId | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

// ---- Navigation Item ----------------------------------------
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  permission?: PermissionKey;
  children?: NavItem[];
  badge?: string | number;
}

// ---- Dashboard Widget Config --------------------------------
export interface WidgetConfig {
  id: string;
  title: string;
  type: 'stat' | 'chart' | 'list' | 'alert' | 'map';
  permission?: PermissionKey;
  size: 'sm' | 'md' | 'lg' | 'full';
}
