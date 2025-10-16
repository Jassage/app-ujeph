import prisma from "../prisma";
export const getAllBooks = async (req, res) => {
    try {
        const books = await prisma.book.findMany();
        res.json(books);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const getBookById = async (req, res) => {
    try {
        const { id } = req.params;
        const book = await prisma.book.findUnique({ where: { id } });
        if (!book)
            return res.status(404).json({ error: "Book non trouvé" });
        res.json(book);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
export const createBook = async (req, res) => {
    try {
        const data = req.body;
        const newBook = await prisma.book.create({ data });
        res.status(201).json(newBook);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
export const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedBook = await prisma.book.update({ where: { id }, data });
        res.json(updatedBook);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
export const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.book.delete({ where: { id } });
        res.json({ message: "Book supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
//# sourceMappingURL=bookController.js.map