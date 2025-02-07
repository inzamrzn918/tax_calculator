import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useState } from 'react';

interface SalaryDetails {
  basicPay?: number;
  dearnessAllowance?: number;
  houseRentAllowance?: number;
  medicalAllowance?: number;
  travelAllowance?: number;
  grossSalary?: number;
  providentFund?: number;
  professionalTax?: number;
  incomeTax?: number;
  totalDeductions?: number;
  netSalary?: number;
  month?: string;
  year?: number;
}

interface PdfFile {
  id: string;
  name: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  timestamp: Date;
  size?: string;
  pages?: number;
  salaryDetails?: SalaryDetails;
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
  const [editedDetails, setEditedDetails] = useState<SalaryDetails | undefined>(file.salaryDetails);

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '---';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleDiscard = () => {
    Alert.alert(
      "Discard PDF",
      "Are you sure you want to discard this salary slip? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Discard", 
          style: "destructive",
          onPress: () => {
            onDiscard?.(file.id);
            onClose();
          }
        }
      ]
    );
  };

  const handleSave = () => {
    if (editedDetails) {
      onSave?.(file.id, editedDetails);
      setIsEditing(false);
    }
  };

  const renderDetailRow = (label: string, value: string | number | undefined, field: keyof SalaryDetails) => (
    <View className="flex-row py-3 border-b border-gray-100 items-center min-h-[48px]">
      <Text className="text-gray-600 flex-1 mr-4" numberOfLines={2}>
        {label}
      </Text>
      {isEditing ? (
        <TextInput
          className="w-32 px-3 py-2 bg-white rounded-lg text-right font-medium text-gray-800 border border-blue-200 shadow-sm"
          value={String(editedDetails?.[field] || '')}
          keyboardType="numeric"
          onChangeText={(text) => {
            setEditedDetails(prev => ({
              ...prev,
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

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[80%]">
          <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
            <View>
              <Text className="text-xl font-bold text-gray-800">Salary Details</Text>
              <Text className="text-sm text-gray-500">
                {file.salaryDetails?.month} {file.salaryDetails?.year}
              </Text>
            </View>
            <View className="flex-row items-center">
              {isEditing ? (
                <>
                  <TouchableOpacity
                    onPress={() => setIsEditing(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-2"
                  >
                    <FontAwesome name="times" size={16} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    className="w-8 h-8 rounded-full bg-green-100 items-center justify-center"
                  >
                    <FontAwesome name="check" size={16} color="#22c55e" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2"
                  >
                    <FontAwesome name="pencil" size={16} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={onClose}
                    className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                  >
                    <FontAwesome name="close" size={16} color="#666" />
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <ScrollView className="p-4">
            <View className="bg-blue-50 p-4 rounded-lg mb-4">
              <Text className="text-sm text-blue-600 mb-1">Net Salary</Text>
              <Text className="text-2xl font-bold text-blue-700">
                {formatCurrency(file.salaryDetails?.netSalary)}
              </Text>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-3">Earnings</Text>
              {renderDetailRow("Basic Pay", editedDetails?.basicPay, "basicPay")}
              {renderDetailRow("Dearness Allowance", editedDetails?.dearnessAllowance, "dearnessAllowance")}
              {renderDetailRow("House Rent Allowance", editedDetails?.houseRentAllowance, "houseRentAllowance")}
              {renderDetailRow("Medical Allowance", editedDetails?.medicalAllowance, "medicalAllowance")}
              {renderDetailRow("Travel Allowance", editedDetails?.travelAllowance, "travelAllowance")}
              <View className="bg-gray-50 mt-2 p-3 rounded">
                {renderDetailRow("Gross Salary", editedDetails?.grossSalary, "grossSalary")}
              </View>
            </View>

            <View className="mb-6">
              <Text className="text-lg font-semibold text-gray-800 mb-3">Deductions</Text>
              {renderDetailRow("Provident Fund", editedDetails?.providentFund, "providentFund")}
              {renderDetailRow("Professional Tax", editedDetails?.professionalTax, "professionalTax")}
              {renderDetailRow("Income Tax", editedDetails?.incomeTax, "incomeTax")}
              <View className="bg-gray-50 mt-2 p-3 rounded">
                {renderDetailRow("Total Deductions", editedDetails?.totalDeductions, "totalDeductions")}
              </View>
            </View>

            {/* File details - only show when not editing */}
            {!isEditing ? (
              <>
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
              </>
            ) : (
              <View className="mt-6 mb-8">
                <TouchableOpacity
                  onPress={handleSave}
                  className="p-4 rounded-lg bg-blue-500 flex-row items-center justify-center"
                >
                  <FontAwesome name="check" size={16} color="#fff" />
                  <Text className="ml-2 text-white font-medium">
                    Save Changes
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="h-6" />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
} 