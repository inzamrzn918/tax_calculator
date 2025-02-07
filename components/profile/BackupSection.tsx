import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { shareAsync } from 'expo-sharing';

interface BackupSectionProps {
  isExpanded: boolean;
  setIsExpanded: (value: boolean) => void;
  tempFile?: string;
  backupFileName?: string;
}

export function BackupSection({ 
  isExpanded, 
  setIsExpanded,
  tempFile,
  backupFileName
}: BackupSectionProps) {
  return (
    <View>
      <TouchableOpacity 
        className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View className="w-8 h-8 bg-green-50 rounded-full items-center justify-center">
          <FontAwesome name="download" size={16} color="#22c55e" />
        </View>
        <Text className="flex-1 text-base text-gray-800 ml-3">Backup Data</Text>
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
                'Google Drive backup will be available in the next update.',
                [{ text: 'OK', style: 'default' }]
              );
            }}
          >
            <View className="w-8 h-8 bg-red-50 rounded-full items-center justify-center">
              <FontAwesome name="google" size={16} color="#ef4444" />
            </View>
            <Text className="flex-1 text-base text-gray-800 ml-3">Google Drive</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white rounded-xl p-4 ml-6 flex-row items-center"
            onPress={() => {
              Alert.alert(
                'Coming Soon',
                'Cloud storage backup will be available in the next update.',
                [{ text: 'OK', style: 'default' }]
              );
            }}
          >
            <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center">
              <FontAwesome name="cloud" size={16} color="#3b82f6" />
            </View>
            <Text className="flex-1 text-base text-gray-800 ml-3">Cloud Storage</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white rounded-xl p-4 ml-6 flex-row items-center"
            onPress={async () => {
              if (!tempFile || !backupFileName) return;
              
              try {
                const downloadDir = FileSystem.documentDirectory + 'Downloads/';
                const dirInfo = await FileSystem.getInfoAsync(downloadDir);
                if (!dirInfo.exists) {
                  await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
                }
                
                const destinationUri = downloadDir + backupFileName;
                await FileSystem.copyAsync({
                  from: tempFile,
                  to: destinationUri
                });

                Alert.alert(
                  'Backup Successful',
                  `Your backup has been saved to Downloads as:\n${backupFileName}`,
                  [{ text: 'OK', style: 'default' }]
                );
              } catch (error) {
                Alert.alert(
                  'Backup Failed',
                  'Unable to save backup file to device storage.',
                  [{ text: 'OK', style: 'default' }]
                );
              }
            }}
          >
            <View className="w-8 h-8 bg-yellow-50 rounded-full items-center justify-center">
              <FontAwesome name="folder" size={16} color="#eab308" />
            </View>
            <Text className="flex-1 text-base text-gray-800 ml-3">Device Storage</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-white rounded-xl p-4 ml-6 flex-row items-center"
            onPress={async () => {
              if (!tempFile || !backupFileName) return;
              
              try {
                await shareAsync(tempFile, {
                  mimeType: 'application/octet-stream',
                  UTI: 'com.taxcalculator.rbs',
                  dialogTitle: backupFileName
                });
              } catch (error) {
                Alert.alert(
                  'Share Failed',
                  'Unable to share backup file.',
                  [{ text: 'OK', style: 'default' }]
                );
              }
            }}
          >
            <View className="w-8 h-8 bg-purple-50 rounded-full items-center justify-center">
              <FontAwesome name="share-alt" size={16} color="#9333ea" />
            </View>
            <Text className="flex-1 text-base text-gray-800 ml-3">Share</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
} 