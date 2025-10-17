"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBookLoan = exports.updateBookLoan = exports.createBookLoan = exports.getBookLoanById = exports.getAllBookLoans = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllBookLoans = async (req, res) => {
    try {
        const bookLoans = await prisma_1.default.bookLoan.findMany();
        res.json(bookLoans);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllBookLoans = getAllBookLoans;
const getBookLoanById = async (req, res) => {
    try {
        const { id } = req.params;
        const bookLoan = await prisma_1.default.bookLoan.findUnique({ where: { id } });
        if (!bookLoan)
            return res.status(404).json({ error: "BookLoan non trouvé" });
        res.json(bookLoan);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getBookLoanById = getBookLoanById;
const createBookLoan = async (req, res) => {
    try {
        const data = req.body;
        const newBookLoan = await prisma_1.default.bookLoan.create({ data });
        res.status(201).json(newBookLoan);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createBookLoan = createBookLoan;
const updateBookLoan = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedBookLoan = await prisma_1.default.bookLoan.update({ where: { id }, data });
        res.json(updatedBookLoan);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateBookLoan = updateBookLoan;
const deleteBookLoan = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.bookLoan.delete({ where: { id } });
        res.json({ message: "BookLoan supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteBookLoan = deleteBookLoan;
