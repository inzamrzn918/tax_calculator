import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Share } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { StorageService } from '../../services/storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { eventEmitter } from '../../services/eventEmitter';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

interface MonthlyStats {
  month: string;
  total: number;
  timestamp: Date;
}

interface UserProfile {
  name: string;
}

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: ''
  });
  const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
  const [isBackupExpanded, setIsBackupExpanded] = useState(false);
  const [isRestoreExpanded, setIsRestoreExpanded] = useState(false);

  // Load data when tab is focused
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = eventEmitter.subscribe('payslipUpdated', () => {
      setTimeout(loadInitialData, 100);
    });

    return () => unsubscribe();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [savedProfile, earnings, stats, allPayslips] = await Promise.all([
        StorageService.getUserProfile(),
        StorageService.getTotalEarnings(),
        StorageService.getMonthlyStats(),
        StorageService.getAllPayslips()
      ]);

      // Update all states at once to prevent UI flicker
      setProfile(savedProfile || { name: '' });
      setTotalEarnings(earnings);
      setMonthlyStats(stats);
      setPdfFiles(allPayslips);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!profile.name.trim()) {
        Alert.alert('Error', 'Name cannot be empty');
        return;
      }

      setIsLoading(true);
      await StorageService.saveUserProfile(profile);
      setIsEditing(false);
      await loadInitialData();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all data? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await StorageService.clearAllData();
              
              // Reset all states atomically
              setTotalEarnings(0);
              setMonthlyStats([]);
              setProfile({ name: '' });
              setPdfFiles([]);
              
              Alert.alert('Success', 'All data has been cleared');
            } catch (error) {
              console.error('Error clearing data:', error);
              Alert.alert('Error', 'Failed to clear data');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleBackupData = async () => {
    try {
      const payslips = await StorageService.getAllPayslips();
      const profile = await StorageService.getUserProfile();
      
      const backupData = {
        payslips,
        profile,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      // Convert to binary format
      const jsonString = JSON.stringify(backupData);
      const encoder = new TextEncoder();
      const binaryData = encoder.encode(jsonString);
      
      // Create backup filename
      const backupFileName = `TaxCalculator_Backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.rbs`;
      const tempFile = `${FileSystem.cacheDirectory}${backupFileName}`;
      
      // Write to temporary file
      await FileSystem.writeAsStringAsync(tempFile, jsonString, {
        encoding: FileSystem.EncodingType.UTF8
      });

      // Show styled action sheet for backup options
      Alert.alert(
        'Backup Data',
        'Choose where to save your backup',
        [
          {
            text: 'Google Drive',
            onPress: async () => {
              Alert.alert(
                'Coming Soon',
                'Google Drive backup will be available in the next update.',
                [{ text: 'OK', style: 'default' }]
              );
            }
          },
          {
            text: 'Cloud Storage',
            onPress: async () => {
              Alert.alert(
                'Coming Soon',
                'Cloud storage backup will be available in the next update.',
                [{ text: 'OK', style: 'default' }]
              );
            }
          },
          {
            text: 'Device Storage',
            onPress: async () => {
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
            }
          },
          {
            text: 'Share',
            onPress: async () => {
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
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ],
        { cancelable: true }
      );

      // Clean up temp file after delay
      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(tempFile);
        } catch (error) {
          console.error('Error cleaning up temp file:', error);
        }
      }, 1000);

    } catch (error) {
      Alert.alert(
        'Backup Failed',
        'An error occurred while preparing the backup.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleRestoreData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/octet-stream',
        copyToCacheDirectory: true
      });

      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        
        // Verify file extension
        if (!file.name.toLowerCase().endsWith('.rbs')) {
          Alert.alert('Invalid File', 'Please select a valid .rbs backup file');
          return;
        }

        // Read and parse the file
        const fileContent = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.UTF8
        });

        try {
          const data = JSON.parse(fileContent);
          
          // Validate backup data structure
          if (!data.version || !data.timestamp || !Array.isArray(data.payslips)) {
            throw new Error('Invalid backup file format');
          }

          // Show confirmation with backup details
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
                    // Restore payslips
                    if (data.payslips) {
                      for (const payslip of data.payslips) {
                        await StorageService.savePayslip(payslip);
                      }
                    }
                    
                    // Restore profile
                    if (data.profile) {
                      await StorageService.saveUserProfile(data.profile);
                    }
                    
                    await loadInitialData();
                    Alert.alert('Success', 'Data restored successfully');
                  } catch (error) {
                    console.error('Error during restore:', error);
                    Alert.alert('Error', 'Failed to restore data');
                  }
                }
              }
            ]
          );

        } catch (error) {
          Alert.alert('Error', 'Invalid backup file format');
          return;
        }
      }
    } catch (error) {
      console.error('Error restoring data:', error);
      Alert.alert('Error', 'Failed to restore data');
    }
  };

  const generateForm16 = async () => {
    try {
      const payslips = await StorageService.getAllPayslips();
      const profile = await StorageService.getUserProfile();

      if (!payslips.length) {
        Alert.alert('No Data', 'No salary data available to generate Form 16');
        return;
      }

      // Group payslips by financial year
      const payslipsByYear = payslips.reduce((acc, payslip) => {
        if (payslip.salaryDetails) {
          const { month, year } = payslip.salaryDetails;
          const financialYear = month && ['January', 'February', 'March'].includes(month) 
            ? `${year-1}-${year}` 
            : `${year}-${year+1}`;
          
          if (!acc[financialYear]) {
            acc[financialYear] = [];
          }
          acc[financialYear].push(payslip);
        }
        return acc;
      }, {} as Record<string, PdfFile[]>);

      // Generate Form 16 data
      const form16Data = Object.entries(payslipsByYear).map(([financialYear, yearPayslips]) => {
        // Sort payslips by month
        yearPayslips.sort((a, b) => {
          const months = ['April', 'May', 'June', 'July', 'August', 'September', 
                         'October', 'November', 'December', 'January', 'February', 'March'];
          const aMonth = a.salaryDetails?.month || '';
          const bMonth = b.salaryDetails?.month || '';
          return months.indexOf(aMonth) - months.indexOf(bMonth);
        });

        // Calculate totals from actual payslip data
        const totalEarnings = yearPayslips.reduce((sum, payslip) => {
          const details = payslip.salaryDetails;
          if (!details) return sum;
          return sum + (
            (details.basicPay || 0) +
            (details.dearnessAllowance || 0) +
            (details.houseRentAllowance || 0) +
            (details.medicalAllowance || 0) +
            (details.travelAllowance || 0)
          );
        }, 0);

        const totalDeductions = yearPayslips.reduce((sum, payslip) => {
          const details = payslip.salaryDetails;
          if (!details) return sum;
          return sum + (
            (details.providentFund || 0) +
            (details.professionalTax || 0) +
            (details.incomeTax || 0)
          );
        }, 0);

        const totalTaxDeducted = yearPayslips.reduce((sum, payslip) => 
          sum + (payslip.salaryDetails?.incomeTax || 0), 0);

        return {
          financialYear,
          employeeName: profile?.name || 'Not Specified',
          totalEarnings,
          totalDeductions,
          totalTaxDeducted,
          netTaxableIncome: totalEarnings - totalDeductions,
          monthlyBreakdown: yearPayslips.map(payslip => {
            const details = payslip.salaryDetails;
            return {
              month: details?.month,
              year: details?.year,
              grossSalary: details?.grossSalary,
              basicPay: details?.basicPay,
              dearnessAllowance: details?.dearnessAllowance,
              houseRentAllowance: details?.houseRentAllowance,
              medicalAllowance: details?.medicalAllowance,
              travelAllowance: details?.travelAllowance,
              providentFund: details?.providentFund,
              professionalTax: details?.professionalTax,
              incomeTax: details?.incomeTax,
              totalDeductions: details?.totalDeductions,
              netSalary: details?.netSalary
            };
          })
        };
      });

      // Generate HTML content
      const htmlContent = generateForm16HTML(form16Data);

      // Generate PDF from HTML
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Share the PDF
      await shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: `Form16_${new Date().getFullYear()}.pdf`
      });

    } catch (error) {
      console.error('Error generating Form 16:', error);
      Alert.alert('Error', 'Failed to generate Form 16');
    }
  };

  const generateForm16HTML = (data: any[]) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          @page {
            margin: 20px;
            size: A4;
          }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 20px;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }
          .section { 
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 20px;
            font-size: 12px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
          }
          th { 
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .total { 
            font-weight: bold; 
            background-color: #f8f8f8;
          }
          .subtitle { 
            color: #666; 
            font-size: 14px;
            margin: 5px 0 15px 0;
          }
          .section-title { 
            color: #2563eb;
            margin-bottom: 15px;
            font-size: 18px;
          }
          .employee-info {
            margin: 20px 0;
            padding: 15px;
            background-color: #f8fafc;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: #1e40af;">Form 16</h1>
          <h2 style="color: #3b82f6;">Tax Deduction Certificate</h2>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        ${data.map(year => `
          <div class="section">
            <h3 class="section-title">Financial Year: ${year.financialYear}</h3>
            <div class="employee-info">
              <p><strong>Employee Name:</strong> ${year.employeeName}</p>
            </div>
            
            <h4>Annual Summary</h4>
            <table>
              <tr>
                <th>Description</th>
                <th>Amount (₹)</th>
              </tr>
              <tr>
                <td>Total Earnings</td>
                <td>${year.totalEarnings.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Total Deductions</td>
                <td>${year.totalDeductions.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Net Taxable Income</td>
                <td>${year.netTaxableIncome.toLocaleString('en-IN')}</td>
              </tr>
              <tr class="total">
                <td>Total Tax Deducted</td>
                <td>${year.totalTaxDeducted.toLocaleString('en-IN')}</td>
              </tr>
            </table>

            <h4>Monthly Breakdown</h4>
            <table>
              <tr>
                <th>Month</th>
                <th>Basic</th>
                <th>DA</th>
                <th>HRA</th>
                <th>Medical</th>
                <th>Travel</th>
                <th>Gross</th>
                <th>PF</th>
                <th>PT</th>
                <th>Tax</th>
                <th>Net</th>
              </tr>
              ${year.monthlyBreakdown.map(month => `
                <tr>
                  <td>${month.month} ${month.year}</td>
                  <td>${(month.basicPay || 0).toLocaleString('en-IN')}</td>
                  <td>${(month.dearnessAllowance || 0).toLocaleString('en-IN')}</td>
                  <td>${(month.houseRentAllowance || 0).toLocaleString('en-IN')}</td>
                  <td>${(month.medicalAllowance || 0).toLocaleString('en-IN')}</td>
                  <td>${(month.travelAllowance || 0).toLocaleString('en-IN')}</td>
                  <td>${(month.grossSalary || 0).toLocaleString('en-IN')}</td>
                  <td>${(month.providentFund || 0).toLocaleString('en-IN')}</td>
                  <td>${(month.professionalTax || 0).toLocaleString('en-IN')}</td>
                  <td>${(month.incomeTax || 0).toLocaleString('en-IN')}</td>
                  <td>${(month.netSalary || 0).toLocaleString('en-IN')}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        `).join('')}
      </body>
      </html>
    `;
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {isLoading ? (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-gray-500">Loading...</Text>
        </View>
      ) : (
        <>
          {/* Profile Header */}
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
                    onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
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

          {/* Stats Cards */}
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
                {pdfFiles.length}
              </Text>
            </View>
          </View>

          {/* Monthly Statistics */}
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

          {/* Actions */}
          <View className="p-4 space-y-3">
            <TouchableOpacity 
              className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
              onPress={() => {/* Handle settings */}}
            >
              <View className="w-8 h-8 bg-gray-50 rounded-full items-center justify-center">
                <FontAwesome name="cog" size={16} color="#6b7280" />
              </View>
              <Text className="flex-1 text-base text-gray-800 ml-3">Settings</Text>
              <FontAwesome name="angle-right" size={20} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
              onPress={() => {/* Handle help */}}
            >
              <View className="w-8 h-8 bg-gray-50 rounded-full items-center justify-center">
                <FontAwesome name="question" size={16} color="#6b7280" />
              </View>
              <Text className="flex-1 text-base text-gray-800 ml-3">Help & Support</Text>
              <FontAwesome name="angle-right" size={20} color="#6b7280" />
            </TouchableOpacity>

            <View>
              <TouchableOpacity 
                className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
                onPress={() => setIsBackupExpanded(!isBackupExpanded)}
              >
                <View className="w-8 h-8 bg-green-50 rounded-full items-center justify-center">
                  <FontAwesome name="download" size={16} color="#22c55e" />
                </View>
                <Text className="flex-1 text-base text-gray-800 ml-3">Backup Data</Text>
                <FontAwesome 
                  name={isBackupExpanded ? "angle-down" : "angle-right"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>

              {isBackupExpanded && (
                <View className="mt-2 space-y-2">
                  <TouchableOpacity 
                    className="bg-white rounded-xl p-4 ml-6 flex-row items-center"
                    onPress={async () => {
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
                    onPress={async () => {
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

            <View>
              <TouchableOpacity 
                className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
                onPress={() => setIsRestoreExpanded(!isRestoreExpanded)}
              >
                <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center">
                  <FontAwesome name="upload" size={16} color="#3b82f6" />
                </View>
                <Text className="flex-1 text-base text-gray-800 ml-3">Restore Data</Text>
                <FontAwesome 
                  name={isRestoreExpanded ? "angle-down" : "angle-right"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>

              {isRestoreExpanded && (
                <View className="mt-2 space-y-2">
                  <TouchableOpacity 
                    className="bg-white rounded-xl p-4 ml-6 flex-row items-center"
                    onPress={async () => {
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
                    onPress={async () => {
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
                                      
                                      await loadInitialData();
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

            <TouchableOpacity 
              className="bg-white rounded-xl p-4 shadow-sm flex-row items-center"
              onPress={generateForm16}
            >
              <View className="w-8 h-8 bg-purple-50 rounded-full items-center justify-center">
                <FontAwesome name="file-text" size={16} color="#9333ea" />
              </View>
              <Text className="flex-1 text-base text-gray-800 ml-3">Export Form 16</Text>
              <FontAwesome name="angle-right" size={20} color="#6b7280" />
            </TouchableOpacity>

            <TouchableOpacity 
              className="bg-red-50 rounded-xl p-4 flex-row items-center"
              onPress={handleClearData}
            >
              <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center">
                <FontAwesome name="trash" size={16} color="#ef4444" />
              </View>
              <Text className="flex-1 text-base text-red-600 ml-3">Clear All Data</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
} 