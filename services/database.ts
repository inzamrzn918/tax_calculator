import AsyncStorage from '@react-native-async-storage/async-storage';
import { SalaryDetails, PdfFile } from '../types';

const STORAGE_KEY = 'pdf_files';

export const initDatabase = async () => {
  try {
    const existingData = await AsyncStorage.getItem(STORAGE_KEY);
    if (!existingData) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    throw error;
  }
};

export const savePdfFile = async (file: PdfFile) => {
  try {
    const existingData = await AsyncStorage.getItem(STORAGE_KEY);
    const files: PdfFile[] = existingData ? JSON.parse(existingData) : [];
    
    const fileIndex = files.findIndex(f => f.id === file.id);
    if (fileIndex >= 0) {
      files[fileIndex] = file;
    } else {
      files.unshift(file);
    }
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    return file;
  } catch (error) {
    console.error('Error saving PDF file:', error);
    throw error;
  }
};

export const getAllPdfFiles = async (): Promise<PdfFile[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const files: PdfFile[] = data ? JSON.parse(data) : [];
    return files.map(file => ({
      ...file,
      timestamp: new Date(file.timestamp)
    }));
  } catch (error) {
    console.error('Error fetching PDF files:', error);
    throw error;
  }
};

export const deletePdfFile = async (fileId: string): Promise<void> => {
  try {
    const existingData = await AsyncStorage.getItem(STORAGE_KEY);
    const files: PdfFile[] = existingData ? JSON.parse(existingData) : [];
    const updatedFiles = files.filter(file => file.id !== fileId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
  } catch (error) {
    console.error('Error deleting PDF file:', error);
    throw error;
  }
};

export const updateSalaryDetails = async (fileId: string, details: SalaryDetails): Promise<void> => {
  try {
    const existingData = await AsyncStorage.getItem(STORAGE_KEY);
    const files: PdfFile[] = existingData ? JSON.parse(existingData) : [];
    
    const updatedFiles = files.map(file => 
      file.id === fileId 
        ? { ...file, salaryDetails: details }
        : file
    );
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFiles));
  } catch (error) {
    console.error('Error updating salary details:', error);
    throw error;
  }
}; 