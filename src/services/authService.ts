// ============================================================
// PULSEGRID — AUTHENTICATION SERVICE (LOCAL BACKEND)
// ============================================================
import type { UserProfile, RoleId } from '../types';

const API_URL = 'http://localhost:4000/api/auth';

export async function loginWithEmail(email: string, password: string): Promise<{ token: string; profile: UserProfile }> {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  return { token: data.token, profile: data.user as UserProfile };
}

export async function registerWithRole(formData: FormData): Promise<{ status: string }> {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    body: formData, // Sending multipart/form-data for files + data
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  return { status: data.status };
}

export async function fetchUserProfile(token: string): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch profile');
  }

  return data as UserProfile;
}

export async function fetchFullProfile(token: string): Promise<UserProfile> {
  const response = await fetch('http://localhost:4000/api/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch full profile');
  }

  return data as UserProfile;
}

export async function updateProfile(token: string, payload: Partial<UserProfile>): Promise<UserProfile> {
  const response = await fetch('http://localhost:4000/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update profile');
  }

  return data as UserProfile;
}

export function logout(): void {
  // Client-side logout clears token in Zustand store.
  // No server-side session to destroy in stateless JWT.
}
