import { Request, Response } from "express";
import  prisma  from "../prisma";

export const getAllBookLoans = async (req: Request, res: Response) => {
  try {
    const bookLoans = await prisma.bookLoan.findMany();
    res.json(bookLoans);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const getBookLoanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const bookLoan = await prisma.bookLoan.findUnique({ where: { id } });
    if (!bookLoan) return res.status(404).json({ error: "BookLoan non trouvé" });
    res.json(bookLoan);
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const createBookLoan = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const newBookLoan = await prisma.bookLoan.create({ data });
    res.status(201).json(newBookLoan);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la création" });
  }
};

export const updateBookLoan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updatedBookLoan = await prisma.bookLoan.update({ where: { id }, data });
    res.json(updatedBookLoan);
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la mise à jour" });
  }
};

export const deleteBookLoan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.bookLoan.delete({ where: { id } });
    res.json({ message: "BookLoan supprimé" });
  } catch (error) {
    res.status(400).json({ error: "Erreur lors de la suppression" });
  }
};