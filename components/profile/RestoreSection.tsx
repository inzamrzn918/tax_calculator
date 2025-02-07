import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { StorageService } from '../../services/storage';

interface RestoreSectionProps {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  onRestoreComplete: () => Promise<void>;
}

export function RestoreSection({ 
  isExpanded, 
  setIsExpanded,
  onRestoreComplete
}: RestoreSectionProps) {
  return (
    <View>
      <TouchableOpacity 
        className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center">
          <FontAwesome name="upload" size={16} color="#3b82f6" />
        </View>
        <Text className="flex-1 text-base text-gray-800 ml-3">Restore Data</Text>
        <FontAwesome 
          name={isExpanded ? "angle-down" : "angle-right"} 
          size={20} 
          color="#6b7280" 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View className="mt-2 space-y-2">
          <TouchableOpacity 
            className="bg-white rounded-xl p-4 ml-6 flex-row items-center"
            onPress={() => {
              Alert.alert(
                'Coming Soon',
                'Google Drive restore will be available in the next update.',
                [{ text: 'OK', style: 'default' }]
              );
            }}
          >
            <View className="w-8 h-8 bg-red-50 rounded-full items-center justify-center">
              <FontAwesome name="google" size={16} color="#ef4444" />
            </View>
            <Text className="flex-1 text-base text-gray-800 ml-3">From Google Drive</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white rounded-xl p-4 ml-6 flex-row items-center"
            onPress={() => {
              Alert.alert(
                'Coming Soon',
                'Cloud storage restore will be available in the next update.',
                [{ text: 'OK', style: 'default' }]
              );
            }}
          >
            <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center">
              <FontAwesome name="cloud" size={16} color="#3b82f6" />
            </View>
            <Text className="flex-1 text-base text-gray-800 ml-3">From Cloud Storage</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white rounded-xl p-4 ml-6 flex-row items-center"
            onPress={async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  type: 'application/octet-stream',
                  copyToCacheDirectory: true
                });

                if (result.assets && result.assets[0]) {
                  const file = result.assets[0];
                  
                  if (!file.name.toLowerCase().endsWith('.rbs')) {
                    Alert.alert('Invalid File', 'Please select a valid .rbs backup file');
                    return;
                  }

                  const fileContent = await FileSystem.readAsStringAsync(file.uri, {
                    encoding: FileSystem.EncodingType.UTF8
                  });

                  try {
                    const data = JSON.parse(fileContent);
                    
                    if (!data.version || !data.timestamp || !Array.isArray(data.payslips)) {
                      throw new Error('Invalid backup file format');
                    }

                    Alert.alert(
                      'Restore Backup',
                      `This backup is from ${new Date(data.timestamp).toLocaleDateString()}\n` +
                      `Contains ${data.payslips.length} payslips\n` +
                      'Do you want to restore this backup?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Restore',
                          onPress: async () => {
                            try {
                              if (data.payslips) {
                                for (const payslip of data.payslips) {
                                  await StorageService.savePayslip(payslip);
                                }
                              }
                              
                              if (data.profile) {
                                await StorageService.saveUserProfile(data.profile);
                              }
                              
                              await onRestoreComplete();
                              Alert.alert('Success', 'Data restored successfully');
                            } catch (error) {
                              Alert.alert('Error', 'Failed to restore data');
                            }
                          }
                        }
                      ]
                    );
                  } catch (error) {
                    Alert.alert('Error', 'Invalid backup file format');
                  }
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to restore data');
              }
            }}
          >
            <View className="w-8 h-8 bg-yellow-50 rounded-full items-center justify-center">
              <FontAwesome name="folder" size={16} color="#eab308" />
            </View>
            <Text className="flex-1 text-base text-gray-800 ml-3">From Device Storage</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
} 