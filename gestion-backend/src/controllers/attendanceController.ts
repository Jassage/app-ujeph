import { Request, Response } from "express";
import prisma from "../prisma";

export const getAllAttendances = async (req: Request, res: Response) => {
  try {
    const attendances = await prisma.attendance.findMany();
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getAttendanceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const attendance = await prisma.attendance.findUnique({ where: { id } });
    if (!attendance) return res.status(404).json({ error: "Attendance non trouvé" });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createAttendance = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newAttendance = await prisma.attendance.create({ data });
    res.status(201).json(newAttendance);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création" });
  }
};

export const updateAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedAttendance = await prisma.attendance.update({ where: { id }, data });
    res.json(updatedAttendance);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la mise à jour" });
  }
};

export const deleteAttendance = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.attendance.delete({ where: { id } });
    res.json({ message: "Attendance supprimé" });
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la suppression" });
  }
};