import path from "path";
import { PrismaClient } from "../generated/prisma"; // Adjust the import path as necessary
const certPath = path.join(process.cwd(), "certs", "ca.pem");
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + "&sslaccept=accept_invalid_certs",
    },
  },
  log: ["query", "info", "warn", "error"],
});

export async function testDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Connected to Aiven MySQL successfully");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

export default prisma;
