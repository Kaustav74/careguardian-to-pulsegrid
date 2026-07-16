// ============================================================
// PULSEGRID — ROLE DEFINITIONS + RBAC MAP
// ============================================================
import type { RoleDefinition, RoleId, PermissionKey } from '../types';
import { Permission } from '../constants/permissions';

// All permissions set (for superAdmin full access)
const ALL_PERMISSIONS: PermissionKey[] = Object.values(Permission);

// ---- Role definitions ----------------------------------------
export const ROLES: Record<RoleId, RoleDefinition> = {
  superAdmin: {
    id: 'superAdmin',
    label: 'Super Admin',
    description: 'Full system access across all organizations',
    permissions: ALL_PERMISSIONS,
    color: '#7c3aed',
    icon: 'ShieldCheckIcon',
    dashboardPath: '/admin/dashboard',
  },

  networkAdmin: {
    id: 'networkAdmin',
    label: 'Network Admin',
    description: 'Manages a network of hospitals and organizations',
    permissions: [
      Permission.MANAGE_USERS, Permission.VIEW_USERS, Permission.APPROVE_USERS, Permission.ASSIGN_ROLES,
      Permission.MANAGE_HOSPITALS, Permission.VIEW_HOSPITALS, Permission.MANAGE_HOSPITAL_STAFF,
      Permission.VIEW_PATIENTS, Permission.VIEW_ANALYTICS, Permission.VIEW_ADVANCED_ANALYTICS,
      Permission.VIEW_AUDIT_LOGS, Permission.SEND_NOTIFICATIONS, Permission.BROADCAST_ALERTS,
      Permission.VIEW_NOTIFICATIONS, Permission.VIEW_SETTINGS, Permission.MANAGE_SETTINGS,
      Permission.VIEW_EMERGENCY_REQUESTS,
    ],
    parentRoles: ['superAdmin'],
    color: '#0891b2',
    icon: 'BuildingOffice2Icon',
    dashboardPath: '/admin/dashboard',
  },

  hospitalAdmin: {
    id: 'hospitalAdmin',
    label: 'Hospital Admin',
    description: 'Manages a single hospital and its staff',
    permissions: [
      Permission.VIEW_USERS, Permission.MANAGE_HOSPITAL_STAFF, Permission.APPROVE_USERS,
      Permission.VIEW_HOSPITALS, Permission.VIEW_PATIENTS, Permission.MANAGE_PATIENTS,
      Permission.VIEW_ANALYTICS, Permission.VIEW_SETTINGS, Permission.MANAGE_SETTINGS,
      Permission.VIEW_NOTIFICATIONS, Permission.SEND_NOTIFICATIONS,
      Permission.VIEW_EMERGENCY_REQUESTS, Permission.VIEW_AUDIT_LOGS,
    ],
    color: '#0284c7',
    icon: 'BuildingOfficeIcon',
    dashboardPath: '/hospital/dashboard',
  },

  doctor: {
    id: 'doctor',
    label: 'Doctor',
    description: 'Licensed medical practitioner with patient care access',
    permissions: [
      Permission.VIEW_PATIENTS, Permission.READ_MEDICAL_RECORDS, Permission.WRITE_MEDICAL_RECORDS,
      Permission.WRITE_PRESCRIPTION, Permission.READ_PRESCRIPTION,
      Permission.ORDER_DIAGNOSTICS, Permission.VIEW_DIAGNOSTICS,
      Permission.VIEW_OWN_PROFILE, Permission.EDIT_OWN_PROFILE,
      Permission.VIEW_NOTIFICATIONS, Permission.TRIGGER_EMERGENCY,
    ],
    color: '#0d9488',
    icon: 'UserIcon',
    dashboardPath: '/doctor/dashboard',
  },

  nurse: {
    id: 'nurse',
    label: 'Nurse',
    description: 'Nursing staff with patient monitoring access',
    permissions: [
      Permission.VIEW_PATIENTS, Permission.READ_MEDICAL_RECORDS, Permission.WRITE_MEDICAL_RECORDS,
      Permission.READ_PRESCRIPTION, Permission.VIEW_DIAGNOSTICS,
      Permission.VIEW_OWN_PROFILE, Permission.EDIT_OWN_PROFILE,
      Permission.VIEW_NOTIFICATIONS, Permission.TRIGGER_EMERGENCY,
    ],
    color: '#0891b2',
    icon: 'HeartIcon',
    dashboardPath: '/nurse/dashboard',
  },

  receptionist: {
    id: 'receptionist',
    label: 'Receptionist',
    description: 'Front desk and appointment management',
    permissions: [
      Permission.VIEW_PATIENTS, Permission.MANAGE_PATIENTS,
      Permission.VIEW_OWN_PROFILE, Permission.EDIT_OWN_PROFILE,
      Permission.VIEW_NOTIFICATIONS,
    ],
    color: '#7c3aed',
    icon: 'ClipboardDocumentListIcon',
    dashboardPath: '/hospital/dashboard',
  },

  ambulanceDriver: {
    id: 'ambulanceDriver',
    label: 'Ambulance Driver',
    description: 'Emergency transport responder',
    permissions: [
      Permission.MANAGE_AMBULANCE, Permission.RESPOND_EMERGENCY,
      Permission.VIEW_EMERGENCY_REQUESTS,
      Permission.VIEW_OWN_PROFILE, Permission.EDIT_OWN_PROFILE,
      Permission.VIEW_NOTIFICATIONS,
    ],
    color: '#dc2626',
    icon: 'TruckIcon',
    dashboardPath: '/ambulance/dashboard',
  },

  pharmacist: {
    id: 'pharmacist',
    label: 'Pharmacist',
    description: 'Medication dispensing and prescription management',
    permissions: [
      Permission.READ_PRESCRIPTION, Permission.DISPENSE_MEDICATION,
      Permission.VIEW_OWN_PROFILE, Permission.EDIT_OWN_PROFILE,
      Permission.VIEW_NOTIFICATIONS,
    ],
    color: '#16a34a',
    icon: 'BeakerIcon',
    dashboardPath: '/pharmacy/dashboard',
  },

  diagnosticStaff: {
    id: 'diagnosticStaff',
    label: 'Diagnostic Staff',
    description: 'Lab and imaging professionals',
    permissions: [
      Permission.VIEW_DIAGNOSTICS, Permission.UPLOAD_DIAGNOSTIC_RESULTS,
      Permission.VIEW_OWN_PROFILE, Permission.EDIT_OWN_PROFILE,
      Permission.VIEW_NOTIFICATIONS,
    ],
    color: '#d97706',
    icon: 'MicroscopeIcon',
    dashboardPath: '/diagnostics/dashboard',
  },

  ruralVolunteer: {
    id: 'ruralVolunteer',
    label: 'Rural Healthcare Volunteer',
    description: 'Last-mile healthcare access in rural areas',
    permissions: [
      Permission.VIEW_PATIENTS, Permission.TRIGGER_EMERGENCY,
      Permission.VIEW_OWN_PROFILE, Permission.EDIT_OWN_PROFILE,
      Permission.VIEW_NOTIFICATIONS,
    ],
    color: '#65a30d',
    icon: 'GlobeAltIcon',
    dashboardPath: '/doctor/dashboard',
  },

  patient: {
    id: 'patient',
    label: 'Patient',
    description: 'Individual receiving healthcare services',
    permissions: [
      Permission.VIEW_OWN_PROFILE, Permission.EDIT_OWN_PROFILE,
      Permission.READ_MEDICAL_RECORDS, Permission.READ_PRESCRIPTION,
      Permission.VIEW_DIAGNOSTICS, Permission.TRIGGER_EMERGENCY,
      Permission.VIEW_NOTIFICATIONS, Permission.MANAGE_FAMILY_LINKS,
    ],
    color: '#2563eb',
    icon: 'UserCircleIcon',
    dashboardPath: '/patient/dashboard',
  },

  familyMember: {
    id: 'familyMember',
    label: 'Family Member',
    description: 'Authorized family contact for a patient',
    permissions: [
      Permission.VIEW_OWN_PROFILE, Permission.EDIT_OWN_PROFILE,
      Permission.VIEW_FAMILY_MEMBER_RECORDS,
      Permission.TRIGGER_EMERGENCY,
      Permission.VIEW_NOTIFICATIONS,
    ],
    color: '#db2777',
    icon: 'UsersIcon',
    dashboardPath: '/family/dashboard',
  },

  emergencyOperator: {
    id: 'emergencyOperator',
    label: 'Emergency Operator',
    description: 'Coordinates emergency dispatch and response',
    permissions: [
      Permission.VIEW_EMERGENCY_REQUESTS, Permission.RESPOND_EMERGENCY,
      Permission.MANAGE_AMBULANCE, Permission.SEND_NOTIFICATIONS, Permission.BROADCAST_ALERTS,
      Permission.VIEW_OWN_PROFILE, Permission.VIEW_NOTIFICATIONS,
    ],
    color: '#dc2626',
    icon: 'PhoneIcon',
    dashboardPath: '/ambulance/dashboard',
  },

  pending: {
    id: 'pending',
    label: 'Pending Approval',
    description: 'Awaiting admin approval',
    permissions: [],
    color: '#9ca3af',
    icon: 'ClockIcon',
    dashboardPath: '/pending-approval',
  },
};

// ---- Helper utilities ----------------------------------------

/**
 * Get all permissions for a role including inherited parent permissions.
 */
export function getEffectivePermissions(roleId: RoleId): PermissionKey[] {
  const role = ROLES[roleId];
  if (!role) return [];

  const permSet = new Set<PermissionKey>(role.permissions);

  if (role.parentRoles) {
    for (const parentId of role.parentRoles) {
      const parentPerms = getEffectivePermissions(parentId);
      parentPerms.forEach(p => permSet.add(p));
    }
  }

  return Array.from(permSet);
}

/**
 * Check if a role has a specific permission.
 */
export function roleHasPermission(roleId: RoleId, permission: PermissionKey): boolean {
  const perms = getEffectivePermissions(roleId);
  return perms.includes(permission);
}

/**
 * Get ordered role hierarchy (higher authority first).
 */
export const ROLE_HIERARCHY: RoleId[] = [
  'superAdmin',
  'networkAdmin',
  'hospitalAdmin',
  'emergencyOperator',
  'doctor',
  'nurse',
  'receptionist',
  'pharmacist',
  'diagnosticStaff',
  'ambulanceDriver',
  'ruralVolunteer',
  'patient',
  'familyMember',
  'pending',
];
