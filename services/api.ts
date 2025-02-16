import axios from 'axios';
import { DocumentPickerResponse } from 'react-native-document-picker';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});


export const uploadPdf = async (file:any) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/upload_pdf', formData, {
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