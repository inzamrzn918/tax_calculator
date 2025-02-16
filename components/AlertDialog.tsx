import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ visible, title, message, onConfirm, onCancel }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black bg-opacity-50">
        <View className="w-80 bg-white rounded-lg p-5">
          <Text className="text-lg font-semibold mb-3">{title}</Text>
          <Text className="text-gray-700 mb-5">{message}</Text>
          <View className="flex-row justify-end">
            <TouchableOpacity onPress={onCancel} className="mr-4">
              <Text className="text-blue-500">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm}>
              <Text className="text-blue-500">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomAlert;
