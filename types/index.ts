export interface UserProfile {
  name: string;
}

export interface MonthlyStats {
  month: string;
  total: number;
  timestamp: Date;
}

export interface SalaryDetails {
  month?: string;
  year?: number;
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
}

export interface PdfFile {
  id: string;
  name: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  timestamp: Date;
  size?: string;
  pages?: number;
  salaryDetails?: SalaryDetails;
} 