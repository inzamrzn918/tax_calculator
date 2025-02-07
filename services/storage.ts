import AsyncStorage from '@react-native-async-storage/async-storage';
import { SalaryDetails, PdfFile } from '../types';

const STORAGE_KEYS = {
  PAYSLIPS: 'payslips',
  USER_SETTINGS: 'user_settings',
  USER_PROFILE: 'user_profile',
} as const;

interface UserProfile {
  name: string;
}

export class StorageService {
  static async savePayslip(payslip: PdfFile): Promise<void> {
    try {
      const existingPayslips = await this.getAllPayslips();
      
      // Check for existing payslip with same ID
      const existingIndex = existingPayslips.findIndex(p => p.id === payslip.id);
      
      let updatedPayslips: PdfFile[];
      if (existingIndex >= 0) {
        // Update existing payslip
        updatedPayslips = existingPayslips.map((p, index) => 
          index === existingIndex ? payslip : p
        );
      } else {
        // Add new payslip
        updatedPayslips = [payslip, ...existingPayslips];
      }

      // Sort payslips by date (newest first)
      updatedPayslips.sort((a, b) => {
        const aDate = new Date(a.timestamp);
        const bDate = new Date(b.timestamp);
        return bDate.getTime() - aDate.getTime();
      });

      // Save to storage
      await AsyncStorage.setItem(
        STORAGE_KEYS.PAYSLIPS, 
        JSON.stringify(updatedPayslips)
      );
    } catch (error) {
      console.error('Error saving payslip:', error);
      throw error;
    }
  }

  static async getAllPayslips(): Promise<PdfFile[]> {
    try {
      const payslipsJson = await AsyncStorage.getItem(STORAGE_KEYS.PAYSLIPS);
      if (!payslipsJson) return [];
      
      const payslips: PdfFile[] = JSON.parse(payslipsJson);
      return payslips
        .map(payslip => ({
          ...payslip,
          timestamp: new Date(payslip.timestamp)
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error getting payslips:', error);
      throw error;
    }
  }

  static async deletePayslip(payslipId: string): Promise<void> {
    try {
      const payslips = await this.getAllPayslips();
      const updatedPayslips = payslips.filter(p => p.id !== payslipId);
      await AsyncStorage.setItem(STORAGE_KEYS.PAYSLIPS, JSON.stringify(updatedPayslips));
    } catch (error) {
      console.error('Error deleting payslip:', error);
      throw error;
    }
  }

  static async updateSalaryDetails(payslipId: string, details: SalaryDetails): Promise<void> {
    try {
      const payslips = await this.getAllPayslips();
      const updatedPayslips = payslips.map(payslip => 
        payslip.id === payslipId 
          ? { ...payslip, salaryDetails: details }
          : payslip
      );
      await AsyncStorage.setItem(STORAGE_KEYS.PAYSLIPS, JSON.stringify(updatedPayslips));
    } catch (error) {
      console.error('Error updating salary details:', error);
      throw error;
    }
  }

  static async clearAllData(onCleared?: () => void): Promise<void> {
    try {
      // Clear all storage keys
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PAYSLIPS,
        STORAGE_KEYS.USER_PROFILE,
        STORAGE_KEYS.USER_SETTINGS
      ]);

      // Call the callback after successful clearing
      onCleared?.();
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  // Helper method to get total earnings for all payslips
  static async getTotalEarnings(): Promise<number> {
    try {
      const payslips = await this.getAllPayslips();
      const totalEarnings = payslips.reduce((total, payslip) => {
        const details = payslip.salaryDetails;
        if (!details) return total;

        // Calculate total earnings from all components
        const earnings = (
          (details.basicPay || 0) +
          (details.dearnessAllowance || 0) +
          (details.houseRentAllowance || 0) +
          (details.medicalAllowance || 0) +
          (details.travelAllowance || 0)
        );

        return total + earnings;
      }, 0);

      return totalEarnings;
    } catch (error) {
      console.error('Error calculating total earnings:', error);
      throw error;
    }
  }

  // Helper method to get monthly statistics
  static async getMonthlyStats(): Promise<{ month: string; total: number }[]> {
    try {
      const payslips = await this.getAllPayslips();
      const monthlyTotals = payslips.reduce((acc, payslip) => {
        const details = payslip.salaryDetails;
        if (details?.month && details?.year) {
          const key = `${details.month} ${details.year}`;
          if (!acc[key]) {
            acc[key] = {
              total: 0,
              timestamp: new Date(payslip.timestamp)
            };
          }

          // Calculate total earnings for this month
          const monthlyEarnings = (
            (details.basicPay || 0) +
            (details.dearnessAllowance || 0) +
            (details.houseRentAllowance || 0) +
            (details.medicalAllowance || 0) +
            (details.travelAllowance || 0)
          );

          acc[key].total += monthlyEarnings;
        }
        return acc;
      }, {} as Record<string, { total: number; timestamp: Date }>);

      return Object.entries(monthlyTotals)
        .map(([month, data]) => ({
          month,
          total: data.total,
          timestamp: data.timestamp
        }))
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      console.error('Error getting monthly stats:', error);
      throw error;
    }
  }

  static async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
      throw error;
    }
  }

  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  static async getAllData(): Promise<{
    payslips: PdfFile[];
    profile: UserProfile | null;
    settings: any;
  }> {
    try {
      const [payslips, profile, settings] = await Promise.all([
        this.getAllPayslips(),
        this.getUserProfile(),
        AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS)
      ]);

      return {
        payslips,
        profile,
        settings: settings ? JSON.parse(settings) : null
      };
    } catch (error) {
      console.error('Error getting all data:', error);
      throw error;
    }
  }

  static async restoreData(data: {
    payslips?: PdfFile[];
    profile?: UserProfile;
    settings?: any;
  }): Promise<void> {
    try {
      const promises = [];

      if (data.payslips) {
        promises.push(
          AsyncStorage.setItem(STORAGE_KEYS.PAYSLIPS, JSON.stringify(data.payslips))
        );
      }

      if (data.profile) {
        promises.push(
          AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(data.profile))
        );
      }

      if (data.settings) {
        promises.push(
          AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(data.settings))
        );
      }

      await Promise.all(promises);
    } catch (error) {
      console.error('Error restoring data:', error);
      throw error;
    }
  }

  static async updatePayslipStatus(
    payslipId: string, 
    status: string, 
    salaryDetails?: SalaryDetails
  ): Promise<void> {
    try {
      const payslips = await this.getAllPayslips();
      const updatedPayslips = payslips.map(payslip => 
        payslip.id === payslipId 
          ? { ...payslip, status, ...(salaryDetails && { salaryDetails }) }
          : payslip
      );
      await AsyncStorage.setItem(STORAGE_KEYS.PAYSLIPS, JSON.stringify(updatedPayslips));
    } catch (error) {
      console.error('Error updating payslip status:', error);
      throw error;
    }
  }
} 