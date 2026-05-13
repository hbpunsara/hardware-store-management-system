import { Request, Response } from "express";
import { db } from "../db";
import { payrolls, payrollComponents, employees, attendance, employeeSalaryComponents } from "../../shared/schema";
import { eq, and, like } from "drizzle-orm";
import PDFDocument from "pdfkit";

import { payrollEngine } from "../lib/payrollEngine";

export const payrollController = {
  // ── GET ALL PAYROLLS (with component breakdown) ──
  async getAll(req: Request, res: Response) {
    try {
      const { month } = req.query;
      const allPayrolls = await db.select({
        id: payrolls.id,
        employeeId: payrolls.employeeId,
        name: employees.name,
        role: employees.role,
        month: payrolls.month,
        baseSalary: payrolls.baseSalary,
        overtime: payrolls.overtime,
        allowances: payrolls.allowances,
        deductions: payrolls.deductions,
        netSalary: payrolls.netSalary,
        daysWorked: payrolls.daysWorked,
        status: payrolls.status
      })
      .from(payrolls)
      .innerJoin(employees, eq(payrolls.employeeId, employees.id))
      .where(month ? eq(payrolls.month, month as string) : undefined);

      // Attach components for each payroll
      const result = [];
      for (const p of allPayrolls) {
        const components = await db.select().from(payrollComponents).where(eq(payrollComponents.payrollId, p.id));
        result.push({ ...p, components });
      }

      res.json(result);
    } catch (error) {
      console.error("getAll error:", error);
      res.status(500).json({ message: "Failed to fetch payrolls" });
    }
  },

  // ── CALCULATE ALL (uses payrollEngine + employee salary components) ──
  async calculateAll(req: Request, res: Response) {
    try {
      const { month } = req.body;
      if (!month) return res.status(400).json({ message: "Month is required" });

      const allEmployees = await db.select().from(employees);
      let created = 0;
      let skipped = 0;

      for (const emp of allEmployees) {
        // Skip if already calculated for this month
        const existing = await db.select().from(payrolls).where(
          and(eq(payrolls.employeeId, emp.id), eq(payrolls.month, month))
        );

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // Get attendance for the month
        const monthParts = month.split(' '); // "May 2026"
        const attendanceLogs = await db.select().from(attendance).where(
          eq(attendance.employeeId, emp.id)
        );
        // Filter attendance by month name
        const monthName = monthParts[0];
        const monthYear = monthParts[1];
        const monthAttendance = attendanceLogs.filter(a => {
          const d = new Date(a.date);
          const m = d.toLocaleString('en-US', { month: 'long' });
          const y = d.getFullYear().toString();
          return m === monthName && y === monthYear;
        });

        const daysWorked = monthAttendance.length || 0;
        const baseSalary = emp.basicSalary || 0;

        // Get recurring salary components for this employee
        const salaryComps = await db.select().from(employeeSalaryComponents).where(
          eq(employeeSalaryComponents.employeeId, emp.id)
        );

        let totalAllowances = 0;
        let totalOtherDeductions = 0;
        const allowanceItems: { name: string; amount: number }[] = [];
        const deductionItems: { name: string; amount: number }[] = [];

        for (const comp of salaryComps) {
          const amount = comp.amountType === "Percentage"
            ? Math.round(baseSalary * (comp.value / 100))
            : comp.value;

          if (comp.type === "Allowance") {
            totalAllowances += amount;
            allowanceItems.push({ name: comp.name, amount });
          } else if (comp.type === "Deduction") {
            totalOtherDeductions += amount;
            deductionItems.push({ name: comp.name, amount });
          }
        }

        // Calculate overtime from attendance hours
        const totalHours = monthAttendance.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
        const standardHours = daysWorked * 8;
        const overtimeHours = Math.max(0, totalHours - standardHours);

        // Run through payroll engine
        const result = payrollEngine.calculate({
          baseSalary,
          overtimeHours,
          allowances: totalAllowances,
          otherDeductions: totalOtherDeductions,
          overtimeMultiplier: emp.overtimeMultiplier || 1.5
        });

        // Insert payroll record
        const [newPayroll] = await db.insert(payrolls).values({
          employeeId: emp.id,
          month,
          baseSalary: result.baseSalary,
          overtime: result.overtimePay,
          allowances: result.allowances,
          deductions: result.employeeEpf + result.otherDeductions,
          netSalary: result.netSalary,
          daysWorked,
          status: "Pending"
        }).returning();

        // Store itemized components
        const componentRows = [
          { payrollId: newPayroll.id, name: "Employee EPF (8%)", type: "Deduction", amount: result.employeeEpf },
          { payrollId: newPayroll.id, name: "Employer EPF (12%)", type: "Employer", amount: result.employerEpf },
          { payrollId: newPayroll.id, name: "Employer ETF (3%)", type: "Employer", amount: result.employerEtf },
          ...allowanceItems.map(a => ({ payrollId: newPayroll.id, name: a.name, type: "Allowance", amount: a.amount })),
          ...deductionItems.map(d => ({ payrollId: newPayroll.id, name: d.name, type: "Deduction", amount: d.amount })),
        ];

        if (result.overtimePay > 0) {
          componentRows.push({ payrollId: newPayroll.id, name: `Overtime (${overtimeHours}h)`, type: "Earning", amount: result.overtimePay });
        }

        if (componentRows.length > 0) {
          await db.insert(payrollComponents).values(componentRows);
        }

        created++;
      }

      res.json({ message: `Calculated ${created} payrolls, ${skipped} already existed` });
    } catch (error) {
      console.error("calculateAll error:", error);
      res.status(500).json({ message: "Failed to calculate salaries" });
    }
  },

  // ── PROCESS ALL (mark Pending → Processed) ──
  async processAll(req: Request, res: Response) {
    try {
      const { month } = req.body;
      if (!month) return res.status(400).json({ message: "Month is required" });

      const pending = await db.select().from(payrolls).where(
        and(eq(payrolls.month, month), eq(payrolls.status, "Pending"))
      );

      for (const p of pending) {
        await db.update(payrolls)
          .set({ status: "Processed", paidAt: new Date().toISOString() })
          .where(eq(payrolls.id, p.id));
      }

      res.json({ message: `${pending.length} payroll(s) processed` });
    } catch (error) {
      console.error("processAll error:", error);
      res.status(500).json({ message: "Failed to process payroll" });
    }
  },

  // ── UPDATE SINGLE PAYROLL ──
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { baseSalary, overtimeHours, allowances, otherDeductions, status } = req.body;

      const result = payrollEngine.calculate({
        baseSalary: baseSalary || 0,
        overtimeHours: overtimeHours || 0,
        allowances: allowances || 0,
        otherDeductions: otherDeductions || 0
      });

      await db.update(payrolls)
        .set({
          baseSalary: result.baseSalary,
          overtime: result.overtimePay,
          allowances: result.allowances,
          deductions: result.employeeEpf + result.otherDeductions,
          netSalary: result.netSalary,
          status
        })
        .where(eq(payrolls.id, Number(id)));

      // Rebuild components
      await db.delete(payrollComponents).where(eq(payrollComponents.payrollId, Number(id)));
      const componentRows = [
        { payrollId: Number(id), name: "Employee EPF (8%)", type: "Deduction", amount: result.employeeEpf },
        { payrollId: Number(id), name: "Employer EPF (12%)", type: "Employer", amount: result.employerEpf },
        { payrollId: Number(id), name: "Employer ETF (3%)", type: "Employer", amount: result.employerEtf },
      ];
      if (result.overtimePay > 0) {
        componentRows.push({ payrollId: Number(id), name: `Overtime (${overtimeHours || 0}h)`, type: "Earning", amount: result.overtimePay });
      }
      if (componentRows.length > 0) {
        await db.insert(payrollComponents).values(componentRows);
      }

      res.json({ message: "Payroll updated" });
    } catch (error) {
      console.error("update error:", error);
      res.status(500).json({ message: "Update failed" });
    }
  },

  // ── DELETE PAYROLL FOR MONTH (recalculate) ──
  async deleteMonth(req: Request, res: Response) {
    try {
      const { month } = req.body;
      if (!month) return res.status(400).json({ message: "Month is required" });

      const existing = await db.select().from(payrolls).where(eq(payrolls.month, month));
      for (const p of existing) {
        await db.delete(payrollComponents).where(eq(payrollComponents.payrollId, p.id));
      }
      await db.delete(payrolls).where(eq(payrolls.month, month));

      res.json({ message: `Deleted payroll data for ${month}` });
    } catch (error) {
      console.error("deleteMonth error:", error);
      res.status(500).json({ message: "Failed to delete payroll" });
    }
  },

  // ── PDF PAYSLIP ──
  async getPayslip(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const [record] = await db.select({
        payroll: payrolls,
        employee: employees
      })
      .from(payrolls)
      .innerJoin(employees, eq(payrolls.employeeId, employees.id))
      .where(eq(payrolls.id, Number(id)));

      if (!record) return res.status(404).json({ message: "Payroll not found" });

      const components = await db.select().from(payrollComponents).where(eq(payrollComponents.payrollId, Number(id)));

      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=payslip-${record.employee.name}.pdf`);
      doc.pipe(res);

      doc.fontSize(20).text("HARDWARE PRO STORE", { align: "center" });
      doc.fontSize(12).text("Salary Slip", { align: "center" });
      doc.moveDown();
      doc.text(`Employee: ${record.employee.name}`);
      doc.text(`Role: ${record.employee.role}`);
      doc.text(`NIC: ${record.employee.nic || 'N/A'}`);
      doc.text(`Month: ${record.payroll.month}`);
      doc.text(`Days Worked: ${record.payroll.daysWorked}`);
      doc.moveDown();
      doc.text("--------------------------------------------");
      doc.text(`Base Salary: LKR ${record.payroll.baseSalary}`);

      // Show each component
      for (const c of components) {
        const prefix = c.type === "Deduction" ? "(-) " : c.type === "Allowance" || c.type === "Earning" ? "(+) " : "    ";
        doc.text(`${prefix}${c.name}: LKR ${c.amount}`);
      }

      doc.text("--------------------------------------------");
      doc.font('Helvetica-Bold').fontSize(14).text(`Net Salary: LKR ${record.payroll.netSalary}`);
      doc.font('Helvetica').fontSize(10);
      doc.moveDown(2);
      doc.fontSize(10).text("Authorized Signature", { align: "right" });

      doc.end();
    } catch (error) {
      console.error("getPayslip error:", error);
      res.status(500).json({ message: "PDF generation failed" });
    }
  },

  // ── EMPLOYEE SALARY CONFIG CRUD ──
  async getSalaryConfig(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const [emp] = await db.select().from(employees).where(eq(employees.id, Number(employeeId)));
      const comps = await db.select().from(employeeSalaryComponents).where(eq(employeeSalaryComponents.employeeId, Number(employeeId)));
      res.json({
        basicSalary: emp?.basicSalary || 0,
        bankName: emp?.bankName || "",
        accountNumber: emp?.accountNumber || "",
        nic: emp?.nic || "",
        overtimeMultiplier: emp?.overtimeMultiplier || 1.5,
        components: comps
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch salary config" });
    }
  },

  async updateBasicSalary(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const { basicSalary, bankName, accountNumber, nic, overtimeMultiplier } = req.body;
      await db.update(employees)
        .set({ basicSalary, bankName, accountNumber, nic, overtimeMultiplier })
        .where(eq(employees.id, Number(employeeId)));
      res.json({ message: "Employee salary info updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update" });
    }
  },

  async addSalaryComponent(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const { name, type, amountType, value } = req.body;
      const [comp] = await db.insert(employeeSalaryComponents).values({
        employeeId: Number(employeeId),
        name, type, amountType: amountType || "Fixed", value
      }).returning();
      res.json(comp);
    } catch (error) {
      res.status(500).json({ message: "Failed to add component" });
    }
  },

  async updateSalaryComponent(req: Request, res: Response) {
    try {
      const { compId } = req.params;
      const { name, type, amountType, value } = req.body;
      await db.update(employeeSalaryComponents)
        .set({ name, type, amountType, value })
        .where(eq(employeeSalaryComponents.id, Number(compId)));
      res.json({ message: "Component updated" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update component" });
    }
  },

  async deleteSalaryComponent(req: Request, res: Response) {
    try {
      const { compId } = req.params;
      await db.delete(employeeSalaryComponents).where(eq(employeeSalaryComponents.id, Number(compId)));
      res.json({ message: "Component deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete component" });
    }
  }
};
