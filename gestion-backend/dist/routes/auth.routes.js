// src/routes/authRoutes.ts
import express from "express";
import { register, login, getMe, verify, forgotPassword, resetPassword, verifyResetToken, updateProfile, changePassword, getResetPasswordPage, verifyPassword, // ← Ajoutez cette fonction
 } from "../controllers/auth.Controllers";
import { authenticateToken } from "../middleware/auth.middleware";
const router = express.Router();
// router.use(setUserContext as express.RequestHandler);
// router.use(authenticateToken, deanPermissions);
// Routes publiques
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-reset-token/:token", verifyResetToken);
router.get("/verify", verify);
router.get("/reset-password/:token", getResetPasswordPage); // ← Route GET
// Routes protégées
router.get("/me", authenticateToken, getMe);
router.put("/profile", authenticateToken, updateProfile);
router.put("/change-password", authenticateToken, changePassword);
router.post("/verify-password", authenticateToken, verifyPassword);
export default router;
//# sourceMappingURL=auth.routes.js.map