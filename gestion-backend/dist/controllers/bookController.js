"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBook = exports.updateBook = exports.createBook = exports.getBookById = exports.getAllBooks = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllBooks = async (req, res) => {
    try {
        const books = await prisma_1.default.book.findMany();
        res.json(books);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllBooks = getAllBooks;
const getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        const book = await prisma_1.default.book.findUnique({ where: { id } });
        if (!book)
            return res.status(404).json({ error: "Book non trouvé" });
        res.json(book);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getBookById = getBookById;
const createBook = async (req, res) => {
    try {
        const data = req.body;
        const newBook = await prisma_1.default.book.create({ data });
        res.status(201).json(newBook);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createBook = createBook;
const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedBook = await prisma_1.default.book.update({ where: { id }, data });
        res.json(updatedBook);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateBook = updateBook;
const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.book.delete({ where: { id } });
        res.json({ message: "Book supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteBook = deleteBook;
