"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
// src/services/emailService.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: "gfro yxde jdob tojf",
    },
});
const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || "jslnoccius@gmail.com",
            to: options.to,
            subject: options.subject,
            html: options.html,
        };
        await transporter.sendMail(mailOptions);
        console.log("Email envoyé à:", options.to);
    }
    catch (error) {
        console.error("Erreur envoi email:", error);
        throw new Error("Erreur lors de l'envoi de l'email");
    }
};
exports.sendEmail = sendEmail;
