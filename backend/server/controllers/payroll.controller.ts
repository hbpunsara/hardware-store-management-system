import { Request, Response } from "express";
import { storage } from "../storage";

export const payrollController = {
    getAll: async (req: Request, res: Response) => {
        try {
            const month = req.query.month as string | undefined;
            const rows = await storage.getAllPayrolls(month);
            const result = rows.map(r => ({
                id: r.id,
                employeeId: r.employeeId,
                name: r.employee.name,
                role: r.employee.role,
                month: r.month,
                baseSalary: Number(r.baseSalary),
                overtime: Number(r.overtime),
                allowances: Number(r.allowances),
                deductions: Number(r.deductions),
                netSalary: Number(r.netSalary),
                daysWorked: r.daysWorked,
                status: r.status,
            }));
            res.json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to fetch payrolls" });
        }
    },

    calculateAll: async (req: Request, res: Response) => {
        try {
            const { month } = req.body;
            if (!month) {
                return res.status(400).json({ message: "Month is required" });
            }

            // Check if already calculated for this month
            const existing = await storage.getAllPayrolls(month);
            if (existing.length > 0) {
                return res.status(400).json({ message: "Payroll for this month is already generated" });
            }

            const employees = await storage.getAllEmployees();
            const activeEmployees = employees.filter(e => e.status !== "Inactive");

            for (const emp of activeEmployees) {
                // Mock default salaries based on role or simple logic
                const baseSalary = emp.role === "Supervisor" ? 65000 : emp.role === "Accountant" ? 60000 : emp.role === "Stock Manager" ? 55000 : 45000;
                const overtime = 0;
                const allowances = 5000;
                const deductions = 2500;
                const netSalary = baseSalary + overtime + allowances - deductions;

                await storage.createPayroll({
                    employeeId: emp.id,
                    month: month,
                    baseSalary: baseSalary,
                    overtime: overtime,
                    allowances: allowances,
                    deductions: deductions,
                    netSalary: netSalary,
                    daysWorked: 20,
                    status: "Pending",
                });
            }

            const rows = await storage.getAllPayrolls(month);
            const result = rows.map(r => ({
                id: r.id,
                employeeId: r.employeeId,
                name: r.employee.name,
                role: r.employee.role,
                month: r.month,
                baseSalary: Number(r.baseSalary),
                overtime: Number(r.overtime),
                allowances: Number(r.allowances),
                deductions: Number(r.deductions),
                netSalary: Number(r.netSalary),
                daysWorked: r.daysWorked,
                status: r.status,
            }));
            res.status(201).json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to calculate payrolls" });
        }
    },

    processAll: async (req: Request, res: Response) => {
        try {
            const { month } = req.body;
            if (!month) {
                return res.status(400).json({ message: "Month is required" });
            }
            const records = await storage.getAllPayrolls(month);
            for (const record of records) {
                if (record.status !== "Processed") {
                    await storage.updatePayroll(record.id, { status: "Processed" });
                }
            }
            res.json({ message: "Payroll processed successfully" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: "Failed to process payrolls" });
        }
    }
};
