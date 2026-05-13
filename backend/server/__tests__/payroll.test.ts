import { describe, test, expect } from '@jest/globals';
import { payrollEngine } from '../lib/payrollEngine';

describe('Payroll Calculation Engine', () => {
  test('should calculate net salary correctly for standard employee', () => {
    const input = {
      baseSalary: 100000,
      overtimeHours: 10,
      allowances: 5000,
      otherDeductions: 2000
    };

    const result = payrollEngine.calculate(input);

    // Overtime: (100000/200) * 1.5 * 10 = 7500
    expect(result.overtimePay).toBe(7500);
    // EPF: 100000 * 0.08 = 8000
    expect(result.employeeEpf).toBe(8000);
    // Gross: 100000 + 7500 + 5000 = 112500
    expect(result.grossSalary).toBe(112500);
    // Net: 112500 - 8000 - 2000 = 102500
    expect(result.netSalary).toBe(102500);
  });

  test('should handle zero overtime and allowances', () => {
    const input = {
      baseSalary: 50000,
      overtimeHours: 0,
      allowances: 0,
      otherDeductions: 0
    };

    const result = payrollEngine.calculate(input);

    expect(result.overtimePay).toBe(0);
    expect(result.employeeEpf).toBe(4000);
    expect(result.netSalary).toBe(46000); // 50000 - 4000
  });
});
