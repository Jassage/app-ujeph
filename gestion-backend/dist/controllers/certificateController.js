"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCertificate = exports.updateCertificate = exports.createCertificate = exports.getCertificateById = exports.getAllCertificates = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getAllCertificates = async (req, res) => {
    try {
        const certificates = await prisma_1.default.certificate.findMany();
        res.json(certificates);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getAllCertificates = getAllCertificates;
const getCertificateById = async (req, res) => {
    try {
        const { id } = req.params;
        const certificate = await prisma_1.default.certificate.findUnique({ where: { id } });
        if (!certificate)
            return res.status(404).json({ error: "Certificate non trouvé" });
        res.json(certificate);
    }
    catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
};
exports.getCertificateById = getCertificateById;
const createCertificate = async (req, res) => {
    try {
        const data = req.body;
        const newCertificate = await prisma_1.default.certificate.create({ data });
        res.status(201).json(newCertificate);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la création" });
    }
};
exports.createCertificate = createCertificate;
const updateCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const updatedCertificate = await prisma_1.default.certificate.update({ where: { id }, data });
        res.json(updatedCertificate);
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la mise à jour" });
    }
};
exports.updateCertificate = updateCertificate;
const deleteCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.certificate.delete({ where: { id } });
        res.json({ message: "Certificate supprimé" });
    }
    catch (error) {
        res.status(400).json({ error: "Erreur lors de la suppression" });
    }
};
exports.deleteCertificate = deleteCertificate;
