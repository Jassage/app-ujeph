"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testDatabaseConnection = testDatabaseConnection;
const path_1 = __importDefault(require("path"));
const prisma_1 = require("../generated/prisma"); // Adjust the import path as necessary
const certPath = path_1.default.join(process.cwd(), "certs", "ca.pem");
const prisma = new prisma_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL + "&sslaccept=accept_invalid_certs",
        },
    },
    log: ["query", "info", "warn", "error"],
});
async function testDatabaseConnection() {
    try {
        await prisma.$queryRaw `SELECT 1`;
        console.log("✅ Connected to Aiven MySQL successfully");
        return true;
    }
    catch (error) {
        console.error("❌ Database connection failed:", error);
        return false;
    }
}
exports.default = prisma;
