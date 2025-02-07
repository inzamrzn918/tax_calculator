import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { UserProfile } from '../../types';

interface ProfileHeaderProps {
  profile: UserProfile;
  isEditing: boolean;
  setIsEditing: (value: boolean) => void;
  setProfile: (profile: UserProfile) => void;
  handleSaveProfile: () => void;
}

export function ProfileHeader({ 
  profile, 
  isEditing, 
  setIsEditing, 
  setProfile, 
  handleSaveProfile 
}: ProfileHeaderProps) {
  return (
    <View className="bg-white p-6 shadow-sm">
      <View className="items-center">
        <View className="w-24 h-24 bg-blue-50 rounded-full items-center justify-center mb-4">
          <FontAwesome name="user" size={40} color="#3b82f6" />
        </View>
        {isEditing ? (
          <View className="w-full max-w-xs">
            <TextInput
              className="text-xl text-center font-semibold text-gray-800 border-b border-gray-200 p-2 mb-4"
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="Enter your name"
              autoFocus
            />
            <TouchableOpacity
              className="mt-6 bg-blue-500 rounded-lg py-3 px-4"
              onPress={handleSaveProfile}
            >
              <Text className="text-white text-center font-medium">Save Profile</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            onPress={() => setIsEditing(true)}
            className="items-center"
          >
            <Text className="text-xl font-semibold text-gray-800">
              {profile.name || 'Add Name'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
} 