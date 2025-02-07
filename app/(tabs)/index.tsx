import { View, FlatList, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { FontAwesome } from '@expo/vector-icons';
import SalarySlipModal from '../../components/SalarySlipModal';
import { initDatabase, getAllPdfFiles, savePdfFile, deletePdfFile, updateSalaryDetails } from '../../services/database';
import { SalaryDetails, PdfFile } from '../../types';
import { StorageService } from '../../services/storage';
import { eventEmitter } from '../../services/eventEmitter';
import { useFocusEffect } from '@react-navigation/native';

export default function Index() {
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<PdfFile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadPayslips = async () => {
    try {
      const files = await StorageService.getAllPayslips();
      setPdfFiles(files);
    } catch (error) {
      console.error('Error loading payslips:', error);
    }
  };

  // Load data when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadPayslips();
    }, [])
  );

  const generateUniqueId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8); // 6 character random string
    return `${timestamp}-${random}`;
  };

  const handleFileUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
      });

      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        const newFile: PdfFile = {
          id: generateUniqueId(),
          name: file.name,
          status: 'uploading',
          timestamp: new Date(),
          size: formatFileSize(file.size || 0),
          pages: Math.floor(Math.random() * 20) + 1,
        };
        
        // Only update local state initially
        setPdfFiles(prev => [newFile, ...prev]);
        
        setTimeout(async () => {
          try {
            const processedData = await simulateProcessPDF(file);
            const updatedFile = { 
              ...newFile, 
              status: 'completed',
              salaryDetails: processedData 
            };
            
            // Save to storage
            await StorageService.savePayslip(updatedFile);
            
            // Refresh the entire list from storage
            const updatedFiles = await StorageService.getAllPayslips();
            setPdfFiles(updatedFiles);

            // Notify profile page
            eventEmitter.emit('payslipUpdated');

            Alert.alert('Success', 'Payslip processed successfully');

          } catch (error) {
            console.error('Error processing PDF:', error);
            const failedFile = { ...newFile, status: 'error' };
            
            // Save failed state
            await StorageService.savePayslip(failedFile);
            
            // Refresh the entire list from storage
            const updatedFiles = await StorageService.getAllPayslips();
            setPdfFiles(updatedFiles);

            Alert.alert('Error', 'Failed to process payslip');
          }
        }, 2000);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to upload document');
    }
  };

  // Simulate PDF processing - this would be replaced with actual API call
  const simulateProcessPDF = async (file: DocumentPicker.DocumentAsset): Promise<SalaryDetails> => {
    // Extract month and year from filename (assuming format: Salary_March_2024.pdf)
    const fileNameParts = file.name.replace('.pdf', '').split('_');
    const month = fileNameParts[1] || 'Unknown';
    const year = parseInt(fileNameParts[2]) || new Date().getFullYear();

    // Simulate API response with random variations
    const baseSalary = 45000 + Math.floor(Math.random() * 5000);
    const daPercentage = 0.2;
    const hraPercentage = 0.12;

    const dearnessAllowance = Math.floor(baseSalary * daPercentage);
    const houseRentAllowance = Math.floor(baseSalary * hraPercentage);
    const medicalAllowance = 2000;
    const travelAllowance = 1500;

    const grossSalary = baseSalary + dearnessAllowance + houseRentAllowance + 
                       medicalAllowance + travelAllowance;

    const pfPercentage = 0.12;
    const providentFund = Math.floor(baseSalary * pfPercentage);
    const professionalTax = 200;
    const incomeTax = Math.floor(grossSalary * 0.1);
    const totalDeductions = providentFund + professionalTax + incomeTax;

    return {
      basicPay: baseSalary,
      dearnessAllowance,
      houseRentAllowance,
      medicalAllowance,
      travelAllowance,
      grossSalary,
      providentFund,
      professionalTax,
      incomeTax,
      totalDeductions,
      netSalary: grossSalary - totalDeductions,
      month,
      year,
    };
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'text-blue-500';
      case 'processing':
        return 'text-yellow-500';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const renderItem = ({ item }: { item: PdfFile }) => (
    <TouchableOpacity 
      className="flex-row p-4 bg-white rounded-xl mb-3 shadow-sm border border-gray-100"
      onPress={() => {
        if (item.status === 'completed') {
          setSelectedFile(item);
          setModalVisible(true);
        }
      }}
    >
      <View className="w-12 h-12 bg-blue-50 rounded-lg items-center justify-center">
        <FontAwesome name="file-pdf-o" size={24} color="#3b82f6" />
      </View>
      <View className="flex-1 ml-4 justify-center">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-semibold text-gray-800 flex-1" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-xs text-gray-400 ml-2">
            {formatDate(item.timestamp)}
          </Text>
        </View>
        <View className="flex-row items-center mt-1">
          <View className={`w-2 h-2 rounded-full mr-2 ${
            item.status === 'uploading' ? 'bg-blue-500' :
            item.status === 'processing' ? 'bg-yellow-500' :
            item.status === 'completed' ? 'bg-green-500' :
            'bg-red-500'
          }`} />
          <Text className={`text-sm ${getStatusColor(item.status)}`}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
          {item.size && (
            <>
              <Text className="text-gray-400 mx-2">•</Text>
              <Text className="text-sm text-gray-500">{item.size}</Text>
            </>
          )}
          {item.pages && (
            <>
              <Text className="text-gray-400 mx-2">•</Text>
              <Text className="text-sm text-gray-500">{item.pages} pages</Text>
            </>
          )}
        </View>
      </View>
      {item.status === 'completed' && (
        <View className="justify-center">
          <FontAwesome name="check-circle" size={24} color="#22c55e" />
        </View>
      )}
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View className="flex-row items-center justify-between mb-3">
      <Text className="text-base font-semibold text-gray-800">
        Recent Uploads
      </Text>
      {pdfFiles.length > 0 && (
        <Text className="text-sm text-gray-500">
          {pdfFiles.length} {pdfFiles.length === 1 ? 'file' : 'files'}
        </Text>
      )}
    </View>
  );

  const handleDiscardPdf = async (fileId: string) => {
    try {
      await StorageService.deletePayslip(fileId);
      setPdfFiles(prev => prev.filter(file => file.id !== fileId));
    } catch (error) {
      console.error('Error discarding PDF:', error);
    }
  };

  const handleSaveSalaryDetails = async (fileId: string, updatedDetails: SalaryDetails) => {
    try {
      await StorageService.updateSalaryDetails(fileId, updatedDetails);
      setPdfFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, salaryDetails: updatedDetails }
          : file
      ));
    } catch (error) {
      console.error('Error updating salary details:', error);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-5">
        <TouchableOpacity 
          className="bg-white border-2 border-dashed border-blue-300 rounded-xl p-6 items-center justify-center"
          onPress={handleFileUpload}
        >
          <View className="w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4">
            <FontAwesome name="cloud-upload" size={32} color="#3b82f6" />
          </View>
          <Text className="text-lg font-semibold text-gray-800 mb-1">
            Upload PDF File
          </Text>
          <Text className="text-sm text-gray-500 text-center">
            Tap to browse or drop your files here
          </Text>
        </TouchableOpacity>
      </View>

      {pdfFiles.length > 0 ? (
        <View className="flex-1 px-5">
          <FlatList
            data={pdfFiles}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={ListHeader}
          />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="text-base text-gray-400 text-center">
            No PDFs uploaded yet
          </Text>
        </View>
      )}

      {selectedFile && (
        <SalarySlipModal
          isVisible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedFile(null);
          }}
          file={selectedFile}
          onDiscard={handleDiscardPdf}
          onSave={handleSaveSalaryDetails}
        />
      )}
    </View>
  );
}
