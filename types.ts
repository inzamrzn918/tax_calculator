export interface SalaryDetails {
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

export interface PdfFile {
  id: string;
  name: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  timestamp: Date;
  size?: string;
  pages?: number;
  salaryDetails?: SalaryDetails;
}

export interface SQLiteTransaction {
  executeSql: (
    sqlStatement: string,
    args?: any[],
    callback?: (transaction: SQLiteTransaction, resultSet: SQLiteResultSet) => void,
    errorCallback?: (transaction: SQLiteTransaction, error: Error) => void
  ) => void;
}

export interface SQLiteResultSet {
  insertId: number;
  rowsAffected: number;
  rows: {
    length: number;
    item: (index: number) => any;
    _array: any[];
  };
} 