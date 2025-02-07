import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface StatsCardsProps {
  totalEarnings: number;
  totalPayslips: number;
  formatCurrency: (amount: number) => string;
}

export function StatsCards({ totalEarnings, totalPayslips, formatCurrency }: StatsCardsProps) {
  return (
    <View className="flex-row p-4 space-x-4">
      <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
        <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mb-2">
          <FontAwesome name="money" size={20} color="#3b82f6" />
        </View>
        <Text className="text-sm text-gray-500">Total Earnings</Text>
        <Text className="text-lg font-semibold text-gray-800 mt-1">
          {formatCurrency(totalEarnings)}
        </Text>
      </View>
      <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
        <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mb-2">
          <FontAwesome name="file-text-o" size={20} color="#22c55e" />
        </View>
        <Text className="text-sm text-gray-500">Total Payslips</Text>
        <Text className="text-lg font-semibold text-gray-800 mt-1">
          {totalPayslips}
        </Text>
      </View>
    </View>
  );
} 