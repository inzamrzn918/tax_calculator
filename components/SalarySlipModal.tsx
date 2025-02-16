import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, GestureResponderEvent } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SalaryDetails } from '@/types';
import { StorageService } from '@/services/storage';


interface PdfFile {
  id: string;
  name: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  timestamp: Date;
  size?: string;
  pages?: number;
}

interface Props {
  isVisible: boolean;
  onClose: () => void;
  file: PdfFile;
  onDiscard?: (fileId: string) => void;
  onSave?: (fileId: string, updatedDetails: SalaryDetails) => void;
}

export default function SalarySlipModal({ isVisible, onClose, file, onDiscard, onSave }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [salaryDetails, setSalaryDetails] = useState<SalaryDetails | null>(null);
  const [pdfFile, setPdfFile] = useState<PdfFile | null>(null);
  const [loading, setLoading] = useState(true);
  
  

  useEffect(() => {
    
    if (isVisible) {
      const fetchSalarySlipData = async () => {
        try {
          const sal = await StorageService.getSalarySlipData(file.id);
          if (sal == null || sal.salaryDetails == undefined) {
            setLoading(false);
            return;
          }
          setPdfFile(sal)
          setSalaryDetails(sal?.salaryDetails)
          setLoading(false)
          console.log(sal);
        } catch (error) {
          console.error('Error fetching salary slip data:', error);
        }
      };

      fetchSalarySlipData();
    }
  }, [isVisible, file.id]);


  const saveSalaryDetails = async () => {
    if (!salaryDetails) return;
    try {
      await AsyncStorage.setItem(`salary_${file.id}`, JSON.stringify(salaryDetails));
      onSave?.(file.id, salaryDetails);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving salary details:', error);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '---';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const renderDetailRow = (label: string, value: string | number | undefined, field: keyof SalaryDetails) => (
    <View className="flex-row py-3 border-b border-gray-100 items-center min-h-[48px]">
      <Text className="text-gray-600 flex-1 mr-4" numberOfLines={2}>
        {label}
      </Text>
      {isEditing ? (
        <TextInput
          className="w-32 px-3 py-2 bg-white rounded-lg text-right font-medium text-gray-800 border border-blue-200 shadow-sm"
          value={String(salaryDetails?.[field] || '')}
          keyboardType="numeric"
          onChangeText={(text) => {
            setSalaryDetails(prev => ({
              ...prev!,
              [field]: text ? Number(text) : undefined
            }));
          }}
          placeholderTextColor="#94a3b8"
          placeholder="Enter amount"
          selectTextOnFocus
        />
      ) : (
        <Text className="font-medium text-gray-800 text-right flex-shrink-0">
          {typeof value === 'number' ? formatCurrency(value) : '---'}
        </Text>
      )}
    </View>
  );

  async function handleDiscard(event: GestureResponderEvent): Promise<void> {
    if (pdfFile?.id && onDiscard) {
      try {
        await onDiscard(pdfFile.id);
      } catch (error) {
        console.error('Error discarding PDF:', error);
      }
    } else {
      console.warn('PDF file ID is undefined or onDiscard is not provided.');
    }
  }

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[80%]">
          <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
            <View>
              <Text className="text-xl font-bold text-gray-800">Salary Details</Text>
              <Text className="text-sm text-gray-500">{salaryDetails?.month} {salaryDetails?.year}</Text>
            </View>
            <View className="flex-row items-center">
              {isEditing ? (
                <>
                  <TouchableOpacity onPress={() => setIsEditing(false)} className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-2">
                    <FontAwesome name="times" size={16} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveSalaryDetails} className="w-8 h-8 rounded-full bg-green-100 items-center justify-center">
                    <FontAwesome name="check" size={16} color="#22c55e" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity onPress={() => setIsEditing(true)} className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2">
                    <FontAwesome name="pencil" size={16} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={onClose} className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                    <FontAwesome name="close" size={16} color="#666" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {loading ? (
            <View className="p-6 items-center justify-center">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-gray-500 mt-2">Loading salary details...</Text>
            </View>
          ) : (
            <ScrollView className="p-4">
              <View className="bg-blue-50 p-4 rounded-lg mb-4">
                <Text className="text-sm text-blue-600 mb-1">Net Salary</Text>
                <Text className="text-2xl font-bold text-blue-700">
                  {formatCurrency(salaryDetails?.netSalary)}
                </Text>
              </View>

              <Text className="text-lg font-semibold text-gray-800 mb-3">Earnings</Text>
              {renderDetailRow("Basic Pay", salaryDetails?.basicPay, "basicPay")}
              {renderDetailRow("Dearness Allowance", salaryDetails?.dearnessAllowance, "dearnessAllowance")}
              {renderDetailRow("House Rent Allowance", salaryDetails?.houseRentAllowance, "houseRentAllowance")}
              {renderDetailRow("Medical Allowance", salaryDetails?.medicalAllowance, "medicalAllowance")}
              {renderDetailRow("Travel Allowance", salaryDetails?.travelAllowance, "travelAllowance")}
              {renderDetailRow("Gross Salary", salaryDetails?.grossSalary, "grossSalary")}

              <Text className="text-lg font-semibold text-gray-800 mt-4 mb-3">Deductions</Text>
              {renderDetailRow("Provident Fund", salaryDetails?.providentFund, "providentFund")}
              {renderDetailRow("Professional Tax", salaryDetails?.professionalTax, "professionalTax")}
              {renderDetailRow("Income Tax", salaryDetails?.incomeTax, "incomeTax")}
              {renderDetailRow("Total Deductions", salaryDetails?.totalDeductions, "totalDeductions")}

              {!isEditing ? (
              <div>
                <View className="mb-4">
                  <Text className="text-xs text-gray-500">File Details</Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Uploaded {file.timestamp.toLocaleDateString()}
                  </Text>
                  <Text className="text-sm text-gray-600">Size: {file.size}</Text>
                  <Text className="text-sm text-gray-600">Pages: {file.pages}</Text>
                </View>

                <View className="mb-8">
                  <TouchableOpacity
                    onPress={handleDiscard}
                    className="p-3 rounded-lg bg-red-50 flex-row items-center justify-center"
                  >
                    <FontAwesome name="trash" size={16} color="#ef4444" />
                    <Text className="ml-2 text-red-600 font-medium">
                      Discard PDF
                    </Text>
                  </TouchableOpacity>
                </View>
              </div>
            ) : (
              <TouchableOpacity
                onPress={handleDiscard}
                className="p-3 rounded-lg bg-red-50 flex-row items-center justify-center"
              >
                <FontAwesome name="trash" size={16} color="#ef4444" />
                <Text className="ml-2 text-red-600 font-medium">
                  Discard PDF
                </Text>
            </TouchableOpacity>

            )}

            <View className="h-6" />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

