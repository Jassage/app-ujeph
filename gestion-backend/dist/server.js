"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("./prisma");
// Import de toutes les routes générées (adapte les chemins si besoin)
const studentRoutes_1 = __importDefault(require("./routes/studentRoutes"));
const professeurRoutes_1 = __importDefault(require("./routes/professeurRoutes"));
const enrollmentRoutes_1 = __importDefault(require("./routes/enrollmentRoutes"));
const guardianRoutes_1 = __importDefault(require("./routes/guardianRoutes"));
const uERoutes_1 = __importDefault(require("./routes/uERoutes"));
const prerequisiteRoutes_1 = __importDefault(require("./routes/prerequisiteRoutes"));
const gradeRoutes_1 = __importDefault(require("./routes/gradeRoutes"));
const retakeRoutes_1 = __importDefault(require("./routes/retakeRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const facultyRoutes_1 = __importDefault(require("./routes/facultyRoutes"));
const facultyLevelRoutes_1 = __importDefault(require("./routes/facultyLevelRoutes"));
const scheduleRoutes_1 = __importDefault(require("./routes/scheduleRoutes"));
const attendanceRoutes_1 = __importDefault(require("./routes/attendanceRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const expenseRoutes_1 = __importDefault(require("./routes/expenseRoutes"));
const bookRoutes_1 = __importDefault(require("./routes/bookRoutes"));
const bookLoanRoutes_1 = __importDefault(require("./routes/bookLoanRoutes"));
const transcriptRoutes_1 = __importDefault(require("./routes/transcriptRoutes"));
const messageRoutes_1 = __importDefault(require("./routes/messageRoutes"));
const messageAttachmentRoutes_1 = __importDefault(require("./routes/messageAttachmentRoutes"));
// import eventRoutes from "./routes/eventRoutes";
const eventParticipantRoutes_1 = __importDefault(require("./routes/eventParticipantRoutes"));
const announcementRoutes_1 = __importDefault(require("./routes/announcementRoutes"));
const announcementAttachmentRoutes_1 = __importDefault(require("./routes/announcementAttachmentRoutes"));
const scholarshipRoutes_1 = __importDefault(require("./routes/scholarshipRoutes"));
const scholarshipApplicationRoutes_1 = __importDefault(require("./routes/scholarshipApplicationRoutes"));
const scholarshipDocumentRoutes_1 = __importDefault(require("./routes/scholarshipDocumentRoutes"));
const roomRoutes_1 = __importDefault(require("./routes/roomRoutes"));
const roomEquipmentRoutes_1 = __importDefault(require("./routes/roomEquipmentRoutes"));
const roomReservationRoutes_1 = __importDefault(require("./routes/roomReservationRoutes"));
const certificateRoutes_1 = __importDefault(require("./routes/certificateRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const academicYear_routes_1 = __importDefault(require("./routes/academicYear.routes"));
const courseAssignmentRoutes_1 = __importDefault(require("./routes/courseAssignmentRoutes"));
const feeStructureRoutes_1 = __importDefault(require("./routes/feeStructureRoutes"));
const studentFeeRoutes_1 = __importDefault(require("./routes/studentFeeRoutes"));
const feePaymentRoutes_1 = __importDefault(require("./routes/feePaymentRoutes"));
const auditRoutes_1 = __importDefault(require("./routes/auditRoutes"));
const backupRoutes_1 = __importDefault(require("./routes/backupRoutes"));
const documentRoutes_1 = __importDefault(require("./routes/documentRoutes"));
const academicYearService_1 = require("./services/academicYearService");
const path_1 = __importDefault(require("path"));
const sessionTimeout_1 = require("./middleware/sessionTimeout");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Middleware pour gérer les CORS et le JSON
app.use((0, cors_1.default)());
(0, sessionTimeout_1.cleanupExpiredSessions)();
app.use(sessionTimeout_1.trackUserActivity);
// app.use(auditMiddleware);
app.use(express_1.default.json());
// Servir les fichiers uploads
app.use("/uploads/profiles", express_1.default.static(path_1.default.join(process.cwd(), "uploads", "profiles")));
app.use("/uploads/imports", express_1.default.static(path_1.default.join(process.cwd(), "uploads", "imports")));
const PORT = process.env.PORT || 4000;
// Monte chaque route avec un préfixe API clair
app.use("/api/auth", auth_routes_1.default);
app.use("/api/students", studentRoutes_1.default);
app.use("/api/professeurs", professeurRoutes_1.default);
app.use("/api/academic-years", academicYear_routes_1.default);
app.use("/api/course-assignments", courseAssignmentRoutes_1.default);
app.use("/api/enrollments", enrollmentRoutes_1.default);
app.use("/api/guardians", guardianRoutes_1.default);
app.use("/api/ues", uERoutes_1.default);
app.use("/api/prerequisites", prerequisiteRoutes_1.default);
app.use("/api/grades", gradeRoutes_1.default);
app.use("/api/retakes", retakeRoutes_1.default);
app.use("/api/users", userRoutes_1.default);
app.use("/api/faculties", facultyRoutes_1.default);
app.use("/api/faculty-levels", facultyLevelRoutes_1.default);
app.use("/api/schedules", scheduleRoutes_1.default);
app.use("/api/attendances", attendanceRoutes_1.default);
app.use("/api/payments", paymentRoutes_1.default);
app.use("/api/expenses", expenseRoutes_1.default);
app.use("/api/books", bookRoutes_1.default);
app.use("/api/book-loans", bookLoanRoutes_1.default);
app.use("/api/transcripts", transcriptRoutes_1.default);
app.use("/api/messages", messageRoutes_1.default);
app.use("/api/message-attachments", messageAttachmentRoutes_1.default);
// app.use("/api/events", eventRoutes);
app.use("/api/event-participants", eventParticipantRoutes_1.default);
app.use("/api/announcements", announcementRoutes_1.default);
app.use("/api/announcement-attachments", announcementAttachmentRoutes_1.default);
app.use("/api/scholarships", scholarshipRoutes_1.default);
app.use("/api/scholarship-applications", scholarshipApplicationRoutes_1.default);
app.use("/api/scholarship-documents", scholarshipDocumentRoutes_1.default);
app.use("/api/rooms", roomRoutes_1.default);
app.use("/api/room-equipments", roomEquipmentRoutes_1.default);
app.use("/api/room-reservations", roomReservationRoutes_1.default);
app.use("/api/certificates", certificateRoutes_1.default);
app.use("/api/analytics", analyticsRoutes_1.default);
app.use("/api/fee-structures", feeStructureRoutes_1.default);
app.use("/api/student-fees", studentFeeRoutes_1.default);
app.use("/api/fee-payments", feePaymentRoutes_1.default);
app.use("/api/audit", auditRoutes_1.default);
app.use("/api/backup", backupRoutes_1.default);
app.use("/api/document", documentRoutes_1.default);
app.use((req, res, next) => {
    // Vérifie si aucune route n'a matché
    if (!req.route) {
        res.status(404).json({
            message: "Route non trouvée",
            path: req.originalUrl,
        });
    }
    else {
        next();
    }
});
// Lancer le serveur
app.listen(PORT, async () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    await (0, prisma_1.testDatabaseConnection)();
    await (0, academicYearService_1.initializeAcademicYear)();
});
