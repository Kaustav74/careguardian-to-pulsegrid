// ============================================================
// PULSEGRID — AUDIT LOG SERVICE (LOCAL BACKEND)
// ============================================================
import type { AuditLogEntry } from '../types';
import { useAuthStore } from '../store/authStore';

const API_URL = 'http://localhost:4000/api/audit-logs';

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export async function createAuditLog(
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await fetch(`${API_URL}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        action,
        resourceType,
        resourceId,
        details,
      }),
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}

export async function getRecentAuditLogs(limitCount: number = 50): Promise<AuditLogEntry[]> {
  try {
    const response = await fetch(`${API_URL}?limit=${limitCount}`, { headers: getHeaders() });
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return await response.json();
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}
