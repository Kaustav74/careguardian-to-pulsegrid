// ============================================================
// PULSEGRID — USER SERVICE (LOCAL BACKEND)
// ============================================================
import type { UserProfile, RoleId } from '../types';
import { useAuthStore } from '../store/authStore';

const API_URL = 'http://localhost:4000/api/users';

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_URL}/${uid}`, { headers: getHeaders() });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch user profile');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  const response = await fetch(`${API_URL}/${uid}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update user profile');
  }
}

export async function getUsersByRole(roleId: RoleId): Promise<UserProfile[]> {
  const response = await fetch(`${API_URL}?roleId=${roleId}`, { headers: getHeaders() });
  if (!response.ok) {
    throw new Error('Failed to fetch users by role');
  }
  return await response.json();
}
