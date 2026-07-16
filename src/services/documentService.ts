import type { MedicalDocument } from '../types';

const API_URL = 'http://localhost:4000/api/documents';

export async function fetchPatientDocuments(token: string): Promise<MedicalDocument[]> {
  const response = await fetch(`${API_URL}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch documents');
  }

  return data as MedicalDocument[];
}

export async function uploadMedicalDocument(token: string, file: File, fileType: string, notes?: string): Promise<MedicalDocument> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);
  if (notes) {
    formData.append('notes', notes);
  }

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload document');
  }

  return data as MedicalDocument;
}
