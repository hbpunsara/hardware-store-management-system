/**
 * Payroll Calculation Engine
 * Implements standard Sri Lankan EPF/ETF and Overtime calculations
 */

export interface PayrollInput {
  baseSalary: number;
  overtimeHours: number;
  allowances: number;
  otherDeductions: number;
  overtimeMultiplier?: number;
}

export interface PayrollResult {
  baseSalary: number;
  overtimePay: number;
  allowances: number;
  employeeEpf: number; // 8%
  employerEpf: number; // 12%
  employerEtf: number; // 3%
  otherDeductions: number;
  grossSalary: number;
  netSalary: number;
}

export const payrollEngine = {
  calculate(input: PayrollInput): PayrollResult {
    const { baseSalary, overtimeHours, allowances, otherDeductions, overtimeMultiplier = 1.5 } = input;
    
    // Overtime: (Base / 200) * multiplier per hour (standard rate is 1.5)
    const overtimeRate = (baseSalary / 200) * overtimeMultiplier;
    const overtimePay = Math.round(overtimeHours * overtimeRate);

    // Statutory Deductions
    const employeeEpf = Math.round(baseSalary * 0.08);
    const employerEpf = Math.round(baseSalary * 0.12);
    const employerEtf = Math.round(baseSalary * 0.03);

    const grossSalary = baseSalary + overtimePay + allowances;
    const netSalary = grossSalary - employeeEpf - otherDeductions;

    return {
      baseSalary,
      overtimePay,
      allowances,
      employeeEpf,
      employerEpf,
      employerEtf,
      otherDeductions,
      grossSalary,
      netSalary
    };
  }
};
