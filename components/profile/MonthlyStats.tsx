import { View, Text } from 'react-native';
import { MonthlyStats } from '../../types';

interface MonthlyStatsProps {
  monthlyStats: MonthlyStats[];
  formatCurrency: (amount: number) => string;
}

export function MonthlyStatsSection({ monthlyStats, formatCurrency }: MonthlyStatsProps) {
  return (
    <View className="px-4 pb-4">
      <Text className="text-lg font-semibold text-gray-800 mb-4">Monthly Statistics</Text>
      {monthlyStats.length > 0 ? (
        monthlyStats.map(({ month, total, timestamp }) => (
          <View 
            key={`${month}-${timestamp.getTime()}`}
            className="bg-white rounded-xl p-4 mb-3 shadow-sm flex-row items-center justify-between"
          >
            <View>
              <Text className="text-base font-medium text-gray-800">{month}</Text>
              <Text className="text-sm text-gray-500 mt-1">Net Salary</Text>
            </View>
            <Text className="text-lg font-semibold text-gray-800">
              {formatCurrency(total)}
            </Text>
          </View>
        ))
      ) : (
        <View className="bg-white rounded-xl p-6 items-center">
          <Text className="text-gray-500">No salary data available</Text>
        </View>
      )}
    </View>
  );
} 