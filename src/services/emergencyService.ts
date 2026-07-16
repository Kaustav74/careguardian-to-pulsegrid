const API_URL = 'http://localhost:4000/api/emergency';

export async function fetchAmbulances(token: string) {
  const response = await fetch(`${API_URL}/ambulances`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch ambulances');
  }

  return data;
}

export async function triggerSOS(token: string, latitude: number, longitude: number, description?: string) {
  const response = await fetch(`${API_URL}/trigger`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ latitude, longitude, description })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to trigger SOS');
  }

  return data;
}

export async function fetchActiveEmergencies(token: string) {
  const response = await fetch(`${API_URL}/active`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch emergencies');
  }

  return data;
}

export async function updateEmergencyStatus(token: string, id: string, status?: string, ambulanceId?: string, priority?: string) {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status, ambulanceId, priority })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update emergency status');
  }

  return data;
}

export async function overrideTriage(token: string, id: string, priority: string) {
  return updateEmergencyStatus(token, id, undefined, undefined, priority);
}
