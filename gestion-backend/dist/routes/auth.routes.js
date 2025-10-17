"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/authRoutes.ts
const express_1 = __importDefault(require("express"));
const auth_Controllers_1 = require("../controllers/auth.Controllers");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// router.use(setUserContext as express.RequestHandler);
// router.use(authenticateToken, deanPermissions);
// Routes publiques
router.post("/register", auth_Controllers_1.register);
router.post("/login", auth_Controllers_1.login);
router.post("/forgot-password", auth_Controllers_1.forgotPassword);
router.post("/reset-password", auth_Controllers_1.resetPassword);
router.get("/verify-reset-token/:token", auth_Controllers_1.verifyResetToken);
router.get("/verify", auth_Controllers_1.verify);
router.get("/reset-password/:token", auth_Controllers_1.getResetPasswordPage); // ← Route GET
// Routes protégées
router.get("/me", auth_middleware_1.authenticateToken, auth_Controllers_1.getMe);
router.put("/profile", auth_middleware_1.authenticateToken, auth_Controllers_1.updateProfile);
router.put("/change-password", auth_middleware_1.authenticateToken, auth_Controllers_1.changePassword);
router.post("/verify-password", auth_middleware_1.authenticateToken, auth_Controllers_1.verifyPassword);
exports.default = router;
