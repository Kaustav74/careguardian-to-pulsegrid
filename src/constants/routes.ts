// ============================================================
// PULSEGRID — ROUTE CONSTANTS
// ============================================================
export const ROUTES = {
  // Public
  HOME:            '/',
  LOGIN:           '/login',
  REGISTER:        '/register',
  ABOUT:           '/about',
  CONTACT:         '/contact',
  FORGOT_PASSWORD: '/forgot-password',
  UNAUTHORIZED:    '/unauthorized',
  PENDING_APPROVAL:'/pending-approval',
  PROFILE:         '/profile',
  NOT_FOUND:       '*',

  // Super Admin
  ADMIN:                '/admin',
  ADMIN_DASHBOARD:      '/admin/dashboard',
  ADMIN_USERS:          '/admin/users',
  ADMIN_HOSPITALS:      '/admin/hospitals',
  ADMIN_ROLES:          '/admin/roles',
  ADMIN_AUDIT:          '/admin/audit-logs',
  ADMIN_SETTINGS:       '/admin/settings',
  ADMIN_ANALYTICS:      '/admin/analytics',
  ADMIN_NOTIFICATIONS:  '/admin/notifications',

  // Hospital Admin
  HOSPITAL:             '/hospital',
  HOSPITAL_DASHBOARD:   '/hospital/dashboard',
  HOSPITAL_STAFF:       '/hospital/staff',
  HOSPITAL_PATIENTS:    '/hospital/patients',
  HOSPITAL_ANALYTICS:   '/hospital/analytics',
  HOSPITAL_SETTINGS:    '/hospital/settings',

  DOCTOR:               '/doctor',
  DOCTOR_DASHBOARD:     '/doctor/dashboard',
  DOCTOR_PATIENTS:      '/doctor/patients',
  DOCTOR_PRESCRIPTIONS: '/doctor/prescriptions',
  DOCTOR_DIAGNOSTICS:   '/doctor/diagnostics',
  DOCTOR_SCHEDULE:      '/doctor/schedule',
  DOCTOR_TELEMEDICINE:  '/doctor/telemedicine',
  DOCTOR_EMERGENCY:     '/doctor/emergency',

  PATIENT:              '/patient',
  PATIENT_DASHBOARD:    '/patient/dashboard',
  PATIENT_PROFILE:      '/patient/profile',
  PATIENT_RECORDS:      '/patient/records',
  PATIENT_APPOINTMENTS: '/patient/appointments',
  PATIENT_EMERGENCY:    '/patient/emergency',
  PATIENT_TELEMEDICINE: '/patient/telemedicine',
  PATIENT_BILLING:      '/patient/billing',
  PATIENT_NUTRITION:    '/patient/nutrition',

  // Ambulance
  AMBULANCE:            '/ambulance',
  AMBULANCE_DASHBOARD:  '/ambulance/dashboard',
  AMBULANCE_OPERATOR:   '/ambulance/operator',
  AMBULANCE_REQUESTS:   '/ambulance/requests',
  AMBULANCE_MAP:        '/ambulance/map',

  PHARMACY:              '/pharmacy',
  PHARMACY_DASHBOARD:    '/pharmacy/dashboard',
  PHARMACY_PRESCRIPTIONS:'/pharmacy/prescriptions',
  PHARMACY_INVENTORY:    '/pharmacy/inventory',

  // Hospital (extra)
  HOSPITAL_EMERGENCY:    '/hospital/emergency',
  HOSPITAL_SCHEDULE:     '/hospital/schedule',

  // Diagnostics
  DIAGNOSTICS:          '/diagnostics',
  DIAGNOSTICS_DASHBOARD:'/diagnostics/dashboard',
  DIAGNOSTICS_ORDERS:   '/diagnostics/orders',
  DIAGNOSTICS_RESULTS:  '/diagnostics/results',

  // Family Member
  FAMILY_MEMBER:           '/family',
  FAMILY_MEMBER_DASHBOARD: '/family/dashboard',

  // Nurse
  NURSE:                   '/nurse',
  NURSE_DASHBOARD:         '/nurse/dashboard',
} as const;

export type RouteKey = keyof typeof ROUTES;
