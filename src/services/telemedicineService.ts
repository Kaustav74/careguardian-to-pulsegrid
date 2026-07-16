import type { TelemedicineAppointment } from '../types';

const API_URL = 'http://localhost:4000/api/telemedicine';

export async function fetchDoctors(token: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/doctors`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch doctors');
  }

  return data;
}

export async function fetchTelemedicineAppointments(token: string): Promise<TelemedicineAppointment[]> {
  const response = await fetch(`${API_URL}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch appointments');
  }

  return data as TelemedicineAppointment[];
}

export async function fetchTelemedicineAppointment(token: string, id: string): Promise<TelemedicineAppointment> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch appointment');
  }

  return data as TelemedicineAppointment;
}

export async function scheduleTelemedicineAppointment(
  token: string, 
  patientId: string, 
  doctorId: string, 
  scheduledTime: Date, 
  notes?: string
): Promise<TelemedicineAppointment> {
  const response = await fetch(`${API_URL}/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ patientId, doctorId, scheduledTime, notes })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to schedule appointment');
  }

  return data as TelemedicineAppointment;
}

export async function updateTelemedicineStatus(
  token: string, 
  id: string, 
  status: 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
): Promise<TelemedicineAppointment> {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update status');
  }

  return data as TelemedicineAppointment;
}
