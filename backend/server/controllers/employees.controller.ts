import { Request, Response } from "express";
import { storage } from "../storage";

function toEmployeeRow(row: { id: number; name: string; role: string; department: string; status?: string | null; checkIn?: string | null; checkOut?: string | null; hours?: string | null; avatar?: string | null }) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    department: row.department,
    status: row.status ?? "Absent",
    checkIn: row.checkIn ?? "-",
    checkOut: row.checkOut ?? "-",
    hours: row.hours ?? "-",
    avatar: row.avatar ?? (row.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)),
  };
}

export const employeesController = {
  getAll: async (_req: Request, res: Response) => {
    const rows = await storage.getAllEmployees();
    res.json(rows.map(toEmployeeRow));
  },

  create: async (req: Request, res: Response) => {
    const { name, role, department } = req.body;
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
    });
    res.status(201).json(toEmployeeRow(row));
  },

  update: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid employee id" });
    }
    const { status, checkIn, checkOut, hours } = req.body;
    const updateData: Record<string, unknown> = {};
    if (status != null) updateData.status = String(status);
    if (checkIn != null) updateData.checkIn = String(checkIn);
    if (checkOut != null) updateData.checkOut = String(checkOut);
    if (hours != null) updateData.hours = String(hours);
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
