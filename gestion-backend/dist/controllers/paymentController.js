"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePayment = exports.updatePayment = exports.createPayment = exports.getPaymentById = exports.getAllPayments = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllPayments = async (req, res) => {
    try {
        const payments = await prisma_1.default.payment.findMany();
        res.json(payments);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllPayments = getAllPayments;
const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await prisma_1.default.payment.findUnique({ where: { id } });
        if (!payment)
            return res.status(404).json({ error: "Payment non trouvé" });
        res.json(payment);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getPaymentById = getPaymentById;
const createPayment = async (req, res) => {
    try {
        const data = req.body;
        const newPayment = await prisma_1.default.payment.create({ data });
        res.status(201).json(newPayment);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createPayment = createPayment;
const updatePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedPayment = await prisma_1.default.payment.update({ where: { id }, data });
        res.json(updatedPayment);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updatePayment = updatePayment;
const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.payment.delete({ where: { id } });
        res.json({ message: "Payment supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deletePayment = deletePayment;
