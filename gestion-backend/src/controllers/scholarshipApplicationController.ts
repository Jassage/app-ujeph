import { Request, Response } from "express";
import prisma from "../prisma";

export const getAllScholarshipApplications = async (req: Request, res: Response) => {
  try {
    const scholarshipApplications = await prisma.scholarshipApplication.findMany();
    res.json(scholarshipApplications);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getScholarshipApplicationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const scholarshipApplication = await prisma.scholarshipApplication.findUnique({ where: { id } });
    if (!scholarshipApplication) return res.status(404).json({ error: "ScholarshipApplication non trouvé" });
    res.json(scholarshipApplication);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createScholarshipApplication = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newScholarshipApplication = await prisma.scholarshipApplication.create({ data });
    res.status(201).json(newScholarshipApplication);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création" });
  }
};

export const updateScholarshipApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedScholarshipApplication = await prisma.scholarshipApplication.update({ where: { id }, data });
    res.json(updatedScholarshipApplication);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la mise à jour" });
  }
};

export const deleteScholarshipApplication = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.scholarshipApplication.delete({ where: { id } });
    res.json({ message: "ScholarshipApplication supprimé" });
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la suppression" });
  }
};