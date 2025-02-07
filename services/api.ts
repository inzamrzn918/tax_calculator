import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

export const uploadPdf = async (file: UploadFile) => {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: 'application/pdf'
  } as any);

  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading PDF:', error);
    throw error;
  }
};

export const getPdfList = async () => {
  try {
    const response = await api.get('/pdfs');
    return response.data;
  } catch (error) {
    console.error('Error fetching PDF list:', error);
    throw error;
  }
}; 