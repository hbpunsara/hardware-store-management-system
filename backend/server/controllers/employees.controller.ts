import { Request, Response } from "express";
import { storage } from "../storage";

function toEmployeeRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    department: row.department,
    status: row.status ?? "Absent",
    checkIn: row.checkIn ?? "-",
    checkOut: row.checkOut ?? "-",
    hours: row.hours ?? "-",
    avatar: row.avatar ?? (row.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)),
    basicSalary: row.basicSalary ?? 0,
    bankName: row.bankName ?? "",
    accountNumber: row.accountNumber ?? "",
    nic: row.nic ?? "",
  };
}

export const employeesController = {
  getAll: async (_req: Request, res: Response) => {
    const rows = await storage.getAllEmployees();
    res.json(rows.map(toEmployeeRow));
  },

  create: async (req: Request, res: Response) => {
    const { name, role, department, basicSalary, bankName, accountNumber, nic } = req.body;
    if (!name || !role || !department) {
      return res.status(400).json({ message: "Missing required fields: name, role, department" });
    }
    const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
    const row = await storage.createEmployee({
      name: String(name),
      role: String(role),
      department: String(department),
      status: "Absent",
      checkIn: "-",
      checkOut: "-",
      hours: "-",
      avatar: initials,
      basicSalary: basicSalary ? Number(basicSalary) : 0,
      bankName: bankName ? String(bankName) : "",
      accountNumber: accountNumber ? String(accountNumber) : "",
      nic: nic ? String(nic) : "",
    });
    res.status(201).json(toEmployeeRow(row));
  },

  update: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid employee id" });
    }
    const { status, checkIn, checkOut, hours, name, role, department, basicSalary, bankName, accountNumber, nic } = req.body;
    const updateData: Record<string, unknown> = {};
    if (status != null) updateData.status = String(status);
    if (checkIn != null) updateData.checkIn = String(checkIn);
    if (checkOut != null) updateData.checkOut = String(checkOut);
    if (hours != null) updateData.hours = String(hours);
    if (name != null) updateData.name = String(name);
    if (role != null) updateData.role = String(role);
    if (department != null) updateData.department = String(department);
    if (basicSalary != null) updateData.basicSalary = Number(basicSalary);
    if (bankName != null) updateData.bankName = String(bankName);
    if (accountNumber != null) updateData.accountNumber = String(accountNumber);
    if (nic != null) updateData.nic = String(nic);

    const row = await storage.updateEmployee(id, updateData);
    if (!row) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(toEmployeeRow(row));
  },

  delete: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid employee id" });
    }
    const deleted = await storage.deleteEmployee(id);
    if (!deleted) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.status(204).send();
  },
};
