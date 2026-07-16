// ============================================================
// PULSEGRID — SIDEBAR LAYOUT (RBAC-AWARE)
// ============================================================
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { usePermissions } from '../hooks/usePermissions';
import { ROLES } from '../permissions/roles';
import Avatar from '../components/ui/Avatar';
import type { NavItem, RoleId } from '../types';
import { ROUTES } from '../constants/routes';

// ---- Per-role nav items -------------------------------------
const NAV_ITEMS: Partial<Record<RoleId, NavItem[]>> = {
  superAdmin: [
    { label: 'Dashboard',     path: ROUTES.ADMIN_DASHBOARD,     icon: '', permission: 'VIEW_ANALYTICS' },
    { label: 'Users',         path: ROUTES.ADMIN_USERS,         icon: '', permission: 'VIEW_USERS' },
    { label: 'Hospitals',     path: ROUTES.ADMIN_HOSPITALS,     icon: '', permission: 'VIEW_HOSPITALS' },
    { label: 'Roles',         path: ROUTES.ADMIN_ROLES,         icon: '', permission: 'ASSIGN_ROLES' },
    { label: 'Audit Logs',    path: ROUTES.ADMIN_AUDIT,         icon: '', permission: 'VIEW_AUDIT_LOGS' },
    { label: 'Analytics',     path: ROUTES.ADMIN_ANALYTICS,     icon: '', permission: 'VIEW_ADVANCED_ANALYTICS' },
    { label: 'Notifications', path: ROUTES.ADMIN_NOTIFICATIONS, icon: '', permission: 'BROADCAST_ALERTS' },
    { label: 'Settings',      path: ROUTES.ADMIN_SETTINGS,      icon: '', permission: 'MANAGE_SETTINGS' },
  ],
  networkAdmin: [
    { label: 'Dashboard',     path: ROUTES.ADMIN_DASHBOARD,     icon: '' },
    { label: 'Hospitals',     path: ROUTES.ADMIN_HOSPITALS,     icon: '', permission: 'VIEW_HOSPITALS' },
    { label: 'Users',         path: ROUTES.ADMIN_USERS,         icon: '', permission: 'VIEW_USERS' },
    { label: 'Analytics',     path: ROUTES.ADMIN_ANALYTICS,     icon: '', permission: 'VIEW_ANALYTICS' },
    { label: 'Notifications', path: ROUTES.ADMIN_NOTIFICATIONS, icon: '', permission: 'SEND_NOTIFICATIONS' },
    { label: 'Settings',      path: ROUTES.ADMIN_SETTINGS,      icon: '', permission: 'VIEW_SETTINGS' },
  ],
  hospitalAdmin: [
    { label: 'Dashboard',     path: ROUTES.HOSPITAL_DASHBOARD,  icon: '' },
    { label: 'Staff',         path: ROUTES.HOSPITAL_STAFF,      icon: '', permission: 'MANAGE_HOSPITAL_STAFF' },
    { label: 'Patients',      path: ROUTES.HOSPITAL_PATIENTS,   icon: '', permission: 'VIEW_PATIENTS' },
    { label: 'Emergency Ops', path: ROUTES.HOSPITAL_EMERGENCY,  icon: '' },
    { label: 'Analytics',     path: ROUTES.HOSPITAL_ANALYTICS,  icon: '', permission: 'VIEW_ANALYTICS' },
    { label: 'Settings',      path: ROUTES.HOSPITAL_SETTINGS,   icon: '', permission: 'VIEW_SETTINGS' },
  ],
  doctor: [
    { label: 'Dashboard',     path: ROUTES.DOCTOR_DASHBOARD,     icon: '' },
    { label: 'My Patients',   path: ROUTES.DOCTOR_PATIENTS,      icon: '', permission: 'VIEW_PATIENTS' },
    { label: 'Telemedicine',  path: ROUTES.DOCTOR_TELEMEDICINE,  icon: '' },
    { label: 'Prescriptions', path: ROUTES.DOCTOR_PRESCRIPTIONS, icon: '', permission: 'WRITE_PRESCRIPTION' },
    { label: 'Diagnostics',   path: ROUTES.DOCTOR_DIAGNOSTICS,   icon: '', permission: 'ORDER_DIAGNOSTICS' },
    { label: 'Schedule',      path: ROUTES.DOCTOR_SCHEDULE,      icon: '' },
    { label: 'Emergency',     path: ROUTES.DOCTOR_EMERGENCY,     icon: '' },
  ],
  patient: [
    { label: 'Dashboard',       path: ROUTES.PATIENT_DASHBOARD,    icon: '' },
    { label: 'Health Records',  path: ROUTES.PATIENT_RECORDS,      icon: '', permission: 'READ_MEDICAL_RECORDS' },
    { label: 'Diet & Nutrition', path: ROUTES.PATIENT_NUTRITION,    icon: '' },
    { label: 'Telemedicine',    path: ROUTES.PATIENT_TELEMEDICINE, icon: '' },
    { label: 'Appointments',    path: ROUTES.PATIENT_APPOINTMENTS, icon: '' },
    { label: 'Emergency SOS',   path: ROUTES.PATIENT_EMERGENCY,    icon: '', permission: 'TRIGGER_EMERGENCY' },
    { label: 'My Profile',      path: ROUTES.PROFILE,              icon: '', permission: 'VIEW_OWN_PROFILE' },
    { label: 'Billing',         path: ROUTES.PATIENT_BILLING,      icon: '' },
  ],
  ambulanceDriver: [
    { label: 'Dashboard',     path: ROUTES.AMBULANCE_DASHBOARD,  icon: '' },
    { label: 'Live Dispatch', path: ROUTES.AMBULANCE_REQUESTS,   icon: '', permission: 'VIEW_EMERGENCY_REQUESTS' },
    { label: 'Navigation Map',path: ROUTES.AMBULANCE_MAP,        icon: '' },
  ],
  pharmacist: [
    { label: 'Dashboard',     path: ROUTES.PHARMACY_DASHBOARD,      icon: '' },
    { label: 'Inventory',     path: ROUTES.PHARMACY_INVENTORY,      icon: '' },
    { label: 'Prescriptions', path: ROUTES.PHARMACY_PRESCRIPTIONS,  icon: '', permission: 'READ_PRESCRIPTION' },
  ],
  diagnosticStaff: [
    { label: 'Dashboard',     path: ROUTES.DIAGNOSTICS_DASHBOARD,  icon: '' },
    { label: 'Orders',        path: ROUTES.DIAGNOSTICS_ORDERS,     icon: '', permission: 'VIEW_DIAGNOSTICS' },
    { label: 'Results',       path: ROUTES.DIAGNOSTICS_RESULTS,    icon: '', permission: 'UPLOAD_DIAGNOSTIC_RESULTS' },
  ],
  familyMember: [
    { label: 'Family Hub',    path: ROUTES.FAMILY_MEMBER_DASHBOARD, icon: '' },
    { label: 'My Profile',    path: ROUTES.PROFILE,                 icon: '' },
  ],
  nurse: [
    { label: 'Nurse Desk',    path: ROUTES.NURSE_DASHBOARD,         icon: '' },
    { label: 'My Patients',   path: ROUTES.DOCTOR_PATIENTS,         icon: '', permission: 'VIEW_PATIENTS' },
    { label: 'Telemedicine',  path: ROUTES.DOCTOR_TELEMEDICINE,     icon: '' },
    { label: 'Emergency',     path: ROUTES.DOCTOR_EMERGENCY,        icon: '' },
  ],
};

// Fall-through aliases
NAV_ITEMS['receptionist']     = NAV_ITEMS['hospitalAdmin'];
NAV_ITEMS['ruralVolunteer']   = NAV_ITEMS['doctor'];
NAV_ITEMS['emergencyOperator']= NAV_ITEMS['ambulanceDriver'];

// ---- Component ----------------------------------------------
const Sidebar: React.FC = () => {
  const { userProfile } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const roleId = userProfile?.roleId as RoleId;
  const navItems = NAV_ITEMS[roleId] ?? [];
  const roleDefinition = ROLES[roleId];

  const filteredItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission as Parameters<typeof hasPermission>[0])
  );

  return (
    <aside
      className={clsx(
        'flex flex-col h-full bg-gray-950 border-r border-gray-800',
        'transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-health-blue to-calm-green flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          CG
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">PulseGrid</p>
            <p className="text-xs text-gray-500 truncate">Healthcare Platform</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="text-gray-500 hover:text-white transition-colors ml-auto flex-shrink-0"
          aria-label="Toggle sidebar"
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* Role badge */}
      {!sidebarCollapsed && roleDefinition && (
        <div className="px-4 py-3 border-b border-gray-800">
          <span
            className="inline-flex text-xs font-semibold px-2.5 py-1 rounded-lg"
            style={{ color: roleDefinition.color, backgroundColor: roleDefinition.color + '20' }}
          >
            {roleDefinition.label}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'text-white bg-health-blue/20 border border-health-blue/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )
            }
            title={sidebarCollapsed ? item.label : undefined}
          >
            <span className="text-base leading-none flex-shrink-0">{item.icon}</span>
            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-800 p-3">
        <button
          className="flex items-center gap-3 w-full rounded-xl p-2 hover:bg-white/5 transition-colors text-left"
          onClick={() => navigate(ROUTES.PROFILE)}
        >
          <Avatar
            src={userProfile?.photoURL}
            name={userProfile?.displayName}
            size="sm"
            online
          />
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{userProfile?.displayName}</p>
              <p className="text-xs text-gray-500 truncate">{userProfile?.email}</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
